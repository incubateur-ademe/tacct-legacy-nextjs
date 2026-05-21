/**
 * Port du pipe Angular `sensibility`. Convertit un niveau de sensibilité
 * (1 à 4, mais le pipe accepte 0 à 4) en libellé humain.
 */
const LABELS = ['Nulle', 'Faible', 'Moyenne', 'Élevée', 'Très élevée'] as const;

export function sensibilityLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return LABELS[value] ?? '';
}
