'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { setFlash } from '@/server/flash';
import { deleteImpactActionsCascade } from './cascade';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { getImpactOwner, parseIncompatibles, type OwnerType } from './impact-queries';

async function assertCanEditStudy(studyId: string) {
  const user = await requireCurrentUser();
  if (isAdmin(user)) return user;
  const isMember = user.user_study.some((us) => us.study_id === studyId);
  if (!isMember) throw new Error('FORBIDDEN');
  return user;
}

async function loadAndAuthorizeOwner(type: OwnerType, id: string) {
  const owner = await getImpactOwner(type, id);
  if (!owner?.studyId) throw new Error('NOT_FOUND');
  await assertCanEditStudy(owner.studyId);
  return owner;
}

function ownerScope(type: OwnerType, ownerId: string) {
  return type === 'impact'
    ? { impact_id: ownerId }
    : { impact_strategy_id: ownerId };
}

// Garde anti-IDOR : l'objet ciblé doit appartenir à l'owner déjà autorisé.
async function assertActionInOwner(type: OwnerType, ownerId: string, actionId: string) {
  const found = await prisma.impact_action.findFirst({
    where: { id: actionId, ...ownerScope(type, ownerId) },
    select: { id: true },
  });
  if (!found) throw new Error('FORBIDDEN');
}

async function assertTrajectoryInOwner(type: OwnerType, ownerId: string, trajectoryId: string) {
  const found = await prisma.impact_trajectory.findFirst({
    where: { id: trajectoryId, ...ownerScope(type, ownerId) },
    select: { id: true },
  });
  if (!found) throw new Error('FORBIDDEN');
}

