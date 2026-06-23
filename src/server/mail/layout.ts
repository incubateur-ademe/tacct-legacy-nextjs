import 'server-only';
import path from 'node:path';
import { readFileSync } from 'node:fs';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Logos embarqués en images inline `cid:` (port de EmailBuilder::embedImages du
// legacy). Les fichiers vivent dans public/assets/img et sont lus au runtime.
const LOGO_DIR = path.join(process.cwd(), 'public', 'assets', 'img');
const LOGOS: { cid: string; filename: string }[] = [
  { cid: 'logo-rf', filename: 'logo-rf.png' },
  { cid: 'logo-ademe', filename: 'logo-ademe.png' },
  { cid: 'logo-tacct', filename: 'logo-tacct.png' },
];

export interface MailAttachment {
  cid: string;
  filename: string;
  content: Buffer;
}

/** Pièces jointes inline (logos) à attacher à chaque mail. */
export function emailLogoAttachments(): MailAttachment[] {
  const attachments: MailAttachment[] = [];
  for (const logo of LOGOS) {
    try {
      attachments.push({
        cid: logo.cid,
        filename: logo.filename,
        content: readFileSync(path.join(LOGO_DIR, logo.filename)),
      });
    } catch (err) {
      console.warn(`[mail] logo introuvable : ${logo.filename}`, err);
    }
  }
  return attachments;
}

const TEXT_STYLE = 'color:#81898f;font-size:1rem;';

/**
 * Gabarit HTML commun (port de email/layout.html.twig + email.css). En-tête à
 * 3 logos (cid), contenu, pied de page ADEME avec année courante. Styles inline
 * (les clients mail n'appliquent pas de CSS externe).
 */
export function emailLayout(content: string): string {
  const currentYear = new Date().getFullYear();
  return `<!doctype html>
<html lang="fr">
  <head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head>
  <body style="margin:0;${TEXT_STYLE}font-family:Arial, Helvetica, sans-serif;line-height:1.5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:700px;">
          <tr><td width="700">
            <br />
            <table role="presentation" width="100%" cellpadding="16" cellspacing="0">
              <thead>
                <tr>
                  <th align="left"><img src="cid:logo-rf" height="74" alt="Logo République Française" /></th>
                  <th align="center"><img src="cid:logo-ademe" height="74" alt="Logo ADEME" /></th>
                  <th align="right"><img src="cid:logo-tacct" height="74" alt="Logo TACCT" /></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="3">
                    <div style="${TEXT_STYLE}">
                      ${content}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" colspan="3">
                    <div style="text-align:center;font-size:0.8rem;color:#81898f;">
                      <p>&copy;${currentYear}, ADEME - Agence de la Transition écologique</p>
                      <p style="font-weight:bold;">20 avenue du Grésillé, BP 90406, 49004 Angers Cedex 01 - <a href="https://www.ademe.fr">www.ademe.fr</a></p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <br /><br />
          </td></tr>
        </table>
        <br /><br />
      </td></tr>
    </table>
  </body>
</html>`;
}
