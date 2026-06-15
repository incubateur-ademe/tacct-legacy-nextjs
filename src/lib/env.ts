import { z } from 'zod';

// Phase 1 : seules DATABASE_URL et APP_URL sont obligatoires.
// Les variables ProConnect / mail / CRM seront durcies plus tard quand on
// branchera ces intégrations.
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url(),

  DATABASE_URL: z.string().min(1),
  DATABASE_CA_PATH: z.string().optional(),

  AUTH_TACCT_SECRET: z.string().min(1),

  USER_ENCRYPTION_KEY: z.string().optional(),

  // ── Mail ──
  // Soit MAILER_DSN (URL complète), soit les variables séparées ci-dessous.
  MAILER_DSN: z.string().optional(),
  MAILER_HOST: z.string().optional(),
  MAILER_PORT: z.coerce.number().int().positive().optional(),
  MAILER_USER: z.string().optional(),
  MAILER_PASSWORD: z.string().optional(),
  ADMIN_MAIL: z.email().optional(),
  APP_EMAIL_CONTACT_ADEME: z.email().optional(),
  RECEPTION_TEST_EMAIL_ADDRESS: z.email().optional(),

  // ── Référentiel ADEME ──
  DATA_ADEME_URL: z.url().optional(),
  REGION_ENDPOINT: z.string().optional(),
  DEPARTMENT_ENDPOINT: z.string().optional(),
  COMMUNE_ENDPOINT: z.string().optional(),
  REMOVED_COMMUNE_ENDPOINT: z.string().optional(),
  POSTAL_CODE_ENDPOINT: z.string().optional(),

  // ── CRM ──
  CRM_CONNECT_URL: z.string().optional(),
  CRM_CONNECT_CLIENT_ID: z.string().optional(),
  CRM_CONNECT_CLIENT_SECRET: z.string().optional(),
  CRM_CONNECT_SOURCE: z.string().default('TACCT'),

  // ── ReCaptcha ──
  RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET: z.string().optional(),

  // ── Médias ──
  FILES_DIRECTORY: z.string().default('./var/uploads'),
  DATA_DIRECTORY: z.string().default('./data'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Variables d’environnement invalides :\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
