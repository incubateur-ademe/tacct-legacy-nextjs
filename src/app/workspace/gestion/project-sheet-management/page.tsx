import Link from 'next/link';
import { getProjectSheetsList } from '@/server/admin/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { Pagination } from '@/components/admin/Pagination';
import { ProjectSheetAdminFilter } from '@/components/admin/ProjectSheetAdminFilter';
import { ProjectSheetAdminList } from '@/components/admin/ProjectSheetAdminList';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  page?: string;
  q?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
}>;

export default async function ProjectSheetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q, sort, dir } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));
  const search = q?.trim() || undefined;

  const { items, total, pageSize } = await getProjectSheetsList({
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

  const projectSheets = items.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug ?? '',
    domain: s.domain ? { name: s.domain.name, icon: s.domain.icon } : null,
  }));

  return (
    <ContentLayout helpKey="admin">
      <div className="container page">
        <div className="row mb-3">
          <div className="col-lg-12 col-md-16">
            <div className="o-card o-card__triangle">
              <div className="row">
                <BlockTitleIcon
                  pageTitle="Fiches Projet"
                  subtitle="Administration"
                  icon="module-report"
                />
              </div>
              <div className="o-centred-elements d-flex">
                <div className="sc-project-sheets-management__search">
                  <form action="" className="w-100">
                    <div className="c-input__group col-sm-16 w-100">
                      <label className="c-input__label" htmlFor="sheetName">
                        Nom de la fiche
                      </label>
                      <input
                        id="sheetName"
                        name="q"
                        className="c-input__large"
                        type="search"
                        defaultValue={search ?? ''}
                      />
                    </div>
                  </form>
                  <span className="ml-2">
                    {total} {pluralize(total, 'résultat', 'résultats')}
                  </span>
                </div>
                <div className="sc-project-sheets-management__group-buttons c-group-buttons--end">
                  <Link
                    href="/workspace/gestion/project-sheet-management/create"
                    className="c-btn--primary sc-project-sheets-management__create-sheet-btn"
                  >
                    Créer une fiche
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProjectSheetAdminFilter
          currentSort={sort}
          currentDir={dir}
          buildHref={buildSortHref}
        />

        {projectSheets.length > 0 && <ProjectSheetAdminList items={projectSheets} />}

        {projectSheets.length === 0 && (
          <div className="o-card mt-4 text-center py-5">Aucune fiche projet.</div>
        )}

        <Pagination page={pageNum} pageCount={pageCount} buildHref={buildPageHref} />
      </div>
    </ContentLayout>
  );
}
