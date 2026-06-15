'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';

async function assertCanEditStudy(studyId: string) {
  const user = await requireCurrentUser();
  if (isAdmin(user)) return user;
  const isMember = user.user_study.some((us) => us.study_id === studyId);
  if (!isMember) throw new Error('FORBIDDEN');
  return user;
}

// ─── Impact themes ────────────────────────────────────────────────────────────

const impactThemeSchema = z.object({
  studyId: z.uuid(),
  thematicId: z.uuid().optional().nullable(),
  customName: z.string().trim().max(255).optional().nullable(),
  justification: z.string().min(1, 'Justification requise'),
});

export async function addImpactTheme(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = impactThemeSchema.safeParse({
    ...raw,
    thematicId: raw.thematicId || null,
    customName: raw.customName || null,
  });
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
    );
  }
  const data = parsed.data;

  if (!data.thematicId && !data.customName) {
    throw new Error('Choisis une thématique du catalogue ou saisis un nom personnalisé.');
  }

  await assertCanEditStudy(data.studyId);

  // Si une thématique du catalogue est choisie sans nom custom, on reprend son name.
  let name = data.customName ?? '';
  if (!name && data.thematicId) {
    const thematic = await prisma.thematic.findUnique({ where: { id: data.thematicId } });
    name = thematic?.name ?? '';
  }

  const now = new Date();
  await prisma.impact_theme.create({
    data: {
      id: randomUUID(),
      study_id: data.studyId,
      thematic_id: data.thematicId ?? null,
      name,
      justification: data.justification,
      created_at: now,
      updated_at: now,
    },
  });

  revalidatePath('/sensibility');
  redirect('/sensibility');
}

