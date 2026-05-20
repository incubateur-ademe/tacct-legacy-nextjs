import 'server-only';
import { prisma } from '@/server/db';

/**
 * Récupère les expositions observées de l'étude avec leur exposition future
 * associée (1:1). Si l'exposition future n'existe pas encore, elle sera créée
 * au moment de la première saisie.
 */
export async function getObservedExposuresWithFutureForStudy(studyId: string) {
  return prisma.observed_exposure.findMany({
    where: { study_id: studyId },
    include: {
      climate_hazard: {
        include: { climate_hazard_category: true },
      },
      future_exposure: true,
    },
    orderBy: { created_at: 'asc' },
  });
}
