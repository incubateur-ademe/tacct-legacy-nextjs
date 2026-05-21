import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import {
  getHazardsForCategoryAndStudy,
  getObservedExposure,
} from '@/server/observed-exposure/queries';
import { updateObservedExposure } from '@/server/observed-exposure/actions';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
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
  const category = exposure.climate_hazard?.climate_hazard_category ?? null;
  const categoryName = category?.name ?? 'Aléa personnalisé';
  const categoryIcon = category?.icon ?? 'suspended';

  const hazards = categoryId
    ? await getHazardsForCategoryAndStudy(categoryId, exposure.study_id)
    : [];

  const updateAction = updateObservedExposure.bind(null, id);

  return (
    <ContentLayout helpKey="observed-exposure">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Décrire l'exposition à l'aléa"
                  subtitle="Diagnostiquer vos impacts"
                  icon="eye"
                />
              </div>

              <form action={updateAction}>
                <input type="hidden" name="studyId" value={exposure.study_id} />

                <div className="c-legend mb-3">Aléa</div>
                <div className="o-card">
                  <BlockTitleIcon
                    className="col-16"
                    pageTitle={categoryName}
                    icon={categoryIcon}
                    size="large"
                  />

                  {isCustom ? (
                    <section className="mt-2">
                      <div className="row">
                        <div className="c-input__group col-sm-16 w-100">
                          <input
                            id="climateHazardCustom"
                            name="climateHazardCustom"
                            type="text"
                            required
                            defaultValue={exposure.climate_hazard_custom ?? ''}
                            maxLength={255}
                            className="c-input__large"
                          />
                          <label className="c-input__label" htmlFor="climateHazardCustom">
                            Nom de l&apos;aléa
                          </label>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="mt-3">
                      {hazards.map((h) => (
                        <div key={h.id} className="c-radio__group">
                          <input
                            type="radio"
                            name="climateHazardId"
                            id={`climate${h.id}`}
                            value={h.id}
                            className="c-radio__input"
                            defaultChecked={h.id === exposure.climate_hazard_id}
                            disabled={h.id !== exposure.climate_hazard_id}
                          />
                          <label className="c-radio__label" htmlFor={`climate${h.id}`}>
                            {h.name}
                          </label>
                        </div>
                      ))}
                    </section>
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
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
