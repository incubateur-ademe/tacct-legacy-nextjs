import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getCategoriesForStudy } from '@/server/observed-exposure/queries';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function AddExposureCategoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const categories = await getCategoriesForStudy(study.id);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">Choisir une catégorie d&apos;aléa</h1>
            <Link href="/workspace/observed-climate/observed-exposure" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        {categories.map((cat) => {
          const allUsed = cat.nbClimate > 0 && cat.nbClimate === cat.nbExposure;
          return (
            <div key={cat.id} className="col-lg-4 col-md-6 mb-3">
              {allUsed ? (
                <div className="o-card text-center" style={{ opacity: 0.5 }}>
                  <em
                    className={`c-icon project-primary medium ${cat.icon}`}
                    aria-hidden="true"
                  />
                  <div className="c-subtitle-black-bold mt-2">{cat.name}</div>
                  <div className="c-subtitle-grey">Tous les aléas saisis</div>
                </div>
              ) : (
                <Link
                  href={`/workspace/observed-climate/observed-exposure/add/${cat.id}`}
                  className="o-card text-center d-block text-decoration-none"
                >
                  <em
                    className={`c-icon project-primary medium ${cat.icon}`}
                    aria-hidden="true"
                  />
                  <div className="c-subtitle-black-bold mt-2">{cat.name}</div>
                  <div className="c-subtitle-grey">
                    {cat.nbExposure}/{cat.nbClimate} aléas
                  </div>
                </Link>
              )}
            </div>
          );
        })}

        {/* Aléa personnalisé — toujours actif */}
        <div className="col-lg-4 col-md-6 mb-3">
          <Link
            href="/workspace/observed-climate/observed-exposure/add/custom"
            className="o-card text-center d-block text-decoration-none"
          >
            <em className="c-icon project-primary medium edit" aria-hidden="true" />
            <div className="c-subtitle-black-bold mt-2">Aléa personnalisé</div>
            <div className="c-subtitle-grey">Saisir un aléa libre</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
