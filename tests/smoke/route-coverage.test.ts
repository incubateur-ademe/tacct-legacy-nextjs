import { describe, expect, it } from 'vitest';
import { discoverRoutePatterns, buildRouteCases } from '../helpers/routes';

const declared = new Set(
  buildRouteCases({
    userId: 'x',
    studyId: 'x',
    impactId: 'x',
    strategyId: 'x',
    impactThemeId: 'x',
    trajectory: { id: 'x', impactId: 'x' },
    observedExposureId: 'x',
    hazardCategoryId: 'x',
    projectSheet: { id: 'x', slug: 'x' },
  }).map((c) => c.pattern),
);

describe('couverture des routes', () => {
  const discovered = discoverRoutePatterns();

  it('déclare toutes les routes présentes dans src/app', () => {
    const missing = discovered.filter((pattern) => !declared.has(pattern));

    expect(
      missing,
      `routes non couvertes par le smoke — ajoute-les dans tests/helpers/routes.ts :\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it("ne déclare aucune route qui n'existe plus", () => {
    const discoveredSet = new Set(discovered);
    const stale = [...declared].filter((pattern) => !discoveredSet.has(pattern));

    expect(stale, `routes déclarées mais absentes de src/app :\n${stale.join('\n')}`).toEqual([]);
  });
});
