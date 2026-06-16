import { readFileSync } from 'node:fs';
import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { decryptField } from '@/server/crypto/user-crypto';

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
      max: 5,
      idleTimeoutMillis: 20_000,
    },
    schema,
  };
}

function createPrismaClient() {
  const { config, schema } = buildPool();
  const pool = new Pool(config);

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
          const result = await query(args);
          deepDecryptUsers(result);
          return result;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
