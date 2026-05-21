import {
  getRegionsList,
  getStudiesAdminList,
} from '@/server/admin/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { SortHeader } from '@/components/admin/SortHeader';
import { Pagination } from '@/components/admin/Pagination';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  page?: string;
  q?: string;
  region?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
}>;

export default async function StudiesAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q, region, sort, dir } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));
  const search = q?.trim() || undefined;

  const [{ items, total, pageSize }, regions] = await Promise.all([
    getStudiesAdminList({
      page: pageNum,
      search,
      regionId: region || undefined,
      sort,
      dir,
    }),
    getRegionsList(),
  ]);
  const pageCount = Math.ceil(total / pageSize);

  const buildSortHref = (newSort: string, newDir: 'asc' | 'desc') => {
    const p = new URLSearchParams();
    p.set('sort', newSort);
    p.set('dir', newDir);
    if (search) p.set('q', search);
    if (region) p.set('region', region);
    return `?${p.toString()}`;
  };

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (search) params.set('q', search);
    if (region) params.set('region', region);
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
                  pageTitle="Études"
                  subtitle="Administration"
                  icon="folder"
                />
              </div>

              <div className="o-centred-elements d-flex">
                <form action="" className="sc-studies__form">
                  <div className="c-input__group col-sm-16 w-100">
                    <input
                      id="firstName"
                      name="q"
                      className="c-input__large"
                      type="text"
                      defaultValue={search ?? ''}
                    />
                    <label className="c-input__label" htmlFor="firstName">
                      Chargé de l&apos;étude
                    </label>
                  </div>

                  <div className="c-input__group w-100">
                    <select name="region" className="c-input" defaultValue={region ?? ''}>
                      <option value="">— Toutes régions —</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <label className="c-input__label">Région</label>
                  </div>

                  <button type="submit" className="c-btn--secondary">
                    Filtrer
                  </button>
                </form>

                <span className="ml-3">
                  {total} {pluralize(total, 'résultat', 'résultats')}
                </span>
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
                          label="Territoire de l'étude"
                          sortKey="territoryName"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="sc-study-filter__territory-name pl-4"
                        />
                        <SortHeader
                          label="Région"
                          sortKey="region"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="sc-study-filter__region"
                        />
                        <SortHeader
                          label="Date de création"
                          sortKey="dateCreation"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="sc-study-filter__creation-date"
                        />
                        <div className="sc-study-filter__status" />
                        <SortHeader
                          label="Chargé de l'étude"
                          sortKey="headStudy"
                          currentSort={sort}
                          currentDir={dir}
                          buildHref={buildSortHref}
                          className="sc-study-filter__head-study"
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
            <div className="o-card mt-4 text-center py-5">Aucune étude.</div>
          )}

          {items.map((study) => {
            const headStudy = study.user_study[0]?.user;
            const regionLabel = study.commune?.department?.region?.label ?? '—';
            return (
              <div className="row mt-4" key={study.id}>
                <div className="col-lg-12 col-md-16">
                  <div className="o-card-p-0">
                    <div className="row">
                      <div className="container w-100 o-centred-elements d-flex">
                        <div className="sc-studies__territory-name pb-2 pl-4 pt-2 c-subtitle-black-bold">
                          {study.territory_name} {String(study.year)}
                        </div>
                        <div className="sc-studies__region d-flex align-items-center pt-2 pb-2">
                          <em
                            className="c-icon medium project-primary france mr-2"
                            aria-hidden="true"
                          />
                          {regionLabel}
                        </div>
                        <div className="sc-studies__creation-date">
                          {dateFormatter.format(study.created_at)}
                        </div>
                        <div className="sc-studies__head-study ml-auto section-ghost d-flex align-items-center h-100">
                          <em
                            className="c-icon medium project-primary people ml-2 mr-1"
                            aria-hidden="true"
                          />
                          <div className="pr-5 pt-2 pb-2">
                            {headStudy
                              ? `${headStudy.firstname} ${headStudy.lastname}`
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
