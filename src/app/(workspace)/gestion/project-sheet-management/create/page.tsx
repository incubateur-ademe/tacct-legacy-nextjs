import { getDomainsList } from '@/server/admin/queries';
import { createProjectSheet } from '@/server/admin/actions';
import { ProjectSheetForm } from '@/components/admin/ProjectSheetForm';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

export default async function CreateProjectSheetPage() {
  const domains = await getDomainsList();
  return (
    <ContentLayout helpKey="admin">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <BlockTitleIcon
                pageTitle="Créer une fiche"
                subtitle="Fiches projet"
                icon="module-report"
              />
              <ProjectSheetForm
                mode="create"
                domains={domains}
                action={createProjectSheet}
              />
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
