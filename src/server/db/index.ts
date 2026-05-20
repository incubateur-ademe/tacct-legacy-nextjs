// ⚠️ Phase 1 : ce fichier sera activé après `prisma db pull` + `prisma generate`.
//
// Une fois le schema généré (src/generated/prisma/client), remplacer le contenu
// de ce fichier par le singleton ci-dessous :
//
// import { PrismaClient } from '@/generated/prisma/client';
//
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };
//
// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log:
//       process.env.NODE_ENV === 'development'
//         ? ['query', 'error', 'warn']
//         : ['error'],
//   });
//
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const prisma = new Proxy(
  {},
  {
    get() {
      throw new Error(
        '[prisma] Le client Prisma n’est pas encore généré. Lancer `pnpm db:pull && pnpm db:generate` (Phase 1).',
      );
    },
  },
) as never;
