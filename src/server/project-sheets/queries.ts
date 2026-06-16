import 'server-only';
import { prisma } from '@/server/db';
import { activityTypeName, areaTypeName } from '@/lib/project-sheet-taxonomy';
import { parseResources, parseStringList, type Resource } from './parse';

export interface ProjectSheetDomain {
  id: string;
  name: string;
  icon: string;
}

export interface ProjectSheetCardData {
  id: string;
  slug: string;
  name: string;
  abstract: string;
  imageFileName: string | null;
  imageAlt: string | null;
  domain: ProjectSheetDomain | null;
  activityType: string | null;
  areaType: string | null;
}

export interface ProjectSheetQuestionData {
  id: string;
  name: string;
  thematic: string;
  diagnosis: boolean;
  strategy: boolean;
  review: boolean;
  highlighted: boolean;
}

export interface ProjectSheetDetailData extends ProjectSheetCardData {
  imageCredit: string | null;
  activityTypeName: string | null;
  areaTypeName: string | null;
  expectedEffects: string[];
  consequences: string[];
  resources: Resource[];
  questions: ProjectSheetQuestionData[];
  linkedSheets: ProjectSheetCardData[];
}

type DomainRow = { id: string; name: string; icon: string } | null;
type FileRow = { file_name: string | null } | null;
interface CardRow {
  id: string;
  slug: string;
  name: string;
  abstract: string;
  image_alt: string | null;
  activity_type: string | null;
  area_type: string | null;
  domain: DomainRow;
  file: FileRow;
}

function toCard(row: CardRow): ProjectSheetCardData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    abstract: row.abstract,
    imageFileName: row.file?.file_name ?? null,
    imageAlt: row.image_alt,
    domain: row.domain
      ? { id: row.domain.id, name: row.domain.name, icon: row.domain.icon }
      : null,
    activityType: row.activity_type,
    areaType: row.area_type,
  };
}

/**
 * Liste publique complète (12 fiches). Le filtrage et la pagination
 * « Afficher plus » sont réalisés côté client, à l'identique du legacy.
 */
export async function getAllPublicProjectSheets(): Promise<ProjectSheetCardData[]> {
  const rows = await prisma.project_sheet_detail.findMany({
    include: { domain: true, file: true },
    orderBy: { name: 'asc' },
  });
  return rows.map(toCard);
}

export async function getPublicProjectSheetBySlug(
  slug: string,
): Promise<ProjectSheetDetailData | null> {
  const row = await prisma.project_sheet_detail.findUnique({
    where: { slug },
    include: {
      domain: true,
      file: true,
      project_sheet_question: { orderBy: { created_at: 'asc' } },
      // Relations où cette fiche est « parent » → ses fiches liées (enfants).
      project_sheet_detail_relation_project_sheet_detail_relation_project_sheet_detail_parentToproject_sheet_detail:
        {
          include: {
            project_sheet_detail_project_sheet_detail_relation_project_sheet_detail_childToproject_sheet_detail:
              { include: { domain: true, file: true } },
          },
        },
    },
  });
  if (!row) return null;

  const linkedSheets = row.project_sheet_detail_relation_project_sheet_detail_relation_project_sheet_detail_parentToproject_sheet_detail
    .map(
      (relation) =>
        relation.project_sheet_detail_project_sheet_detail_relation_project_sheet_detail_childToproject_sheet_detail,
    )
    .slice(0, 3)
    .map(toCard);

  return {
    ...toCard(row),
    imageCredit: row.image_credit,
    activityTypeName: activityTypeName(row.activity_type),
    areaTypeName: areaTypeName(row.area_type),
    expectedEffects: parseStringList(row.expected_effects),
    consequences: parseStringList(row.consequences),
    resources: parseResources(row.resources),
    questions: row.project_sheet_question.map((question) => ({
      id: question.id,
      name: question.name,
      thematic: question.thematic,
      diagnosis: question.diagnosis,
      strategy: question.strategy,
      review: question.review,
      highlighted: question.highlighted,
    })),
    linkedSheets,
  };
}
