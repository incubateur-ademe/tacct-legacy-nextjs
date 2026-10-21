import { NextResponse, type NextRequest } from 'next/server';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { getUsersExport } from '@/server/admin/queries';
import { buildUsersWorkbook, xlsxResponse } from '@/server/admin/export';

/**
 * Export xlsx de la liste des comptes (admin). Reprend les filtres et le tri de
 * `/gestion/account-management`, sans pagination.
 */
export async function GET(request: NextRequest) {
  const user = await requireCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const users = await getUsersExport({
    search: params.get('q')?.trim() || undefined,
    sort: params.get('sort') ?? undefined,
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  });

  return xlsxResponse(await buildUsersWorkbook(users), 'tacct-comptes');
}
