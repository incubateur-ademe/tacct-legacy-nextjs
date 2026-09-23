/**
 * Redémarre les conteneurs `web` de l'app via l'API Scalingo. Lancé chaque nuit
 * par le planificateur Scalingo (`cron.json`), dans un conteneur one-off.
 *
 * Pourquoi : la mémoire du conteneur web grossit jusqu'à la limite du conteneur
 * en 2-3 jours, puis swappe ; le process devient trop lent pour rendre ses
 * connexions au pool et les pages tombent en 500. Un redémarrage à froid remet
 * le compteur à zéro. C'est un pansement : il ne dispense pas de trouver ce qui
 * fait grossir la mémoire.
 *
 * Variables d'environnement :
 * - `SCALINGO_API_TOKEN` (obligatoire) : token API d'un compte ayant accès à
 *   l'app. Idéalement un compte dédié, pas un token personnel.
 * - `APP` : nom de l'app, fourni automatiquement par Scalingo dans ses
 *   conteneurs. `SCALINGO_APP` le remplace si besoin (en prod : `tacct-legacy`).
 *
 * On passe par l'API et non par le domaine : l'app n'est joignable que derrière
 * le reverse proxy de tacct.ademe.fr/workspace-tacct, ce qui ne concerne pas
 * l'API Scalingo, qui la désigne par son nom.
 */

const AUTH_URL = 'https://auth.scalingo.com/v1/tokens/exchange';
// Région de l'app (`scalingo --region osc-fr1 --app tacct-legacy`).
const API_URL = 'https://api.osc-fr1.scalingo.com';

const apiToken = process.env.SCALINGO_API_TOKEN;
const app = process.env.SCALINGO_APP ?? process.env.APP;

if (!apiToken || !app) {
  console.error('[restart-web] SCALINGO_API_TOKEN et APP (ou SCALINGO_APP) sont requis.');
  process.exit(1);
}

// Le token API ne sert qu'à obtenir un bearer de courte durée.
const echange = await fetch(AUTH_URL, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    Authorization: `Basic ${Buffer.from(`:${apiToken}`).toString('base64')}`,
  },
});
if (!echange.ok) {
  console.error(`[restart-web] échange du token refusé : HTTP ${echange.status}`);
  process.exit(1);
}
const { token: bearer } = await echange.json();

const restart = await fetch(`${API_URL}/v1/apps/${encodeURIComponent(app)}/restart`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearer}`,
  },
  body: JSON.stringify({ scope: ['web'] }),
});
if (!restart.ok) {
  console.error(
    `[restart-web] redémarrage refusé : HTTP ${restart.status} — ${await restart.text()}`,
  );
  process.exit(1);
}

console.log(`[restart-web] redémarrage des conteneurs web de ${app} demandé.`);
