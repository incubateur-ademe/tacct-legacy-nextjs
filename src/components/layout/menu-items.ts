// Équivalent direct de tacct-legacy/.../components/menu/accueilNavItems.ts
// Le `menuKey` détermine quel jeu d'items afficher (DIAGNOSTIC ou ADMIN ici, les
// autres modes seront ajoutés avec les domaines stratégies).

export type MenuKey =
  | 'DIAGNOSTIC'
  | 'STUDIED_IMPACT'
  | 'IMPACT_STRATEGIE'
  | 'ADMIN'
  | 'PROFILE'
  | 'SETTINGS';

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
  /** si true, l'item n'est actif que sur une correspondance exacte du chemin */
  exact?: boolean;
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

// Menu de la section « Impacts étudiés » (legacy : MenuKeyEnum.STUDIED_IMPACT).
export const studiedImpactsNavItems: NavItem[] = [
  accueilNavItem,
  {
    name: 'studied-impacts',
    title: 'Impacts étudiés',
    route: 'impacts',
    icon: 'cible',
  },
];

// Menu de travail d'un impact (legacy : MenuKeyEnum.IMPACT_STRATEGIE). Les routes
// dépendent du type ('impact'|'strategy') et de l'id de l'impact courant.
export function getImpactStrategyNavItems(type: string, id: string): NavItem[] {
  const base = `impacts/${type}/${id}`;
  return [
    accueilNavItem,
    { name: 'studied-impacts', title: 'Impacts étudiés', route: 'impacts', icon: 'cible', exact: true },
    {
      name: 'impact-level',
      title: "Niveau d'impact",
      route: `${base}/impact-level`,
      icon: 'niveaux',
      exact: true,
    },
    {
      name: 'impact-action',
      title: 'Actions',
      route: `${base}/define-actions`,
      icon: 'module-report',
      exact: true,
    },
    {
      name: 'impact-evaluation',
      title: 'Évaluation',
      route: `${base}/review-actions`,
      icon: 'eligibility',
      exact: true,
    },
    {
      name: 'impact-trajectoires',
      title: 'Trajectoires',
      route: `${base}/build-trajectories`,
      icon: 'module-scenario',
      exact: true,
    },
  ];
}

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
  // /workspace, /dashboard, /observed-climate, /future-climate,
  // /sensibility, /skills-partners-mobilised → DIAGNOSTIC
  // /gestion/... → ADMIN
  // /profile → PROFILE
  // /settings → SETTINGS

  if (!pathname.startsWith('/')) return null;
  const segments = pathname.split('/').filter(Boolean);

  const second = segments[0];

  if (!second) return null;
  if (second === 'gestion') return 'ADMIN';
  if (second === 'profile') return 'PROFILE';
  if (second === 'settings') return 'SETTINGS';

  // /impacts (et /impacts/choose-impacts) → menu « Impacts étudiés ».
  // Les pages de travail d'un impact (/impacts/[type]/[id]/...) auront leur propre
  // menu (IMPACT_STRATEGIE) traité lors de la migration de ces pages.
  if (second === 'impacts') {
    const third = segments[1];
    if (!third || third === 'choose-impacts') return 'STUDIED_IMPACT';
    // /impacts/{type}/{id}/... → menu de travail d'un impact.
    return 'IMPACT_STRATEGIE';
  }

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
    case 'STUDIED_IMPACT':
      return studiedImpactsNavItems;
    case 'IMPACT_STRATEGIE':
      // Items dynamiques (dépendent de type/id) : construits dans le composant Menu.
      return [];
    case 'ADMIN':
      return adminNavItems;
    case 'PROFILE':
      return profileNavItems;
    case 'SETTINGS':
      return settingsNavItems;
  }
}
