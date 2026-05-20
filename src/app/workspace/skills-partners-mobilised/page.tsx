import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import {
  getImpactsWithCompetencesForStudy,
  getSkillTerritoryCatalog,
} from '@/server/skills-partners/queries';
import { revokeImpactFromSkills } from '@/server/skills-partners/actions';
import { CompetenceForm } from '@/components/skills-partners/CompetenceForm';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string; showRevoked?: string }>;

export default async function SkillsPartnersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam, showRevoked } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const [impacts, skills] = await Promise.all([
    getImpactsWithCompetencesForStudy(study.id),
    getSkillTerritoryCatalog(),
  ]);

  const skillOptions = skills.map((s) => ({ id: s.id, label: s.label }));

  // Critère de priorité : sensibility × future_exposure >= 8
  // Les impacts révoqués apparaissent dans la section "Non prioritaires" (toggle).
  const impactsWithScore = impacts.map((imp) => {
    const sensitivity = imp.sensitivity ? Number(imp.sensitivity) : 0;
    const futureExposure = imp.observed_exposure?.future_exposure?.exposure
      ? Number(imp.observed_exposure.future_exposure.exposure)
      : 0;
    const score = sensitivity * futureExposure;
    return {
      impact: imp,
      score,
      isPriority: !imp.revoked_diagnostic && score >= 8,
    };
  });

  // Tri par score descendant pour mettre les plus exposés en premier
  impactsWithScore.sort((a, b) => b.score - a.score);

  const priority = impactsWithScore.filter((x) => x.isPriority);
  const nonPriority = impactsWithScore.filter((x) => !x.isPriority);
  const showNonPriority = showRevoked === '1';

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h1 className="c-title-black-bold">Compétences et partenaires à mobiliser</h1>
            <div className="c-subtitle-grey mt-1">
              {priority.length} impact{priority.length > 1 ? 's' : ''} prioritaire{priority.length > 1 ? 's' : ''}
              {' • '}
              {nonPriority.length} non prioritaire{nonPriority.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {priority.length === 0 && (
        <div className="o-card mt-4 text-center py-5">
          Aucun impact prioritaire. Les impacts deviennent prioritaires quand sensibilité × exposition
          future est ≥ 8.
        </div>
      )}

      {priority.map((x) => (
        <ImpactCard
          key={x.impact.id}
          impactWithScore={x}
          skills={skillOptions}
          canRevoke={false}
        />
      ))}

      {nonPriority.length > 0 && (
        <>
          <div className="row mt-5">
            <div className="col-lg-12 col-md-16">
              <a
                href={`?${showNonPriority ? '' : 'showRevoked=1'}`}
                className="c-btn--tertiary"
              >
                {showNonPriority ? '▾ Masquer' : '▸ Afficher'} les impacts non prioritaires (
                {nonPriority.length})
              </a>
            </div>
          </div>
          {showNonPriority &&
            nonPriority.map((x) => (
              <ImpactCard
                key={x.impact.id}
                impactWithScore={x}
                skills={skillOptions}
                canRevoke={!x.impact.revoked_diagnostic}
              />
            ))}
        </>
      )}
    </div>
  );
}

function ImpactCard({
  impactWithScore: { impact, score, isPriority },
  skills,
  canRevoke,
}: {
  impactWithScore: {
    impact: Awaited<ReturnType<typeof getImpactsWithCompetencesForStudy>>[number];
    score: number;
    isPriority: boolean;
  };
  skills: { id: string; label: string }[];
  canRevoke: boolean;
}) {
  const hazardName =
    impact.observed_exposure?.climate_hazard?.name ??
    impact.observed_exposure?.climate_hazard_custom ??
    '—';
  const sensitivity = impact.sensitivity ? Number(impact.sensitivity) : null;
  const futureExposure = impact.observed_exposure?.future_exposure?.exposure;

  const initial = impact.impact_competence.map((c) => ({
    id: c.id,
    skillTerritoryId: c.skill_territory_id ?? '',
    otherOrganization: c.other_organization,
  }));

  // Couleur d'alerte selon score (rouge ≥ 16, orange ≥ 12, jaune ≥ 8)
  const scoreColor =
    score >= 16 ? '#dc3545' : score >= 12 ? '#fd7e14' : score >= 8 ? '#ffc107' : '#6c757d';

  return (
    <div className="row mt-4">
      <div className="col-lg-12 col-md-16">
        <div className="o-card" style={{ borderLeft: `4px solid ${scoreColor}` }}>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="c-subtitle-black-bold m-0">
                {impact.description ?? '(impact sans description)'}
              </h2>
              <div className="c-subtitle-grey mt-1">
                Thématique : {impact.impact_theme?.name ?? '—'}
                {' • '}Aléa : {hazardName}
              </div>
              <div className="c-subtitle-grey mt-1">
                Sensibilité : {sensitivity ?? '—'} / 4
                {' • '}Exposition future :{' '}
                {futureExposure === null || futureExposure === undefined
                  ? '—'
                  : `${String(futureExposure)} / 3`}
                {' • '}Score : <strong>{score}</strong>
                {!isPriority && (
                  <span className="badge bg-warning ms-2">
                    {impact.revoked_diagnostic ? 'Retiré' : 'Non prioritaire'}
                  </span>
                )}
              </div>
            </div>
            {canRevoke && (
              <form
                action={async () => {
                  'use server';
                  await revokeImpactFromSkills(impact.id);
                }}
              >
                <button type="submit" className="c-btn--tertiary">
                  Retirer
                </button>
              </form>
            )}
          </div>

          <CompetenceForm impactId={impact.id} skills={skills} initial={initial} />
        </div>
      </div>
    </div>
  );
}
