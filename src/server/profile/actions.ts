'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import {
  sendDeactivationEmail,
  sendInviteEmail,
  sendTransferEmail,
} from '@/server/mail/study-emails';

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

  revalidatePath('/');
  revalidatePath('/settings');
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

  revalidatePath('/');
  revalidatePath('/settings');
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
 * user identifié par email, et envoie les emails associés.
 *
 * - Compte cible déjà responsable d'une étude → refus (409 legacy).
 * - Compte cible existant : il devient head, l'ancien head est retiré de
 *   l'étude, et sa commune de rattachement devient celle de l'étude. Email
 *   « transfert » au nouveau ; si l'ancien head n'a plus d'étude, email de
 *   désactivation.
 * - Compte inexistant : email d'invitation (statut `mailSent`).
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
  const { studyId, mail, firstname, lastname } = parsed.data;
  const currentUser = await assertCanEditStudy(studyId);

  const currentUs = await prisma.user_study.findFirst({
    where: { study_id: studyId, user_id: currentUser.id, head_study: true },
  });
  if (!currentUs) {
    throw new Error('Seul le chargé d’étude peut transférer l’étude.');
  }

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { commune_id: true, territory_name: true },
  });
  if (!study) throw new Error('NOT_FOUND');

  const target = await prisma.user.findUnique({ where: { email: mail } });

  // Compte existant déjà responsable d'une étude → transfert impossible.
  if (target) {
    const targetIsHead = await prisma.user_study.findFirst({
      where: { user_id: target.id, head_study: true },
    });
    if (targetIsHead) {
      throw new Error('Transfert impossible. Compte existant avec un diagnostic en cours.');
    }
  }

  const emailParams = {
    firstname,
    headStudyFirstname: currentUser.firstname ?? '',
    headStudyLastname: currentUser.lastname ?? '',
    territoryName: study.territory_name,
  };

  if (!target) {
    await sendTransferEmail(mail, { ...emailParams, userExists: false });
    return { status: 'mailSent' };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const targetUs = await tx.user_study.findFirst({
      where: { study_id: studyId, user_id: target.id },
    });
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
    if (study.commune_id) {
      await tx.user.update({
        where: { id: target.id },
        data: { commune_id: study.commune_id, updated_at: now },
      });
    }
    // L'ancien chargé d'étude est retiré de l'étude (legacy : suppression).
    await tx.user_study.delete({ where: { id: currentUs.id } });
  });

  await sendTransferEmail(mail, { ...emailParams, userExists: true });

  const remaining = await prisma.user_study.count({ where: { user_id: currentUser.id } });
  if (remaining === 0 && currentUser.email) {
    await sendDeactivationEmail(currentUser.email, {
      firstname: currentUser.firstname ?? '',
      recipientFirstname: firstname,
      recipientLastname: lastname,
      territoryName: study.territory_name,
    });
  }

  revalidatePath('/settings');
  revalidatePath('/');
  return { status: 'transferred' };
}

// ─── Invitation d'un co-utilisateur sur l'étude ───────────────────────────────

const inviteSchema = z.object({
  studyId: z.uuid(),
  email: z.email(),
});

/**
 * Port du `sendInviteMail` legacy : invite un utilisateur à co-piloter l'étude.
 * Si le compte existe, il est lié à l'étude (s'il ne l'est pas déjà). Un email
 * d'invitation est envoyé dans tous les cas (compte connu ou non).
 */
export async function inviteCoUserToStudy(formData: FormData): Promise<void> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Formulaire invalide');
  const { studyId, email } = parsed.data;
  const currentUser = await assertCanEditStudy(studyId);

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { territory_name: true },
  });
  if (!study) throw new Error('NOT_FOUND');

  const invitee = await prisma.user.findUnique({ where: { email } });

  if (invitee) {
    const existing = await prisma.user_study.findFirst({
      where: { user_id: invitee.id, study_id: studyId },
    });
    if (!existing) {
      const now = new Date();
      await prisma.user_study.create({
        data: {
          id: randomUUID(),
          user_id: invitee.id,
          study_id: studyId,
          head_study: false,
          created_at: now,
          updated_at: now,
        },
      });
    }
  }

  await sendInviteEmail(email, {
    headStudyFirstname: currentUser.firstname ?? '',
    headStudyLastname: currentUser.lastname ?? '',
    territoryName: study.territory_name,
    userExists: Boolean(invitee),
  });

  revalidatePath('/settings');
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
  revalidatePath('/settings');
}
