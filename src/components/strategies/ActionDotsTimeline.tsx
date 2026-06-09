'use client';

import { Dots } from './Dots';
import { averageDotColor, averageSmileIcon, type ReviewCriterion } from '@/lib/review-average';
import type { DotColor } from '@/lib/manage-dots';

export type TimelineAction = {
  finalite1: boolean;
  finalite2: boolean;
  finalite3: boolean;
  anticipe1: boolean;
  anticipe2: boolean;
  reviews: { rank: number; value: number }[];
};

/**
 * Partie droite d'une ligne d'action (legacy item-action / item-trajectory) :
 * smiley moyen + timeline de 3 dots (un par niveau d'impact). La couleur du trait
 * suit la moyenne des évaluations si elle existe, sinon la couleur du niveau.
 */
export function ActionDotsTimeline({
  action,
  criteria,
}: {
  action: TimelineAction;
  criteria: ReviewCriterion[];
}) {
  const reviews = action.reviews ?? [];
  const hasReviews = reviews.length > 0;
  const smile = hasReviews ? averageSmileIcon(reviews, criteria) : 'default-smile';
  const color = (fallback: DotColor): DotColor =>
    hasReviews ? averageDotColor(reviews, criteria) : fallback;

  return (
    <div className="row align-items-center justify-content-end w-50 u-margin__bottom--auto">
      <em className={`c-icon ${smile}`} aria-hidden="true" />
      <Dots
        lineLeft
        lineSize="2.5rem"
        selected={action.finalite1}
        colorLine={color('light')}
        colorDots={action.anticipe1 ? color('light') : null}
      />
      <Dots
        lineLeft
        lineSize="2.5rem"
        selected={action.finalite2}
        colorLine={color('primary')}
        colorDots={action.anticipe2 ? color('primary') : null}
        className="sc-dots__superpostion-1"
      />
      <Dots
        lineLeft
        lineRight
        lineSize="2.5rem"
        selected={action.finalite3}
        colorLine={color('dark')}
        className="sc-dots__superpostion-2"
      />
    </div>
  );
}
