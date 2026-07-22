'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { setFlash } from '@/server/flash';
import { blindIndex } from '@/server/crypto/user-crypto';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { sendDeactivationEmail, sendTransferEmail } from '@/server/mail/study-emails';
import { sendInviteEmail } from '@/server/mail/invite-emails';

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
 * Transfère le rôle « chargé d'étude » à un autre user identifié par email.
 *
 * - Compte cible inexistant → retour `not_found` (message affiché à l'écran ;
 *   plus aucune invitation par email).
 * - Compte cible déjà responsable d'une étude → refus.
 * - Compte cible existant : il devient head, l'ancien head est retiré de
 *   l'étude, et sa commune de rattachement devient celle de l'étude. Email
 *   « transfert » au nouveau ; si l'ancien head n'a plus d'étude, son compte
 *   est désactivé et il reçoit l'email de désactivation.
 *
 * Le flag `validated` suit la possession d'une étude : la cible est validée
 * (accès à l'outil de saisie), l'ancien head est dévalidé s'il ne participe
 * plus à aucune étude.
 */
export async function transferStudyHead(
  formData: FormData,
): Promise<{ status: 'transferred' | 'not_found' }> {
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

  // Recherche par blind index (l'email est chiffré en base).
  const target = await prisma.user.findUnique({
    where: { email_bidx: blindIndex(mail) },
  });

  // Plus d'invitation par email : si le compte n'existe pas, on le signale à
  // l'écran (le formulaire affiche le message).
  if (!target) {
    return { status: 'not_found' };
  }

  // Compte existant déjà responsable d'une étude → transfert impossible.
  const targetIsHead = await prisma.user_study.findFirst({
    where: { user_id: target.id, head_study: true },
  });
  if (targetIsHead) {
    throw new Error('Transfert impossible. Compte existant avec un diagnostic en cours.');
  }

  const emailParams = {
    firstname,
    headStudyFirstname: currentUser.firstname ?? '',
    headStudyLastname: currentUser.lastname ?? '',
    territoryName: study.territory_name,
  };

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
    // La cible devient responsable : son compte est validé pour lui ouvrir
    // l'accès à l'outil de saisie.
    await tx.user.update({
      where: { id: target.id },
      data: {
        ...(study.commune_id ? { commune_id: study.commune_id } : {}),
        validated: true,
        updated_at: now,
      },
    });
    // L'ancien chargé d'étude est retiré de l'étude (legacy : suppression).
    await tx.user_study.delete({ where: { id: currentUs.id } });

    // Plus aucune étude → compte désactivé (cohérent avec l'email de
    // désactivation, qui invite à demander une réactivation).
    const remaining = await tx.user_study.count({ where: { user_id: currentUser.id } });
    if (remaining === 0) {
      await tx.user.update({
        where: { id: currentUser.id },
        data: { validated: false, updated_at: now },
      });
    }
  });

  await sendTransferEmail(mail, emailParams);

  const remaining = await prisma.user_study.count({ where: { user_id: currentUser.id } });
  if (remaining === 0 && currentUser.email) {
    await sendDeactivationEmail(currentUser.email, {
      firstname: currentUser.firstname ?? '',
      recipientFirstname: firstname,
      recipientLastname: lastname,
      territoryName: study.territory_name,
    });
  }

  await setFlash('Transfert effectué. Un mail vous a été transmis.');
  revalidatePath('/settings');
  revalidatePath('/');
  return { status: 'transferred' };
}

// ─── Invitation d'un(e) collègue sur l'étude ─────────────────────────────────

const inviteSchema = z.object({
  studyId: z.uuid(),
  mail: z.email(),
});

/**
 * Invite un compte existant à rejoindre l'étude en tant que collaborateur.
 *
 * - Compte cible inexistant → retour `not_found` (message affiché à l'écran).
 * - Compte cible existant : ajout à l'étude (sans `head_study`) et passage du
 *   compte en « validé » pour lui ouvrir l'accès à l'outil de saisie, puis
 *   email d'invitation.
 */
export async function inviteColleague(
  formData: FormData,
): Promise<{ status: 'invited' | 'already_member' | 'not_found' }> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
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
    throw new Error('Seul le chargé d’étude peut inviter un(e) collègue.');
  }

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { territory_name: true },
  });
  if (!study) throw new Error('NOT_FOUND');

  const target = await prisma.user.findUnique({
    where: { email_bidx: blindIndex(mail) },
  });
  if (!target) {
    return { status: 'not_found' };
  }

  const existingUs = await prisma.user_study.findFirst({
    where: { study_id: studyId, user_id: target.id },
  });
  if (existingUs) {
    return { status: 'already_member' };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.user_study.create({
      data: {
        id: randomUUID(),
        study_id: studyId,
        user_id: target.id,
        head_study: false,
        created_at: now,
        updated_at: now,
      },
    });
    if (!target.validated) {
      await tx.user.update({
        where: { id: target.id },
        data: { validated: true, updated_at: now },
      });
    }
  });

  await sendInviteEmail(mail, {
    headStudyFirstname: currentUser.firstname ?? '',
    headStudyLastname: currentUser.lastname ?? '',
    territoryName: study.territory_name,
  });

  revalidatePath('/settings');
  return { status: 'invited' };
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
