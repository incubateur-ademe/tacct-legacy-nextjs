// Équivalent direct de tacct-legacy/.../components/menu/accueilNavItems.ts
// Le `menuKey` détermine quel jeu d'items afficher (DIAGNOSTIC ou ADMIN ici, les
// autres modes seront ajoutés avec les domaines stratégies).

export type MenuKey = 'DIAGNOSTIC' | 'ADMIN' | 'PROFILE' | 'SETTINGS';

export interface SubNavItem {
  subTitle: string;
  subRoute: string;
}

export interface NavItem {
  name: string;
  title: string;
  /** chemin relatif à /workspace */
  route: string;
  icon: string;
  /** statut éventuel (incomplete / in-progress / validated) à afficher à droite */
  statusField?: 'observed_exposure_valid' | 'exposition_future_valid' | 'sensibility_valid';
  subNav?: SubNavItem[];
  /** roles requis ; vide = tous */
  roles?: ('ROLE_USER' | 'ROLE_ADMIN')[];
}

const accueilNavItem: NavItem = {
  name: 'Accueil',
  title: 'Accueil',
  route: '',
  icon: 'home-back',
};

export const diagnosticNavItems: NavItem[] = [
  accueilNavItem,
  {
    name: 'dashboard',
    title: 'Tableau de bord',
    route: 'dashboard',
    icon: 'dashboard',
  },
  {
    name: 'observed_climate',
    title: 'Climat passé',
    route: 'observed-climate',
    icon: 'eye',
    statusField: 'observed_exposure_valid',
    subNav: [
      { subTitle: 'Tendances climatiques', subRoute: 'climate-trend' },
      { subTitle: 'Catastrophes naturelles', subRoute: 'natural-disasters' },
      { subTitle: 'Saisie exposition observée', subRoute: 'observed-exposure' },
    ],
  },
  {
    name: 'future_climate',
    title: 'Climat futur',
    route: 'future-climate',
    icon: 'exposition-future',
    statusField: 'exposition_future_valid',
    subNav: [
      { subTitle: 'Analyse climat futur', subRoute: 'analyse-future-climate' },
      { subTitle: 'Saisie exposition future', subRoute: 'capture-future-climate' },
    ],
  },
  {
    name: 'sensibility',
    title: 'Sensibilité',
    route: 'sensibility',
    icon: 'sensibilite',
    statusField: 'sensibility_valid',
  },
  {
    name: 'skills-partners-mobilised',
    title: 'À Mobiliser',
    route: 'skills-partners-mobilised',
    icon: 'peoples',
  },
];

export const adminNavItems: NavItem[] = [
  accueilNavItem,
  {
    name: 'studies-management',
    title: 'Études',
    route: 'gestion/studies-management',
    icon: 'folder',
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'account-management',
    title: 'Gestion des comptes',
    route: 'gestion/account-management',
    icon: 'peoples',
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'study-offices-management',
    title: "Bureaux d'étude",
    route: 'gestion/study-offices-management',
    icon: 'peoples',
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'project-sheet-management',
    title: 'Fiches projets',
    route: 'gestion/project-sheet-management',
    icon: 'module-report',
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'status',
    title: 'État du système',
    route: 'gestion/status',
    icon: 'dashboard',
    roles: ['ROLE_ADMIN'],
  },
];

export const profileNavItems: NavItem[] = [accueilNavItem];
export const settingsNavItems: NavItem[] = [accueilNavItem];

export function resolveMenuKey(pathname: string): MenuKey | null {
  // /workspace, /workspace/dashboard, /workspace/observed-climate, /workspace/future-climate,
  // /workspace/sensibility, /workspace/skills-partners-mobilised → DIAGNOSTIC
  // /workspace/gestion/... → ADMIN
  // /workspace/profile → PROFILE
  // /workspace/settings → SETTINGS

  if (!pathname.startsWith('/')) return null;
  const segments = pathname.split('/').filter(Boolean);

  // Hors workspace : pas de menu
  if (segments[0] !== 'workspace') return null;

  const second = segments[1];

  if (!second) return 'DIAGNOSTIC';
  if (second === 'gestion') return 'ADMIN';
  if (second === 'profile') return 'PROFILE';
  if (second === 'settings') return 'SETTINGS';

  // Routes du diagnostic
  if (
    [
      'dashboard',
      'observed-climate',
      'future-climate',
      'sensibility',
      'skills-partners-mobilised',
    ].includes(second)
  ) {
    return 'DIAGNOSTIC';
  }

  return null;
}

export function getNavItemsForKey(key: MenuKey): NavItem[] {
  switch (key) {
    case 'DIAGNOSTIC':
      return diagnosticNavItems;
    case 'ADMIN':
      return adminNavItems;
    case 'PROFILE':
      return profileNavItems;
    case 'SETTINGS':
      return settingsNavItems;
  }
}
