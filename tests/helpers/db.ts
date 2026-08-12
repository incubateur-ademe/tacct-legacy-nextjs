import { prisma } from '@/server/db';

const READ_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

/**
 * Client Prisma bridé en lecture seule : les tests tournent sur la base de prod,
 * toute opération d'écriture doit échouer avant d'atteindre le serveur.
 */
export const readOnlyPrisma = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        if (!READ_OPERATIONS.has(operation)) {
          throw new Error(
            `Opération "${operation}" bloquée : les tests sont en lecture seule sur la base de prod.`,
          );
        }
        return query(args);
      },
    },
  },
});

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
