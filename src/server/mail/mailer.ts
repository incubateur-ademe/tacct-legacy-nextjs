import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { getEnv } from '@/lib/env';
import { emailLogoAttachments } from './layout';

let cached: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cached !== undefined) return cached;
  const env = getEnv();

  // Priorité à la DSN complète si fournie…
  if (env.MAILER_DSN) {
    cached = nodemailer.createTransport(env.MAILER_DSN);
    return cached;
  }

  // …sinon configuration par variables séparées (évite d'encoder l'URL).
  if (env.MAILER_HOST) {
    const port = env.MAILER_PORT ?? 587;
    cached = nodemailer.createTransport({
      host: env.MAILER_HOST,
      port,
      secure: port === 465, // 465 = TLS direct ; 587/2525 = STARTTLS
      auth:
        env.MAILER_USER && env.MAILER_PASSWORD
          ? { user: env.MAILER_USER, pass: env.MAILER_PASSWORD }
          : undefined,
    });
    return cached;
  }

  cached = null;
  return cached;
}

/**
 * Envoie un email. Si aucun `MAILER_DSN` n'est configuré ou si l'envoi échoue,
 * on log sans faire échouer l'action appelante (la partie métier reste valide).
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[mail] MAILER_DSN absent — email non envoyé : "${opts.subject}" → ${opts.to}`);
    return;
  }
  const { ADMIN_MAIL } = getEnv();
  try {
    await transporter.sendMail({
      // L'adresse doit être un expéditeur vérifié chez le fournisseur SMTP (Brevo).
      from: { name: 'TACCT', address: ADMIN_MAIL ?? 'noreply@ademe.fr' },
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      // Logos embarqués en inline (cid) référencés par le layout des mails.
      attachments: emailLogoAttachments().map((a) => ({
        filename: a.filename,
        content: a.content,
        cid: a.cid,
      })),
    });
  } catch (err) {
    console.error(`[mail] Échec d'envoi "${opts.subject}" → ${opts.to} :`, err);
  }
}
