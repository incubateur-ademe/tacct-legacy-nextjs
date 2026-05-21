'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';

/**
 * Valeurs autorisées de `trends` (fidélité legacy : `entity/trendexposure.ts`).
 * Les anciennes valeurs en base utilisent ces clés en anglais.
 */
const TREND_VALUES = ['increase', 'identical', 'decrease', 'predictible'] as const;

const futureExposureSchema = z.object({
  observedExposureId: z.uuid(),
  trends: z.enum(TREND_VALUES).optional().nullable(),
  // L'exposition future va de 0 à 4 (5 niveaux : Nulle → Très élevée),
  // contre 0 à 3 pour l'exposition observée.
  exposure: z.coerce.number().int().min(0).max(4).optional().nullable(),
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
 * Patch d'un champ unique de l'exposition future. Sert l'auto-save côté client
 * (à chaque onChange d'un select / blur d'un textarea) au lieu d'un formulaire
 * complet.
 *
 * - Crée l'enregistrement `future_exposure` s'il n'existe pas encore.
 * - Règle métier portée du legacy : quand `trends` passe à `identical`,
 *   `exposure` est aligné sur celle de l'exposition observée.
 */
export async function patchFutureExposureField(
  observedExposureId: string,
  field: 'trends' | 'exposure' | 'justification',
  value: string | null,
): Promise<void> {
  const obs = await prisma.observed_exposure.findUnique({
    where: { id: observedExposureId },
    select: {
      study_id: true,
      exposure: true,
      future_exposure: { select: { id: true } },
    },
  });
  if (!obs?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(obs.study_id);

  const now = new Date();
  const data: {
    trends?: string | null;
    exposure?: number | null;
    justification?: string | null;
    updated_at: Date;
  } = { updated_at: now };

  if (field === 'trends') {
    const trend = value && (TREND_VALUES as readonly string[]).includes(value) ? value : null;
    data.trends = trend;
    // Si la tendance passe à « identique » et que l'observée est définie,
    // on aligne automatiquement l'exposition future sur l'observée.
    if (trend === 'identical' && obs.exposure !== null) {
      data.exposure = Number(obs.exposure);
    }
  } else if (field === 'exposure') {
    const parsed = value === '' || value === null ? null : Number(value);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0 || parsed > 4)) {
      throw new Error('exposure invalide (0-4)');
    }
    data.exposure = parsed;
  } else if (field === 'justification') {
    data.justification = value ?? null;
  }

  if (obs.future_exposure?.id) {
    await prisma.future_exposure.update({
      where: { id: obs.future_exposure.id },
      data,
    });
  } else {
    await prisma.future_exposure.create({
      data: {
        id: randomUUID(),
        observed_exposure_id: observedExposureId,
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
