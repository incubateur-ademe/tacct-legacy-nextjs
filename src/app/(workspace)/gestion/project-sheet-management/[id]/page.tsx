import { notFound } from 'next/navigation';
import { getDomainsList, getProjectSheetById } from '@/server/admin/queries';
import { updateProjectSheet } from '@/server/admin/actions';
import { ProjectSheetForm } from '@/components/admin/ProjectSheetForm';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EditProjectSheetPage({ params }: { params: Params }) {
  const { id } = await params;
  const [sheet, domains] = await Promise.all([
    getProjectSheetById(id),
    getDomainsList(),
  ]);
  if (!sheet) notFound();

  const updateAction = updateProjectSheet.bind(null, id);

  return (
    <ContentLayout helpKey="admin">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <BlockTitleIcon
                pageTitle={sheet.name}
                subtitle="Fiches projet"
                icon="module-report"
              />
              <ProjectSheetForm
                mode="edit"
                domains={domains}
                action={updateAction}
                defaults={{
                  name: sheet.name,
                  slug: sheet.slug,
                  abstract: sheet.abstract,
                  domainId: sheet.domain_id,
                  areaType: sheet.area_type,
                  activityType: sheet.activity_type,
                  expectedEffects: sheet.expected_effects,
                  consequences: sheet.consequences,
                  resources: sheet.resources,
                  imageAlt: sheet.image_alt,
                  imageCredit: sheet.image_credit,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
