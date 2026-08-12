import { readOnlyPrisma } from './db';

export type Fixtures = {
  userId: string;
  studyId: string;
  impactId: string | null;
  strategyId: string | null;
  impactThemeId: string | null;
  trajectory: { id: string; impactId: string } | null;
  observedExposureId: string | null;
  hazardCategoryId: string | null;
  projectSheet: { id: string; slug: string } | null;
};

async function resolveAdminWithStudy(): Promise<{ userId: string; studyId: string }> {
  const forcedUserId = process.env.TEST_USER_ID;

  if (forcedUserId) {
    const link = await readOnlyPrisma.user_study.findFirst({
      where: { user_id: forcedUserId },
      select: { study_id: true },
    });
    if (!link?.study_id) {
      throw new Error(
        `TEST_USER_ID=${forcedUserId} n'est rattaché à aucune étude : la plupart des pages redirigeraient.`,
      );
    }
    return { userId: forcedUserId, studyId: link.study_id };
  }

  const adminLink = await readOnlyPrisma.user_study.findFirst({
    where: { user: { roles: { contains: 'ROLE_ADMIN' } } },
    select: { user_id: true, study_id: true },
  });

  if (!adminLink?.user_id || !adminLink.study_id) {
    throw new Error(
      [
        "Aucun utilisateur ROLE_ADMIN rattaché à une étude n'a été trouvé en base.",
        'Les pages /gestion et les pages liées à une étude ne peuvent pas être testées.',
        'Contourne en fixant TEST_USER_ID=<id utilisateur> avant de lancer les tests.',
      ].join('\n'),
    );
  }

  return { userId: adminLink.user_id, studyId: adminLink.study_id };
}

let cached: Fixtures | null = null;

export async function loadFixtures(): Promise<Fixtures> {
  if (cached) return cached;

  const { userId, studyId } = await resolveAdminWithStudy();
  const scopedToStudy = { impact_theme: { study_id: studyId } };

  const [impact, strategy, impactTheme, trajectory, observedExposure, hazardCategory, projectSheet] =
    await Promise.all([
      readOnlyPrisma.impact.findFirst({ where: scopedToStudy, select: { id: true } }),
      readOnlyPrisma.impact_strategy.findFirst({ where: scopedToStudy, select: { id: true } }),
      readOnlyPrisma.impact_theme.findFirst({
        where: { study_id: studyId },
        select: { id: true },
      }),
      readOnlyPrisma.impact_trajectory.findFirst({
        where: { impact: scopedToStudy },
        select: { id: true, impact_id: true },
      }),
      readOnlyPrisma.observed_exposure.findFirst({
        where: { study_id: studyId },
        select: { id: true },
      }),
      readOnlyPrisma.climate_hazard_category.findFirst({ select: { id: true } }),
      readOnlyPrisma.project_sheet_detail.findFirst({ select: { id: true, slug: true } }),
    ]);

  cached = {
    userId,
    studyId,
    impactId: impact?.id ?? null,
    strategyId: strategy?.id ?? null,
    impactThemeId: impactTheme?.id ?? null,
    trajectory:
      trajectory?.impact_id != null ? { id: trajectory.id, impactId: trajectory.impact_id } : null,
    observedExposureId: observedExposure?.id ?? null,
    hazardCategoryId: hazardCategory?.id ?? null,
    projectSheet: projectSheet ?? null,
  };

  return cached;
}
