import { beforeEach, describe, expect, it, vi } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { NextRequest } from 'next/server';

// Aucun accès base : l'export est testé sur des données en mémoire.
vi.mock('@/server/db', () => ({ prisma: {} }));
const requireCurrentUser = vi.fn();
vi.mock('@/server/auth/current-user', () => ({ requireCurrentUser: () => requireCurrentUser() }));

const { authorizeAdminExport, buildStudiesWorkbook, buildUsersWorkbook, xlsxResponse } =
  await import('@/server/admin/export');

const ADMIN = { id: 'admin-1', roles: '["ROLE_ADMIN"]', validated: true };

const request = (secFetchSite?: string) =>
  new NextRequest('http://localhost/workspace-tacct/api/gestion/account-management/xlsx', {
    headers: secFetchSite ? { 'sec-fetch-site': secFetchSite } : {},
  });

const statusOf = (result: unknown) => (result instanceof Response ? result.status : 200);

function sheetXml(buffer: Buffer): { sheet: string; strings: string } {
  const files = unzipSync(new Uint8Array(buffer));
  const read = (name: string) => strFromU8(files[name] ?? new Uint8Array());
  return { sheet: read('xl/worksheets/sheet1.xml'), strings: read('xl/sharedStrings.xml') };
}

const user = (overrides: Record<string, unknown> = {}) => ({
  firstname: 'Élodie',
  lastname: 'Dupont',
  email: 'elodie@example.fr',
  username: 'elodie',
  roles: '[]',
  validated: true,
  created_at: new Date('2025-03-14T10:00:00Z'),
  workspace_last_login_at: null,
  workspace_login_count: 0,
  study_office: null,
  commune: null,
  user_study: [],
  ...overrides,
});

describe('authorizeAdminExport', () => {
  beforeEach(() => {
    requireCurrentUser.mockReset();
    requireCurrentUser.mockResolvedValue(ADMIN);
  });

  it.each(['cross-site', 'same-site'])(
    'refuse une requête %s sans même lire la session',
    async (site) => {
      expect(statusOf(await authorizeAdminExport(request(site)))).toBe(403);
      expect(requireCurrentUser).not.toHaveBeenCalled();
    },
  );

  it.each(['same-origin', 'none', undefined])('laisse passer un admin (%s)', async (site) => {
    expect(await authorizeAdminExport(request(site))).toBe(ADMIN);
  });

  it.each([
    ['non admin', { ...ADMIN, roles: '["ROLE_USER"]' }],
    ['admin non validé', { ...ADMIN, validated: false }],
    ['rôles illisibles', { ...ADMIN, roles: 'ROLE_ADMIN' }],
    ['rôles non tableau', { ...ADMIN, roles: '{"0":"ROLE_ADMIN"}' }],
  ])('refuse : %s', async (_label, current) => {
    requireCurrentUser.mockResolvedValue(current);
    expect(statusOf(await authorizeAdminExport(request('same-origin')))).toBe(403);
  });
});

describe('contenu du fichier', () => {
  it("écrit les saisies en texte, jamais en formule, et les neutralise pour un passage en CSV", async () => {
    const { sheet, strings } = sheetXml(
      await buildUsersWorkbook([
        user({
          lastname: '=HYPERLINK("https://evil.example","clic")',
          firstname: '+cmd|calc',
          email: '@SUM(1)',
          study_office: { name: '-2+3' },
          commune: { label: '\t=1+1', postal_code: '01000' },
        }),
      ] as never),
    );
    expect(sheet).not.toContain('<f>');
    expect(sheet).not.toMatch(/t="(str|inlineStr)"/);
    for (const neutralized of ["'=HYPERLINK(", "'+cmd|calc", "'@SUM(1)", "'-2+3", "'\t=1+1"]) {
      expect(strings).toContain(neutralized);
    }
    // Une valeur ordinaire n'est pas modifiée.
    expect(strings).toContain('<t>01000</t>');
  });

  it('échappe le XML et retire les caractères invalides', async () => {
    const { strings } = sheetXml(
      await buildStudiesWorkbook([
        {
          territory_name: '</t></si><si><t>injecté\u0001\u0008',
          year: 2024n,
          observed_exposure_valid: 'validated',
          exposition_future_valid: 'in-progress',
          sensibility_valid: 'incomplete',
          strategy_construction_valid: 'incomplete',
          created_at: new Date(),
          updated_at: new Date(),
          commune: null,
          user_study: [{ user: { firstname: 'Jean', lastname: 'Martin', email: 'j@example.fr' } }],
          _count: { user_study: 4 },
        },
      ] as never),
    );
    expect(strings).toContain('&lt;/t&gt;&lt;/si&gt;&lt;si&gt;&lt;t&gt;injecté');
    expect(strings).not.toMatch(/[\u0001\u0008]/);
    expect(strings).toContain('Jean Martin');
  });

  it("tronque à la limite d'Excel (32 767 caractères)", async () => {
    const { strings } = sheetXml(
      await buildUsersWorkbook([user({ lastname: 'x'.repeat(40_000) })] as never),
    );
    expect(strings).toContain('x'.repeat(32_767));
    expect(strings).not.toContain('x'.repeat(32_768));
  });
});

describe('routes', () => {
  it.each([
    '@/app/api/gestion/account-management/xlsx/route',
    '@/app/api/gestion/studies-management/xlsx/route',
  ])('%s refuse HEAD (sinon Next le dérive de GET)', async (path) => {
    const { HEAD } = await import(path);
    const res = HEAD();
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET');
  });
});

describe('xlsxResponse', () => {
  it('interdit tout cache et toute interprétation du fichier', async () => {
    const res = xlsxResponse(await buildUsersWorkbook([]), {
      basename: 'tacct-comptes',
      user: ADMIN as never,
      rowCount: 0,
    });
    expect(res.headers.get('cache-control')).toBe('no-store, private');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('content-disposition')).toMatch(
      /^attachment; filename="tacct-comptes-\d{4}-\d{2}-\d{2}\.xlsx"$/,
    );
  });
});
