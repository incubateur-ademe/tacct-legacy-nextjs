import { afterAll, describe, expect, it } from 'vitest';
import { loadFixtures } from '../helpers/fixtures';
import { buildRouteCases, type RouteCase } from '../helpers/routes';
import { sessionCookieHeader } from '../helpers/session';
import { request } from '../helpers/http';
import { disconnect } from '../helpers/db';
import { ensureServerReachable } from '../helpers/server';
import { ensureFixturesMatchTarget } from '../helpers/consistency';
import { BASE_URL } from '../helpers/config';

const LOGIN_PATH = '/mon-compte';

/**
 * Routes qui ne rendent rien et redirigent vers leur première sous-page.
 * Toute autre route doit répondre 200 : un 3xx inattendu est un échec.
 */
const EXPECTED_REDIRECTS: Record<string, string> = {
  '/future-climate': '/future-climate/analyse-future-climate',
  '/gestion': '/gestion/studies-management',
  '/observed-climate': '/observed-climate/observed-exposure',
};

await ensureServerReachable();
const fixtures = await loadFixtures();
const cookie = await sessionCookieHeader(fixtures.userId);
await ensureFixturesMatchTarget(fixtures, cookie);
const cases = buildRouteCases(fixtures);

const skipped = cases.filter((c) => c.url === null);
if (skipped.length > 0) {
  console.warn(
    [`\n${skipped.length} route(s) non testée(s), faute de données en base :`]
      .concat(skipped.map((c) => `  - ${c.pattern} (${c.skipReason})`))
      .join('\n'),
  );
}

function title(routeCase: RouteCase): string {
  return routeCase.label ? `${routeCase.pattern} [${routeCase.label}]` : routeCase.pattern;
}

function detail(routeCase: RouteCase, res: { status: number; body: string }): string {
  return `${routeCase.url} → ${res.status}\n${res.body.slice(0, 400)}`;
}

afterAll(async () => {
  await disconnect();
});

describe(`GET des routes sur ${BASE_URL}`, () => {
  for (const routeCase of cases) {
    it.skipIf(routeCase.url === null)(title(routeCase), async () => {
      const res = await request(routeCase.url as string, { cookie });
      const expectedRedirect = EXPECTED_REDIRECTS[routeCase.pattern];

      if (expectedRedirect) {
        expect(res.status, detail(routeCase, res)).toBeGreaterThanOrEqual(300);
        expect(res.status, detail(routeCase, res)).toBeLessThan(400);
        expect(res.location ?? '', 'cible de redirection inattendue').toContain(expectedRedirect);
        return;
      }

      expect(res.status, detail(routeCase, res)).toBe(200);

      if (!routeCase.api) {
        expect(res.body.length, `réponse vide pour ${routeCase.url}`).toBeGreaterThan(0);
      }
    });
  }
});

describe('garde-fous', () => {
  it('une route protégée renvoie vers la connexion sans session', async () => {
    const res = await request('/dashboard');

    expect(res.status, 'sans cookie, /dashboard devrait rediriger').toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(
      res.location ?? '',
      "la session forgée ne prouve rien si l'app n'exige pas d'authentification",
    ).toContain(LOGIN_PATH);
  });

  it('refuse toute méthode autre que GET/HEAD/OPTIONS', async () => {
    await expect(request('/dashboard', { method: 'POST', cookie })).rejects.toThrow(
      /lecture seule/,
    );
  });

  it('répond aux routes API en OPTIONS', async () => {
    const res = await request(`/api/export-tet/${fixtures.studyId}`, {
      method: 'OPTIONS',
      cookie,
    });

    expect(res.status).toBeLessThan(500);
  });
});
