import { getEnv } from '@/lib/env';
import 'server-only';
import { emailLayout, escapeHtml } from './layout';
import { sendMail } from './mailer';

const SUBJECT_VALIDATED = '[TACCT] Validation de votre compte';

/**
 * Port de `UserValidatedEmailService` + `templates/email/validated.html.twig` :
 * email envoyé à l'utilisateur quand un admin valide/active son compte.
 */
export async function sendAccountValidatedEmail(
  to: string,
  params: { firstname: string },
): Promise<void> {
  const { APP_URL } = getEnv();
  const firstname = escapeHtml(params.firstname);
  const identifier = escapeHtml(to);

  const body = `<div><span>Bonjour ${firstname},</span></div>
    <div><p>Bienvenue !</p></div>
    <div><p>Votre compte sur le site des Trajectoires d'Adaptation au Changement Climatique
      des Territoires a été validé. Vous avez désormais accès à l'outil de saise TACCT</p></div>
    <div><p>Retrouvez ci-dessous votre identifiant pour vous connecter à votre compte :</p></div>
    <div><span>Identifiant : ${identifier}</span></div>
    <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>
    <div><p>Pour toute question, n'hésitez pas à <a href="${APP_URL}/contact">nous contacter</a>.</p></div>`;

  await sendMail({ to, subject: SUBJECT_VALIDATED, html: emailLayout(body) });
}
