import { notFound } from 'next/navigation';
import { getUserById } from '@/server/admin/queries';
import { EditAccount } from '@/components/admin/EditAccount';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EditUserPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  const studies = user.user_study
    .map((us) => us.study)
    .filter((study): study is NonNullable<typeof study> => study !== null)
    .map((study) => ({
      territoryName: study.territory_name,
      year: Number(study.year),
    }));

  return (
    <ContentLayout helpKey="admin">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle={`${user.lastname} ${user.firstname}`}
                  subtitle="Gestion des comptes"
                  icon="people"
                />
              </div>
              <EditAccount
                id={user.id}
                firstname={user.firstname ?? ''}
                lastname={user.lastname ?? ''}
                email={user.email ?? ''}
                validated={user.validated}
                commune={
                  user.commune
                    ? {
                        id: user.commune.id,
                        label: user.commune.label,
                        postalCode: user.commune.postal_code,
                      }
                    : null
                }
                studies={studies}
              />
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
