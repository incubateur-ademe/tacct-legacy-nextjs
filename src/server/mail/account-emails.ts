import 'server-only';
import { getEnv } from '@/lib/env';
import { sendMail } from './mailer';
import { emailLayout, escapeHtml } from './layout';

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
      des Territoires a été validé.</p></div>
    <div><p>Retrouvez ci-dessous votre identifiant pour vous connecter à votre compte :</p></div>
    <div><span>Identifiant : ${identifier}</span></div>
    <div>
      <p>Si vous disposez déjà d'un compte dans l'annuaire de l'Ademe alors nous vous invitons à vous
        <a href="${APP_URL}">connecter directement sur le site</a> avec vos identifiants.</p>
      <p>Sinon, vous recevrez un mail de "Mon Compte Ademe" vous permettant de définir votre mot de passe.</p>
    </div>
    <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>
    <div><p>Pour toute question, n'hésitez pas à <a href="${APP_URL}/contact">nous contacter</a>.</p></div>`;

  await sendMail({ to, subject: SUBJECT_VALIDATED, html: emailLayout(body) });
}
