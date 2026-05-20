import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getObservedExposuresWithFutureForStudy } from '@/server/future-exposure/queries';
import {
  saveFutureExposure,
  validateFutureExposureStep,
} from '@/server/future-exposure/actions';

export const dynamic = 'force-dynamic';

const TRENDS_OPTIONS = [
  { value: '', label: '— Non renseigné —' },
  { value: 'stable', label: 'Stable' },
  { value: 'augmentation', label: 'Augmentation' },
  { value: 'diminution', label: 'Diminution' },
  { value: 'incertain', label: 'Incertain' },
];

const EXPOSURE_OPTIONS = [
  { value: '', label: '— Non renseigné —' },
  { value: '0', label: '0 — Aucune' },
  { value: '1', label: '1 — Faible' },
  { value: '2', label: '2 — Modérée' },
  { value: '3', label: '3 — Forte' },
];

type SearchParams = Promise<{ study?: string }>;

export default async function CaptureFutureClimatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const exposures = await getObservedExposuresWithFutureForStudy(study.id);
  const incomplete = exposures.some(
    (e) => !e.future_exposure || !e.future_exposure.trends || e.future_exposure.exposure === null,
  );

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h1 className="c-title-black-bold">Saisie de l&apos;exposition future aux aléas</h1>
            <div className="mt-2 c-subtitle-grey">
              {exposures.length} {exposures.length > 1 ? 'aléas' : 'aléa'} à renseigner
            </div>
            <div className="mt-2">
              <Link
                href="/workspace/future-climate/analyse-future-climate"
                className="c-btn--secondary"
              >
                Voir les instructions d&apos;analyse
              </Link>
            </div>
          </div>
        </div>
      </div>

      {exposures.length === 0 && (
        <div className="o-card mt-4 text-center py-5">
          Aucun aléa observé n&apos;a été saisi. Commence par renseigner les expositions observées.
          <div className="mt-3">
            <Link
              href="/workspace/observed-climate/observed-exposure"
              className="c-btn--primary"
            >
              Aller à la saisie observée
            </Link>
          </div>
        </div>
      )}

      {exposures.map((exp) => {
        const hazardName = exp.climate_hazard_custom ?? exp.climate_hazard?.name ?? '—';
        const fe = exp.future_exposure;
        return (
          <div key={exp.id} className="row mt-4">
            <div className="col-lg-12 col-md-16">
              <div className="o-card">
                <h2 className="c-subtitle-black-bold m-0">{hazardName}</h2>
                {exp.climate_hazard?.climate_hazard_category && (
                  <div className="c-subtitle-grey">
                    {exp.climate_hazard.climate_hazard_category.name}
                  </div>
                )}

                <div className="mt-2 c-subtitle-grey">
                  Exposition observée actuelle :{' '}
                  {exp.exposure === null ? 'non renseignée' : `${String(exp.exposure)} / 3`}
                </div>

                <form action={saveFutureExposure} className="mt-3">
                  <input type="hidden" name="observedExposureId" value={exp.id} />

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="c-input__label" htmlFor={`trends-${exp.id}`}>
                        Évolution future
                      </label>
                      <select
                        id={`trends-${exp.id}`}
                        name="trends"
                        defaultValue={fe?.trends ?? ''}
                        className="c-input w-100"
                      >
                        {TRENDS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="c-input__label" htmlFor={`exposure-${exp.id}`}>
                        Exposition future
                      </label>
                      <select
                        id={`exposure-${exp.id}`}
                        name="exposure"
                        defaultValue={fe?.exposure === undefined || fe?.exposure === null ? '' : String(fe.exposure)}
                        className="c-input w-100"
                      >
                        {EXPOSURE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="c-input__label" htmlFor={`justification-${exp.id}`}>
                      Justification
                    </label>
                    <textarea
                      id={`justification-${exp.id}`}
                      name="justification"
                      defaultValue={fe?.justification ?? ''}
                      rows={3}
                      maxLength={1000}
                      className="c-input w-100"
                    />
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="c-btn--secondary">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })}

      {exposures.length > 0 && (
        <div className="o-card mt-4">
          {incomplete && (
            <div className="text-danger mb-2">
              Certaines expositions n&apos;ont pas leurs champs « Évolution future » et « Exposition future » remplis.
              La validation passera l&apos;étape en « incomplet ».
            </div>
          )}
          <form
            action={async () => {
              'use server';
              await validateFutureExposureStep(study.id);
            }}
          >
            <button type="submit" className="c-btn--primary">
              Valider l&apos;exposition future
            </button>
          </form>
          <div className="c-subtitle-grey mt-2">
            Statut actuel : <strong>{study.exposition_future_valid}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
