import { ContentLayout } from '@/components/layout/ContentLayout';
import type { DetailSyntheseImpactItem } from '@/components/skills-partners/DetailSyntheseImpacts';
import { DetailSyntheseImpacts } from '@/components/skills-partners/DetailSyntheseImpacts';
import { SyntheseImpacts } from '@/components/skills-partners/SyntheseImpacts';
import type { SyntheseImpactItem } from '@/components/skills-partners/SyntheseImpactSimple';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { requireCurrentUser } from '@/server/auth/current-user';
import {
  getImpactsWithCompetencesForStudy,
  getSkillTerritoryCatalog,
} from '@/server/skills-partners/queries';
import { getCurrentStudy } from '@/server/study/current-study';
import { trendIcon } from '@/lib/skillsScore';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

// Ordre des groupes de tendance à futureExposure égal (cf. tri legacy).
const TREND_RANK: Record<string, number> = {
  'arrow-increases': 0,
  'arrow-holding': 1,
  'arrow-decreases': 2,
};

export default async function SkillsPartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  const [impacts, skills] = await Promise.all([
    getImpactsWithCompetencesForStudy(study.id),
    getSkillTerritoryCatalog(),
  ]);

  const skillOptions = skills.map((s) => ({ id: s.id, label: s.label ?? '' }));

  /**
   * Mapping legacy : pour chaque impact, on calcule
   *   observedExposure = sensitivity × exposure_observée
   *   futureExposure   = sensitivity × exposure_future
   * (les seuils 8/12/16 du legacy sont des produits sur 16.)
   */
  type Item = SyntheseImpactItem & {
    actionPlan: string;
    revokedDiagnostic: boolean;
    trend: string;
  };

  const items: Item[] = impacts.map((imp) => {
    const sensitivity = imp.sensitivity ? Number(imp.sensitivity) : 0;
    const obs = imp.observed_exposure?.exposure ? Number(imp.observed_exposure.exposure) : 0;
    const fut = imp.observed_exposure?.future_exposure?.exposure
      ? Number(imp.observed_exposure.future_exposure.exposure)
      : 0;
    const observedExposure = sensitivity * obs;
    const futureExposure = sensitivity * fut;
    return {
      id: imp.id,
      description: imp.description ?? '',
      thematicIcon: imp.impact_theme?.thematic?.icon ?? 'suspended',
      thematicName: imp.impact_theme?.thematic?.name ?? imp.impact_theme?.name ?? '',
      observedExposure,
      futureExposure,
      revokedDiagnostic: imp.revoked_diagnostic,
      actionPlan: imp.action_plan ?? '',
      trend: trendIcon(observedExposure, futureExposure),
    };
  });

  // Tri legacy : futureExposure DESC, puis groupe de tendance
  // (croît → stable → décroît), puis observedExposure DESC, puis description ASC.
  const sorted = [...items].sort((a, b) => {
    if (b.futureExposure !== a.futureExposure) return b.futureExposure - a.futureExposure;
    if (TREND_RANK[a.trend] !== TREND_RANK[b.trend]) {
      return (TREND_RANK[a.trend] ?? 0) - (TREND_RANK[b.trend] ?? 0);
    }
    if (b.observedExposure !== a.observedExposure) return b.observedExposure - a.observedExposure;
    return a.description.localeCompare(b.description);
  });

  // Liste compacte : tous les impacts (le split prio/non-prio se fait dans le composant).
  const syntheseItems: SyntheseImpactItem[] = sorted;

  // Détails : tous les impacts non révoqués (fidèle au legacy `*ngIf="!revokedDiagnostic"`).
  const detailItems: DetailSyntheseImpactItem[] = sorted
    .filter((i) => !i.revokedDiagnostic)
    .map((i) => ({
      id: i.id,
      description: i.description,
      thematicIcon: i.thematicIcon,
      thematicName: i.thematicName,
      actionPlan: i.actionPlan,
      observedExposure: i.observedExposure,
      futureExposure: i.futureExposure,
      revokedDiagnostic: i.revokedDiagnostic,
    }));

  // Index des compétences existantes par impact id
  const competencesByImpact = new Map<
    string,
    { id: string; skillTerritoryId: string; otherOrganization: string }[]
  >();
  for (const imp of impacts) {
    competencesByImpact.set(
      imp.id,
      imp.impact_competence.map((c) => ({
        id: c.id,
        skillTerritoryId: c.skill_territory_id ?? '',
        otherOrganization: c.other_organization ?? '',
      })),
    );
  }

  return (
    <ContentLayout helpKey="skills-partners-mobilised">
      <div className="page container">
        <div className="o-card u-margin__bottom--m">
          <div className="row">
            <BlockTitleIcon
              pageTitle="Compétences et partenaires à mobiliser"
              subtitle="Stratégies d'adaptation"
              icon="peoples"
            />
          </div>
        </div>

        <div className="o-card">
          <SyntheseImpacts impacts={syntheseItems} />
          <div style={{ margin: '5rem 0 0' }}></div>

          {detailItems.map((d) => (
            <DetailSyntheseImpacts
              key={d.id}
              syntheseImpact={d}
              skills={skillOptions}
              initialCompetences={competencesByImpact.get(d.id) ?? []}
            />
          ))}
        </div>
      </div>
    </ContentLayout>
  );
}
