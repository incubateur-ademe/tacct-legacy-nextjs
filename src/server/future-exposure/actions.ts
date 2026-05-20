'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';

const futureExposureSchema = z.object({
  observedExposureId: z.uuid(),
  trends: z.string().max(255).optional().nullable(),
  exposure: z.coerce.number().int().min(0).max(3).optional().nullable(),
  justification: z.string().max(1000).optional().nullable(),
});

async function assertCanEditStudy(studyId: string) {
  const user = await requireCurrentUser();
  if (isAdmin(user)) return user;
  const isMember = user.user_study.some((us) => us.study_id === studyId);
  if (!isMember) throw new Error('FORBIDDEN');
  return user;
}

/**
 * Upsert d'une exposition future (1:1 avec une exposition observée).
 */
export async function saveFutureExposure(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = futureExposureSchema.safeParse({
    ...raw,
    trends: raw.trends || null,
    exposure: raw.exposure === '' ? null : raw.exposure,
    justification: raw.justification || null,
  });
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
    );
  }
  const data = parsed.data;

  const obs = await prisma.observed_exposure.findUnique({
    where: { id: data.observedExposureId },
    select: { study_id: true, future_exposure: { select: { id: true } } },
  });
  if (!obs?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(obs.study_id);

  const now = new Date();
  if (obs.future_exposure?.id) {
    await prisma.future_exposure.update({
      where: { id: obs.future_exposure.id },
      data: {
        trends: data.trends ?? null,
        exposure: data.exposure ?? null,
        justification: data.justification ?? null,
        updated_at: now,
      },
    });
  } else {
    await prisma.future_exposure.create({
      data: {
        id: randomUUID(),
        observed_exposure_id: data.observedExposureId,
        trends: data.trends ?? null,
        exposure: data.exposure ?? null,
        justification: data.justification ?? null,
        created_at: now,
        updated_at: now,
      },
    });
  }

  revalidatePath('/workspace/future-climate/capture-future-climate');
}

/**
 * Met à jour le statut de validation de l'étape "exposition future"
 * (`study.exposition_future_valid`).
 *
 * Validé seulement si toutes les expositions observées ont une exposition
 * future avec `trends` ET `exposure` renseignés.
 */
export async function validateFutureExposureStep(studyId: string) {
  await assertCanEditStudy(studyId);

  const exposures = await prisma.observed_exposure.findMany({
    where: { study_id: studyId },
    include: { future_exposure: true },
  });

  const allComplete =
    exposures.length > 0 &&
    exposures.every(
      (e) => e.future_exposure && e.future_exposure.trends && e.future_exposure.exposure !== null,
    );

  await prisma.study.update({
    where: { id: studyId },
    data: {
      exposition_future_valid: allComplete ? 'validated' : 'incomplete',
      updated_at: new Date(),
    },
  });

  revalidatePath('/workspace/future-climate/capture-future-climate');
  revalidatePath('/workspace');
}
