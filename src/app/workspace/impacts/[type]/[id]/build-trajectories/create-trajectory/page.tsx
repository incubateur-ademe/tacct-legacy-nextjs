import { notFound } from 'next/navigation';
import {
  DEFAULT_CRITERIA,
  getActionsForOwner,
  getImpactOwner,
  getReviewCriteriaForOwner,
  getTrajectoriesForOwner,
  parseIncompatibles,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { createTrajectory } from '@/server/strategies/impact-actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { TrajectoryForm, type EditorAction } from '@/components/strategies/TrajectoryForm';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function CreateTrajectoryPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const [actionsRaw, trajectories, savedCriteria] = await Promise.all([
    getActionsForOwner(ownerType, id),
    getTrajectoriesForOwner(ownerType, id),
    getReviewCriteriaForOwner(ownerType, id),
  ]);

  const criteria =
    savedCriteria.length === 8
      ? savedCriteria.map((c) => ({ rank: c.rank, weighting: c.weighting }))
      : DEFAULT_CRITERIA.map((d) => ({ rank: d.rank, weighting: 1 }));

  const actions: EditorAction[] = actionsRaw.map((a) => ({
    id: a.id,
    intitule: a.intitule,
    description: a.description,
    typeAction: a.type_action,
    finalite1: a.finalite1,
    finalite2: a.finalite2,
    finalite3: a.finalite3,
    anticipe1: a.anticipe1,
    anticipe2: a.anticipe2,
    incompatibles: parseIncompatibles(a.incompatibles),
    reviews: a.impact_action_review.map((r) => ({ rank: r.rank, value: r.value })),
  }));

  const submitAction = createTrajectory.bind(null, ownerType, id);

  return (
    <ContentLayout helpKey="build-trajectories">
      <div className="o-card sc-create-trajectory-card">
        <BlockTitleIcon
          className="col-16"
          pageTitle="Ajouter une trajectoire"
          subtitle={owner.title}
          icon={owner.thematicIcon ?? 'suspended'}
        />
        <TrajectoryForm
          type={ownerType}
          ownerId={id}
          actions={actions}
          criteria={criteria}
          impactLevel={owner.impactLevel}
          existingNames={trajectories.map((t) => t.name)}
          submitAction={submitAction}
        />
      </div>
    </ContentLayout>
  );
}
