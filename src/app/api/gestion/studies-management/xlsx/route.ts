import { NextResponse, type NextRequest } from 'next/server';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { getStudiesAdminExport } from '@/server/admin/queries';
import { buildStudiesWorkbook, xlsxResponse } from '@/server/admin/export';

/**
 * Export xlsx de la liste des études (admin). Reprend les filtres et le tri de
 * `/gestion/studies-management`, sans pagination.
 */
export async function GET(request: NextRequest) {
  const user = await requireCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const studies = await getStudiesAdminExport({
    search: params.get('q')?.trim() || undefined,
    regionId: params.get('region') || undefined,
    sort: params.get('sort') ?? undefined,
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  });

  return xlsxResponse(await buildStudiesWorkbook(studies), 'tacct-etudes');
}
