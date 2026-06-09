import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DEFAULT_CRITERIA,
  getActionsForOwner,
  getImpactOwner,
  getReviewCriteriaForOwner,
  getTrajectoriesForOwner,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ImpactLevelAbstract } from '@/components/strategies/ImpactLevelAbstract';
import { ItemTrajectory, type TrajectoryData } from '@/components/strategies/ItemTrajectory';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function BuildTrajectoriesPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const [trajectories, actions, savedCriteria] = await Promise.all([
    getTrajectoriesForOwner(ownerType, id),
    getActionsForOwner(ownerType, id),
    getReviewCriteriaForOwner(ownerType, id),
  ]);

  const criteria =
    savedCriteria.length === 8
      ? savedCriteria.map((c) => ({ rank: c.rank, weighting: c.weighting }))
      : DEFAULT_CRITERIA.map((d) => ({ rank: d.rank, weighting: 1 }));

  const reviewsByAction = new Map(
    actions.map((a) => [a.id, a.impact_action_review.map((r) => ({ rank: r.rank, value: r.value }))]),
  );

  const trajData: TrajectoryData[] = trajectories.map((t) => ({
    id: t.id,
    name: t.name,
    actions: t.impact_trajectory_impact_action.map((j) => ({
      id: j.impact_action.id,
      intitule: j.impact_action.intitule,
      typeAction: j.impact_action.type_action,
      finalite1: j.impact_action.finalite1,
      finalite2: j.impact_action.finalite2,
      finalite3: j.impact_action.finalite3,
      anticipe1: j.impact_action.anticipe1,
      anticipe2: j.impact_action.anticipe2,
      reviews: reviewsByAction.get(j.impact_action.id) ?? [],
    })),
  }));

  return (
    <ContentLayout helpKey="build-trajectories">
      <div className="sc-build-trajectories">
        <div className="o-card o-card__triangle u-margin__bottom-l">
          <div className="row">
            <BlockTitleIcon
              className="col-16"
              pageTitle="Construction de trajectoires"
              subtitle={owner.title}
              icon={owner.thematicIcon ?? 'suspended'}
            />
          </div>
          <ImpactLevelAbstract impactLevel={owner.impactLevel} />
          <div className="o-centred-elements">
            <span className="ml-0 mr-auto">
              {pluralize(
                trajectories.length,
                `${trajectories.length} trajectoire`,
                `${trajectories.length} trajectoires`,
              )}
            </span>
            <Link
              href={`/workspace/impacts/${type}/${id}/build-trajectories/create-trajectory`}
              className="ml-auto mr-0 c-btn--primary"
            >
              Ajouter une trajectoire
            </Link>
          </div>
        </div>

        {trajData.map((trajectory) => (
          <ItemTrajectory
            key={trajectory.id}
            type={ownerType}
            ownerId={id}
            trajectory={trajectory}
            criteria={criteria}
          />
        ))}
      </div>
    </ContentLayout>
  );
}
