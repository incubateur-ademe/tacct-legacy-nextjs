/**
 * Port du pipe Angular `typeExposure`. Convertit un niveau d'exposition (0..3)
 * en libellé humain : 'nulle' / 'faible' / 'moyenne' / 'élevée'.
 */
const LABELS = ['nulle', 'faible', 'moyenne', 'élevée'] as const;

export function typeExposure(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return LABELS[value] ?? '';
}
