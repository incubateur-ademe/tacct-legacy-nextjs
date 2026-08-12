import { config } from 'dotenv';

config({ path: '.env', quiet: true });

// Les fixtures doivent être résolues dans la base utilisée par l'instance visée.
// Quand TEST_BASE_URL pointe ailleurs qu'en local, TEST_DATABASE_URL permet de
// brancher les fixtures sur la bonne base sans toucher au .env.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
