import 'server-only';
import { prisma } from '@/server/db';

/**
 * Impact themes de l'étude, avec leurs impacts et l'aléa principal de chacun.
 */
export async function getImpactThemesForStudy(studyId: string) {
  return prisma.impact_theme.findMany({
    where: { study_id: studyId },
    include: {
      thematic: true,
      impact: {
        include: {
          observed_exposure: {
            include: {
              climate_hazard: { include: { climate_hazard_category: true } },
              future_exposure: true,
            },
          },
          observed_exposure_impact: {
            include: {
              observed_exposure: {
                include: { climate_hazard: true },
              },
            },
          },
        },
        orderBy: { created_at: 'asc' },
      },
    },
    orderBy: { created_at: 'asc' },
  });
}

export async function getThematicsCatalog() {
  return prisma.thematic.findMany({ orderBy: { name: 'asc' } });
}

/**
 * Catalogue des thématiques + flag `used` indiquant si l'étude a déjà une
 * `impact_theme` qui pointe sur cette thématique. Permet de désactiver les
 * tuiles déjà choisies dans la page « Ajouter une thématique ».
 */
export async function getThematicsCatalogForStudy(studyId: string) {
  const [thematics, themes] = await Promise.all([
    prisma.thematic.findMany({ orderBy: { name: 'asc' } }),
    prisma.impact_theme.findMany({
      where: { study_id: studyId },
      select: { thematic_id: true },
    }),
  ]);
  const used = new Set(themes.map((t) => t.thematic_id).filter(Boolean) as string[]);
  return thematics.map((t) => ({
    id: t.id,
    name: t.name ?? '',
    icon: t.icon ?? 'suspended',
    used: used.has(t.id),
  }));
}

export async function getImpactThemeById(id: string) {
  return prisma.impact_theme.findUnique({
    where: { id },
    include: { thematic: true, study: true },
  });
}

/**
 * Expositions observées de l'étude (utilisées pour les selects "aléa principal"
 * et "aléas secondaires" du form impact).
 */
export async function getExposuresForStudy(studyId: string) {
  return prisma.observed_exposure.findMany({
    where: { study_id: studyId },
    include: {
      climate_hazard: { include: { climate_hazard_category: true } },
      future_exposure: true,
    },
    orderBy: { created_at: 'asc' },
  });
}

export async function getImpactById(id: string) {
  return prisma.impact.findUnique({
    where: { id },
    include: {
      impact_theme: { include: { thematic: true, study: true } },
      observed_exposure: { include: { climate_hazard: true } },
      observed_exposure_impact: { include: { observed_exposure: true } },
    },
  });
}
