// Port de manage-dots.utils.ts (legacy) : couleurs et bordures des "dots" qui
// visualisent les niveaux de finalité / anticipation d'une action.

export interface Finalite {
  value: number;
  libelle: string | null;
  isSelectable: boolean;
  selected: boolean;
}

export type DotColor =
  | 'light'
  | 'primary'
  | 'dark'
  | 'empty-smile'
  | 'red-smile'
  | 'orange-smile'
  | 'green-smile'
  | 'dark-green-smile';

export function setManageDotsBorderLeft(finalite: Finalite, finalites: Finalite[]): boolean {
  switch (finalite.value) {
    case 1:
      return true;
    case 2:
      return !finalites.find((f) => f.value === 1)?.selected;
    case 3:
      return !finalites.find((f) => f.value === 2)?.selected;
    default:
      return true;
  }
}

export function setManageDotsBorderRight(finalite: Finalite, finalites: Finalite[]): boolean {
  switch (finalite.value) {
    case 1:
      return !finalites.find((f) => f.value === 2)?.selected;
    case 2:
      return !finalites.find((f) => f.value === 3)?.selected;
    case 3:
      return true;
    default:
      return true;
  }
}

export function setColorAnticipation(
  finalite: Finalite,
  anticipation1: boolean,
  anticipation2: boolean,
): DotColor | null {
  switch (finalite.value) {
    case 1:
      return anticipation1 ? 'light' : null;
    case 2:
      return anticipation2 ? 'primary' : null;
    default:
      return null;
  }
}

export function setColor(finalite: Finalite): DotColor {
  switch (finalite.value) {
    case 1:
      return 'light';
    case 2:
      return 'primary';
    default:
      return 'dark';
  }
}
