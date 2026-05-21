import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getThematicsCatalogForStudy } from '@/server/sensibility/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { AddThematicForm } from '@/components/sensibility/AddThematicForm';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function AddThematicPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const thematics = await getThematicsCatalogForStudy(study.id);

  return (
    <ContentLayout helpKey="sensibility">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Ajouter une thématique"
                  subtitle="Diagnostiquer vos impacts"
                  icon="sensibilite"
                />
              </div>
              <AddThematicForm studyId={study.id} thematics={thematics} />
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
