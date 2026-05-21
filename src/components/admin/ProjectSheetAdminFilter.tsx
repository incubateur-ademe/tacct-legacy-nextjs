import { SortHeader } from './SortHeader';

/**
 * Port de `app-project-sheet-admin-filter` legacy. Ligne d'en-têtes triables
 * pour la liste admin des fiches projet : Nom + Domaine + Actions.
 */
export function ProjectSheetAdminFilter({
  currentSort,
  currentDir,
  buildHref,
}: {
  currentSort: string | undefined;
  currentDir: 'asc' | 'desc' | undefined;
  buildHref: (sort: string, dir: 'asc' | 'desc') => string;
}) {
  return (
    <div className="sc-project-sheet-admin-filter">
      <SortHeader
        label="Nom"
        sortKey="name"
        currentSort={currentSort}
        currentDir={currentDir}
        buildHref={buildHref}
        className="sc-project-sheet-admin-filter__btn-name"
      />
      <SortHeader
        label="Domaine"
        sortKey="domain"
        currentSort={currentSort}
        currentDir={currentDir}
        buildHref={buildHref}
        className="sc-project-sheet-admin-filter__btn-domain"
      />
      <div className="sc-project-sheet-admin-filter__label-actions">Actions</div>
    </div>
  );
}
