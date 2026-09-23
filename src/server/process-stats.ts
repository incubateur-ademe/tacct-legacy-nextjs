import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';

// Pas de `import 'server-only'` : ce module est chargé depuis `instrumentation.ts`,
// compilé sans la condition `react-server`, où `server-only` lève à l'import.

/**
 * Retard de la boucle d'événements : le temps qu'un callback prêt attend avant
 * d'être exécuté. C'est la mesure qui tranche entre « la base est lente » et
 * « Node est lent » : un conteneur qui swappe fait grimper ce retard à plusieurs
 * secondes, alors que Postgres a déjà répondu.
 */
let histogramme: IntervalHistogram | null = null;

const INTERVALLE_BILAN_MS = 60 * 60 * 1000;

const mo = (octets: number) => Math.round(octets / 1024 / 1024);
const ms = (nanos: number) => Math.round(nanos / 1e6);

/**
 * État du process, au même format dans le bilan horaire et dans les logs de
 * saturation du pool, pour les comparer d'un coup d'œil.
 *
 * - `rss` qui monte de bilan en bilan jusqu'à la limite du conteneur → la mémoire
 *   grossit. Si `heap` monte avec, c'est du JS retenu (fuite, cache) ; sinon ce
 *   sont des buffers ou de la mémoire native.
 * - `lag_max` de plusieurs secondes → Node a été bloqué ou ralenti (swap, calcul
 *   synchrone), indépendamment de la base.
 */
export function formatProcessStats(): string {
  const { rss, heapUsed, heapTotal } = process.memoryUsage();
  const lag = histogramme
    ? ` lag_max=${ms(histogramme.max)}ms lag_p99=${ms(histogramme.percentile(99))}ms`
    : '';
  const uptimeH = Math.floor(process.uptime() / 3600);
  return `rss=${mo(rss)}Mo heap=${mo(heapUsed)}/${mo(heapTotal)}Mo${lag} uptime=${uptimeH}h`;
}

/**
 * Démarre la mesure du retard et un bilan par heure. Les incidents arrivent au
 * bout de 2-3 jours : le bilan horaire montre la courbe qui y mène, pas seulement
 * l'instant de la panne. 24 lignes par jour.
 *
 * L'histogramme est remis à zéro après chaque bilan : `lag_max` porte donc sur
 * l'heure écoulée, y compris dans les logs de saturation.
 */
export function demarrerSuiviProcess(): void {
  if (histogramme) return;
  histogramme = monitorEventLoopDelay({ resolution: 20 });
  histogramme.enable();

  const timer = setInterval(() => {
    console.log(`[process] ${formatProcessStats()}`);
    histogramme?.reset();
  }, INTERVALLE_BILAN_MS);
  timer.unref();

  console.log(`[process] suivi démarré — ${formatProcessStats()}`);
}
