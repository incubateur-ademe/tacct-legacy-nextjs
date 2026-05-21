/**
 * Port des `selectFutureExposureColor` / `selectObservedExposureColor` legacy.
 *
 * Convertit un score (sensibilité × exposition, sur 16) en classe CSS de
 * couleur d'alerte, selon les seuils :
 *   ≥ 16 → rouge | ≥ 12 → orange | ≥ 8 → jaune | sinon vide
 */
export function futureExposureColorClass(
  scope: 'synthese' | 'detail',
  futureExposure: number,
): string {
  const base = scope === 'synthese' ? 'sc-synthese-impacts' : 'sc-detail-synthese-impacts';
  if (futureExposure >= 16) return `${base}__red`;
  if (futureExposure >= 12) return `${base}__orange`;
  if (futureExposure >= 8) return `${base}__yellow`;
  return '';
}

/**
 * Couleur de l'exposition observée — n'est colorée que si elle est égale à
 * l'exposition future (= pas de croissance). Sinon vide.
 */
export function observedExposureColorClass(
  scope: 'synthese' | 'detail',
  observedExposure: number,
  futureExposure: number,
): string {
  if (futureExposure !== observedExposure) return '';
  return futureExposureColorClass(scope, futureExposure);
}

/**
 * Icône flèche selon la tendance entre observé et futur.
 */
export function trendIcon(observed: number, future: number): string {
  if (future > observed) return 'arrow-increases';
  if (future < observed) return 'arrow-decreases';
  return 'arrow-holding';
}
