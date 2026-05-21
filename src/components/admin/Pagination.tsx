import Link from 'next/link';

/**
 * Pagination stylée `c-ngx-pagination` (port visuel du `ngb-pagination` legacy).
 * Affiche au max `maxSize` numéros + précédent/suivant. Les liens préservent
 * les autres query params.
 */
export function Pagination({
  page,
  pageCount,
  buildHref,
  maxSize = 10,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
  maxSize?: number;
}) {
  if (pageCount <= 1) return null;

  // Fenêtre glissante autour de la page courante
  const half = Math.floor(maxSize / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(pageCount, start + maxSize - 1);
  if (end - start + 1 < maxSize) {
    start = Math.max(1, end - maxSize + 1);
  }
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);

  return (
    <nav aria-label="pagination" className="d-flex justify-content-between p-2 c-ngx-pagination mt-5">
      <ul>
        <li className={page === 1 ? 'disabled' : ''}>
          {page === 1 ? <span>&lt;</span> : <Link href={buildHref(prev)}>&lt;</Link>}
        </li>
        {pages.map((p) => (
          <li key={p} className={p === page ? 'active' : ''}>
            {p === page ? <span>{p}</span> : <Link href={buildHref(p)}>{p}</Link>}
          </li>
        ))}
        <li className={page === pageCount ? 'disabled' : ''}>
          {page === pageCount ? (
            <span>&gt;</span>
          ) : (
            <Link href={buildHref(next)}>&gt;</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
