'use client';

import { useEffect, useState } from 'react';
import { ACTIVITY_TYPES, AREA_TYPES } from '@/lib/project-sheet-taxonomy';
import type { ProjectSheetDomain } from '@/server/project-sheets/queries';

export type FilterType =
  | 'all'
  | 'activityType'
  | 'areaType'
  | 'domainType'
  | 'searchSheet';

export interface Filter {
  type: FilterType;
  value: string;
}

export function ProjectSheetSearch({
  domains,
  filter,
  onChange,
}: {
  domains: ProjectSheetDomain[];
  filter: Filter;
  onChange: (filter: Filter) => void;
}) {
  const [search, setSearch] = useState('');

  // Recherche par nom : debounce 750 ms, comme le legacy.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (search) {
        onChange({ type: 'searchSheet', value: search });
      } else if (filter.type === 'searchSheet') {
        onChange({ type: 'all', value: '' });
      }
    }, 750);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const isActive = (type: FilterType, value: string) =>
    filter.type === type && filter.value === value;

  // Filtres mutuellement exclusifs : un chip n'est cliquable que si aucun
  // filtre n'est actif, ou s'il est lui-même le filtre actif (pour le retirer).
  const isChipEnabled = (type: FilterType, value: string) =>
    filter.type === 'all' || isActive(type, value);

  const isControlDisabled = (type: FilterType) =>
    filter.type !== 'all' && filter.type !== type;

  const toggleChip = (type: FilterType, value: string) => {
    if (isActive(type, value)) onChange({ type: 'all', value: '' });
    else onChange({ type, value });
  };

  const chipClass = (active: boolean) =>
    `sc-project-sheet-search__btn-filter m-1${active ? ' sc-project-sheet-search__btn-filter-active' : ''}`;

  return (
    <div className="mb-3">
      <h2 className="c-subtitle mb-2">Thème</h2>
      <section className="mb-2 d-flex">
        {ACTIVITY_TYPES.map((activity) => {
          const active = isActive('activityType', activity.id);
          return (
            <button
              key={activity.id}
              type="button"
              className={chipClass(active)}
              disabled={!isChipEnabled('activityType', activity.id)}
              onClick={() => toggleChip('activityType', activity.id)}
            >
              <div className="o-centred-elements">
                <span className="sc-project-sheet-search__btn-filter-span">
                  {activity.label}
                </span>
                {active && <em className="c-icon close-small" />}
              </div>
            </button>
          );
        })}
      </section>

      <h2 className="c-subtitle mb-2">Espaces</h2>
      <section className="sc-project-sheet-search__section-filter mb-2 d-flex">
        {AREA_TYPES.map((area) => {
          const active = isActive('areaType', area.id);
          return (
            <button
              key={area.id}
              type="button"
              className={chipClass(active)}
              disabled={!isChipEnabled('areaType', area.id)}
              onClick={() => toggleChip('areaType', area.id)}
            >
              <div className="o-centred-elements">
                <span className="sc-project-sheet-search__btn-filter-span">
                  {area.label}
                </span>
                {active && <em className="c-icon close-small" />}
              </div>
            </button>
          );
        })}
      </section>

      <section className="mb-2" />

      <h2 className="c-subtitle mb-2">Domaine d&apos;activité</h2>
      <div className="c-input__group w-50">
        <select
          id="domainType"
          className="c-input sc-project-sheet-search__select"
          value={filter.type === 'domainType' ? filter.value : ''}
          disabled={isControlDisabled('domainType')}
          onChange={(event) =>
            onChange(
              event.target.value
                ? { type: 'domainType', value: event.target.value }
                : { type: 'all', value: '' },
            )
          }
        >
          <option value="">Type d&apos;activités</option>
          {domains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="c-subtitle mb-2">Recherche</h2>
      <div className="c-input__group w-25">
        <input
          className="c-input__large sc-project-sheet-search__input"
          type="text"
          placeholder="Recherche par Nom"
          value={search}
          disabled={isControlDisabled('searchSheet')}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
    </div>
  );
}
