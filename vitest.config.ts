import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = process.cwd().replace(/\\/g, '/');
const src = `${root}/src`;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: [path.join('tests', 'setup', 'env.ts')],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // La base ciblée est celle de prod : on évite toute rafale de connexions.
    fileParallelism: false,
  },
  resolve: {
    alias: [
      { find: '@/db', replacement: `${src}/server/db` },
      { find: '@prisma/generated', replacement: `${src}/generated/prisma` },
      // `server-only` lève une exception hors contexte RSC (condition react-server).
      { find: 'server-only', replacement: `${root}/tests/setup/server-only-stub.ts` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
});
