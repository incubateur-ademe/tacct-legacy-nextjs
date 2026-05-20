import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/server/db';
import { getUserById } from '@/server/admin/queries';
import { updateUser } from '@/server/admin/actions';
import { userRoles } from '@/server/study/current-study';
import { UserForm } from '@/components/admin/UserForm';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EditUserPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  const studyOffices = await prisma.study_office.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const roles = userRoles(user);
  const updateAction = updateUser.bind(null, id);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">
              Modifier le compte — {user.firstname} {user.lastname.toUpperCase()}
            </h1>
            <Link href="/workspace/gestion/account-management" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <UserForm
          mode="edit"
          studyOffices={studyOffices}
          action={updateAction}
          defaults={{
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            username: user.username,
            communeId: user.commune_id ?? '',
            communeLabel: user.commune?.label ?? null,
            communePostalCode: user.commune?.postal_code ?? null,
            studyOfficeId: user.study_office_id ?? '',
            isAdmin: roles.includes('ROLE_ADMIN'),
            validated: user.validated,
          }}
        />
      </div>
    </div>
  );
}
