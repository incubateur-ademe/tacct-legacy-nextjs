import { prisma } from '@/server/db';
import { createUser } from '@/server/admin/actions';
import { UserForm } from '@/components/admin/UserForm';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

export default async function CreateUserPage() {
  const studyOffices = await prisma.study_office.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <ContentLayout helpKey="admin">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Créer un compte"
                  subtitle="Gestion des comptes"
                  icon="people"
                />
              </div>
              <UserForm mode="create" studyOffices={studyOffices} action={createUser} />
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
