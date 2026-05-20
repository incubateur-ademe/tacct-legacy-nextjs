import 'server-only';
import { prisma } from '@/server/db';

const DEFAULT_PAGE_SIZE = 12;

export async function getPublicProjectSheets({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  domainId,
  areaType,
  activityType,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  domainId?: string;
  areaType?: string;
  activityType?: string;
}) {
  const where = {
    AND: [
      search ? { name: { contains: search, mode: 'insensitive' as const } } : {},
      domainId ? { domain_id: domainId } : {},
      areaType ? { area_type: areaType } : {},
      activityType ? { activity_type: activityType } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.project_sheet_detail.findMany({
      where,
      include: { domain: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project_sheet_detail.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getPublicProjectSheetBySlug(slug: string) {
  return prisma.project_sheet_detail.findUnique({
    where: { slug },
    include: {
      domain: true,
      project_sheet_question: { orderBy: { created_at: 'asc' } },
    },
  });
}
