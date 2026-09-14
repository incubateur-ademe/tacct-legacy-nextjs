import { readFileSync } from 'node:fs';
import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { decryptField } from '@/server/crypto/user-crypto';
import { formatPoolStats, readPoolStats, watchPoolSaturation } from './pool-stats';

/**
 * Taille du pool. Exportée pour que les jauges se lisent `3/5` plutôt que `3`,
 * sans dupliquer la valeur.
 */
export const POOL_MAX = 5;

/**
 * Identifie les connexions de cette app dans `pg_stat_activity`. Les deux apps
 * TACCT partagent la même base : sans ça, leurs connexions sont indiscernables
 * (`application_name` vide des deux côtés).
 */
const APPLICATION_NAME = 'tacct-legacy';

/**
 * Erreurs de `pg` signifiant « je n'ai pas pu te donner de connexion ». On les
 * annote avec l'état du pool au moment exact de l'échec : c'est ce qui permet de
 * distinguer un pool épuisé d'une base injoignable, sans avoir à être connecté à
 * Postgres au bon moment.
 */
const ERREURS_DE_CONNEXION = [
  'timeout exceeded when trying to connect',
  'Connection terminated due to connection timeout',
  'Connection terminated unexpectedly',
];

const USER_ENCRYPTED_FIELDS = new Set([
  'email',
  'username',
  'firstname',
  'lastname',
  'authenticated_id',
]);

/**
 * Déchiffre en place, récursivement, tout champ user sensible préfixé `enc:v1:`
 * dans un résultat Prisma — y compris les `user` imbriqués via des `include`
 * (que l'extension par modèle ne couvre pas). Sûr : on ne tente le
 * déchiffrement que sur ces noms de champs ET quand la valeur est bien un
 * chiffré `enc:v1:`. Les résultats Prisma sont des arbres (pas de cycle).
 */
function deepDecryptUsers(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  if (value instanceof Date || Buffer.isBuffer(value)) return;
  if (Array.isArray(value)) {
    for (const item of value) deepDecryptUsers(item);
    return;
  }
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === 'string') {
      if (USER_ENCRYPTED_FIELDS.has(key) && v.startsWith('enc:v1:')) {
        (value as Record<string, unknown>)[key] = decryptField(v);
      }
    } else if (v && typeof v === 'object') {
      deepDecryptUsers(v);
    }
  }
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

interface BuiltPool {
  config: PoolConfig;
  schema: string | null;
}

/**
 * Construit la config `pg` à partir de DATABASE_URL.
 *
 * - `sslmode=…` dans l'URL → `pg-connection-string` le traduit en `verify-full`,
 *   ce qui écrase nos options SSL. On le strip, on gère SSL via `pool.ssl`.
 * - `?schema=…` est un param du moteur Prisma natif, ignoré par le pool `pg`.
 *   On l'extrait pour le passer ensuite à `PrismaPg({ schema })`, qui qualifie
 *   les tables dans les requêtes générées (`"schema"."Table"`). Pas besoin de
 *   toucher au `search_path` côté connexion.
 */
function buildPool(): BuiltPool {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('DATABASE_URL is not set');

  const url = new URL(rawUrl);
  const schema = url.searchParams.get('schema');
  const hadSslMode = url.searchParams.has('sslmode');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('schema');
  const connectionString = url.toString();

  const caPath = process.env.DATABASE_CA_PATH;
  let ssl: PoolConfig['ssl'];
  if (caPath) {
    ssl = { rejectUnauthorized: true, ca: readFileSync(caPath, 'utf8') };
  } else if (hadSslMode) {
    ssl = { rejectUnauthorized: false };
  }

  return {
    config: {
      connectionString,
      ...(ssl !== undefined && { ssl }),
      application_name: APPLICATION_NAME,
      max: POOL_MAX,
      idleTimeoutMillis: 20_000,
      // Échoue vite si aucune connexion ne peut être acquise (au lieu d'attendre
      // indéfiniment et de laisser le proxy parent timeouter à 30s).
      connectionTimeoutMillis: 10_000,
      // Garde les sockets TCP vivantes et détecte celles coupées par le réseau
      // après inactivité.
      keepAlive: true,
      // Filet de sécurité : annule côté serveur une requête bloquée plutôt que
      // de monopoliser une connexion du pool.
      statement_timeout: 30_000,
      // `statement_timeout` ne couvre pas une transaction ouverte qui n'exécute
      // plus rien : aucune requête ne tourne, donc rien à annuler, et la connexion
      // reste sortie du pool indéfiniment. Là, c'est Postgres qui tue la session,
      // ce qui rend son slot au pool sans attendre un redémarrage. Très au-dessus
      // des timeouts de transaction de Prisma (5s par défaut) : ne se déclenche
      // que sur une transaction réellement abandonnée.
      idle_in_transaction_session_timeout: 60_000,
    },
    schema,
  };
}

let activePool: Pool | null = null;

/**
 * Le pool sous-jacent, pour lire ses jauges (route de santé). `null` tant que le
 * client Prisma n'a pas été instancié.
 */
export function getPool(): Pool | null {
  return activePool;
}

/**
 * Journalise l'état du pool quand l'erreur est un échec d'acquisition de
 * connexion. La ligne se retrouve dans les logs juste à côté du 500 de Next, ce
 * qui donne le contexte qui manque aujourd'hui pour trancher :
 *
 * - `total=5/5 idle=0 waiting>0` → le pool est plein et ne rend rien : requêtes
 *   trop lentes, ou clients sortis jamais rendus. `pg_stat_activity` départage
 *   (`state = active` vs `idle`).
 * - `total<5` → le pool n'arrive pas à *ouvrir* une connexion : base injoignable,
 *   TLS, DNS, ou limite de connexions atteinte côté serveur.
 */
function logSiErreurDeConnexion(error: unknown, pool: Pool): void {
  const message = error instanceof Error ? error.message : String(error);
  if (!ERREURS_DE_CONNEXION.some((motif) => message.includes(motif))) return;

  console.error(
    `[pg] échec d'acquisition — ${formatPoolStats(readPoolStats(pool, POOL_MAX))} — ${message}`,
  );
}

function createPrismaClient() {
  const { config, schema } = buildPool();
  const pool = new Pool(config);
  activePool = pool;
  watchPoolSaturation(pool, POOL_MAX);

  // CRITIQUE : sans ce handler, une erreur sur une connexion *idle* (fermée par
  // le serveur PG / le réseau après inactivité) est émise comme événement
  // 'error' non capturé → exception non gérée → crash du process. C'est la
  // cause des freezes après quelques minutes d'inactivité.
  pool.on('error', (err) => {
    console.error('[pg] erreur sur une connexion idle du pool :', err.message);
  });

  const adapter = new PrismaPg(pool, schema ? { schema } : undefined);
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            const result = await query(args);
            deepDecryptUsers(result);
            return result;
          } catch (error) {
            logSiErreurDeConnexion(error, pool);
            throw error;
          }
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
