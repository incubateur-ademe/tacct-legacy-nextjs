import { readFileSync } from 'node:fs';
import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { decryptField } from '@/server/crypto/user-crypto';

const USER_ENCRYPTED_FIELDS = [
  'email',
  'username',
  'firstname',
  'lastname',
  'authenticated_id',
] as const;

function decryptUserRow(row: Record<string, unknown>): void {
  for (const field of USER_ENCRYPTED_FIELDS) {
    const value = row[field];
    if (typeof value === 'string') row[field] = decryptField(value);
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
      user: {
        async $allOperations({ args, query }) {
          const result = await query(args);
          if (Array.isArray(result)) {
            for (const row of result) {
              if (row && typeof row === 'object') {
                decryptUserRow(row as Record<string, unknown>);
              }
            }
          } else if (result && typeof result === 'object') {
            decryptUserRow(result as Record<string, unknown>);
          }
          return result;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
