import type { NextRequest } from 'next/server';
import { getUsersExport } from '@/server/admin/queries';
import { authorizeAdminExport, buildUsersWorkbook, xlsxResponse } from '@/server/admin/export';

export const dynamic = 'force-dynamic';

/**
 * Export xlsx de la liste des comptes (admin). Reprend les filtres et le tri de
 * `/gestion/account-management`, sans pagination.
 */
export async function GET(request: NextRequest) {
  const user = await authorizeAdminExport(request);
  if (user instanceof Response) return user;

  const params = request.nextUrl.searchParams;
  const users = await getUsersExport({
    search: params.get('q')?.trim() || undefined,
    sort: params.get('sort') ?? undefined,
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  });

  return xlsxResponse(await buildUsersWorkbook(users), {
    basename: 'tacct-comptes',
    user,
    rowCount: users.length,
  });
}

// Sinon Next dérive HEAD de GET : l'export serait calculé et tracé sans être envoyé.
export const HEAD = () => new Response(null, { status: 405, headers: { Allow: 'GET' } });
