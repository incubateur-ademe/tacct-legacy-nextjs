import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { generateStudyCsv } from '@/server/dashboard/queries';
import { prisma } from '@/server/db';

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

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { territory_name: true },
  });
  if (!study) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const csv = await generateStudyCsv(studyId);
  const filename = `tacct-${slugify(study.territory_name)}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
