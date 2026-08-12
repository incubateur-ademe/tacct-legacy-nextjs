import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { Fixtures } from './fixtures';

const APP_DIR = path.join(process.cwd(), 'src', 'app');
const ROUTE_FILES = new Set(['page.tsx', 'route.ts']);

/**
 * Reconstruit la liste des routes réellement présentes dans `src/app`.
 * Sert de garde-fou : toute nouvelle route non déclarée dans `buildRouteCases`
 * fait échouer le test de couverture.
 */
export function discoverRoutePatterns(): string[] {
  const patterns = new Set<string>();

  const walk = (dir: string, segments: string[]): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_') || entry.name.startsWith('@')) continue;
        const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
        walk(path.join(dir, entry.name), isGroup ? segments : [...segments, entry.name]);
      } else if (ROUTE_FILES.has(entry.name)) {
        patterns.add(segments.length > 0 ? `/${segments.join('/')}` : '/');
      }
    }
  };

  walk(APP_DIR, []);
  return [...patterns].sort();
}

export type RouteCase = {
  pattern: string;
  /** URL concrète à appeler, ou `null` si aucune donnée de test n'a été trouvée. */
  url: string | null;
  label?: string;
  skipReason?: string;
  /** Route API : on attend du JSON/CSV, pas du HTML. */
  api?: boolean;
};

const STATIC_ROUTES = [
  '/',
  '/dashboard',
  '/future-climate',
  '/future-climate/analyse-future-climate',
  '/future-climate/capture-future-climate',
  '/gestion',
  '/gestion/account-management',
  '/gestion/account-management/create',
  '/gestion/project-sheet-management',
  '/gestion/project-sheet-management/create',
  '/gestion/status',
  '/gestion/studies-management',
  '/gestion/study-offices-management',
  '/impacts',
  '/impacts/choose-impacts',
  '/impacts/choose-impacts/create-impact',
  '/observed-climate',
  '/observed-climate/climate-trend',
  '/observed-climate/natural-disasters',
  '/observed-climate/observed-exposure',
  '/observed-climate/observed-exposure/add',
  '/profile',
  '/project-sheets',
  '/sensibility',
  '/sensibility/impact-theme/add',
  '/settings',
  '/skills-partners-mobilised',
];

/** Étapes de travail d'un impact / d'une stratégie, sous `/impacts/[type]/[id]`. */
const IMPACT_WORK_STEPS = [
  '/impact-level',
  '/define-actions',
  '/review-actions',
  '/review-actions/criterias',
  '/build-trajectories',
  '/build-trajectories/create-trajectory',
];

export function buildRouteCases(fixtures: Fixtures): RouteCase[] {
  const cases: RouteCase[] = STATIC_ROUTES.map((pattern) => ({ pattern, url: pattern }));

  const add = (
    pattern: string,
    value: string | null,
    build: (value: string) => string,
    missing: string,
    extra: { label?: string; api?: boolean } = {},
  ): void => {
    cases.push({
      pattern,
      url: value === null ? null : build(value),
      skipReason: value === null ? missing : undefined,
      ...extra,
    });
  };

  add(
    '/gestion/account-management/[id]',
    fixtures.userId,
    (id) => `/gestion/account-management/${id}`,
    'aucun utilisateur',
  );
  add(
    '/gestion/project-sheet-management/[id]',
    fixtures.projectSheet?.id ?? null,
    (id) => `/gestion/project-sheet-management/${id}`,
    'aucune fiche projet en base',
  );
  // Le paramètre s'appelle `idImpact` mais la page charge un `impact_strategy`.
  add(
    '/impacts/choose-impacts/[idImpact]',
    fixtures.strategyId,
    (id) => `/impacts/choose-impacts/${id}`,
    "aucun impact stratégie rattaché à l'étude de test",
  );
  add(
    '/observed-climate/observed-exposure/[id]/edit',
    fixtures.observedExposureId,
    (id) => `/observed-climate/observed-exposure/${id}/edit`,
    "aucune exposition observée sur l'étude de test",
  );
  add(
    '/observed-climate/observed-exposure/add/[category]',
    fixtures.hazardCategoryId,
    (id) => `/observed-climate/observed-exposure/add/${id}`,
    'aucune catégorie d\'aléa en base',
    { label: 'catégorie' },
  );
  add(
    '/observed-climate/observed-exposure/add/[category]',
    'custom',
    () => '/observed-climate/observed-exposure/add/custom',
    '',
    { label: 'aléa personnalisé' },
  );
  add(
    '/sensibility/impact-theme/impact/add/[impactThemeId]',
    fixtures.impactThemeId,
    (id) => `/sensibility/impact-theme/impact/add/${id}`,
    "aucun thème d'impact sur l'étude de test",
  );
  add(
    '/sensibility/impact-theme/impact/edit/[impactId]',
    fixtures.impactId,
    (id) => `/sensibility/impact-theme/impact/edit/${id}`,
    "aucun impact rattaché à l'étude de test",
  );
  add(
    '/project-sheets/[slug]',
    fixtures.projectSheet?.slug ?? null,
    (slug) => `/project-sheets/${slug}`,
    'aucune fiche projet en base',
  );

  const owners = [
    { label: 'impact', type: 'impact', id: fixtures.impactId },
    { label: 'strategy', type: 'strategy', id: fixtures.strategyId },
  ] as const;

  for (const step of IMPACT_WORK_STEPS) {
    for (const owner of owners) {
      add(
        `/impacts/[type]/[id]${step}`,
        owner.id,
        (id) => `/impacts/${owner.type}/${id}${step}`,
        `aucun ${owner.type} rattaché à l'étude de test`,
        { label: owner.label },
      );
    }
  }

  add(
    '/impacts/[type]/[id]/build-trajectories/[idTrajectory]',
    fixtures.trajectory?.id ?? null,
    (id) => `/impacts/impact/${fixtures.trajectory?.impactId}/build-trajectories/${id}`,
    "aucune trajectoire sur l'étude de test",
  );

  add(
    '/api/dashboard/[studyId]/csv',
    fixtures.studyId,
    (id) => `/api/dashboard/${id}/csv`,
    'aucune étude',
    { api: true },
  );
  add(
    '/api/export-tet/[studyId]',
    fixtures.studyId,
    (id) => `/api/export-tet/${id}`,
    'aucune étude',
    { api: true },
  );

  return cases;
}