// Ne conserve que les actions appartenant à l'owner autorisé (anti-IDOR sur les liens).
async function filterActionsInOwner(
  type: OwnerType,
  ownerId: string,
  actionIds: string[],
): Promise<string[]> {
  if (actionIds.length === 0) return [];
  const owned = await prisma.impact_action.findMany({
    where: { ...ownerScope(type, ownerId), id: { in: actionIds } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((a) => a.id));
  return actionIds.filter((aid) => ownedIds.has(aid));
}

// ─── Impact level ─────────────────────────────────────────────────────────────

const impactLevelSchema = z.object({
  indicateurSuivi: z.string().max(500).default(''),
  description1: z.string().max(500).default(''),
  description2: z.string().max(500).default(''),
  description3: z.string().max(500).default(''),
  finalite1: z.string().max(500).default(''),
  finalite2: z.string().max(500).default(''),
  finalite3: z.string().max(500).default(''),
  seuil1: z.string().max(500).default(''),
  seuil2: z.string().max(500).default(''),
});

export async function saveImpactLevel(
  type: OwnerType,
  ownerId: string,
  formData: FormData,
): Promise<void> {
  const parsed = impactLevelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Formulaire invalide');
  const data = parsed.data;

  const owner = await loadAndAuthorizeOwner(type, ownerId);

  const isUpdate = Boolean(owner.impactLevelId);

  if (owner.impactLevelId) {
    await prisma.impact_level.update({
      where: { id: owner.impactLevelId },
      data: {
        indicateur_suivi: data.indicateurSuivi,
        description1: data.description1,
        description2: data.description2,
        description3: data.description3,
        finalite1: data.finalite1,
        finalite2: data.finalite2,
        finalite3: data.finalite3,
        seuil1: data.seuil1,
        seuil2: data.seuil2,
      },
    });
  } else {
    const newId = randomUUID();
    await prisma.impact_level.create({
      data: {
        id: newId,
        indicateur_suivi: data.indicateurSuivi,
        description1: data.description1,
        description2: data.description2,
        description3: data.description3,
        finalite1: data.finalite1,
        finalite2: data.finalite2,
        finalite3: data.finalite3,
        seuil1: data.seuil1,
        seuil2: data.seuil2,
      },
    });
    if (type === 'impact') {
      await prisma.impact.update({
        where: { id: ownerId },
        data: { impact_level_id: newId, updated_at: new Date() },
      });
    } else {
      await prisma.impact_strategy.update({
        where: { id: ownerId },
        data: { impact_level_id: newId, updated_at: new Date() },
      });
    }
  }

  await setFlash(isUpdate ? `Niveaux d'impact mis à jour.` : `Niveaux d'impact ajoutés.`);
  revalidatePath(`/impacts/${type}/${ownerId}/impact-level`);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const actionSchema = z.object({
  intitule: z.string().min(1).max(255),
  typeApproche: z.string().max(255).optional().nullable(),
  description: z.string().max(255).optional().nullable(),
  typeAction: z.string().max(255).optional().nullable(),
  finalite1: z.coerce.boolean().default(false),
  finalite2: z.coerce.boolean().default(false),
  finalite3: z.coerce.boolean().default(false),
  anticipe1: z.coerce.boolean().default(false),
  anticipe2: z.coerce.boolean().default(false),
});

function parseActionForm(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const incompatibles = formData.getAll('incompatibles') as string[];
  return {
    parsed: actionSchema.safeParse({
      ...raw,
      typeApproche: raw.typeApproche || null,
      description: raw.description || null,
      typeAction: raw.typeAction || null,
      finalite1: raw.finalite1 === 'on',
      finalite2: raw.finalite2 === 'on',
      finalite3: raw.finalite3 === 'on',
      anticipe1: raw.anticipe1 === 'on',
      anticipe2: raw.anticipe2 === 'on',
    }),
    incompatibles: incompatibles.filter(Boolean),
  };
}

/**
 * Maintien la symétrie des incompatibilités : si A déclare B incompatible, on
 * ajoute aussi A dans la liste de B (et vice versa pour les suppressions).
 */
async function syncIncompatibilities(
  type: OwnerType,
  ownerId: string,
  actionId: string,
  newIncompatibles: string[],
) {
  // Bornage au périmètre de l'owner : on ne touche jamais aux actions d'une autre étude.
  const allActions = await prisma.impact_action.findMany({
    where: ownerScope(type, ownerId),
    select: { id: true, incompatibles: true },
  });

  for (const other of allActions) {
    if (other.id === actionId) continue;
    const otherList = parseIncompatibles(other.incompatibles);
    const shouldContain = newIncompatibles.includes(other.id);
    const currentlyContains = otherList.includes(actionId);
    if (shouldContain && !currentlyContains) {
      await prisma.impact_action.update({
        where: { id: other.id },
        data: {
          incompatibles: JSON.stringify([...otherList, actionId]),
          updated_at: new Date(),
        },
      });
    } else if (!shouldContain && currentlyContains) {
      await prisma.impact_action.update({
        where: { id: other.id },
        data: {
          incompatibles: JSON.stringify(otherList.filter((x) => x !== actionId)),
          updated_at: new Date(),
        },
      });
    }
  }
}

export async function createImpactAction(
  type: OwnerType,
  ownerId: string,
  formData: FormData,
): Promise<void> {
  const { parsed, incompatibles } = parseActionForm(formData);
  if (!parsed.success) {
    throw new Error(`Formulaire invalide : ${parsed.error.issues.map((i) => i.message).join(', ')}`);
  }
  await loadAndAuthorizeOwner(type, ownerId);

  const data = parsed.data;
  const now = new Date();
  const actionId = randomUUID();
  await prisma.impact_action.create({
    data: {
      id: actionId,
      intitule: data.intitule,
      type_approche: data.typeApproche ?? null,
      description: data.description ?? null,
      type_action: data.typeAction ?? null,
      finalite1: data.finalite1,
      finalite2: data.finalite2,
      finalite3: data.finalite3,
      anticipe1: data.anticipe1,
      anticipe2: data.anticipe2,
      incompatibles: JSON.stringify(incompatibles),
      impact_id: type === 'impact' ? ownerId : null,
      impact_strategy_id: type === 'strategy' ? ownerId : null,
      created_at: now,
      updated_at: now,
    },
  });
  await syncIncompatibilities(type, ownerId, actionId, incompatibles);

  await setFlash('Action créée');
  revalidatePath(`/impacts/${type}/${ownerId}/define-actions`);
}

export async function updateImpactAction(
  type: OwnerType,
  ownerId: string,
  actionId: string,
  formData: FormData,
): Promise<void> {
  const { parsed, incompatibles } = parseActionForm(formData);
  if (!parsed.success) throw new Error('Formulaire invalide');
  await loadAndAuthorizeOwner(type, ownerId);
  await assertActionInOwner(type, ownerId, actionId);

  const data = parsed.data;
  await prisma.impact_action.update({
    where: { id: actionId },
    data: {
      intitule: data.intitule,
      type_approche: data.typeApproche ?? null,
      description: data.description ?? null,
      type_action: data.typeAction ?? null,
      finalite1: data.finalite1,
      finalite2: data.finalite2,
      finalite3: data.finalite3,
      anticipe1: data.anticipe1,
      anticipe2: data.anticipe2,
      incompatibles: JSON.stringify(incompatibles),
      updated_at: new Date(),
    },
  });
  await syncIncompatibilities(type, ownerId, actionId, incompatibles);

  await setFlash('Action modifiée');
  revalidatePath(`/impacts/${type}/${ownerId}/define-actions`);
}

export async function deleteImpactAction(
  type: OwnerType,
  ownerId: string,
  actionId: string,
): Promise<void> {
  await loadAndAuthorizeOwner(type, ownerId);
  await assertActionInOwner(type, ownerId, actionId);
  await syncIncompatibilities(type, ownerId, actionId, []);
  await prisma.$transaction(async (tx) => {
    await deleteImpactActionsCascade(tx, [actionId]);
  });
  await setFlash('Action supprimée');
  revalidatePath(`/impacts/${type}/${ownerId}/define-actions`);
}

// ─── Review criteria ──────────────────────────────────────────────────────────

const criteriaItemSchema = z.object({
  rank: z.number().int().min(1).max(8),
  name: z.string().max(255).default(''),
  weighting: z.coerce.number().int().min(0).max(3).default(0),
});

export async function saveReviewCriteria(
  type: OwnerType,
  ownerId: string,
  formData: FormData,
): Promise<void> {
  await loadAndAuthorizeOwner(type, ownerId);

  const names = formData.getAll('criteriaName') as string[];
  const weightings = formData.getAll('criteriaWeighting') as string[];
  const items: { rank: number; name: string; weighting: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const parsed = criteriaItemSchema.safeParse({
      rank: i + 1,
      name: names[i] ?? '',
      weighting: weightings[i] ?? '0',
    });
    if (!parsed.success) continue;
    items.push(parsed.data);
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.impact_review_criteria.deleteMany({
      where: type === 'impact' ? { impact_id: ownerId } : { impact_strategy_id: ownerId },
    });
    if (items.length > 0) {
      await tx.impact_review_criteria.createMany({
        data: items.map((it) => ({
          id: randomUUID(),
          impact_id: type === 'impact' ? ownerId : null,
          impact_strategy_id: type === 'strategy' ? ownerId : null,
          name: it.name,
          // Si le nom est vide, on force weighting à 0 (critère désactivé)
          weighting: it.name.trim() === '' ? 0 : it.weighting,
          rank: it.rank,
          created_at: now,
          updated_at: now,
        })),
      });
    }
  });

  revalidatePath(`/impacts/${type}/${ownerId}/review-actions`);
  redirect(`/impacts/${type}/${ownerId}/review-actions`);
}

// ─── Action reviews (grille) ──────────────────────────────────────────────────

/**
 * Sauvegarde de la grille review-actions : pour chaque action × critère,
 * upsert d'un `impact_action_review (rank, value)`.
 */
export async function saveActionReviews(
  type: OwnerType,
  ownerId: string,
  formData: FormData,
): Promise<void> {
  await loadAndAuthorizeOwner(type, ownerId);

  // Format attendu : champs `review[<actionId>][<rank>]` = value (number)
  const updates: { actionId: string; rank: number; value: number }[] = [];
  for (const [key, raw] of formData.entries()) {
    const match = /^review\[([a-f0-9-]+)\]\[(\d+)\]$/.exec(key);
    if (!match) continue;
    const actionId = match[1]!;
    const rank = Number(match[2]);
    const value = Number(raw);
    if (!Number.isFinite(rank) || !Number.isFinite(value)) continue;
    updates.push({ actionId, rank, value });
  }

  // Filtrage anti-IDOR : ne conserver que les actions appartenant à l'owner autorisé.
  const ownedActions = await prisma.impact_action.findMany({
    where: { ...ownerScope(type, ownerId), id: { in: updates.map((u) => u.actionId) } },
    select: { id: true },
  });
  const ownedIds = new Set(ownedActions.map((a) => a.id));
  const safeUpdates = updates.filter((u) => ownedIds.has(u.actionId));

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const u of safeUpdates) {
      const existing = await tx.impact_action_review.findFirst({
        where: { impact_action_id: u.actionId, rank: u.rank },
      });
      if (existing) {
        await tx.impact_action_review.update({
          where: { id: existing.id },
          data: { value: u.value, updated_at: now },
        });
      } else {
        await tx.impact_action_review.create({
          data: {
            id: randomUUID(),
            impact_action_id: u.actionId,
            rank: u.rank,
            value: u.value,
            created_at: now,
            updated_at: now,
          },
        });
      }
    }
  });

  revalidatePath(`/impacts/${type}/${ownerId}/review-actions`);
}

