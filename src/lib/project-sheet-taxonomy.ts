/**
 * Mappings des codes `activity_type` / `area_type` vers leurs libellés.
 * Repris des fichiers legacy `assets/json/activity-types.json` et
 * `area-types.json` (également présents dans public/assets/json).
 */

export interface TaxonomyItem {
  id: string;
  label: string;
}

export const ACTIVITY_TYPES: TaxonomyItem[] = [
  { id: '0', label: 'Biodiversité' },
  { id: '1', label: 'Eau' },
  { id: '2', label: 'Paysages' },
  { id: '3', label: 'Sols' },
];

export const AREA_TYPES: TaxonomyItem[] = [
  { id: '0', label: 'Agricoles et forestiers' },
  { id: '1', label: 'De montagne' },
  { id: '2', label: 'Littoraux et maritimes' },
  { id: '3', label: 'Naturels et aquatiques' },
  { id: '4', label: 'Urbanisés' },
];

export function activityTypeName(id: string | null): string | null {
  return ACTIVITY_TYPES.find((item) => item.id === id)?.label ?? null;
}

export function areaTypeName(id: string | null): string | null {
  return AREA_TYPES.find((item) => item.id === id)?.label ?? null;
}
