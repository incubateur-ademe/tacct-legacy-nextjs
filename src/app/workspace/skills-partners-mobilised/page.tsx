import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import {
  getImpactsWithCompetencesForStudy,
  getSkillTerritoryCatalog,
} from '@/server/skills-partners/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { SyntheseImpacts } from '@/components/skills-partners/SyntheseImpacts';
import { DetailSyntheseImpacts } from '@/components/skills-partners/DetailSyntheseImpacts';
import type { SyntheseImpactItem } from '@/components/skills-partners/SyntheseImpactSimple';
import type { DetailSyntheseImpactItem } from '@/components/skills-partners/DetailSyntheseImpacts';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

const MIN_FUTURE_EXPOSURE = 8;

export default async function SkillsPartnersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

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
  };

  const items: Item[] = impacts.map((imp) => {
    const sensitivity = imp.sensitivity ? Number(imp.sensitivity) : 0;
    const obs = imp.observed_exposure?.exposure ? Number(imp.observed_exposure.exposure) : 0;
    const fut = imp.observed_exposure?.future_exposure?.exposure
      ? Number(imp.observed_exposure.future_exposure.exposure)
      : 0;
    return {
      id: imp.id,
      description: imp.description ?? '',
      thematicIcon: imp.impact_theme?.thematic?.icon ?? 'suspended',
      thematicName: imp.impact_theme?.thematic?.name ?? imp.impact_theme?.name ?? '',
      observedExposure: sensitivity * obs,
      futureExposure: sensitivity * fut,
      revokedDiagnostic: imp.revoked_diagnostic,
      actionPlan: imp.action_plan ?? '',
    };
  });

  // Tri legacy : par futureExposure DESC puis par description
  const sorted = [...items].sort((a, b) => {
    if (b.futureExposure !== a.futureExposure) return b.futureExposure - a.futureExposure;
    return a.description.localeCompare(b.description);
  });

  // Pour la liste compacte : ignore les impacts révoqués dans les prioritaires
  // (la legacy les filtre en amont via le store) — on garde tous pour avoir
  // possibilité de réajouter via le bouton "Ajouter" dans la zone non-prio.
  const syntheseItems: SyntheseImpactItem[] = sorted;

  // Pour les détails : uniquement les prioritaires non révoqués
  const detailItems: DetailSyntheseImpactItem[] = sorted
    .filter((i) => i.futureExposure >= MIN_FUTURE_EXPOSURE && !i.revokedDiagnostic)
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
      <div className="container page">
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
