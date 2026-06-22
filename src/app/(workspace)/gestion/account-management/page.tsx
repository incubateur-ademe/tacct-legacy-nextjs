import { Pagination } from '@/components/admin/Pagination';
import { SortHeader } from '@/components/admin/SortHeader';
import { StatusAccount } from '@/components/admin/StatusAccount';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { pluralize } from '@/lib/pluralize';
import { getUsersList } from '@/server/admin/queries';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  page?: string;
  q?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
}>;

export default async function AccountManagementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q, sort, dir } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));
  const search = q?.trim() || undefined;

  const { items, total, pageSize } = await getUsersList({
    page: pageNum,
    search,
    sort,
    dir,
  });
  const pageCount = Math.ceil(total / pageSize);

  const buildSortHref = (newSort: string, newDir: 'asc' | 'desc') => {
    const p = new URLSearchParams();
    p.set('sort', newSort);
    p.set('dir', newDir);
    if (search) p.set('q', search);
    return `?${p.toString()}`;
  };

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (search) params.set('q', search);
    if (sort) params.set('sort', sort);
    if (dir) params.set('dir', dir);
    return `?${params.toString()}`;
  };

  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <ContentLayout helpKey="admin">
      <div className="page container">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card o-card__triangle">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Gestion des comptes"
                  subtitle="Administration"
                  icon="peoples"
                />
              </div>
              <div className="o-centred-elements d-flex">
                <div className="sc-account-management__search">
                  <form action="" className="w-100">
                    <div className="c-input__group col-sm-16 w-100">
                      <input
                        id="firstName"
                        name="q"
                        className="c-input__large"
                        type="search"
                        defaultValue={search ?? ''}
                      />
                      <label className="c-input__label" htmlFor="firstName">
                        Chargé de l&apos;étude
                      </label>
                    </div>
                  </form>
                  <span className="ml-2">
                    {total} {pluralize(total, 'résultat', 'résultats')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtre / tri */}
          <div className="container-fluid">
            <section>
              <div className="row mt-4">
                <div className="col-lg-12">
                  <div className="admin-list-filter">
                    <div className="row pt-2 pr-4 pb-2 pl-4">
                      <div className="o-centred-elements d-flex container w-100">
                        <SortHeader
                          label="Nom"
                          sortKey="lastname"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="f-account-management__name"
                        />
                        <SortHeader
                          label="Commune"
                          sortKey="commune"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="f-account-management__commune"
                        />
                        <SortHeader
                          label="Date de création"
                          sortKey="creationDate"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="f-account-management__creation-date"
                        />
                        <SortHeader
                          label="Statut"
                          sortKey="validated"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="f-account-management__validation"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Liste des comptes */}
        <section>
          {items.map((u) => (
            <Link
              key={u.id}
              href={`/gestion/account-management/${u.id}`}
              className="c-account row d-block text-decoration-none mt-4"
            >
              <div className="col-lg-12 col-md-16">
                <div className="o-card-p-0">
                  <div className="row pt-2 pr-4 pb-2 pl-4">
                    <div className="o-centred-elements d-flex container w-100">
                      <div className="c-account-management__name c-subtitle-black-bold text-uppercase">
                        {u.lastname} {u.firstname}
                      </div>
                      <div className="c-account-management__commune d-flex align-items-center mr-auto">
                        <em className="c-icon medium project-primary position" aria-hidden="true" />{' '}
                        {u.commune?.label ?? ''} {u.commune?.postal_code ?? ''}
                      </div>
                      <div className="c-account-management__creation-date">
                        {dateFormatter.format(u.created_at)}
                      </div>
                      <div className="c-subtitle-black-bold d-flex align-items-center c-account-management__validation ml-auto">
                        <StatusAccount status={u.validated} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          <Pagination page={pageNum} pageCount={pageCount} buildHref={buildPageHref} />
        </section>
      </div>
    </ContentLayout>
  );
}
