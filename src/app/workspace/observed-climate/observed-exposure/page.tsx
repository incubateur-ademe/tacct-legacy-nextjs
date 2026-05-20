import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getObservedExposuresForStudy } from '@/server/observed-exposure/queries';
import {
  deleteObservedExposure,
  validateObservedExposureStep,
} from '@/server/observed-exposure/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function ObservedExposurePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const exposures = await getObservedExposuresForStudy(study.id);
  const total = exposures.length;
  const incomplete = exposures.some((e) => e.exposure === null);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <div className="d-flex align-items-center justify-content-between">
              <h1 className="c-title-black-bold m-0">Saisie exposition observée</h1>
              <Link
                href="/workspace/observed-climate/observed-exposure/add"
                className="c-btn--primary"
              >
                + Ajouter un aléa
              </Link>
            </div>
            <div className="mt-2 c-subtitle-grey">
              {total} {total > 1 ? 'aléas saisis' : 'aléa saisi'}
            </div>
          </div>
        </div>
      </div>

      {total === 0 && (
        <div className="o-card mt-4 text-center py-5">
          Aucun aléa saisi pour le moment.
        </div>
      )}

      {exposures.map((exp) => {
        const hazardName = exp.climate_hazard_custom ?? exp.climate_hazard?.name ?? '—';
        const categoryName = exp.climate_hazard?.climate_hazard_category?.name;
        return (
          <div key={exp.id} className="row mt-4">
            <div className="col-lg-12 col-md-16">
              <div className="o-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="c-subtitle-black-bold m-0">{hazardName}</h3>
                    {categoryName && (
                      <div className="c-subtitle-grey">{categoryName}</div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Link
                      href={`/workspace/observed-climate/observed-exposure/${exp.id}/edit`}
                      className="c-btn--secondary"
                    >
                      Modifier
                    </Link>
                    <form
                      action={async () => {
                        'use server';
                        await deleteObservedExposure(exp.id);
                      }}
                    >
                      <button type="submit" className="c-btn--tertiary">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>

                {exp.climate_features && (
                  <Section title="Caractéristiques climatiques">{exp.climate_features}</Section>
                )}
                {exp.trends && <Section title="Tendances passées">{exp.trends}</Section>}
                {exp.sources && <Section title="Sources">{exp.sources}</Section>}

                <div className="mt-3">
                  <strong>Notation exposition : </strong>
                  {exp.exposure === null ? (
                    <span className="text-danger">Non renseignée</span>
                  ) : (
                    <span>{String(exp.exposure)} / 3</span>
                  )}
                </div>
                {exp.justification && (
                  <Section title="Justification">{exp.justification}</Section>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {total > 0 && (
        <div className="o-card mt-4">
          {incomplete && (
            <div className="text-danger mb-2">
              Certaines expositions n&apos;ont pas de notation. La validation passera l&apos;étape en
              « incomplet ».
            </div>
          )}
          <form
            action={async () => {
              'use server';
              await validateObservedExposureStep(study.id);
            }}
          >
            <button type="submit" className="c-btn--primary">
              Valider l&apos;exposition
            </button>
          </form>
          <div className="c-subtitle-grey mt-2">
            Statut actuel : <strong>{study.observed_exposure_valid}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="c-subtitle-grey">{title}</div>
      <div className="u-txt-word-break">{children}</div>
    </div>
  );
}
