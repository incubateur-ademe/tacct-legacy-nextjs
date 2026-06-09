// Catalogues statiques des types d'action et d'approche (port de
// public/assets/json/types-actions.json et types-approches.json du legacy).

export interface TypeAction {
  id: string;
  libelle: string;
  icon: string;
}

export interface TypeApproche {
  id: string;
  libelle: string;
}

export const TYPES_ACTIONS: TypeAction[] = [
  { id: 'dc6ca30f-a497-439c-a290-f9388cf4fc80', libelle: 'Institutionnelle', icon: 'institution.svg' },
  { id: '6bddf94a-9b39-4a94-ac7e-46636d59f9c2', libelle: 'Financière', icon: 'module-finance.svg' },
  { id: '5d3d58c1-c6c1-4c1d-9b35-a7571c130c7a', libelle: 'Réglementaire', icon: 'réglementaire.svg' },
  { id: 'b411781f-b7a1-4beb-a34b-0e15acfe8a3f', libelle: 'Formation', icon: 'formation.svg' },
  {
    id: '0f570454-07be-4af1-ae34-ef9ff70bd5b6',
    libelle: 'Sensibilisation / Communication',
    icon: 'communication.svg',
  },
  { id: 'e792ad6a-f502-46f6-9af3-ee375b04b74b', libelle: 'Recherche et développement', icon: 'recherche.svg' },
  { id: '6343583a-b6d9-442f-b10c-59bb818150f1', libelle: 'Technique', icon: 'technique.svg' },
];

export const TYPES_APPROCHES: TypeApproche[] = [
  { id: 'bd9f793c-7fbd-4d9a-97bf-f6028c33a5ff', libelle: 'Ajustement' },
  { id: '0de46735-67f5-4f5a-ac79-4cd85f8b25d5', libelle: 'Transformation' },
];

export function findTypeAction(id: string | null | undefined): TypeAction | undefined {
  return id ? TYPES_ACTIONS.find((t) => t.id === id) : undefined;
}

export function findTypeApproche(id: string | null | undefined): TypeApproche | undefined {
  return id ? TYPES_APPROCHES.find((t) => t.id === id) : undefined;
}
