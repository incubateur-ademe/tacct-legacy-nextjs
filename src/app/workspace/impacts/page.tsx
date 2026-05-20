import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getStudiedImpactsForStudy } from '@/server/strategies/queries';
import {
  setImpactStudied,
  deleteImpactStrategy,
} from '@/server/strategies/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function StudiedImpactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const { diagnosed, strategies } = await getStudiedImpactsForStudy(study.id);

  // Tri prioritaires / non-prioritaires côté impact diagnostiqué
  const diagnosedWithScore = diagnosed.map((imp) => {
    const s = imp.sensitivity ? Number(imp.sensitivity) : 0;
    const f = imp.observed_exposure?.future_exposure?.exposure
      ? Number(imp.observed_exposure.future_exposure.exposure)
      : 0;
    return { impact: imp, score: s * f };
  });
  diagnosedWithScore.sort((a, b) => b.score - a.score);

  const priority = diagnosedWithScore.filter((x) => x.score >= 8 || x.impact.strategy_studied);
  const nonPriority = diagnosedWithScore.filter(
    (x) => x.score < 8 && !x.impact.strategy_studied,
  );

  const total = priority.length + strategies.length;

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h1 className="c-title-black-bold m-0">Impacts étudiés</h1>
              <div className="c-subtitle-grey mt-1">
                {total} impact{total > 1 ? 's' : ''} en cours de stratégie
              </div>
            </div>
            <Link href="/workspace/impacts/choose-impacts" className="c-btn--primary">
              + Choisir un impact
            </Link>
          </div>
        </div>
      </div>

      {total === 0 && (
        <div className="o-card mt-4 text-center py-5">
          Aucun impact étudié. Choisis-en parmi les impacts diagnostiqués ou crée-en un nouveau.
        </div>
      )}

      {/* ── Impacts diagnostiqués prioritaires ── */}
      {priority.length > 0 && (
        <div className="row mt-4">
          <div className="col-lg-12">
            <h2 className="c-subtitle-black-bold">
              Impacts diagnostiqués prioritaires ({priority.length})
            </h2>
          </div>
        </div>
      )}
      {priority.map(({ impact, score }) => (
        <DiagnosedImpactCard key={impact.id} impact={impact} score={score} />
      ))}

      {/* ── Impact strategies (ex nihilo) ── */}
      {strategies.length > 0 && (
        <div className="row mt-5">
          <div className="col-lg-12">
            <h2 className="c-subtitle-black-bold">
              Impacts stratégie créés ex nihilo ({strategies.length})
            </h2>
          </div>
        </div>
      )}
      {strategies.map((s) => (
        <div key={s.id} className="row mt-3">
          <div className="col-lg-12">
            <div className="o-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{s.description ?? '(sans description)'}</strong>
                  <div className="c-subtitle-grey">
                    {s.impact_theme?.thematic?.icon && (
                      <em
                        className={`c-icon project-primary small ${s.impact_theme.thematic.icon} mr-1`}
                        aria-hidden="true"
                      />
                    )}
                    {s.impact_theme?.name ?? '—'}
                    {' • '}
                    {s.impact_action.length} action{s.impact_action.length > 1 ? 's' : ''}
                    {' • '}
                    {s.impact_trajectory.length} trajectoire
                    {s.impact_trajectory.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Link
                    href={`/workspace/impacts/strategy/${s.id}/impact-level`}
                    className="c-btn--secondary"
                  >
                    Travailler
                  </Link>
                  <Link
                    href={`/workspace/impacts/choose-impacts/${s.id}`}
                    className="c-btn--tertiary"
                  >
                    Modifier
                  </Link>
                  <form
                    action={async () => {
                      'use server';
                      await deleteImpactStrategy(s.id);
                    }}
                  >
                    <button type="submit" className="c-btn--tertiary">
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── Impacts diagnostiqués non prioritaires ── */}
      {nonPriority.length > 0 && (
        <details className="row mt-5">
          <summary
            className="col-lg-12 c-subtitle-grey"
            style={{ cursor: 'pointer' }}
          >
            Voir les impacts diagnostiqués non prioritaires ({nonPriority.length})
          </summary>
          {nonPriority.map(({ impact, score }) => (
            <DiagnosedImpactCard
              key={impact.id}
              impact={impact}
              score={score}
              canStudy
            />
          ))}
        </details>
      )}
    </div>
  );
}

function DiagnosedImpactCard({
  impact,
  score,
  canStudy = false,
}: {
  impact: Awaited<ReturnType<typeof getStudiedImpactsForStudy>>['diagnosed'][number];
  score: number;
  canStudy?: boolean;
}) {
  const studied = impact.strategy_studied;
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
                {' • '}
                Score : {score}
                {' • '}
                {impact.impact_action.length} action{impact.impact_action.length > 1 ? 's' : ''}
                {' • '}
                {impact.impact_trajectory.length} trajectoire
                {impact.impact_trajectory.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link
                href={`/workspace/impacts/impact/${impact.id}/impact-level`}
                className="c-btn--secondary"
              >
                Travailler
              </Link>
              {canStudy && !studied && (
                <form
                  action={async () => {
                    'use server';
                    await setImpactStudied(impact.id, true);
                  }}
                >
                  <button type="submit" className="c-btn--tertiary">
                    Étudier
                  </button>
                </form>
              )}
              {studied && (
                <form
                  action={async () => {
                    'use server';
                    await setImpactStudied(impact.id, false);
                  }}
                >
                  <button type="submit" className="c-btn--tertiary">
                    Retirer
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
