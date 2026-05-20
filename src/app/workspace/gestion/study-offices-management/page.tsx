import { getStudyOfficesList } from '@/server/admin/queries';
import {
  createStudyOffice,
  deleteStudyOffice,
  updateStudyOffice,
} from '@/server/admin/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ page?: string; q?: string }>;

export default async function StudyOfficesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));
  const search = q?.trim() || undefined;

  const { items, total, pageSize } = await getStudyOfficesList({
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
              <h1 className="c-title-black-bold m-0">Bureaux d&apos;étude</h1>
              <div className="c-subtitle-grey mt-1">
                {total} bureau{total > 1 ? 'x' : ''} d&apos;étude
              </div>
            </div>
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
          </div>
        </div>
      </div>

      {/* Form de création */}
      <div className="o-card mt-4">
        <h2 className="c-subtitle-black-bold">Créer un bureau d&apos;étude</h2>
        <form action={createStudyOffice} className="d-flex gap-2 align-items-end mt-2">
          <div className="flex-grow-1">
            <label className="c-input__label" htmlFor="new-name">
              Nom *
            </label>
            <input
              id="new-name"
              name="name"
              type="text"
              required
              maxLength={255}
              className="c-input w-100"
            />
          </div>
          <div className="flex-grow-1">
            <label className="c-input__label" htmlFor="new-communeId">
              Commune (id)
            </label>
            <input
              id="new-communeId"
              name="communeId"
              type="text"
              className="c-input w-100"
            />
          </div>
          <button type="submit" className="c-btn--primary">
            Créer
          </button>
        </form>
      </div>

      {/* Liste */}
      <div className="o-card mt-4">
        {items.length === 0 ? (
          <p className="text-muted text-center py-3">Aucun bureau d&apos;étude trouvé.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Commune</th>
                <th scope="col">Membres</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const updateAction = updateStudyOffice.bind(null, o.id);
                return (
                  <tr key={o.id}>
                    <td>
                      <form
                        action={updateAction}
                        id={`form-${o.id}`}
                        className="d-flex gap-2"
                      >
                        <input
                          name="name"
                          type="text"
                          defaultValue={o.name}
                          maxLength={255}
                          className="c-input"
                        />
                      </form>
                    </td>
                    <td>
                      <input
                        name="communeId"
                        type="text"
                        form={`form-${o.id}`}
                        defaultValue={o.commune_id ?? ''}
                        className="c-input"
                      />
                      {o.commune?.label && (
                        <small className="c-subtitle-grey d-block">
                          {o.commune.label}
                        </small>
                      )}
                    </td>
                    <td>{o.user.length}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="submit"
                          form={`form-${o.id}`}
                          className="c-btn--secondary"
                        >
                          Enregistrer
                        </button>
                        <form
                          action={async () => {
                            'use server';
                            await deleteStudyOffice(o.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="c-btn--tertiary"
                            disabled={o.user.length > 0}
                            title={
                              o.user.length > 0
                                ? 'Ce bureau a encore des membres associés'
                                : ''
                            }
                          >
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
