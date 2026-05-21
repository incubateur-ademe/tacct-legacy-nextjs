import 'server-only';
import { prisma } from '@/server/db';

const DEFAULT_PAGE_SIZE = 10;

// ─── Users ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc';

export async function getUsersList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  sort,
  dir = 'asc',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Clé de tri : `lastname` (Nom), `commune`, `creationDate`, `validated` */
  sort?: string;
  dir?: SortDir;
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

  const orderBy =
    sort === 'commune'
      ? { commune: { label: dir } }
      : sort === 'creationDate'
        ? { created_at: dir }
        : sort === 'validated'
          ? { validated: dir }
          : { lastname: (sort === 'lastname' ? dir : 'asc') as SortDir };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { study_office: true, commune: true },
      orderBy,
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

// ─── Studies (admin) ──────────────────────────────────────────────────────────

export async function getStudiesAdminList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  regionId,
  sort,
  dir = 'asc',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  regionId?: string;
  sort?: string;
  dir?: SortDir;
}) {
  const where = {
    ...(search
      ? {
          OR: [
            { territory_name: { contains: search, mode: 'insensitive' as const } },
            {
              user_study: {
                some: {
                  user: {
                    OR: [
                      { firstname: { contains: search, mode: 'insensitive' as const } },
                      { lastname: { contains: search, mode: 'insensitive' as const } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(regionId
      ? { commune: { department: { region_id: regionId } } }
      : {}),
  };

  const orderBy =
    sort === 'territoryName'
      ? { territory_name: dir }
      : sort === 'region'
        ? { commune: { department: { region: { label: dir } } } }
        : sort === 'dateCreation'
          ? { created_at: dir }
          : { created_at: 'desc' as SortDir };

  const [items, total] = await Promise.all([
    prisma.study.findMany({
      where,
      include: {
        commune: { include: { department: { include: { region: true } } } },
        user_study: {
          where: { head_study: true },
          take: 1,
          include: { user: true },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.study.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getRegionsList() {
  return prisma.region.findMany({ orderBy: { label: 'asc' } });
}

// ─── Study offices ────────────────────────────────────────────────────────────

export async function getStudyOfficesList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  sort,
  dir = 'asc',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  dir?: SortDir;
}) {
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};
  const orderBy =
    sort === 'commune'
      ? { commune: { label: dir } }
      : sort === 'creationDate'
        ? { created_at: dir }
        : { name: (sort === 'name' ? dir : 'asc') as SortDir };
  const [items, total] = await Promise.all([
    prisma.study_office.findMany({
      where,
      include: {
        commune: true,
        user: { select: { id: true, firstname: true, lastname: true } },
      },
      orderBy,
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
  sort,
  dir = 'asc',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  dir?: SortDir;
}) {
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};
  const orderBy =
    sort === 'domain'
      ? { domain: { name: dir } }
      : { name: (sort === 'name' ? dir : 'asc') as SortDir };
  const [items, total] = await Promise.all([
    prisma.project_sheet_detail.findMany({
      where,
      include: { domain: true },
      orderBy,
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
