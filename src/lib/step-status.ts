/**
 * Recalcul des statuts d'étape de l'étude (`study.*_valid`) — logique pure,
 * sans accès base, appelée par `@/server/study/step-status`.
 *
 * Port de `ObservedExposureDataPersister` (legacy Symfony), qui repositionnait
 * ces statuts à chaque écriture sur un aléa ou sur une exposition future.
 *
 * Principe : une étape validée ne le reste pas si les données sur lesquelles
 * portait la validation changent. Les statuts pilotent les badges du menu, les
 * pastilles du tableau de bord et le déverrouillage du bloc « Construire des
 * stratégies » sur l'accueil — d'où l'importance de ne pas les laisser figés
 * sur `validated`.
 *
 * Aucun de ces recalculs ne pose `validated` : seule la validation explicite
 * d'une étape par l'utilisateur (`validate*Step`) le fait.
 */

export const IN_PROGRESS = 'in-progress';
export const INCOMPLETE = 'incomplete';
export const VALIDATED = 'validated';

/** Rétrograde une étape validée, laisse les autres statuts tels quels. */
function demoteIfValidated(status: string): string {
  return status === VALIDATED ? IN_PROGRESS : status;
}

/**
 * Statuts à écrire après toute création / modification / suppression d'aléa.
 * Port de `observedExposureUpdate()` et de la branche « plus aucun aléa » du
 * `remove()` legacy.
 *
 * - plus aucun aléa dans l'étude → les trois étapes du diagnostic repartent à
 *   `in-progress` ;
 * - sinon → `observed_exposure_valid` vaut `incomplete` s'il reste un aléa sans
 *   niveau d'exposition, `in-progress` sinon ; `sensibility_valid` et
 *   `exposition_future_valid` sont rétrogradés s'ils étaient `validated`.
 *
 * `resetFutureExposure` force `exposition_future_valid` à `incomplete` : c'est
 * le cas quand l'ajout d'un aléa (ou le changement de son niveau d'exposition)
 * laisse l'étape « exposition future » forcément incomplète.
 */
export function statusesAfterObservedExposureChange({
  exposures,
  current,
  resetFutureExposure = false,
}: {
  exposures: { exposure: number | null }[];
  current: { sensibility_valid: string; exposition_future_valid: string };
  resetFutureExposure?: boolean;
}): {
  observed_exposure_valid: string;
  exposition_future_valid: string;
  sensibility_valid: string;
} {
  if (exposures.length === 0) {
    return {
      observed_exposure_valid: IN_PROGRESS,
      exposition_future_valid: IN_PROGRESS,
      sensibility_valid: IN_PROGRESS,
    };
  }

  return {
    observed_exposure_valid: exposures.some((e) => e.exposure === null) ? INCOMPLETE : IN_PROGRESS,
    exposition_future_valid: resetFutureExposure
      ? INCOMPLETE
      : demoteIfValidated(current.exposition_future_valid),
    sensibility_valid: demoteIfValidated(current.sensibility_valid),
  };
}

/**
 * Statuts à écrire après toute écriture sur une exposition future.
 * Port de `futureExposureUpdate()` legacy.
 *
 * `exposition_future_valid` vaut `in-progress` seulement si TOUS les aléas ont
 * une exposition future avec `trends` ET `exposure` renseignés, `incomplete`
 * sinon ; `sensibility_valid` est rétrogradé s'il était `validated`.
 */
export function statusesAfterFutureExposureChange({
  exposures,
  current,
}: {
  exposures: { futureExposure: { trends: string | null; exposure: number | null } | null }[];
  current: { sensibility_valid: string };
}): { exposition_future_valid: string; sensibility_valid: string } {
  const allComplete = exposures.every(
    (e) => e.futureExposure && e.futureExposure.trends && e.futureExposure.exposure !== null,
  );

  return {
    exposition_future_valid: allComplete ? IN_PROGRESS : INCOMPLETE,
    sensibility_valid: demoteIfValidated(current.sensibility_valid),
  };
}
