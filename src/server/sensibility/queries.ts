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
              climate_hazard: true,
              future_exposure: true,
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
