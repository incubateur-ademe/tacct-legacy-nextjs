'use server';

import { revalidatePath } from 'next/cache';
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

// ─── Étude (settings) ─────────────────────────────────────────────────────────

const studyInfoSchema = z.object({
  studyId: z.uuid(),
  year: z.coerce.number().int().min(1900).max(2200),
  territoryName: z.string().min(1).max(255),
});

export async function updateStudyInfo(formData: FormData): Promise<void> {
  const parsed = studyInfoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  const data = parsed.data;
  await assertCanEditStudy(data.studyId);

  await prisma.study.update({
    where: { id: data.studyId },
    data: {
      year: data.year,
      territory_name: data.territoryName,
      updated_at: new Date(),
    },
  });

  revalidatePath('/workspace');
  revalidatePath('/workspace/settings');
}

/**
 * Patch d'un seul champ de l'étude (year ou territory_name). Sert l'auto-save
 * sur blur des inputs du form Settings, à l'image du legacy.
 */
export async function patchStudyField(
  studyId: string,
  field: 'year' | 'territoryName',
  value: string,
): Promise<void> {
  await assertCanEditStudy(studyId);

  if (field === 'year') {
    const year = Number(value);
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      throw new Error('Année invalide');
    }
    await prisma.study.update({
      where: { id: studyId },
      data: { year, updated_at: new Date() },
    });
  } else if (field === 'territoryName') {
    const territoryName = value.trim();
    if (territoryName.length === 0 || territoryName.length > 255) {
      throw new Error('Nom du territoire invalide');
    }
    await prisma.study.update({
      where: { id: studyId },
      data: { territory_name: territoryName, updated_at: new Date() },
    });
  }

  revalidatePath('/workspace');
  revalidatePath('/workspace/settings');
}

// ─── Transfert du « chargé d'étude » à un autre user ──────────────────────────

const transferSchema = z.object({
  studyId: z.uuid(),
  lastname: z.string().min(1).max(255),
  firstname: z.string().min(1).max(255),
  mail: z.email(),
});

/**
 * Port du `transfer` legacy : transfère le rôle « chargé d'étude » à un autre
 * user identifié par email.
 *
 * - Si le user cible existe et n'est pas déjà head : le passe en head, dégrade
 *   le head courant en co-utilisateur, et lui crée un user_study si nécessaire.
 * - Si le user n'existe pas : le legacy envoie un email d'invitation (service
 *   mail Symfony). Côté next, on remonte juste un statut pour V1.
 */
export async function transferStudyHead(
  formData: FormData,
): Promise<{ status: 'transferred' | 'mailSent' }> {
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  const { studyId, mail } = parsed.data;
  const currentUser = await assertCanEditStudy(studyId);

  const currentUs = await prisma.user_study.findFirst({
    where: { study_id: studyId, user_id: currentUser.id, head_study: true },
  });
  if (!currentUs) {
    throw new Error('Seul le chargé d’étude peut transférer l’étude.');
  }

  const target = await prisma.user.findUnique({ where: { email: mail } });
  if (!target) {
    // Legacy : envoi d'un email d'invitation. À porter quand le service mail
    // sera branché côté next.
    return { status: 'mailSent' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user_study.update({
      where: { id: currentUs.id },
      data: { head_study: false, updated_at: new Date() },
    });

    const targetUs = await tx.user_study.findFirst({
      where: { study_id: studyId, user_id: target.id },
    });
    const now = new Date();
    if (targetUs) {
      await tx.user_study.update({
        where: { id: targetUs.id },
        data: { head_study: true, updated_at: now },
      });
    } else {
      await tx.user_study.create({
        data: {
          id: randomUUID(),
          study_id: studyId,
          user_id: target.id,
          head_study: true,
          created_at: now,
          updated_at: now,
        },
      });
    }
  });

  revalidatePath('/workspace/settings');
  revalidatePath('/workspace');
  return { status: 'transferred' };
}

// ─── Invitation d'un co-utilisateur sur l'étude ───────────────────────────────

const inviteSchema = z.object({
  studyId: z.uuid(),
  email: z.email(),
});

/**
 * Invite un utilisateur existant à co-piloter l'étude. Si l'email n'existe pas
 * en base, on lève une erreur (l'envoi d'email d'invitation est reporté à plus
 * tard avec le service mail).
 */
export async function inviteCoUserToStudy(formData: FormData): Promise<void> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Formulaire invalide');
  await assertCanEditStudy(parsed.data.studyId);

  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!invitee) {
    throw new Error(
      `Aucun compte trouvé pour ${parsed.data.email}. Le user doit avoir été créé au préalable.`,
    );
  }

  const existing = await prisma.user_study.findFirst({
    where: { user_id: invitee.id, study_id: parsed.data.studyId },
  });
  if (existing) {
    throw new Error('Cet utilisateur est déjà membre de l’étude.');
  }

  const now = new Date();
  await prisma.user_study.create({
    data: {
      id: randomUUID(),
      user_id: invitee.id,
      study_id: parsed.data.studyId,
      head_study: false,
      created_at: now,
      updated_at: now,
    },
  });

  revalidatePath('/workspace/settings');
}

/**
 * Retire un co-utilisateur de l'étude. Refuse si c'est le head study.
 */
export async function removeCoUserFromStudy(userStudyId: string): Promise<void> {
  const us = await prisma.user_study.findUnique({
    where: { id: userStudyId },
    select: { study_id: true, head_study: true },
  });
  if (!us?.study_id) throw new Error('NOT_FOUND');
  if (us.head_study) throw new Error('Impossible de retirer le head study');
  await assertCanEditStudy(us.study_id);

  await prisma.user_study.delete({ where: { id: userStudyId } });
  revalidatePath('/workspace/settings');
}
