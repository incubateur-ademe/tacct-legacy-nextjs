import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { prisma } from '@/server/db';
import { getHazardsForCategoryAndStudy } from '@/server/observed-exposure/queries';
import { addObservedExposure } from '@/server/observed-exposure/actions';
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
  if (!study) redirect('/workspace/gestion/studies-management');

  const isCustom = category === 'custom';
  let categoryName = 'Aléa personnalisé';
  let hazards: Awaited<ReturnType<typeof getHazardsForCategoryAndStudy>> = [];

  if (!isCustom) {
    const cat = await prisma.climate_hazard_category.findUnique({
      where: { id: category },
      select: { name: true },
    });
    if (!cat) notFound();
    categoryName = cat.name;
    hazards = await getHazardsForCategoryAndStudy(category, study.id);
  }

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">Ajouter un aléa — {categoryName}</h1>
            <Link
              href="/workspace/observed-climate/observed-exposure/add"
              className="c-btn--tertiary"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <form action={addObservedExposure} className="mt-4">
        <input type="hidden" name="studyId" value={study.id} />

        {/* ── Aléa ── */}
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
                maxLength={255}
                className="c-input"
              />
            </div>
          ) : (
            <div>
              {hazards.length === 0 && (
                <p className="text-muted">Aucun aléa dans cette catégorie.</p>
              )}
              {hazards.map((h) => (
                <div key={h.id} className="c-radio__group">
                  <input
                    type="radio"
                    name="climateHazardId"
                    id={`hazard-${h.id}`}
                    value={h.id}
                    disabled={h.alreadyExposed}
                    required
                  />
                  <label
                    htmlFor={`hazard-${h.id}`}
                    className={h.alreadyExposed ? 'text-muted' : ''}
                  >
                    {h.name}
                    {h.alreadyExposed && ' (déjà saisi)'}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <ExposureFormFields />
      </form>
    </div>
  );
}
