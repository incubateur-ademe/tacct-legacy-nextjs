import 'server-only';
import { prisma } from '@/server/db';

/**
 * Récupère les catégories d'aléas applicables à l'étude (filtrées par le
 * département de la commune), avec le nombre d'aléas dans la catégorie et le
 * nombre d'aléas déjà saisis en exposition observée pour cette étude.
 */
export async function getCategoriesForStudy(studyId: string) {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { commune: true },
  });
  const departmentId = study?.commune?.department_id ?? null;

  // Récupère les catégories disponibles dans le département de l'étude
  const categories = await prisma.climate_hazard_category.findMany({
    where: departmentId
      ? {
          climate_hazard_category_department: {
            some: { department_id: departmentId },
          },
        }
      : undefined,
    include: {
      climate_hazard: {
        include: {
          observed_exposure: {
            where: { study_id: studyId },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories.map((cat) => {
    const nbClimate = cat.climate_hazard.length;
    const nbExposure = cat.climate_hazard.filter((h) => h.observed_exposure.length > 0).length;
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      nbClimate,
      nbExposure,
    };
  });
}

/**
 * Aléas d'une catégorie, avec flag `alreadyExposed` indiquant s'ils ont déjà
 * été saisis en exposition observée pour cette étude.
 */
export async function getHazardsForCategoryAndStudy(categoryId: string, studyId: string) {
  const hazards = await prisma.climate_hazard.findMany({
    where: { climate_hazard_category_id: categoryId },
    include: {
      observed_exposure: {
        where: { study_id: studyId },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return hazards.map((h) => ({
    id: h.id,
    name: h.name,
    alreadyExposed: h.observed_exposure.length > 0,
  }));
}

/**
 * Liste des expositions observées de l'étude.
 */
export async function getObservedExposuresForStudy(studyId: string) {
  return prisma.observed_exposure.findMany({
    where: { study_id: studyId },
    include: {
      climate_hazard: {
        include: { climate_hazard_category: true },
      },
    },
    orderBy: { created_at: 'asc' },
  });
}

export async function getObservedExposure(id: string) {
  return prisma.observed_exposure.findUnique({
    where: { id },
    include: {
      climate_hazard: { include: { climate_hazard_category: true } },
      study: true,
    },
  });
}
