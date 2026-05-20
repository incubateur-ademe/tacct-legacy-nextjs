import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getDiagnosedImpactsForStudy } from '@/server/strategies/queries';
import { setImpactStudied } from '@/server/strategies/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function ChooseImpactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const impacts = await getDiagnosedImpactsForStudy(study.id);
  const impactsWithScore = impacts.map((imp) => {
    const s = imp.sensitivity ? Number(imp.sensitivity) : 0;
    const f = imp.observed_exposure?.future_exposure?.exposure
      ? Number(imp.observed_exposure.future_exposure.exposure)
      : 0;
    return { impact: imp, score: s * f };
  });
  impactsWithScore.sort((a, b) => b.score - a.score);

  const priority = impactsWithScore.filter((x) => x.score >= 8);
  const nonPriority = impactsWithScore.filter((x) => x.score < 8);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h1 className="c-title-black-bold m-0">Choisir un impact à étudier</h1>
              <div className="c-subtitle-grey mt-1">
                Sélectionne un impact diagnostiqué ou crée-en un nouveau.
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link href="/workspace/impacts" className="c-btn--tertiary">
                ← Retour
              </Link>
              <Link
                href="/workspace/impacts/choose-impacts/create-impact"
                className="c-btn--primary"
              >
                + Créer un impact
              </Link>
            </div>
          </div>
        </div>
      </div>

      {priority.length === 0 && nonPriority.length === 0 && (
        <div className="o-card mt-4 text-center py-5">
          Aucun impact diagnostiqué. Commence par l&apos;étape sensibilité.
        </div>
      )}

      {priority.length > 0 && (
        <div className="row mt-4">
          <div className="col-lg-12">
            <h2 className="c-subtitle-black-bold">Impacts prioritaires (score ≥ 8)</h2>
          </div>
        </div>
      )}
      {priority.map(({ impact, score }) => (
        <ImpactRow key={impact.id} impact={impact} score={score} />
      ))}

      {nonPriority.length > 0 && (
        <>
          <div className="row mt-5">
            <div className="col-lg-12">
              <h2 className="c-subtitle-black-bold">
                Autres impacts ({nonPriority.length})
              </h2>
            </div>
          </div>
          {nonPriority.map(({ impact, score }) => (
            <ImpactRow key={impact.id} impact={impact} score={score} />
          ))}
        </>
      )}
    </div>
  );
}

function ImpactRow({
  impact,
  score,
}: {
  impact: Awaited<ReturnType<typeof getDiagnosedImpactsForStudy>>[number];
  score: number;
}) {
  const studied = impact.strategy_studied;
  const hazardName =
    impact.observed_exposure?.climate_hazard?.name ??
    impact.observed_exposure?.climate_hazard_custom ??
    '—';
  return (
    <div className="row mt-3">
      <div className="col-lg-12">
        <div className="o-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <strong>{impact.description ?? '(sans description)'}</strong>
              <div className="c-subtitle-grey">
                {impact.impact_theme?.thematic?.icon && (
                  <em
                    className={`c-icon project-primary small ${impact.impact_theme.thematic.icon} mr-1`}
                    aria-hidden="true"
                  />
                )}
                {impact.impact_theme?.name ?? '—'}
                {' • '}Aléa : {hazardName}
                {' • '}Score : <strong>{score}</strong>
                {studied && <span className="badge bg-success ms-2">Étudié</span>}
              </div>
            </div>
            <form
              action={async () => {
                'use server';
                await setImpactStudied(impact.id, !studied);
              }}
            >
              <button
                type="submit"
                className={studied ? 'c-btn--tertiary' : 'c-btn--primary'}
              >
                {studied ? 'Retirer de l’étude' : 'Étudier cet impact'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
