import 'server-only';
import { getEnv } from '@/lib/env';
import { sendMail } from './mailer';

// Port des emails Symfony (templates/email/*.html.twig) liés à l'invitation et
// au transfert d'une étude. Le flux « compte inconnu » du legacy renvoyait un
// lien tokenisé vers la création de compte ; cette page n'étant pas migrée, on
// envoie un message simplifié invitant à contacter le support.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(content: string): string {
  const { APP_URL } = getEnv();
  return `<!doctype html>
<html lang="fr">
  <body style="font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; line-height: 1.5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 16px;">
      ${content}
      <hr style="margin-top: 24px; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 12px; color: #666;">
        TACCT — Trajectoires d'Adaptation au Changement Climatique des Territoires<br />
        <a href="${APP_URL}">${APP_URL}</a>
      </p>
    </div>
  </body>
</html>`;
}

const SUBJECT_INVITATION = '[TACCT] Invitation';
const SUBJECT_TRANSFER = '[TACCT] Transfert étude';

export async function sendInviteEmail(
  to: string,
  params: {
    headStudyFirstname: string;
    headStudyLastname: string;
    territoryName: string;
    userExists: boolean;
  },
): Promise<void> {
  const { APP_URL } = getEnv();
  const head = escapeHtml(`${params.headStudyFirstname} ${params.headStudyLastname}`.trim());
  const territory = escapeHtml(params.territoryName);

  const intro = `<div><span>Bonjour,</span></div>
    <div><p>Bienvenue !</p></div>
    <div><p>Vous avez été invité sur le site des Trajectoires d'Adaptation au Changement Climatique
      des Territoires par ${head} pour le territoire : ${territory}.</p></div>`;

  const body = params.userExists
    ? `${intro}
       <div><p>Retrouvez ci-dessous votre identifiant pour vous connecter à votre compte :</p></div>
       <div><span>Identifiant : ${escapeHtml(to)}</span></div>
       <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>
       <div><p>Pour toute question, n'hésitez pas à <a href="${APP_URL}/contact">nous contacter</a>.</p></div>`
    : `${intro}
       <div><p>Un compte doit être créé pour vous permettre de rejoindre l'étude. Rapprochez-vous
         du support ADEME via la page <a href="${APP_URL}/contact">contact</a> pour l'activer.</p></div>
       <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>`;

  await sendMail({ to, subject: SUBJECT_INVITATION, html: layout(body) });
}

export async function sendTransferEmail(
  to: string,
  params: {
    firstname: string;
    headStudyFirstname: string;
    headStudyLastname: string;
    territoryName: string;
    userExists: boolean;
  },
): Promise<void> {
  const { APP_URL } = getEnv();
  const firstname = escapeHtml(params.firstname);
  const head = escapeHtml(`${params.headStudyFirstname} ${params.headStudyLastname}`.trim());
  const territory = escapeHtml(params.territoryName);

  const intro = `<div><span>Bonjour ${firstname},</span></div>
    <div><p>Bienvenue !</p></div>
    <div><p>Vous avez été désigné sur le site des Trajectoires d'Adaptation au Changement Climatique
      des Territoires par ${head} comme nouveau responsable du diagnostic sur le territoire :
      ${territory}.</p></div>`;

  const body = params.userExists
    ? `${intro}
       <div><p>Retrouvez ci-dessous votre identifiant pour vous connecter à votre compte :</p></div>
       <div><span>Identifiant : ${escapeHtml(to)}</span></div>
       <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>
       <div><p>Pour toute question, n'hésitez pas à <a href="${APP_URL}/contact">nous contacter</a>.</p></div>`
    : `${intro}
       <div><p>Un compte doit être créé pour vous permettre d'accéder au diagnostic. Rapprochez-vous
         du support ADEME via la page <a href="${APP_URL}/contact">contact</a> pour l'activer.</p></div>
       <div><p>À bientôt sur <a href="${APP_URL}">TACCT !</a></p></div>`;

  await sendMail({ to, subject: SUBJECT_INVITATION, html: layout(body) });
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

  await sendMail({ to, subject: SUBJECT_TRANSFER, html: layout(body) });
}
