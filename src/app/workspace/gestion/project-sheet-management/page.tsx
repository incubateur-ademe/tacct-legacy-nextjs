import Link from 'next/link';
import { getProjectSheetsList } from '@/server/admin/queries';
import { deleteProjectSheet } from '@/server/admin/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ page?: string; q?: string }>;

export default async function ProjectSheetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));
  const search = q?.trim() || undefined;

  const { items, total, pageSize } = await getProjectSheetsList({
    page: pageNum,
    search,
  });
  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h1 className="c-title-black-bold m-0">Fiches projet</h1>
              <div className="c-subtitle-grey mt-1">
                {total} fiche{total > 1 ? 's' : ''}
              </div>
            </div>
            <div className="d-flex gap-2">
              <form className="d-flex" action="">
                <input
                  type="text"
                  name="q"
                  defaultValue={search ?? ''}
                  placeholder="Rechercher…"
                  className="c-input"
                />
                <button type="submit" className="c-btn--secondary ms-2">
                  OK
                </button>
              </form>
              <Link
                href="/workspace/gestion/project-sheet-management/create"
                className="c-btn--primary"
              >
                + Créer une fiche
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="o-card mt-4">
        {items.length === 0 ? (
          <p className="text-muted text-center py-3">Aucune fiche projet trouvée.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Slug</th>
                <th scope="col">Domaine</th>
                <th scope="col">Mise à jour</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    <code>{s.slug}</code>
                  </td>
                  <td>{s.domain?.name ?? '—'}</td>
                  <td>{new Date(s.updated_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        href={`/workspace/gestion/project-sheet-management/${s.id}`}
                        className="c-btn--secondary"
                      >
                        Modifier
                      </Link>
                      <form
                        action={async () => {
                          'use server';
                          await deleteProjectSheet(s.id);
                        }}
                      >
                        <button type="submit" className="c-btn--tertiary">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
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
