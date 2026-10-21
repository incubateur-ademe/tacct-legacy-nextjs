import 'server-only';
import { prisma } from '@/server/db';

const DEFAULT_PAGE_SIZE = 10;

// ─── Users ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc';

export type UsersListFilters = {
  search?: string;
  /** Clé de tri : `lastname` (Nom), `commune`, `creationDate`, `validated` */
  sort?: string;
  dir?: SortDir;
};

type FilterableUser = {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  created_at: Date;
  validated: boolean;
  commune: { label: string } | null;
};

// firstname/lastname/email/username sont chiffrés (AES-GCM) : ni recherche SQL
// (LIKE impossible), ni tri SQL (ordre du chiffré). On charge la liste
// déchiffrée (extension Prisma) puis on filtre/trie en mémoire. OK tant que le
// volume reste modéré (quelques milliers de comptes).
function filterAndSortUsers<T extends FilterableUser>(
  all: T[],
  { search, sort, dir = 'asc' }: UsersListFilters,
): T[] {
  const needle = search?.trim().toLowerCase();
  const filtered = needle
    ? all.filter((u) =>
        [u.firstname, u.lastname, u.email, u.username].some((v) =>
          v.toLowerCase().includes(needle),
        ),
      )
    : all;

  const factor = dir === 'desc' ? -1 : 1;
  const cmpStr = (a: string, b: string) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' });
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'commune':
        return factor * cmpStr(a.commune?.label ?? '', b.commune?.label ?? '');
      case 'creationDate':
        return factor * (a.created_at.getTime() - b.created_at.getTime());
      case 'validated':
        return factor * (Number(a.validated) - Number(b.validated));
      default:
        return factor * cmpStr(a.lastname, b.lastname);
    }
  });
}

export async function getUsersList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  ...filters
}: UsersListFilters & { page?: number; pageSize?: number }) {
  const all = await prisma.user.findMany({
    include: { study_office: true, commune: true },
  });
  const sorted = filterAndSortUsers(all, filters);

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  return { items, total, page, pageSize };
}

/**
 * Tous les comptes correspondant aux filtres de la liste, pour l'export xlsx.
 * `select` strict : seuls les champs exportés (ou nécessaires au filtre) sont
 * chargés — jamais `access_token`, `authenticated_id` ni les index aveugles.
 */
export async function getUsersExport(filters: UsersListFilters) {
  const all = await prisma.user.findMany({
    select: {
      firstname: true,
      lastname: true,
      email: true,
      username: true,
      roles: true,
      validated: true,
      created_at: true,
      workspace_last_login_at: true,
      workspace_login_count: true,
      study_office: { select: { name: true } },
      commune: { select: { label: true, postal_code: true } },
      user_study: { select: { study: { select: { territory_name: true, year: true } } } },
    },
  });
  return filterAndSortUsers(all, filters);
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

export type StudiesListFilters = {
  search?: string;
  regionId?: string;
  sort?: string;
  dir?: SortDir;
};

async function buildStudiesQuery({ search, regionId, sort, dir }: StudiesListFilters) {
  // Valeurs issues de l'URL : seules les valeurs attendues atteignent Prisma.
  const order: SortDir = dir === 'desc' ? 'desc' : 'asc';
  // Le nom du chargé d'étude est chiffré : on résout d'abord en mémoire les
  // user_ids dont le nom matche (volume modéré), puis on filtre les études
  // dessus en SQL — la pagination et le tri SQL des études sont conservés.
  const needle = search?.trim();
  let matchedUserIds: string[] = [];
  if (needle) {
    const low = needle.toLowerCase();
    const users = await prisma.user.findMany({
      select: { id: true, firstname: true, lastname: true },
    });
    matchedUserIds = users
      .filter(
        (u) =>
          u.firstname.toLowerCase().includes(low) ||
          u.lastname.toLowerCase().includes(low),
      )
      .map((u) => u.id);
  }

  const where = {
    ...(needle
      ? {
          OR: [
            { territory_name: { contains: needle, mode: 'insensitive' as const } },
            ...(matchedUserIds.length > 0
              ? [{ user_study: { some: { user_id: { in: matchedUserIds } } } }]
              : []),
          ],
        }
      : {}),
    ...(typeof regionId === 'string' && regionId
      ? { commune: { department: { region_id: regionId } } }
      : {}),
  };

  const orderBy =
    sort === 'territoryName'
      ? { territory_name: order }
      : sort === 'region'
        ? { commune: { department: { region: { label: order } } } }
        : sort === 'dateCreation'
          ? { created_at: order }
          : { created_at: 'desc' as SortDir };

  return { where, orderBy };
}

export async function getStudiesAdminList({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  ...filters
}: StudiesListFilters & { page?: number; pageSize?: number }) {
  const { where, orderBy } = await buildStudiesQuery(filters);

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

/**
 * Toutes les études correspondant aux filtres de la liste, pour l'export xlsx.
 * Des membres, on ne charge que l'identité du chargé d'étude (cf. `getUsersExport`).
 */
export async function getStudiesAdminExport(filters: StudiesListFilters) {
  const { where, orderBy } = await buildStudiesQuery(filters);
  return prisma.study.findMany({
    where,
    select: {
      territory_name: true,
      year: true,
      observed_exposure_valid: true,
      exposition_future_valid: true,
      sensibility_valid: true,
      strategy_construction_valid: true,
      created_at: true,
      updated_at: true,
      commune: {
        select: {
          label: true,
          postal_code: true,
          department: { select: { label: true, region: { select: { label: true } } } },
        },
      },
      // Les autres membres ne sont que comptés : leur identité n'est pas chargée.
      user_study: {
        where: { head_study: true },
        take: 1,
        select: { user: { select: { firstname: true, lastname: true, email: true } } },
      },
      _count: { select: { user_study: true } },
    },
    orderBy,
  });
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
