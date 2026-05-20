import Link from 'next/link';
import { getDomainsList } from '@/server/admin/queries';
import { createProjectSheet } from '@/server/admin/actions';
import { ProjectSheetForm } from '@/components/admin/ProjectSheetForm';

export const dynamic = 'force-dynamic';

export default async function CreateProjectSheetPage() {
  const domains = await getDomainsList();
  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">Créer une fiche projet</h1>
            <Link
              href="/workspace/gestion/project-sheet-management"
              className="c-btn--tertiary"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ProjectSheetForm mode="create" domains={domains} action={createProjectSheet} />
      </div>
    </div>
  );
}
