import Link from 'next/link';

/**
 * Bouton-lien d'en-tête de colonne triable (port visuel des `<button (click)=
 * "sortByX()">` du legacy avec chevron-up / chevron-down).
 *
 * - L'état du tri courant est porté par les query params `sort` (clé) +
 *   `dir` (`asc` / `desc`).
 * - Cliquer sur une colonne active : bascule la direction.
 * - Cliquer sur une autre colonne : active cette colonne en `asc`.
 */
export function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  buildHref,
  className,
}: {
  label: string;
  sortKey: string;
  currentSort: string | undefined;
  currentDir: 'asc' | 'desc' | undefined;
  buildHref: (sort: string, dir: 'asc' | 'desc') => string;
  className?: string;
}) {
  const active = currentSort === sortKey;
  const nextDir: 'asc' | 'desc' = active && currentDir === 'asc' ? 'desc' : 'asc';

  return (
    <Link
      href={buildHref(sortKey, nextDir)}
      className={[
        className,
        'd-flex align-items-center',
        active ? 'c-subtitle-black-bold' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="o-filter">{label}</span>
      {active && (
        <em
          className={`c-icon medium ${currentDir === 'asc' ? 'chevron-up' : 'chevron-down'}`}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
