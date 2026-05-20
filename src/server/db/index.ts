import { readFileSync } from 'node:fs';
import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

interface BuiltPool {
  config: PoolConfig;
  schema: string | null;
}

/**
 * Construit la config `pg` à partir de DATABASE_URL.
 *
 * Subtilités du driver adapter Prisma 7 :
 *
 * - `sslmode=…` dans l'URL → `pg-connection-string` le traduit en `verify-full`,
 *   ce qui écrase nos options SSL. On le strip, on gère SSL via `pool.ssl`.
 * - `?schema=…` est un param du moteur Prisma natif, ignoré par
 *   `@prisma/adapter-pg`. On l'extrait et on force le `search_path` à chaque
 *   nouvelle connexion via `pool.on('connect')`.
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

function createPrismaClient(): PrismaClient {
  const { config, schema } = buildPool();
  const pool = new Pool(config);

  // Le param `?schema=…` n'est pas lu par l'adapter : on force le search_path
  // à chaque nouvelle connexion. On utilise un paramètre lié pour gérer les
  // noms de schemas avec caractères spéciaux (ex. "tacct-legacy").
  if (schema) {
    pool.on('connect', (client) => {
      client.query({
        text: 'SELECT set_config($1, $2, false)',
        values: ['search_path', schema],
      }).catch((err) => {
        console.error('[prisma] échec du SET search_path :', err);
      });
    });
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
