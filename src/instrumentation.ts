/**
 * Exécuté une fois au démarrage du serveur Next.
 *
 * Import dynamique sous garde `nodejs` : `perf_hooks` n'existe pas dans le
 * runtime edge, qui charge aussi ce fichier.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { demarrerSuiviProcess } = await import('./server/process-stats');
  demarrerSuiviProcess();
}
