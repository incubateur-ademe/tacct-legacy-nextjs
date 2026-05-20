import 'server-only';
import { prisma } from '@/server/db';

/**
 * Tous les impacts de l'étude avec leurs compétences déjà saisies et leur aléa
 * principal (pour récupérer l'exposition future utilisée pour le tri).
 */
export async function getImpactsWithCompetencesForStudy(studyId: string) {
  return prisma.impact.findMany({
    where: { impact_theme: { study_id: studyId } },
    include: {
      impact_theme: { include: { thematic: true } },
      observed_exposure: {
        include: {
          climate_hazard: true,
          future_exposure: true,
        },
      },
      impact_competence: { include: { skill_territory: true } },
    },
    orderBy: { created_at: 'asc' },
  });
}

export async function getSkillTerritoryCatalog() {
  return prisma.skill_territory.findMany({ orderBy: { label: 'asc' } });
}
