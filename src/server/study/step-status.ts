import 'server-only';
import { prisma } from '@/server/db';
import {
  statusesAfterFutureExposureChange,
  statusesAfterObservedExposureChange,
} from '@/lib/step-status';

/**
 * Écriture des statuts d'étape de l'étude (`study.*_valid`) après une écriture
 * sur un aléa ou sur une exposition future — port du
 * `ObservedExposureDataPersister` legacy. La décision elle-même est dans
 * `@/lib/step-status` (logique pure, testée).
 */

/** À appeler après toute création / modification / suppression d'aléa. */
export async function refreshStatusesAfterObservedExposureChange(
  studyId: string,
  { resetFutureExposure = false }: { resetFutureExposure?: boolean } = {},
): Promise<void> {
  const [rows, study] = await Promise.all([
    prisma.observed_exposure.findMany({
      where: { study_id: studyId },
      select: { exposure: true },
    }),
    prisma.study.findUnique({
      where: { id: studyId },
      select: { sensibility_valid: true, exposition_future_valid: true },
    }),
  ]);
  if (!study) return;

  const statuses = statusesAfterObservedExposureChange({
    exposures: rows.map((r) => ({ exposure: r.exposure === null ? null : Number(r.exposure) })),
    current: study,
    resetFutureExposure,
  });

  await prisma.study.update({
    where: { id: studyId },
    data: { ...statuses, updated_at: new Date() },
  });
}

/** À appeler après toute écriture sur une exposition future. */
export async function refreshStatusesAfterFutureExposureChange(studyId: string): Promise<void> {
  const [rows, study] = await Promise.all([
    prisma.observed_exposure.findMany({
      where: { study_id: studyId },
      select: { future_exposure: { select: { trends: true, exposure: true } } },
    }),
    prisma.study.findUnique({
      where: { id: studyId },
      select: { sensibility_valid: true },
    }),
  ]);
  if (!study) return;

  const statuses = statusesAfterFutureExposureChange({
    exposures: rows.map((r) => ({
      futureExposure: r.future_exposure
        ? {
            trends: r.future_exposure.trends,
            exposure:
              r.future_exposure.exposure === null ? null : Number(r.future_exposure.exposure),
          }
        : null,
    })),
    current: study,
  });

  await prisma.study.update({
    where: { id: studyId },
    data: { ...statuses, updated_at: new Date() },
  });
}
