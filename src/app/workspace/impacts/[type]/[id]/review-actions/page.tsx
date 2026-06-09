import { notFound } from 'next/navigation';
import {
  DEFAULT_CRITERIA,
  getActionsForOwner,
  getImpactOwner,
  getReviewCriteriaForOwner,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { ReviewActions } from '@/components/strategies/ReviewActions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function ReviewActionsPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const [actionsRaw, savedCriteria] = await Promise.all([
    getActionsForOwner(ownerType, id),
    getReviewCriteriaForOwner(ownerType, id),
  ]);

  // 8 critères sauvegardés, sinon catalogue par défaut (poids 1).
  const criteria =
    savedCriteria.length === 8
      ? savedCriteria.map((c) => ({ rank: c.rank, name: c.name, weighting: c.weighting }))
      : DEFAULT_CRITERIA.map((d) => ({ rank: d.rank, name: d.name, weighting: 1 }));

  const actions = actionsRaw.map((a) => ({
    id: a.id,
    intitule: a.intitule,
    reviews: a.impact_action_review.map((r) => ({ rank: r.rank, value: r.value })),
  }));

  return (
    <ContentLayout helpKey="review-actions">
      <ReviewActions
        type={ownerType}
        ownerId={id}
        title={owner.title}
        icon={owner.thematicIcon ?? 'suspended'}
        actions={actions}
        criteria={criteria}
      />
    </ContentLayout>
  );
}
