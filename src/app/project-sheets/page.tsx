import Link from 'next/link';
import { getDomainsList } from '@/server/admin/queries';
import { getPublicProjectSheets } from '@/server/project-sheets/queries';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  page?: string;
  q?: string;
  domain?: string;
  area?: string;
  activity?: string;
}>;

export default async function ProjectSheetsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, q, domain, area, activity } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1'));

  const [{ items, total, pageSize }, domains] = await Promise.all([
    getPublicProjectSheets({
      page: pageNum,
      search: q?.trim() || undefined,
      domainId: domain || undefined,
      areaType: area || undefined,
      activityType: activity || undefined,
    }),
    getDomainsList(),
  ]);

  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-lg-12">
          <h1 className="c-title-black-bold">Fiches projet</h1>
          <p className="c-subtitle-grey mt-2" style={{ maxWidth: 800 }}>
            Découvre des retours d&apos;expérience et fiches projet d&apos;adaptation au
            changement climatique recensés par TACCT.
          </p>
        </div>
      </div>

      {/* Filtres */}
      <form className="o-card mb-4" action="">
        <div className="row align-items-end">
          <div className="col-md-4 mb-2">
            <label className="c-input__label" htmlFor="q">
              Recherche
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={q ?? ''}
              placeholder="Nom de fiche…"
              className="c-input w-100"
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="c-input__label" htmlFor="domain">
              Domaine
            </label>
            <select
              id="domain"
              name="domain"
              defaultValue={domain ?? ''}
              className="c-input w-100"
            >
              <option value="">Tous</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 mb-2">
            <label className="c-input__label" htmlFor="area">
              Type de territoire
            </label>
            <input
              id="area"
              name="area"
              type="text"
              maxLength={4}
              defaultValue={area ?? ''}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-2 mb-2">
            <label className="c-input__label" htmlFor="activity">
              Type d&apos;activité
            </label>
            <input
              id="activity"
              name="activity"
              type="text"
              maxLength={4}
              defaultValue={activity ?? ''}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-1 mb-2">
            <button type="submit" className="c-btn--primary w-100">
              Filtrer
            </button>
          </div>
        </div>
      </form>

      <div className="c-subtitle-grey mb-3">
        {total} fiche{total > 1 ? 's' : ''}
      </div>

      <div className="row">
        {items.length === 0 && (
          <div className="col-lg-12">
            <div className="o-card text-center py-5">
              Aucune fiche ne correspond à ta recherche.
            </div>
          </div>
        )}

        {items.map((s) => (
          <div key={s.id} className="col-md-4 mb-4">
            <Link
              href={`/project-sheets/${s.slug}`}
              className="o-card d-block h-100 text-decoration-none"
            >
              <h2 className="c-subtitle-black-bold m-0">{s.name}</h2>
              <div className="c-subtitle-grey">
                {s.domain?.name ?? '—'}
                {s.area_type && ` • ${s.area_type}`}
                {s.activity_type && ` • ${s.activity_type}`}
              </div>
              <p className="mt-2 mb-0">{s.abstract}</p>
            </Link>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <nav aria-label="pagination" className="d-flex justify-content-center mt-3">
          <ul className="pagination">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              params.set('page', String(p));
              if (q) params.set('q', q);
              if (domain) params.set('domain', domain);
              if (area) params.set('area', area);
              if (activity) params.set('activity', activity);
              return (
                <li key={p} className={`page-item ${p === pageNum ? 'active' : ''}`}>
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
  );
}
