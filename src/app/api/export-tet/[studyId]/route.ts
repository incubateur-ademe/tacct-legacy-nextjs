import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { generateExportTeTCsv } from '@/server/strategies/export-tet';

/**
 * Téléchargement du plan d'action TeT au format CSV.
 * Port de `GET /csv-export-tet/study/{id}` (Symfony legacy).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studyId: string }> },
) {
  const user = await requireCurrentUser();
  const { studyId } = await params;

  const canAccess =
    isAdmin(user) || user.user_study.some((us) => us.study_id === studyId);
  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const personnePilote = `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
  const result = await generateExportTeTCsv(studyId, personnePilote);

  if (!result) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(result.csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    },
  });
}
