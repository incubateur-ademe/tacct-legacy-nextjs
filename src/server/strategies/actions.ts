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

/**
 * Toggle le flag `impact.strategy_studied`. Quand on "choisit" un impact
 * diagnostiqué pour l'étudier, on passe à true. Quand on le retire, false.
 */
export async function setImpactStudied(impactId: string, studied: boolean): Promise<void> {
  const impact = await prisma.impact.findUnique({
    where: { id: impactId },
    include: { impact_theme: { select: { study_id: true } } },
  });
  if (!impact?.impact_theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(impact.impact_theme.study_id);

  await prisma.impact.update({
    where: { id: impactId },
    data: { strategy_studied: studied, updated_at: new Date() },
  });

  revalidatePath('/impacts');
  revalidatePath('/impacts/choose-impacts');
}

/**
 * Valide la construction des stratégies de l'étude (passe
 * `strategy_construction_valid` à `validated` si ce n'est pas déjà le cas).
 * Déclenché à l'export du plan d'action — port du
 * `valitadeStrategyConstructionAction` legacy.
 */
export async function validateStrategyConstruction(studyId: string): Promise<void> {
  await assertCanEditStudy(studyId);

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { strategy_construction_valid: true },
  });
  if (!study) throw new Error('NOT_FOUND');

  if (study.strategy_construction_valid !== 'validated') {
    await prisma.study.update({
      where: { id: studyId },
      data: { strategy_construction_valid: 'validated', updated_at: new Date() },
    });
    revalidatePath('/');
    revalidatePath('/impacts');
  }
}

// ─── Impact strategy (créé ex nihilo) ─────────────────────────────────────────

const impactStrategySchema = z.object({
  studyId: z.uuid(),
  description: z.string().min(1, 'Description requise'),
  thematicId: z.uuid().optional().nullable(),
  impactThemeId: z.uuid().optional().nullable(),
  customThematicName: z.string().trim().max(255).optional().nullable(),
  themeJustification: z.string().max(2000).optional().nullable(),
});

/**
 * Crée un nouvel impact stratégie ex nihilo.
 * Si thematicId fourni et qu'un impact_theme existe déjà pour cette thématique
 * dans l'étude, on le réutilise. Sinon on crée l'impact_theme.
 */
export async function createImpactStrategy(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = impactStrategySchema.safeParse({
    ...raw,
    thematicId: raw.thematicId || null,
    impactThemeId: raw.impactThemeId || null,
    customThematicName: raw.customThematicName || null,
    themeJustification: raw.themeJustification || null,
  });
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
    );
  }
  const data = parsed.data;
  await assertCanEditStudy(data.studyId);

  const now = new Date();

  // 1. Résoudre / créer l'impact_theme
  let impactThemeId = data.impactThemeId;
  if (!impactThemeId) {
    if (data.thematicId) {
      // Réutiliser un impact_theme existant pour cette thématique dans l'étude
      const existing = await prisma.impact_theme.findFirst({
        where: { study_id: data.studyId, thematic_id: data.thematicId },
      });
      if (existing) {
        impactThemeId = existing.id;
      } else {
        const thematic = await prisma.thematic.findUnique({
          where: { id: data.thematicId },
        });
        impactThemeId = randomUUID();
        await prisma.impact_theme.create({
          data: {
            id: impactThemeId,
            study_id: data.studyId,
            thematic_id: data.thematicId,
            name: thematic?.name ?? '',
            justification: data.themeJustification ?? '',
            created_at: now,
            updated_at: now,
          },
        });
      }
    } else if (data.customThematicName) {
      impactThemeId = randomUUID();
      await prisma.impact_theme.create({
        data: {
          id: impactThemeId,
          study_id: data.studyId,
          thematic_id: null,
          name: data.customThematicName,
          justification: data.themeJustification ?? '',
          created_at: now,
          updated_at: now,
        },
      });
    } else {
      throw new Error('Choisis une thématique du catalogue ou saisis un nom personnalisé.');
    }
  }

  // 2. Créer l'impact_strategy
  await prisma.impact_strategy.create({
    data: {
      id: randomUUID(),
      impact_theme_id: impactThemeId,
      description: data.description,
      created_at: now,
      updated_at: now,
    },
  });

  revalidatePath('/impacts');
  redirect('/impacts');
}

const updateImpactStrategySchema = z.object({
  description: z.string().min(1),
});

export async function updateImpactStrategy(
  id: string,
  formData: FormData,
): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = updateImpactStrategySchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Formulaire invalide : ${parsed.error.issues.map((i) => i.message).join(', ')}`);
  }

  const strategy = await prisma.impact_strategy.findUnique({
    where: { id },
    include: { impact_theme: { select: { study_id: true } } },
  });
  if (!strategy?.impact_theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(strategy.impact_theme.study_id);

  await prisma.impact_strategy.update({
    where: { id },
    data: { description: parsed.data.description, updated_at: new Date() },
  });

  revalidatePath('/impacts');
  redirect('/impacts');
}

export async function deleteImpactStrategy(id: string): Promise<void> {
  const strategy = await prisma.impact_strategy.findUnique({
    where: { id },
    include: { impact_theme: { select: { study_id: true } } },
  });
  if (!strategy?.impact_theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(strategy.impact_theme.study_id);

  await prisma.impact_strategy.delete({ where: { id } });
  revalidatePath('/impacts');
}
