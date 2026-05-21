/**
 * Port des pipes Angular `futureExposure` et `translateSeason` pour les valeurs
 * d'exposition future (0 à 4, donc 5 niveaux contre 4 pour l'observée).
 */
const LABELS = ['Nulle', 'Faible', 'Moyenne', 'Elevée', 'Très élevée'] as const;

export function futureExposureLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return LABELS[value] ?? '';
}

/**
 * Libellés des tendances climatiques utilisées dans le legacy
 * (`trendExposure` dans `entity/trendexposure.ts`).
 */
export const TREND_LABELS: Record<string, string> = {
  increase: 'Augmentation',
  identical: 'Identique',
  decrease: 'Diminution',
  predictible: 'Non prévisible',
};
