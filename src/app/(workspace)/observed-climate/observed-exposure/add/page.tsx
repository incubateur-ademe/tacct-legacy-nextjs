import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getCategoriesForStudy } from '@/server/observed-exposure/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { ClimateHazardCategory } from '@/components/observed-climate/ClimateHazardCategory';

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
  if (!study) redirect('/gestion/studies-management');

  const categories = await getCategoriesForStudy(study.id);

  return (
    <ContentLayout helpKey="observed-exposure">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Ajouter un aléa climatique"
                  subtitle="Diagnostiquer vos impacts"
                  icon="eye"
                />
              </div>
              <div className="container">
                <div className="c-add-exposure__list-categories">
                  {categories.map((cat) => {
                    const allUsed = cat.nbClimate > 0 && cat.nbClimate === cat.nbExposure;
                    return (
                      <ClimateHazardCategory
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        icon={cat.icon}
                        color={allUsed ? 'empty' : 'project-primary'}
                        disabled={allUsed}
                      />
                    );
                  })}
                  <ClimateHazardCategory
                    id="custom"
                    name="Aléa personnalisé"
                    icon="suspended"
                    color="project-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