export async function deleteImpactTheme(id: string) {
  const theme = await prisma.impact_theme.findUnique({
    where: { id },
    select: { study_id: true },
  });
  if (!theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(theme.study_id);

  await prisma.impact_theme.delete({ where: { id } });
  revalidatePath('/sensibility');
}

/**
 * Patch de la justification d'une thématique (édition inline depuis
 * l'accordéon de la page sensibility). Port du `UpdateImpactTheme` legacy.
 */
export async function updateImpactThemeJustification(
  id: string,
  justification: string,
): Promise<void> {
  const theme = await prisma.impact_theme.findUnique({
    where: { id },
    select: { study_id: true },
  });
  if (!theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(theme.study_id);

  await prisma.impact_theme.update({
    where: { id },
    data: { justification, updated_at: new Date() },
  });
  revalidatePath('/sensibility');
}

// ─── Impacts ──────────────────────────────────────────────────────────────────

const impactSchema = z.object({
  impactThemeId: z.uuid(),
  description: z.string().max(255).optional().nullable(),
  sensitivity: z.coerce.number().int().min(1).max(4).optional().nullable(),
  justification: z.string().optional().nullable(),
  primaryExposureId: z.uuid().optional().nullable(),
  secondaryExposureIds: z.array(z.uuid()).optional().default([]),
  observedImpact: z.string().default(''),
  actionPlan: z.string().optional().nullable(),
});

function parseImpactForm(formData: FormData) {
  const raw = Object.fromEntries(formData);
  // Récupération des secondaryExposureIds (peut y avoir plusieurs `secondaryExposureIds`).
  const secondaryIds = formData.getAll('secondaryExposureIds').filter(Boolean) as string[];

  return impactSchema.safeParse({
    ...raw,
    description: raw.description || null,
    sensitivity: raw.sensitivity === '' ? null : raw.sensitivity,
    justification: raw.justification || null,
    primaryExposureId: raw.primaryExposureId || null,
    secondaryExposureIds: secondaryIds,
    actionPlan: raw.actionPlan || null,
  });
}

/**
 * Calcule revoked_diagnostic = sensitivity × future_exposure < 8.
 * Si une des deux valeurs manque, retourne false.
 */
async function computeRevokedDiagnostic(
  sensitivity: number | null | undefined,
  primaryExposureId: string | null | undefined,
): Promise<boolean> {
  if (!sensitivity || !primaryExposureId) return false;
  const exposure = await prisma.observed_exposure.findUnique({
    where: { id: primaryExposureId },
    include: { future_exposure: true },
  });
  const futureExposure = exposure?.future_exposure?.exposure;
  if (futureExposure === null || futureExposure === undefined) return false;
  return sensitivity * Number(futureExposure) < 8;
}

export async function addImpact(formData: FormData): Promise<void> {
  const parsed = parseImpactForm(formData);
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
    );
  }
  const data = parsed.data;

  const theme = await prisma.impact_theme.findUnique({
    where: { id: data.impactThemeId },
    select: { study_id: true },
  });
  if (!theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(theme.study_id);

  const revoked = await computeRevokedDiagnostic(data.sensitivity, data.primaryExposureId);
  const now = new Date();
  const impactId = randomUUID();

  await prisma.impact.create({
    data: {
      id: impactId,
      impact_theme_id: data.impactThemeId,
      primary_exposure_id: data.primaryExposureId ?? null,
      description: data.description ?? null,
      sensitivity: data.sensitivity ?? null,
      justification: data.justification ?? null,
      observed_impact: data.observedImpact,
      action_plan: data.actionPlan ?? null,
      revoked_diagnostic: revoked,
      strategy_studied: false,
      created_at: now,
      updated_at: now,
      observed_exposure_impact: {
        create: data.secondaryExposureIds
          .filter((id) => id !== data.primaryExposureId)
          .map((id) => ({ observed_exposure: { connect: { id } } })),
      },
    },
  });

  revalidatePath('/sensibility');
  redirect('/sensibility');
}

export async function updateImpact(impactId: string, formData: FormData): Promise<void> {
  const parsed = parseImpactForm(formData);
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
    );
  }
  const data = parsed.data;

  const impact = await prisma.impact.findUnique({
    where: { id: impactId },
    include: { impact_theme: { select: { study_id: true } } },
  });
  if (!impact?.impact_theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(impact.impact_theme.study_id);

  const revoked = await computeRevokedDiagnostic(data.sensitivity, data.primaryExposureId);

  await prisma.$transaction(async (tx) => {
    // Reset des aléas secondaires : delete puis create
    await tx.observed_exposure_impact.deleteMany({ where: { impact_id: impactId } });
    await tx.impact.update({
      where: { id: impactId },
      data: {
        primary_exposure_id: data.primaryExposureId ?? null,
        description: data.description ?? null,
        sensitivity: data.sensitivity ?? null,
        justification: data.justification ?? null,
        observed_impact: data.observedImpact,
        action_plan: data.actionPlan ?? null,
        revoked_diagnostic: revoked,
        updated_at: new Date(),
        observed_exposure_impact: {
          create: data.secondaryExposureIds
            .filter((id) => id !== data.primaryExposureId)
            .map((id) => ({ observed_exposure: { connect: { id } } })),
        },
      },
    });
  });

  revalidatePath('/sensibility');
  redirect('/sensibility');
}

export async function deleteImpact(impactId: string) {
  const impact = await prisma.impact.findUnique({
    where: { id: impactId },
    include: { impact_theme: { select: { study_id: true } } },
  });
  if (!impact?.impact_theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(impact.impact_theme.study_id);

  await prisma.impact.delete({ where: { id: impactId } });
  revalidatePath('/sensibility');
}

/**
 * Validation de l'étape sensibilité (`study.sensibility_valid`).
 * Validé si tous les impacts ont une sensitivity renseignée.
 */
export async function validateSensibilityStep(studyId: string) {
  await assertCanEditStudy(studyId);

  const impacts = await prisma.impact.findMany({
    where: { impact_theme: { study_id: studyId } },
    select: { sensitivity: true },
  });

  const allComplete = impacts.length > 0 && impacts.every((i) => i.sensitivity !== null);

  await prisma.study.update({
    where: { id: studyId },
    data: {
      sensibility_valid: allComplete ? 'validated' : 'incomplete',
      updated_at: new Date(),
    },
  });

  revalidatePath('/sensibility');
  revalidatePath('/');
}
