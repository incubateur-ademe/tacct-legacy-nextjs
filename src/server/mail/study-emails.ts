import 'server-only';
import { getEnv } from '@/lib/env';
import { sendMail } from './mailer';
import { emailLayout, escapeHtml } from './layout';

// Emails liés au transfert d'une étude (port des templates Symfony). Le transfert
// ne cible que des comptes déjà existants ; il n'y a plus d'email d'invitation.

const SUBJECT_TRANSFER = '[TACCT] Transfert étude';

export async function sendTransferEmail(
  to: string,
  params: {
    firstname: string;
    headStudyFirstname: string;
    headStudyLastname: string;
    territoryName: string;
  },
): Promise<void> {
  const { APP_URL } = getEnv();
  const firstname = escapeHtml(params.firstname);
  const head = escapeHtml(`${params.headStudyFirstname} ${params.headStudyLastname}`.trim());
  const territory = escapeHtml(params.territoryName);

  const body = `<div><span>Bonjour ${firstname},</span></div>
    <div><p>Bienvenue !</p></div>
    <div><p>Vous avez été désigné sur le site des Trajectoires d'Adaptation au Changement Climatique
      des Territoires par ${head} comme nouveau responsable du diagnostic sur le territoire :
      ${territory}.</p></div>
    <div><p>Retrouvez ci-dessous votre identifiant pour vous connecter à votre compte :</p></div>
    <div><span>Identifiant : ${escapeHtml(to)}</span></div>
    <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>
    <div><p>Pour toute question, n'hésitez pas à <a href="${APP_URL}/contact">nous contacter</a>.</p></div>`;

  await sendMail({ to, subject: SUBJECT_TRANSFER, html: emailLayout(body) });
}

export async function sendDeactivationEmail(
  to: string,
  params: {
    firstname: string;
    recipientFirstname: string;
    recipientLastname: string;
    territoryName: string;
  },
): Promise<void> {
  const { APP_URL } = getEnv();
  const firstname = escapeHtml(params.firstname);
  const recipient = escapeHtml(`${params.recipientFirstname} ${params.recipientLastname}`.trim());
  const territory = escapeHtml(params.territoryName);

  const body = `<div><span>Bonjour ${firstname},</span></div>
    <div><p>Vous avez désigné ${recipient} comme nouveau responsable du diagnostic sur le territoire :
      ${territory} sur le site des Trajectoires d'Adaptation au Changement Climatique des Territoires.</p></div>
    <div><p>Veuillez <a href="${APP_URL}/contact">nous contacter</a> en indiquant votre nouvelle commune
      de rattachement si vous souhaitez réactiver votre compte pour démarrer un nouveau diagnostic.</p></div>
    <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>`;

  await sendMail({ to, subject: SUBJECT_TRANSFER, html: emailLayout(body) });
}
