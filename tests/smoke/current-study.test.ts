import { afterAll, describe, expect, it } from 'vitest';
import { sessionCookieHeader } from '../helpers/session';
import { request } from '../helpers/http';
import { disconnect, readOnlyPrisma } from '../helpers/db';
import { ensureServerReachable } from '../helpers/server';

await ensureServerReachable();

/**
 * Non-régression du switch d'étude : le choix doit tenir d'une page à l'autre,
 * sans qu'aucune étude ne reprenne la main.
 */
const multiStudyUser = await (async () => {
  const admins = await readOnlyPrisma.user.findMany({
    where: { roles: { contains: 'ROLE_ADMIN' } },
    select: { id: true, user_study: { select: { study_id: true }, orderBy: { id: 'asc' } } },
    take: 50,
  });

  for (const admin of admins) {
    const studyIds = [...new Set(admin.user_study.map((us) => us.study_id))].filter(
      (id): id is string => id !== null,
    );
    if (studyIds.length >= 2) return { id: admin.id, studyIds };
  }
  return null;
})();

/** L'id de l'étude courante est porté par le lien d'export CSV du dashboard. */
function currentStudyOnPage(html: string): string | null {
  return html.match(/\/api\/dashboard\/([0-9a-f-]{36})\/csv/)?.[1] ?? null;
}

afterAll(async () => {
  await disconnect();
});

describe.skipIf(multiStudyUser === null)("étude courante d'un utilisateur multi-études", () => {
  const user = multiStudyUser as NonNullable<typeof multiStudyUser>;
  const [studyA, studyB] = user.studyIds as [string, string];

  it('suit le cookie plutôt que la première étude', async () => {
    const cookie = await sessionCookieHeader(user.id);

    const onB = await request('/dashboard', {
      cookie: `${cookie}; tacct.current-study=${studyB}`,
    });
    expect(onB.status).toBe(200);
    expect(currentStudyOnPage(onB.body)).toBe(studyB);

    const onA = await request('/dashboard', {
      cookie: `${cookie}; tacct.current-study=${studyA}`,
    });
    expect(onA.status).toBe(200);
    expect(currentStudyOnPage(onA.body)).toBe(studyA);
  });

  it("conserve l'étude choisie en changeant de page", async () => {
    const cookie = `${await sessionCookieHeader(user.id)}; tacct.current-study=${studyB}`;

    for (const route of ['/dashboard', '/impacts', '/observed-climate/observed-exposure']) {
      const res = await request(route, { cookie });
      expect(res.status, route).toBe(200);
    }

    // Le dashboard reste sur l'étude choisie après un aller-retour sur d'autres pages.
    const res = await request('/dashboard', { cookie });
    expect(currentStudyOnPage(res.body)).toBe(studyB);
  });

  it('retombe sur une étude valide si le cookie désigne une étude inconnue', async () => {
    const cookie = `${await sessionCookieHeader(user.id)}; tacct.current-study=00000000-0000-0000-0000-000000000000`;

    const res = await request('/dashboard', { cookie });
    expect(res.status).toBe(200);
    expect(user.studyIds).toContain(currentStudyOnPage(res.body));
  });
});
