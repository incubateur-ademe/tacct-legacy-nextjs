import 'server-only';
import { prisma } from '@/server/db';

export type OwnerType = 'impact' | 'strategy';

/**
 * Wrapper unifié pour récupérer un impact (diagnostiqué) OU un impact_strategy
 * (créé ex nihilo). Permet aux pages de stratégies de travailler indifféremment
 * sur les deux types.
 */
export async function getImpactOwner(type: OwnerType, id: string) {
  if (type === 'impact') {
    const impact = await prisma.impact.findUnique({
      where: { id },
      include: {
        impact_theme: { include: { thematic: true, study: true } },
        impact_level: true,
      },
    });
    if (!impact) return null;
    return {
      kind: 'impact' as const,
      id: impact.id,
      title: impact.description ?? '(sans description)',
      studyId: impact.impact_theme?.study_id ?? null,
      impactThemeName: impact.impact_theme?.name ?? null,
      thematicIcon: impact.impact_theme?.thematic?.icon ?? null,
      impactLevel: impact.impact_level,
      impactLevelId: impact.impact_level_id,
    };
  }
  const strategy = await prisma.impact_strategy.findUnique({
    where: { id },
    include: {
      impact_theme: { include: { thematic: true, study: true } },
      impact_level: true,
    },
  });
  if (!strategy) return null;
  return {
    kind: 'strategy' as const,
    id: strategy.id,
    title: strategy.description ?? '(sans description)',
    studyId: strategy.impact_theme?.study_id ?? null,
    impactThemeName: strategy.impact_theme?.name ?? null,
    thematicIcon: strategy.impact_theme?.thematic?.icon ?? null,
    impactLevel: strategy.impact_level,
    impactLevelId: strategy.impact_level_id,
  };
}

export type ImpactOwner = NonNullable<Awaited<ReturnType<typeof getImpactOwner>>>;

/**
 * Actions de l'impact ou de la stratégie, avec leurs reviews.
 */
export async function getActionsForOwner(type: OwnerType, ownerId: string) {
  return prisma.impact_action.findMany({
    where: type === 'impact' ? { impact_id: ownerId } : { impact_strategy_id: ownerId },
    include: { impact_action_review: { orderBy: { rank: 'asc' } } },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * 8 critères d'évaluation (rank 1..8). Si vide → catalogue par défaut.
 */
export async function getReviewCriteriaForOwner(type: OwnerType, ownerId: string) {
  return prisma.impact_review_criteria.findMany({
    where: type === 'impact' ? { impact_id: ownerId } : { impact_strategy_id: ownerId },
    orderBy: { rank: 'asc' },
  });
}

/** Critères par défaut TACCT (8 axes). */
export const DEFAULT_CRITERIA: { rank: number; name: string }[] = [
  { rank: 1, name: 'Efficacité' },
  { rank: 2, name: 'Coût' },
  { rank: 3, name: 'Temporalité' },
  { rank: 4, name: 'Acceptabilité' },
  { rank: 5, name: 'Faisabilité technique' },
  { rank: 6, name: 'Co-bénéfices' },
  { rank: 7, name: 'Réversibilité' },
  { rank: 8, name: 'Impact environnemental' },
];

/**
 * Trajectoires de l'impact, avec les actions liées.
 */
export async function getTrajectoriesForOwner(type: OwnerType, ownerId: string) {
  return prisma.impact_trajectory.findMany({
    where: type === 'impact' ? { impact_id: ownerId } : { impact_strategy_id: ownerId },
    include: {
      impact_trajectory_impact_action: {
        include: { impact_action: true },
        orderBy: { created_at: 'asc' },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}

export async function getTrajectoryById(id: string) {
  return prisma.impact_trajectory.findUnique({
    where: { id },
    include: {
      impact_trajectory_impact_action: { include: { impact_action: true } },
    },
  });
}

/** Parse le champ JSON incompatibles. */
export function parseIncompatibles(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
