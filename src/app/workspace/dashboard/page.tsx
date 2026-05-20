import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import {
  buildSynthesisMatrix,
  buildThematicAverages,
  getDashboardData,
} from '@/server/dashboard/queries';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const { exposures, themes } = await getDashboardData(study.id);
  const matrix = buildSynthesisMatrix(themes);
  const averages = buildThematicAverages(themes);
  const totalImpacts = themes.reduce((sum, t) => sum + t.impact.length, 0);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card">
            <h1 className="c-title-black-bold m-0">Diagnostic — synthèse</h1>
            <div className="c-subtitle-grey mt-1">
              {study.territory_name} ({String(study.year)})
            </div>
          </div>
        </div>
      </div>

      {/* ── Statuts des étapes ── */}
      <div className="row mt-4">
        <div className="col-lg-12">
          <div className="o-card d-flex flex-wrap gap-3">
            <StepBadge label="Climat passé" status={study.observed_exposure_valid} />
            <StepBadge label="Climat futur" status={study.exposition_future_valid} />
            <StepBadge label="Sensibilité" status={study.sensibility_valid} />
          </div>
        </div>
      </div>

      {/* ── Section : Exposition ── */}
      <div className="row mt-4">
        <div className="col-lg-7">
          <div className="o-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="c-subtitle-black-bold m-0">Exposition</h2>
              <Link
                href="/workspace/observed-climate/observed-exposure"
                className="c-btn--secondary"
              >
                Saisir le climat
              </Link>
            </div>

            {exposures.length === 0 && (
              <p className="text-muted mt-3">Aucun aléa observé.</p>
            )}

            {exposures.map((exp) => {
              const hazardName =
                exp.climate_hazard?.name ?? exp.climate_hazard_custom ?? '—';
              const observedExp = exp.exposure;
              const futureExp = exp.future_exposure?.exposure;
              const trend = exp.future_exposure?.trends ?? null;
              return (
                <div
                  key={exp.id}
                  className="mt-3 pt-3"
                  style={{ borderTop: '1px solid #eee' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {exp.climate_hazard?.climate_hazard_category?.icon && (
                        <em
                          className={`c-icon project-primary medium ${exp.climate_hazard.climate_hazard_category.icon} mr-2`}
                          aria-hidden="true"
                        />
                      )}
                      <strong>{hazardName}</strong>
                    </div>
                    <div>
                      <span className="badge bg-info">
                        Observé : {observedExp === null ? '—' : String(observedExp)}
                      </span>
                      <span className="mx-2">{trendArrow(trend)}</span>
                      <span className="badge bg-warning">
                        Futur :{' '}
                        {futureExp === null || futureExp === undefined
                          ? '—'
                          : String(futureExp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section : Sensibilité ── */}
        <div className="col-lg-5 mt-4 mt-lg-0">
          <div className="o-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="c-subtitle-black-bold m-0">Sensibilité</h2>
              <Link href="/workspace/sensibility" className="c-btn--secondary">
                Saisir
              </Link>
            </div>

            <div className="mt-2 c-subtitle-grey">
              {totalImpacts} impact{totalImpacts > 1 ? 's' : ''} sur {themes.length}{' '}
              thématique{themes.length > 1 ? 's' : ''}
            </div>

            {themes.map((t) => (
              <div
                key={t.id}
                className="mt-3 pt-2"
                style={{ borderTop: '1px solid #eee' }}
              >
                <div className="d-flex justify-content-between">
                  <strong>
                    {t.thematic?.icon && (
                      <em
                        className={`c-icon project-primary small ${t.thematic.icon} mr-2`}
                        aria-hidden="true"
                      />
                    )}
                    {t.name}
                  </strong>
                  <span className="c-subtitle-grey">
                    {t.impact.length} impact{t.impact.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Matrice synthèse 4×4 ── */}
      <div className="row mt-4">
        <div className="col-lg-12">
          <div className="o-card">
            <h2 className="c-subtitle-black-bold">Synthèse des impacts (4×4)</h2>
            <p className="c-subtitle-grey">
              Axe vertical : sensibilité (1→4). Axe horizontal : exposition (0→3).
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="table table-bordered text-center mt-3" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: 100 }} scope="col">
                      <span className="visually-hidden">Sensibilité / Exposition</span>
                    </th>
                    {[0, 1, 2, 3].map((x) => (
                      <th key={x}>Exposition {x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <th>Sensibilité {4 - rowIdx}</th>
                      {row.map((cell) => {
                        const allImpacts = [
                          ...cell.observed.map((i) => ({ ...i, kind: 'observé' as const })),
                          ...cell.future.map((i) => ({ ...i, kind: 'futur' as const })),
                        ];
                        return (
                          <td
                            key={cell.exposure}
                            style={{
                              minHeight: 60,
                              verticalAlign: 'top',
                              background:
                                cell.future.length > 0
                                  ? 'rgba(255,193,7,0.1)'
                                  : cell.observed.length > 0
                                    ? 'rgba(25,135,84,0.1)'
                                    : undefined,
                            }}
                          >
                            {allImpacts.map((i, k) => (
                              <div key={`${i.impactId}-${k}`} style={{ fontSize: 12 }}>
                                {i.thematicIcon && (
                                  <em
                                    className={`c-icon project-primary small ${i.thematicIcon} mr-1`}
                                    aria-hidden="true"
                                  />
                                )}
                                <span title={`${i.description} (${i.kind})`}>
                                  {i.thematicName}
                                </span>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex gap-3 mt-2">
              <span>
                <span
                  className="d-inline-block me-1"
                  style={{ width: 12, height: 12, background: 'rgba(25,135,84,0.4)' }}
                />
                Observé
              </span>
              <span>
                <span
                  className="d-inline-block me-1"
                  style={{ width: 12, height: 12, background: 'rgba(255,193,7,0.4)' }}
                />
                Futur
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Niveau moyen par thématique ── */}
      <div className="row mt-4">
        <div className="col-lg-12">
          <div className="o-card">
            <h2 className="c-subtitle-black-bold">Niveau moyen des impacts par thématique</h2>
            <p className="c-subtitle-grey">
              Moyenne de sensibilité × exposition pour chaque thématique.
            </p>
            {averages.length === 0 && (
              <p className="text-muted mt-3">Pas encore de donnée à agréger.</p>
            )}
            {averages.length > 0 && (
              <table className="table table-striped mt-3">
                <thead>
                  <tr>
                    <th>Thématique</th>
                    <th className="text-end">Niveau observé</th>
                    <th className="text-end">Niveau futur</th>
                    <th className="text-end">Nb impacts</th>
                  </tr>
                </thead>
                <tbody>
                  {averages.map((a) => (
                    <tr key={a.themeId}>
                      <td>
                        {a.thematicIcon && (
                          <em
                            className={`c-icon project-primary small ${a.thematicIcon} mr-2`}
                            aria-hidden="true"
                          />
                        )}
                        {a.thematicName}
                      </td>
                      <td className="text-end">{a.observed.toFixed(1)}</td>
                      <td className="text-end">{a.future.toFixed(1)}</td>
                      <td className="text-end">{a.nbImpacts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Export CSV ── */}
      <div className="row mt-4 mb-5">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h2 className="c-subtitle-black-bold m-0">Exporter la synthèse</h2>
              <div className="c-subtitle-grey">
                Télécharger l&apos;ensemble des impacts + aléas au format CSV.
              </div>
            </div>
            <a
              href={`/api/dashboard/${study.id}/csv`}
              className="c-btn--primary"
              download
            >
              Télécharger le CSV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBadge({ label, status }: { label: string; status: string }) {
  const color =
    status === 'validated' ? '#198754' : status === 'in-progress' ? '#f9a825' : '#dc3545';
  return (
    <div className="d-flex align-items-center">
      <span
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: color,
          marginRight: 8,
        }}
      />
      <strong>{label}</strong>
      <span className="ms-2 c-subtitle-grey">{status}</span>
    </div>
  );
}

function trendArrow(trend: string | null): string {
  if (trend === 'augmentation') return '↑';
  if (trend === 'diminution') return '↓';
  if (trend === 'stable') return '=';
  return '·';
}
