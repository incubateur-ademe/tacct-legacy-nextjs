import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import {
  getHazardsForCategoryAndStudy,
  getObservedExposure,
} from '@/server/observed-exposure/queries';
import { updateObservedExposure } from '@/server/observed-exposure/actions';
import { ExposureFormFields } from '@/components/observed-exposure/ExposureFormFields';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EditExposurePage({ params }: { params: Params }) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const exposure = await getObservedExposure(id);
  if (!exposure || !exposure.study_id) notFound();

  const canEdit = isAdmin(user) || user.user_study.some((us) => us.study_id === exposure.study_id);
  if (!canEdit) redirect('/workspace');

  const isCustom = !exposure.climate_hazard_id;
  const categoryId = exposure.climate_hazard?.climate_hazard_category_id ?? null;
  const categoryName = exposure.climate_hazard?.climate_hazard_category?.name ?? 'Aléa personnalisé';

  // Pour le radio en mode "non-custom" : on liste les aléas de la catégorie, en
  // gardant celui-ci sélectionné et désactivant les autres (lecture seule sur le hazard).
  const hazards = categoryId
    ? await getHazardsForCategoryAndStudy(categoryId, exposure.study_id)
    : [];

  // Bind l'id à l'action.
  const updateAction = updateObservedExposure.bind(null, id);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">
              Modifier l&apos;exposition — {categoryName}
            </h1>
            <Link
              href="/workspace/observed-climate/observed-exposure"
              className="c-btn--tertiary"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <form action={updateAction} className="mt-4">
        <input type="hidden" name="studyId" value={exposure.study_id} />

        <div className="o-card mb-3">
          <h2 className="c-subtitle-black-bold">Aléa</h2>
          {isCustom ? (
            <div className="c-input__group">
              <label className="c-input__label" htmlFor="climateHazardCustom">
                Nom de l&apos;aléa
              </label>
              <input
                id="climateHazardCustom"
                name="climateHazardCustom"
                type="text"
                required
                defaultValue={exposure.climate_hazard_custom ?? ''}
                maxLength={255}
                className="c-input"
              />
            </div>
          ) : (
            <div>
              {hazards.map((h) => (
                <div key={h.id} className="c-radio__group">
                  <input
                    type="radio"
                    name="climateHazardId"
                    id={`hazard-${h.id}`}
                    value={h.id}
                    defaultChecked={h.id === exposure.climate_hazard_id}
                    disabled={h.id !== exposure.climate_hazard_id}
                  />
                  <label htmlFor={`hazard-${h.id}`}>{h.name}</label>
                </div>
              ))}
            </div>
          )}
        </div>

        <ExposureFormFields
          defaults={{
            climateFeatures: exposure.climate_features,
            trends: exposure.trends,
            sources: exposure.sources,
            exposure: exposure.exposure === null ? null : Number(exposure.exposure),
            justification: exposure.justification,
          }}
        />
      </form>
    </div>
  );
}
