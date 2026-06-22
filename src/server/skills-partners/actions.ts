'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { setFlash } from '@/server/flash';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';

async function assertCanEditStudy(studyId: string) {
  const user = await requireCurrentUser();
  if (isAdmin(user)) return user;
  const isMember = user.user_study.some((us) => us.study_id === studyId);
  if (!isMember) throw new Error('FORBIDDEN');
  return user;
}

const competenceLineSchema = z.object({
  skillTerritoryId: z.uuid().optional().nullable(),
  otherOrganization: z.string().default(''),
});

/**
 * Remplace toutes les compétences d'un impact par celles soumises dans le form.
 * Les lignes vides (pas de skill_territory ET pas de texte) sont ignorées.
 */
export async function saveImpactCompetences(
  impactId: string,
  formData: FormData,
): Promise<void> {
  const skillIds = formData.getAll('skillTerritoryId') as string[];
  const others = formData.getAll('otherOrganization') as string[];
  const count = Math.max(skillIds.length, others.length);

  const lines: { skillTerritoryId: string | null; otherOrganization: string }[] = [];
  for (let i = 0; i < count; i++) {
    const parsed = competenceLineSchema.safeParse({
      skillTerritoryId: skillIds[i] || null,
      otherOrganization: others[i] ?? '',
    });
    if (!parsed.success) continue;
    const line = parsed.data;
    if (!line.skillTerritoryId && !line.otherOrganization.trim()) continue;
    lines.push({
      skillTerritoryId: line.skillTerritoryId ?? null,
      otherOrganization: line.otherOrganization,
    });
  }

  const impact = await prisma.impact.findUnique({
    where: { id: impactId },
    include: { impact_theme: { select: { study_id: true } } },
  });
  if (!impact?.impact_theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(impact.impact_theme.study_id);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.impact_competence.deleteMany({ where: { impact_id: impactId } });
    if (lines.length > 0) {
      await tx.impact_competence.createMany({
        data: lines.map((l) => ({
          id: randomUUID(),
          impact_id: impactId,
          skill_territory_id: l.skillTerritoryId,
          other_organization: l.otherOrganization,
          created_at: now,
          updated_at: now,
        })),
      });
    }
  });

  await setFlash(`Compétences ajoutées à l'impact.`);
  revalidatePath('/skills-partners-mobilised');
}

/**
 * Toggle de l'état révoqué d'un impact. Port du `revokeImpact` legacy qui
 * permet aussi bien de retirer (revoked=true) que de réajouter (false) un
 * impact dans la section non-prioritaire.
 */
export async function setImpactRevoked(impactId: string, revoked: boolean) {
  const impact = await prisma.impact.findUnique({
    where: { id: impactId },
    include: { impact_theme: { select: { study_id: true } } },
  });
  if (!impact?.impact_theme?.study_id) throw new Error('NOT_FOUND');
  await assertCanEditStudy(impact.impact_theme.study_id);

  await prisma.impact.update({
    where: { id: impactId },
    data: { revoked_diagnostic: revoked, updated_at: new Date() },
  });

  await setFlash(revoked ? 'Impact retiré.' : 'Impact ajouté.');
  revalidatePath('/skills-partners-mobilised');
}
