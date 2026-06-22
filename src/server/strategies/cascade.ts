import { prisma } from '@/server/db';

/**
 * Client de transaction Prisma (client étendu, privé des méthodes de contrôle).
 * Permet de partager la logique de cascade entre plusieurs server actions.
 */
type Tx = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Supprime des `impact_action` et leurs dépendances (reviews + lignes de
 * jonction trajectoire↔action). Réplique le cascade remove Doctrine du legacy
 * (ImpactAction → ImpactActionReview, ImpactTrajectoryImpactAction).
 */
export async function deleteImpactActionsCascade(tx: Tx, actionIds: string[]): Promise<void> {
  if (actionIds.length === 0) return;
  await tx.impact_trajectory_impact_action.deleteMany({ where: { action_id: { in: actionIds } } });
  await tx.impact_action_review.deleteMany({ where: { impact_action_id: { in: actionIds } } });
  await tx.impact_action.deleteMany({ where: { id: { in: actionIds } } });
}

/**
 * Supprime des impacts et toute leur descendance (actions, trajectoires,
 * compétences, aléas, critères de revue, expositions liées, niveau d'impact).
 * Réplique le cascade remove du legacy (ImpactTheme → Impact → …).
 */
export async function deleteImpactsCascade(tx: Tx, impactIds: string[]): Promise<void> {
  if (impactIds.length === 0) return;

  const actions = await tx.impact_action.findMany({
    where: { impact_id: { in: impactIds } },
    select: { id: true },
  });
  await deleteImpactActionsCascade(
    tx,
    actions.map((a) => a.id),
  );

  // Les trajectoires suppriment leurs lignes de jonction en cascade (trajectory_id).
  await tx.impact_trajectory.deleteMany({ where: { impact_id: { in: impactIds } } });
  await tx.impact_competence.deleteMany({ where: { impact_id: { in: impactIds } } });
  await tx.impact_climate_hazard.deleteMany({ where: { impact_id: { in: impactIds } } });
  await tx.impact_review_criteria.deleteMany({ where: { impact_id: { in: impactIds } } });
  await tx.observed_exposure_impact.deleteMany({ where: { impact_id: { in: impactIds } } });

  const levels = await tx.impact.findMany({
    where: { id: { in: impactIds }, impact_level_id: { not: null } },
    select: { impact_level_id: true },
  });
  await tx.impact.deleteMany({ where: { id: { in: impactIds } } });

  const levelIds = levels.map((l) => l.impact_level_id).filter((v): v is string => v !== null);
  if (levelIds.length > 0) {
    await tx.impact_level.deleteMany({ where: { id: { in: levelIds } } });
  }
}

/**
 * Supprime des `impact_strategy` et toute leur descendance (actions,
 * trajectoires, critères de revue, niveau d'impact). Réplique le cascade remove
 * du legacy (ImpactTheme → ImpactStrategy → …).
 */
export async function deleteImpactStrategiesCascade(
  tx: Tx,
  strategyIds: string[],
): Promise<void> {
  if (strategyIds.length === 0) return;

  const actions = await tx.impact_action.findMany({
    where: { impact_strategy_id: { in: strategyIds } },
    select: { id: true },
  });
  await deleteImpactActionsCascade(
    tx,
    actions.map((a) => a.id),
  );

  await tx.impact_trajectory.deleteMany({ where: { impact_strategy_id: { in: strategyIds } } });
  await tx.impact_review_criteria.deleteMany({ where: { impact_strategy_id: { in: strategyIds } } });

  const levels = await tx.impact_strategy.findMany({
    where: { id: { in: strategyIds }, impact_level_id: { not: null } },
    select: { impact_level_id: true },
  });
  await tx.impact_strategy.deleteMany({ where: { id: { in: strategyIds } } });

  const levelIds = levels.map((l) => l.impact_level_id).filter((v): v is string => v !== null);
  if (levelIds.length > 0) {
    await tx.impact_level.deleteMany({ where: { id: { in: levelIds } } });
  }
}
