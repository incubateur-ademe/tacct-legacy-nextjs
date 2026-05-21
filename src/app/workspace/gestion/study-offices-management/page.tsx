import { getStudyOfficesList } from '@/server/admin/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { SortHeader } from '@/components/admin/SortHeader';
import { Pagination } from '@/components/admin/Pagination';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  page?: string;
  q?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
}>;

export default async function StudyOfficesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q, sort, dir } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));
  const search = q?.trim() || undefined;

  const { items, total, pageSize } = await getStudyOfficesList({
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
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card o-card__triangle">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Bureaux d'étude"
                  subtitle="Administration"
                  icon="peoples"
                />
              </div>
              <div className="o-centred-elements d-flex">
                {total > 0 && (
                  <span className="ml-0 mr-auto subtitle">
                    {total} {pluralize(total, 'résultat', 'résultats')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filtre / tri */}
          <div className="container-fluid">
            <section>
              <div className="row mt-2">
                <div className="col-lg-12">
                  <div className="admin-list-filter">
                    <div className="row pt-2 pb-2">
                      <div className="container w-100 o-centred-elements d-flex">
                        <SortHeader
                          label="Nom"
                          sortKey="name"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="f-study-office__name pl-4"
                        />
                        <SortHeader
                          label="Commune"
                          sortKey="commune"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="f-study-office__region"
                        />
                        <SortHeader
                          label="Date de création"
                          sortKey="creationDate"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="f-study-office__creation-date"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section>
          {items.length === 0 && (
            <div className="o-card mt-4 text-center py-5">
              Aucun bureau d&apos;étude.
            </div>
          )}

          {items.map((office) => {
            const firstUser = office.user[0];
            return (
              <div className="c-studies row mt-4" key={office.id}>
                <div className="col-lg-12 col-md-16">
                  <div className="o-card-p-0">
                    <div className="row">
                      <div className="container w-100 o-centred-elements d-flex">
                        <div className="c-study-office__name pb-2 pl-4 pt-2 c-subtitle-black-bold">
                          {office.name}
                        </div>
                        <div className="d-flex align-items-center mr-auto pt-2 pl-2 pb-2 c-study-office__region">
                          <em
                            className="c-icon medium project-primary position"
                            aria-hidden="true"
                          />
                          {office.commune?.label ?? '—'}
                          {office.commune?.postal_code && ` - ${office.commune.postal_code}`}
                        </div>
                        <div className="c-study-office__creation-date">
                          {dateFormatter.format(office.created_at)}
                        </div>
                        <div className="c-study-office__user ml-auto section-ghost d-flex align-items-center h-100">
                          <em
                            className="c-icon medium project-primary people ml-2 mr-1"
                            aria-hidden="true"
                          />
                          <div className="pr-5 pt-2 pb-2">
                            {firstUser
                              ? `${firstUser.firstname} ${firstUser.lastname}`
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Pagination page={pageNum} pageCount={pageCount} buildHref={buildPageHref} />
        </section>
      </div>
    </ContentLayout>
  );
}
