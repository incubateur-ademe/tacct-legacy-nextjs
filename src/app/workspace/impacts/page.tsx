import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getStudiedImpactsForStudy } from '@/server/strategies/queries';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ImpactItem, type ImpactItemData } from '@/components/strategies/ImpactItem';
import { ExportActionPlanButton } from '@/components/strategies/ExportActionPlanButton';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

type Diagnosed = Awaited<ReturnType<typeof getStudiedImpactsForStudy>>['diagnosed'][number];
type Strategy = Awaited<ReturnType<typeof getStudiedImpactsForStudy>>['strategies'][number];

export default async function StudiedImpactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace');

  const { diagnosed, strategies } = await getStudiedImpactsForStudy(study.id);

  // Impacts étudiés = non révoqués ET (choisis OU prioritaires score ≥ 8).
  const studied = diagnosed
    .filter((i) => !i.revoked_diagnostic && (i.strategy_studied || score(i) >= 8))
    .map((i) => ({ impact: i, score: score(i) }));

  const priority = studied
    .filter((x) => x.score >= 8)
    .sort((a, b) => b.score - a.score);
  const notPriority = studied
    .filter((x) => x.score < 8)
    .sort((a, b) => (a.impact.created_at?.getTime() ?? 0) - (b.impact.created_at?.getTime() ?? 0));
  const strategySorted = [...strategies].sort(
    (a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0),
  );

  const totalImpacts = priority.length + notPriority.length + strategySorted.length;

  const suffix = studyIdParam ? `?study=${studyIdParam}` : '';

  const items: ImpactItemData[] = [
    ...priority.map((x) => toImpactItem(x.impact, true)),
    ...notPriority.map((x) => toImpactItem(x.impact, false)),
    ...strategySorted.map((s) => toStrategyItem(s)),
  ];

  return (
    <ContentLayout helpKey="impacts-studied">
      <div className="sc-studied-impacts">
        <div className="col-lg-12 col-md-16">
          <div className="o-card o-card__triangle">
            <div className="row">
              <BlockTitleIcon
                className="col-16"
                pageTitle="Impacts étudiés"
                subtitle="Construire des stratégies"
                icon="cible"
              />
            </div>
            <div className="o-centred-elements">
              <span className="ml-0 mr-auto sc-studied-impacts__subtitle">
                {pluralize(totalImpacts, `${totalImpacts} impact`, `${totalImpacts} impacts`)}
              </span>
              <ExportActionPlanButton studyId={study.id} disabled={totalImpacts === 0} />
              <Link href={`/workspace/impacts/choose-impacts${suffix}`} className="ml-2 mr-0 c-btn--primary">
                Choisir un impact
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-12 mt-5">
          {items.map((item) => (
            <ImpactItem key={`${item.kind}-${item.id}`} impact={item} />
          ))}
        </div>
      </div>
    </ContentLayout>
  );
}

function score(impact: Diagnosed): number {
  return (
    Number(impact.sensitivity ?? 0) *
    Number(impact.observed_exposure?.future_exposure?.exposure ?? 0)
  );
}

function toImpactItem(impact: Diagnosed, isPriority: boolean): ImpactItemData {
  return {
    kind: 'impact',
    id: impact.id,
    description: impact.description ?? '',
    thematicIcon: impact.impact_theme?.thematic?.icon ?? 'suspended',
    thematicName: impact.impact_theme?.thematic?.name ?? impact.impact_theme?.name ?? '',
    nbActions: impact.impact_action.length,
    nbTrajectories: impact.impact_trajectory.length,
    editable: false,
    deleteDisabled: isPriority,
  };
}

function toStrategyItem(strategy: Strategy): ImpactItemData {
  return {
    kind: 'strategy',
    id: strategy.id,
    description: strategy.description ?? '',
    thematicIcon: strategy.impact_theme?.thematic?.icon ?? 'suspended',
    thematicName: strategy.impact_theme?.thematic?.name ?? strategy.impact_theme?.name ?? '',
    nbActions: strategy.impact_action.length,
    nbTrajectories: strategy.impact_trajectory.length,
    editable: true,
    deleteDisabled: false,
  };
}
