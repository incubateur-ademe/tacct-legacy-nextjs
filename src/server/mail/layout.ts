import 'server-only';
import { getEnv } from '@/lib/env';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailLayout(content: string): string {
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
