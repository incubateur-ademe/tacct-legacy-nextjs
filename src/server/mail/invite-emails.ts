import { getEnv } from '@/lib/env';
import 'server-only';
import { emailLayout, escapeHtml } from './layout';
import { sendMail } from './mailer';

// Port de `InviteEmailService` + `templates/email/invite-known.html.twig`.
// L'invitation ne cible que des comptes existants : le template « unknown »
// (création de compte via lien tokenisé) n'est pas repris.

const SUBJECT_INVITE = '[TACCT] Invitation';

export async function sendInviteEmail(
  to: string,
  params: {
    headStudyFirstname: string;
    headStudyLastname: string;
    territoryName: string;
  },
): Promise<void> {
  const { APP_URL } = getEnv();
  const head = escapeHtml(`${params.headStudyFirstname} ${params.headStudyLastname}`.trim());
  const territory = escapeHtml(params.territoryName);

  const body = `<div><span>Bonjour,</span></div>
    <div><p>Bienvenue !</p></div>
    <div><p>Vous avez été invité(e) à collaborer sur le site des Trajectoires d'Adaptation au
      Changement Climatique des Territoires par ${head} pour le territoire : ${territory}.</p></div>
    <div><p>Votre compte est actif, vous pouvez dès à présent vous connecter à l'outil de saisie
      TACCT avec l'identifiant ci-dessous :</p></div>
    <div><span>Identifiant : ${escapeHtml(to)}</span></div>
    <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>
    <div><p>Pour toute question, n'hésitez pas à <a href="${APP_URL}/contact">nous contacter</a>.</p></div>`;

  await sendMail({ to, subject: SUBJECT_INVITE, html: emailLayout(body) });
}
