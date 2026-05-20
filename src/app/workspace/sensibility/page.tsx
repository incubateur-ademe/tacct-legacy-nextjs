import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import {
  getImpactThemesForStudy,
} from '@/server/sensibility/queries';
import {
  deleteImpactTheme,
  deleteImpact,
  validateSensibilityStep,
} from '@/server/sensibility/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function SensibilityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const themes = await getImpactThemesForStudy(study.id);
  const totalImpacts = themes.reduce((sum, t) => sum + t.impact.length, 0);
  const incomplete = themes
    .flatMap((t) => t.impact)
    .some((i) => i.sensitivity === null);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h1 className="c-title-black-bold m-0">Sensibilité</h1>
              <div className="c-subtitle-grey mt-1">
                {totalImpacts} impact{totalImpacts > 1 ? 's' : ''} qualifié{totalImpacts > 1 ? 's' : ''}
                {' '}sur {themes.length} thématique{themes.length > 1 ? 's' : ''}
              </div>
            </div>
            <Link
              href="/workspace/sensibility/impact-theme/add"
              className="c-btn--primary"
            >
              + Ajouter une thématique
            </Link>
          </div>
        </div>
      </div>

      {themes.length === 0 && (
        <div className="o-card mt-4 text-center py-5">
          Aucune thématique ajoutée. Commence par en créer une.
        </div>
      )}

      {themes.map((theme) => (
        <div key={theme.id} className="row mt-4">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h2 className="c-subtitle-black-bold m-0">
                    {theme.thematic?.icon && (
                      <em
                        className={`c-icon medium project-primary ${theme.thematic.icon} mr-2`}
                        aria-hidden="true"
                      />
                    )}
                    {theme.name}
                  </h2>
                  {theme.justification && (
                    <p className="c-subtitle-grey mt-1 mb-0">{theme.justification}</p>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Link
                    href={`/workspace/sensibility/impact-theme/impact/add/${theme.id}`}
                    className="c-btn--secondary"
                  >
                    + Impact
                  </Link>
                  <form
                    action={async () => {
                      'use server';
                      await deleteImpactTheme(theme.id);
                    }}
                  >
                    <button type="submit" className="c-btn--tertiary">
                      Supprimer thématique
                    </button>
                  </form>
                </div>
              </div>

              {theme.impact.length === 0 && (
                <div className="mt-3 text-muted">Aucun impact dans cette thématique.</div>
              )}

              {theme.impact.map((impact) => {
                const primaryHazard =
                  impact.observed_exposure?.climate_hazard?.name ??
                  '—';
                return (
                  <div key={impact.id} className="mt-3 pt-3" style={{ borderTop: '1px solid #eee' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <strong>{impact.description ?? '(sans description)'}</strong>
                        <div className="c-subtitle-grey">
                          Aléa principal : {primaryHazard}
                          {' • '}
                          Sensibilité :{' '}
                          {impact.sensitivity === null ? (
                            <span className="text-danger">Non renseignée</span>
                          ) : (
                            `${String(impact.sensitivity)} / 4`
                          )}
                          {impact.revoked_diagnostic && (
                            <span className="badge bg-warning ms-2">
                              Diagnostic révoqué (sensibilité × exposition future &lt; 8)
                            </span>
                          )}
                        </div>
                        {impact.observed_impact && (
                          <p className="mt-2 mb-0 u-txt-word-break">{impact.observed_impact}</p>
                        )}
                      </div>
                      <div className="d-flex gap-2 ms-3">
                        <Link
                          href={`/workspace/sensibility/impact-theme/impact/edit/${impact.id}`}
                          className="c-btn--secondary"
                        >
                          Modifier
                        </Link>
                        <form
                          action={async () => {
                            'use server';
                            await deleteImpact(impact.id);
                          }}
                        >
                          <button type="submit" className="c-btn--tertiary">
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {totalImpacts > 0 && (
        <div className="o-card mt-4">
          {incomplete && (
            <div className="text-danger mb-2">
              Certains impacts n&apos;ont pas de note de sensibilité. La validation passera l&apos;étape en
              « incomplet ».
            </div>
          )}
          <form
            action={async () => {
              'use server';
              await validateSensibilityStep(study.id);
            }}
          >
            <button type="submit" className="c-btn--primary">
              Valider la sensibilité
            </button>
          </form>
          <div className="c-subtitle-grey mt-2">
            Statut actuel : <strong>{study.sensibility_valid}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
