import 'server-only';
import { prisma } from '@/server/db';

const DEFAULT_PAGE_SIZE = 10;

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsersList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const where = search
    ? {
        OR: [
          { firstname: { contains: search, mode: 'insensitive' as const } },
          { lastname: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { study_office: true, commune: true },
      orderBy: { lastname: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      study_office: true,
      commune: true,
      user_study: { include: { study: true } },
    },
  });
}

// ─── Study offices ────────────────────────────────────────────────────────────

export async function getStudyOfficesList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};
  const [items, total] = await Promise.all([
    prisma.study_office.findMany({
      where,
      include: { commune: true, user: { select: { id: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.study_office.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getStudyOfficeById(id: string) {
  return prisma.study_office.findUnique({
    where: { id },
    include: { commune: true },
  });
}

// ─── Project sheets ───────────────────────────────────────────────────────────

export async function getProjectSheetsList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};
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

export async function getProjectSheetById(id: string) {
  return prisma.project_sheet_detail.findUnique({
    where: { id },
    include: {
      domain: true,
      project_sheet_question: { orderBy: { created_at: 'asc' } },
    },
  });
}

export async function getDomainsList() {
  return prisma.domain.findMany({ orderBy: { name: 'asc' } });
}

// ─── Status (santé système) ───────────────────────────────────────────────────

export async function getSystemStatus() {
  const [users, studies, studyOffices, projectSheets, exposures, impacts] =
    await Promise.all([
      prisma.user.count(),
      prisma.study.count(),
      prisma.study_office.count(),
      prisma.project_sheet_detail.count(),
      prisma.observed_exposure.count(),
      prisma.impact.count(),
    ]);
  return { users, studies, studyOffices, projectSheets, exposures, impacts };
}

// ─── Communes (pour selects) ──────────────────────────────────────────────────

export async function searchCommunes(query: string, limit = 20) {
  if (!query || query.length < 2) return [];
  return prisma.commune.findMany({
    where: {
      OR: [
        { label: { contains: query, mode: 'insensitive' as const } },
        { postal_code: { contains: query } },
      ],
    },
    orderBy: { label: 'asc' },
    take: limit,
  });
}
