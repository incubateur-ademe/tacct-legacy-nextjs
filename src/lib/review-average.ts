// Port de average.utils.ts (legacy) : moyenne pondérée des évaluations d'une
// action et choix de l'icône "smiley" correspondante.

export interface ReviewCriterion {
  rank: number;
  weighting: number;
}

/** Note → classe d'icône smiley (icône + couleur), cf. ReviewIconColorEnum. */
export function smileForValue(value: number): string {
  switch (value) {
    case 1:
      return 'unhappy-smile red-smile';
    case 2:
      return 'neutral-smile orange-smile';
    case 3:
      return 'light-smile green-smile';
    case 4:
      return 'large-smile dark-green-smile';
    default:
      return 'default-smile empty-smile';
  }
}

export function calculateAverage(
  values: Record<number, number>,
  criteria: ReviewCriterion[],
): number {
  let weightingSum = 0;
  let sumProduct = 0;
  for (const c of criteria) {
    const value = values[c.rank] ?? 0;
    if (value > 0) {
      weightingSum += c.weighting;
      sumProduct += value * c.weighting;
    }
  }
  return weightingSum > 0 ? sumProduct / weightingSum : 0;
}

export function averageIconClass(values: Record<number, number>, criteria: ReviewCriterion[]): string {
  const avg = calculateAverage(values, criteria);
  if (avg > 0 && avg < 2) return 'unhappy-smile red-smile';
  if (avg >= 2 && avg < 3) return 'neutral-smile orange-smile';
  if (avg >= 3 && avg < 4) return 'light-smile green-smile';
  if (avg >= 4) return 'large-smile dark-green-smile';
  return 'default-smile empty-smile';
}

export function reviewsToValues(reviews: { rank: number; value: number }[]): Record<number, number> {
  const values: Record<number, number> = {};
  for (const r of reviews) if (r.value > 0) values[r.rank] = r.value;
  return values;
}

/** Smiley moyen d'une action (legacy icon()/averageIconColor). */
export function averageSmileIcon(
  reviews: { rank: number; value: number }[],
  criteria: ReviewCriterion[],
): string {
  if (reviews.length === 0) return 'default-smile';
  return averageIconClass(reviewsToValues(reviews), criteria);
}

/** Couleur "smile" du trait des dots selon la moyenne (legacy averageColor). */
export function averageDotColor(
  reviews: { rank: number; value: number }[],
  criteria: ReviewCriterion[],
): 'empty-smile' | 'red-smile' | 'orange-smile' | 'green-smile' | 'dark-green-smile' {
  const avg = calculateAverage(reviewsToValues(reviews), criteria);
  if (avg > 0 && avg < 2) return 'red-smile';
  if (avg >= 2 && avg < 3) return 'orange-smile';
  if (avg >= 3 && avg < 4) return 'green-smile';
  if (avg >= 4) return 'dark-green-smile';
  return 'empty-smile';
}
