import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url(),

  DATABASE_URL: z.url(),

  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.url(),
  AUTH_TRUST_HOST: z.string().optional(),

  PROCONNECT_ISSUER: z.url(),
  PROCONNECT_CLIENT_ID: z.string(),
  PROCONNECT_CLIENT_SECRET: z.string(),

  MAILER_DSN: z.string(),
  ADMIN_MAIL: z.email(),
  APP_EMAIL_CONTACT_ADEME: z.email(),
  RECEPTION_TEST_EMAIL_ADDRESS: z.email(),

  DATA_ADEME_URL: z.url(),
  REGION_ENDPOINT: z.string(),
  DEPARTMENT_ENDPOINT: z.string(),
  COMMUNE_ENDPOINT: z.string(),
  REMOVED_COMMUNE_ENDPOINT: z.string(),
  POSTAL_CODE_ENDPOINT: z.string(),

  CRM_CONNECT_URL: z.string().optional(),
  CRM_CONNECT_CLIENT_ID: z.string().optional(),
  CRM_CONNECT_CLIENT_SECRET: z.string().optional(),
  CRM_CONNECT_SOURCE: z.string().default('TACCT'),

  RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET: z.string().optional(),

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
