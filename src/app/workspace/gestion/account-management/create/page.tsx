import Link from 'next/link';
import { prisma } from '@/server/db';
import { createUser } from '@/server/admin/actions';
import { UserForm } from '@/components/admin/UserForm';

export const dynamic = 'force-dynamic';

export default async function CreateUserPage() {
  const studyOffices = await prisma.study_office.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">Créer un compte</h1>
            <Link href="/workspace/gestion/account-management" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <UserForm mode="create" studyOffices={studyOffices} action={createUser} />
      </div>
    </div>
  );
}
