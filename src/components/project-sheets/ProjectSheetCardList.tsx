'use client';

import { useMemo, useState } from 'react';
import type {
  ProjectSheetCardData,
  ProjectSheetDomain,
} from '@/server/project-sheets/queries';
import { ProjectSheetCard } from './ProjectSheetCard';
import { ProjectSheetSearch, type Filter } from './ProjectSheetSearch';

const PAGE_SIZE = 15;

export function ProjectSheetCardList({
  sheets,
  domains,
}: {
  sheets: ProjectSheetCardData[];
  domains: ProjectSheetDomain[];
}) {
  const [filter, setFilter] = useState<Filter>({ type: 'all', value: '' });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const isFiltered = filter.type !== 'all' && filter.value !== '';

  const filtered = useMemo(() => {
    if (!isFiltered) return sheets;
    switch (filter.type) {
      case 'activityType':
        return sheets.filter((sheet) => sheet.activityType === filter.value);
      case 'areaType':
        return sheets.filter((sheet) => sheet.areaType === filter.value);
      case 'domainType':
        return sheets.filter((sheet) => sheet.domain?.id === filter.value);
      case 'searchSheet':
        return sheets.filter((sheet) =>
          sheet.name.toLowerCase().includes(filter.value.toLowerCase()),
        );
      default:
        return sheets;
    }
  }, [sheets, filter, isFiltered]);

  const shown = isFiltered ? filtered : filtered.slice(0, visible);
  const canShowMore = !isFiltered && visible < filtered.length;

  const handleFilterChange = (next: Filter) => {
    setFilter(next);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="sc-project-sheet-card-list">
      <ProjectSheetSearch
        domains={domains}
        filter={filter}
        onChange={handleFilterChange}
      />

      {isFiltered && (
        <div className="sc-project-sheet-card-list__counter mb-3">
          {filtered.length} {filtered.length > 1 ? 'résultats' : 'résultat'}
        </div>
      )}

      <div className="sc-project-sheet-card-list__item-list">
        {shown.map((sheet) => (
          <ProjectSheetCard key={sheet.id} sheet={sheet} />
        ))}
      </div>

      {canShowMore && (
        <div className="sc-project-sheet-card-list__btn-group">
          <button
            type="button"
            className="sc-project-sheet-card-list__show-more"
            onClick={() => setVisible((value) => value + PAGE_SIZE)}
          >
            Afficher plus
            <span
              className="c-icon medium project-primary chevron-down"
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  );
}
