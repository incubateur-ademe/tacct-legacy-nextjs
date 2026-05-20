import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

type SearchParams = Promise<{ page?: string }>;

export default async function StudiesAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? '1'));
  const skip = (page - 1) * PAGE_SIZE;

  const [studies, total] = await Promise.all([
    prisma.study.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        commune: { include: { department: { include: { region: true } } } },
        user_study: {
          where: { head_study: true },
          take: 1,
          include: { user: true },
        },
      },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.study.count(),
  ]);

  const pageCount = Math.ceil(total / PAGE_SIZE);
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card o-card__triangle">
            <div className="row">
              <div className="col-16 d-flex align-items-center">
                <em
                  className="c-icon medium project-primary folder mr-3"
                  aria-hidden="true"
                />
                <div>
                  <h1 className="c-title-black-bold m-0">Études</h1>
                  <div className="c-subtitle-grey">Administration</div>
                </div>
              </div>
            </div>
            <div className="o-centred-elements mt-3">
              <span className="ml-0 mr-auto subtitle">
                {total} {total > 1 ? 'résultats' : 'résultat'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section>
        {studies.length === 0 && (
          <div className="o-card mt-4 text-center py-5">Aucune étude.</div>
        )}

        {studies.map((study) => {
          const headStudy = study.user_study[0]?.user;
          const regionLabel = study.commune?.department?.region?.label ?? '—';
          return (
            <div className="row mt-4" key={study.id}>
              <div className="col-lg-12 col-md-16">
                <div className="o-card-p-0">
                  <div className="row">
                    <div className="container w-100 o-centred-elements">
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
                          {headStudy ? `${headStudy.firstname} ${headStudy.lastname}` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {pageCount > 1 && (
          <nav className="d-flex justify-content-between p-2 c-ngx-pagination mt-5">
            <ul className="pagination">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <li
                  key={p}
                  className={`page-item ${p === page ? 'active' : ''}`}
                >
                  <a href={`?page=${p}`} className="page-link">
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </section>
    </div>
  );
}
