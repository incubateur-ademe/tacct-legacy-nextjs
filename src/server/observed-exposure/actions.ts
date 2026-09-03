'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { setFlash } from '@/server/flash';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { refreshStatusesAfterObservedExposureChange } from '@/server/study/step-status';

const exposureFormSchema = z.object({
  studyId: z.uuid(),
  climateHazardId: z.uuid().optional().nullable(),
  climateHazardCustom: z.string().trim().min(1).max(255).optional().nullable(),
  climateFeatures: z.string().default(''),
  trends: z.string().default(''),
  sources: z.string().optional().nullable(),
  exposure: z.coerce.number().int().min(0).max(3).optional().nullable(),
  justification: z.string().optional().nullable(),
});

async function assertCanEditStudy(studyId: string) {
  const user = await requireCurrentUser();
  if (isAdmin(user)) return user;
  const isMember = user.user_study.some((us) => us.study_id === studyId);
  if (!isMember) throw new Error('FORBIDDEN');
  return user;
}

export async function addObservedExposure(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = exposureFormSchema.safeParse({
    ...raw,
    climateHazardId: raw.climateHazardId || null,
    climateHazardCustom: raw.climateHazardCustom || null,
    sources: raw.sources || null,
    exposure: raw.exposure === '' ? null : raw.exposure,
    justification: raw.justification || null,
  });
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
    );
  }

  const data = parsed.data;
  if (!data.climateHazardId && !data.climateHazardCustom) {
    throw new Error('Sélectionne un aléa ou saisis un aléa personnalisé.');
  }

  await assertCanEditStudy(data.studyId);

  const now = new Date();
  await prisma.observed_exposure.create({
    data: {
      id: randomUUID(),
      study_id: data.studyId,
      climate_hazard_id: data.climateHazardId ?? null,
      climate_hazard_custom: data.climateHazardCustom ?? null,
      climate_features: data.climateFeatures,
      trends: data.trends,
      sources: data.sources ?? null,
      exposure: data.exposure ?? null,
      justification: data.justification ?? null,
      created_at: now,
      updated_at: now,
    },
  });

  // Un aléa de plus rend forcément l'étape « exposition future » incomplète
  // (port du `persist()` legacy, branche création).
  await refreshStatusesAfterObservedExposureChange(data.studyId, { resetFutureExposure: true });

  await setFlash('Aléa créé');
  revalidatePath('/observed-climate/observed-exposure');
  redirect('/observed-climate/observed-exposure');
}

export async function updateObservedExposure(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = exposureFormSchema.safeParse({
    ...raw,
    climateHazardId: raw.climateHazardId || null,
    climateHazardCustom: raw.climateHazardCustom || null,
    sources: raw.sources || null,
    exposure: raw.exposure === '' ? null : raw.exposure,
    justification: raw.justification || null,
  });
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
    );
  }

  const data = parsed.data;

  // L'étude de rattachement est lue sur la ligne, pas prise dans le formulaire :
  // c'est elle qui porte le contrôle d'accès et les statuts d'étape recalculés
  // plus bas — un `studyId` obsolète ou forgé écrirait sinon sur une autre étude.
  const before = await prisma.observed_exposure.findUnique({
    where: { id },
    select: { study_id: true, exposure: true, future_exposure: { select: { id: true } } },
  });
  if (!before?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(before.study_id);

  // Changer le niveau d'exposition observée invalide l'exposition future qui en
  // découlait : le legacy remet `trends` et `exposure` à null sur la
  // `future_exposure` liée (`persist()`, branche `put`).
  const previousExposure = before.exposure === null ? null : Number(before.exposure);
  const exposureChanged = previousExposure !== (data.exposure ?? null);
  const resetFutureExposure = exposureChanged && before.future_exposure !== null;

  await prisma.$transaction(async (tx) => {
    await tx.observed_exposure.update({
      where: { id },
      data: {
        climate_hazard_id: data.climateHazardId ?? null,
        climate_hazard_custom: data.climateHazardCustom ?? null,
        climate_features: data.climateFeatures,
        trends: data.trends,
        sources: data.sources ?? null,
        exposure: data.exposure ?? null,
        justification: data.justification ?? null,
        updated_at: new Date(),
      },
    });

    if (resetFutureExposure && before.future_exposure) {
      await tx.future_exposure.update({
        where: { id: before.future_exposure.id },
        data: { trends: null, exposure: null, updated_at: new Date() },
      });
    }
  });

  await refreshStatusesAfterObservedExposureChange(before.study_id, { resetFutureExposure });

  await setFlash('Aléa modifié');
  revalidatePath('/observed-climate/observed-exposure');
  redirect('/observed-climate/observed-exposure');
}

/**
 * Supprime un aléa (exposition observée).
 *
 * Les clés étrangères qui pointent vers `observed_exposure` sont en RESTRICT
 * côté base : la suppression échoue tant que les lignes liées existent. On
 * réplique donc le comportement du legacy :
 *  - `impact.primary_exposure_id` → suppression refusée (`ExposureAlreadyUsed`),
 *    avec un message d'erreur plutôt qu'une erreur serveur ;
 *  - `future_exposure` → supprimée en cascade (`cascade: ['remove']` Doctrine).
 *
 * (`observed_exposure_impact`, les aléas secondaires, est déjà en CASCADE.)
 */
export async function deleteObservedExposure(id: string) {
  const exposure = await prisma.observed_exposure.findUnique({
    where: { id },
    select: { study_id: true },
  });
  if (!exposure?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(exposure.study_id);

  const usedByImpact = await prisma.impact.findFirst({
    where: { primary_exposure_id: id },
    select: { id: true },
  });
  if (usedByImpact) {
    await setFlash(
      'Suppression impossible',
      'error',
      "L'aléa est renseigné dans un impact d'une thématique",
    );
    revalidatePath('/observed-climate/observed-exposure');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.future_exposure.deleteMany({ where: { observed_exposure_id: id } });
    await tx.observed_exposure.delete({ where: { id } });
  });

  await refreshStatusesAfterObservedExposureChange(exposure.study_id);

  await setFlash('Aléa supprimé');
  revalidatePath('/observed-climate/observed-exposure');
}

/**
 * Met à jour le statut de validation de l'étape "exposition observée"
 * (`study.observed_exposure_valid`).
 *
 * Validé seulement si toutes les expositions ont un `exposure` rempli.
 */
export async function validateObservedExposureStep(studyId: string) {
  await assertCanEditStudy(studyId);

  const exposures = await prisma.observed_exposure.findMany({
    where: { study_id: studyId },
    select: { exposure: true },
  });
  const allComplete = exposures.length > 0 && exposures.every((e) => e.exposure !== null);

  await prisma.study.update({
    where: { id: studyId },
    data: {
      observed_exposure_valid: allComplete ? 'validated' : 'incomplete',
      updated_at: new Date(),
    },
  });

  if (allComplete) {
    await setFlash('Validation effectuée');
  } else {
    await setFlash(
      'Validation non effectuée',
      'error',
      'Informations manquantes sur un ou plusieurs aléas',
    );
  }

  revalidatePath('/observed-climate/observed-exposure');
  revalidatePath('/');
}
