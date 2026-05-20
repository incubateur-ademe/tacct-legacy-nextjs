import 'server-only';
import { prisma } from '@/server/db';

/**
 * Impacts diagnostiqués (depuis l'étape sensibilité) de l'étude.
 * Ces impacts peuvent être marqués pour étude stratégique via `strategy_studied`.
 */
export async function getDiagnosedImpactsForStudy(studyId: string) {
  return prisma.impact.findMany({
    where: { impact_theme: { study_id: studyId } },
    include: {
      impact_theme: { include: { thematic: true } },
      observed_exposure: { include: { future_exposure: true, climate_hazard: true } },
    },
    orderBy: { created_at: 'asc' },
  });
}

/**
 * Impacts étudiés en stratégie : 2 sources fusionnées
 * - `impact` avec strategy_studied=true OU score (sensitivity × futureExposure) >= 8
 * - `impact_strategy` (créés ex nihilo, liés à un impact_theme de l'étude)
 */
export async function getStudiedImpactsForStudy(studyId: string) {
  const [diagnosed, strategies] = await Promise.all([
    prisma.impact.findMany({
      where: {
        impact_theme: { study_id: studyId },
        OR: [
          { strategy_studied: true },
          // Sensibilité × exposition future >= 8 (impact "prioritaire" même non explicitement choisi)
          // Filtré par revoked_diagnostic = false.
          { revoked_diagnostic: false },
        ],
      },
      include: {
        impact_theme: { include: { thematic: true } },
        observed_exposure: { include: { future_exposure: true, climate_hazard: true } },
        impact_action: { select: { id: true } },
        impact_trajectory: { select: { id: true } },
      },
      orderBy: { created_at: 'asc' },
    }),
    prisma.impact_strategy.findMany({
      where: { impact_theme: { study_id: studyId } },
      include: {
        impact_theme: { include: { thematic: true } },
        impact_action: { select: { id: true } },
        impact_trajectory: { select: { id: true } },
      },
      orderBy: { created_at: 'asc' },
    }),
  ]);

  return { diagnosed, strategies };
}

export async function getImpactStrategyById(id: string) {
  return prisma.impact_strategy.findUnique({
    where: { id },
    include: {
      impact_theme: { include: { thematic: true, study: true } },
    },
  });
}

export async function getImpactThemesAndCatalog(studyId: string) {
  const [themes, catalog] = await Promise.all([
    prisma.impact_theme.findMany({
      where: { study_id: studyId },
      include: { thematic: true },
      orderBy: { created_at: 'asc' },
    }),
    prisma.thematic.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return { themes, catalog };
}