// ─── Trajectories ─────────────────────────────────────────────────────────────

const trajectorySchema = z.object({
  name: z.string().min(1).max(255),
});

export async function createTrajectory(
  type: OwnerType,
  ownerId: string,
  formData: FormData,
): Promise<void> {
  const parsed = trajectorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Formulaire invalide');
  const actionIds = formData.getAll('actionIds').filter(Boolean) as string[];

  await loadAndAuthorizeOwner(type, ownerId);
  const safeActionIds = await filterActionsInOwner(type, ownerId, actionIds);

  const now = new Date();
  const trajId = randomUUID();
  await prisma.impact_trajectory.create({
    data: {
      id: trajId,
      name: parsed.data.name,
      impact_id: type === 'impact' ? ownerId : null,
      impact_strategy_id: type === 'strategy' ? ownerId : null,
      created_at: now,
      impact_trajectory_impact_action: {
        create: safeActionIds.map((aid) => ({
          id: randomUUID(),
          action_id: aid,
          created_at: now,
        })),
      },
    },
  });

  await setFlash('Trajectoire créée');
  revalidatePath(`/impacts/${type}/${ownerId}/build-trajectories`);
  redirect(`/impacts/${type}/${ownerId}/build-trajectories`);
}

export async function updateTrajectory(
  type: OwnerType,
  ownerId: string,
  trajectoryId: string,
  formData: FormData,
): Promise<void> {
  const parsed = trajectorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Formulaire invalide');
  const actionIds = formData.getAll('actionIds').filter(Boolean) as string[];

  await loadAndAuthorizeOwner(type, ownerId);
  await assertTrajectoryInOwner(type, ownerId, trajectoryId);
  const safeActionIds = await filterActionsInOwner(type, ownerId, actionIds);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.impact_trajectory.update({
      where: { id: trajectoryId },
      data: { name: parsed.data.name },
    });
    await tx.impact_trajectory_impact_action.deleteMany({
      where: { trajectory_id: trajectoryId },
    });
    if (safeActionIds.length > 0) {
      await tx.impact_trajectory_impact_action.createMany({
        data: safeActionIds.map((aid) => ({
          id: randomUUID(),
          trajectory_id: trajectoryId,
          action_id: aid,
          created_at: now,
        })),
      });
    }
  });

  await setFlash('Trajectoire modifiée');
  revalidatePath(`/impacts/${type}/${ownerId}/build-trajectories`);
  redirect(`/impacts/${type}/${ownerId}/build-trajectories`);
}

export async function deleteTrajectory(
  type: OwnerType,
  ownerId: string,
  trajectoryId: string,
): Promise<void> {
  await loadAndAuthorizeOwner(type, ownerId);
  await assertTrajectoryInOwner(type, ownerId, trajectoryId);
  await prisma.impact_trajectory.delete({ where: { id: trajectoryId } });
  await setFlash('Trajectoire supprimée');
  revalidatePath(`/impacts/${type}/${ownerId}/build-trajectories`);
}
