import type { NextRequest } from 'next/server';
import { getStudiesAdminExport } from '@/server/admin/queries';
import { authorizeAdminExport, buildStudiesWorkbook, xlsxResponse } from '@/server/admin/export';

export const dynamic = 'force-dynamic';

/**
 * Export xlsx de la liste des études (admin). Reprend les filtres et le tri de
 * `/gestion/studies-management`, sans pagination.
 */
export async function GET(request: NextRequest) {
  const user = await authorizeAdminExport(request);
  if (user instanceof Response) return user;

  const params = request.nextUrl.searchParams;
  const studies = await getStudiesAdminExport({
    search: params.get('q')?.trim() || undefined,
    regionId: params.get('region') || undefined,
    sort: params.get('sort') ?? undefined,
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  });

  return xlsxResponse(await buildStudiesWorkbook(studies), {
    basename: 'tacct-etudes',
    user,
    rowCount: studies.length,
  });
}

// Sinon Next dérive HEAD de GET : l'export serait calculé et tracé sans être envoyé.
export const HEAD = () => new Response(null, { status: 405, headers: { Allow: 'GET' } });
