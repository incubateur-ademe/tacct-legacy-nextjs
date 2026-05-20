import Link from 'next/link';
import { getUsersList } from '@/server/admin/queries';
import { deleteUser } from '@/server/admin/actions';
import { userRoles } from '@/server/study/current-study';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ page?: string; q?: string }>;

export default async function AccountManagementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));
  const search = q?.trim() || undefined;

  const { items, total, pageSize } = await getUsersList({ page: pageNum, search });
  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h1 className="c-title-black-bold m-0">Gestion des comptes</h1>
              <div className="c-subtitle-grey mt-1">
                {total} compte{total > 1 ? 's' : ''}
              </div>
            </div>
            <div className="d-flex gap-2">
              <form className="d-flex" action="">
                <input
                  type="text"
                  name="q"
                  defaultValue={search ?? ''}
                  placeholder="Rechercher (nom, email…)"
                  className="c-input"
                />
                <button type="submit" className="c-btn--secondary ms-2">
                  OK
                </button>
              </form>
              <Link
                href="/workspace/gestion/account-management/create"
                className="c-btn--primary"
              >
                + Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="o-card mt-4">
        {items.length === 0 ? (
          <p className="text-muted text-center py-3">Aucun compte trouvé.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Email</th>
                <th scope="col">Bureau d&apos;étude</th>
                <th scope="col">Rôles</th>
                <th scope="col">Validé</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const roles = userRoles(u);
                return (
                  <tr key={u.id}>
                    <td>
                      {u.lastname.toUpperCase()} {u.firstname}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.study_office?.name ?? '—'}</td>
                    <td>
                      {roles.includes('ROLE_ADMIN') ? (
                        <span className="badge bg-warning">Admin</span>
                      ) : (
                        <span className="badge bg-secondary">User</span>
                      )}
                    </td>
                    <td>{u.validated ? '✓' : '—'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          href={`/workspace/gestion/account-management/${u.id}`}
                          className="c-btn--secondary"
                        >
                          Modifier
                        </Link>
                        <form
                          action={async () => {
                            'use server';
                            await deleteUser(u.id);
                          }}
                        >
                          <button type="submit" className="c-btn--tertiary">
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {pageCount > 1 && (
          <nav aria-label="pagination" className="d-flex justify-content-center mt-3">
            <ul className="pagination">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams();
                params.set('page', String(p));
                if (search) params.set('q', search);
                return (
                  <li
                    key={p}
                    className={`page-item ${p === pageNum ? 'active' : ''}`}
                  >
                    <a href={`?${params.toString()}`} className="page-link">
                      {p}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
