import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { prisma } from '@/server/db';
import { getHazardsForCategoryAndStudy } from '@/server/observed-exposure/queries';
import { addObservedExposure } from '@/server/observed-exposure/actions';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { ExposureFormFields } from '@/components/observed-exposure/ExposureFormFields';

export const dynamic = 'force-dynamic';

type Params = Promise<{ category: string }>;
type SearchParams = Promise<{ study?: string }>;

export default async function AddExposureHazardPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { category } = await params;
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  const isCustom = category === 'custom';
  let categoryName = 'Aléa personnalisé';
  let categoryIcon = 'suspended';
  let hazards: Awaited<ReturnType<typeof getHazardsForCategoryAndStudy>> = [];

  if (!isCustom) {
    const cat = await prisma.climate_hazard_category.findUnique({
      where: { id: category },
      select: { name: true, icon: true },
    });
    if (!cat) notFound();
    categoryName = cat.name;
    categoryIcon = cat.icon;
    hazards = await getHazardsForCategoryAndStudy(category, study.id);
  }

  const qs = studyIdParam ? `?study=${studyIdParam}` : '';

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

              <form action={addObservedExposure}>
                <input type="hidden" name="studyId" value={study.id} />

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
                      {hazards.length === 0 && (
                        <p className="text-muted">Aucun aléa dans cette catégorie.</p>
                      )}
                      {hazards.map((h) => (
                        <div key={h.id} className="c-radio__group">
                          {/* Aléas déjà saisis : cochés et désactivés, hors du
                              groupe de radios pour ne pas fausser la sélection. */}
                          <input
                            type="radio"
                            name={h.alreadyExposed ? `used${h.id}` : 'climateHazardId'}
                            id={`climate${h.id}`}
                            value={h.id}
                            className="c-radio__input"
                            disabled={h.alreadyExposed}
                            defaultChecked={h.alreadyExposed}
                            required={!h.alreadyExposed}
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
                  cancelHref={`/observed-climate/observed-exposure${qs}`}
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
