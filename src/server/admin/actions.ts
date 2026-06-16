'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { blindIndex, encryptField } from '@/server/crypto/user-crypto';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';

async function assertAdmin() {
  const user = await requireCurrentUser();
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
  return user;
}

// ─── Users ────────────────────────────────────────────────────────────────────

const userFormSchema = z.object({
  firstname: z.string().min(1).max(255),
  lastname: z.string().min(1).max(255),
  email: z.email().max(255),
  username: z.string().max(255).default(''),
  communeId: z.string().optional().nullable(),
  studyOfficeId: z.string().optional().nullable(),
  isAdmin: z.coerce.boolean().default(false),
  validated: z.coerce.boolean().default(false),
});

function rolesJson(asAdmin: boolean): string {
  return JSON.stringify(asAdmin ? ['ROLE_ADMIN', 'ROLE_USER'] : ['ROLE_USER']);
}

export async function createUser(formData: FormData): Promise<void> {
  await assertAdmin();
  const raw = Object.fromEntries(formData);
  const parsed = userFormSchema.safeParse({
    ...raw,
    communeId: raw.communeId || null,
    studyOfficeId: raw.studyOfficeId || null,
    isAdmin: raw.isAdmin === 'on',
    validated: raw.validated === 'on',
  });
  if (!parsed.success) {
    throw new Error(
      `Formulaire invalide : ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  const data = parsed.data;
  const username = data.username || data.email;

  const now = new Date();
  await prisma.user.create({
    data: {
      id: randomUUID(),
      firstname: encryptField(data.firstname),
      lastname: encryptField(data.lastname),
      email: encryptField(data.email),
      email_bidx: blindIndex(data.email),
      username: encryptField(username),
      encryption_version: 1,
      commune_id: data.communeId ?? null,
      study_office_id: data.studyOfficeId ?? null,
      roles: rolesJson(data.isAdmin),
      validated: data.validated,
      validated_terms_of_use: true,
      created_at: now,
      updated_at: now,
    },
  });

  revalidatePath('/gestion/account-management');
  redirect('/gestion/account-management');
}

export async function updateUser(id: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const raw = Object.fromEntries(formData);
  // En édition : firstname/lastname/email lockés côté UI (read-only). On les ignore.
  const parsedPartial = userFormSchema
    .pick({ communeId: true, studyOfficeId: true, isAdmin: true, validated: true })
    .safeParse({
      communeId: raw.communeId || null,
      studyOfficeId: raw.studyOfficeId || null,
      isAdmin: raw.isAdmin === 'on',
      validated: raw.validated === 'on',
    });
  if (!parsedPartial.success) throw new Error('Formulaire invalide');
  const data = parsedPartial.data;

  await prisma.user.update({
    where: { id },
    data: {
      commune_id: data.communeId ?? null,
      study_office_id: data.studyOfficeId ?? null,
      roles: rolesJson(data.isAdmin),
      validated: data.validated,
      updated_at: new Date(),
    },
  });

  revalidatePath('/gestion/account-management');
  redirect('/gestion/account-management');
}

export async function deleteUser(id: string): Promise<void> {
  await assertAdmin();
  await prisma.user.delete({ where: { id } });
  revalidatePath('/gestion/account-management');
}

// ─── Study offices ────────────────────────────────────────────────────────────

const studyOfficeSchema = z.object({
  name: z.string().min(1).max(255),
  communeId: z.string().optional().nullable(),
});

export async function createStudyOffice(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = studyOfficeSchema.safeParse({
    ...Object.fromEntries(formData),
    communeId: formData.get('communeId') || null,
  });
  if (!parsed.success) throw new Error('Formulaire invalide');
  const now = new Date();
  await prisma.study_office.create({
    data: {
      id: randomUUID(),
      name: parsed.data.name,
      commune_id: parsed.data.communeId ?? null,
      created_at: now,
      updated_at: now,
    },
  });
  revalidatePath('/gestion/study-offices-management');
}

export async function updateStudyOffice(id: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = studyOfficeSchema.safeParse({
    ...Object.fromEntries(formData),
    communeId: formData.get('communeId') || null,
  });
  if (!parsed.success) throw new Error('Formulaire invalide');
  await prisma.study_office.update({
    where: { id },
    data: {
      name: parsed.data.name,
      commune_id: parsed.data.communeId ?? null,
      updated_at: new Date(),
    },
  });
  revalidatePath('/gestion/study-offices-management');
}

export async function deleteStudyOffice(id: string): Promise<void> {
  await assertAdmin();
  await prisma.study_office.delete({ where: { id } });
  revalidatePath('/gestion/study-offices-management');
}

// ─── Project sheets ───────────────────────────────────────────────────────────

const projectSheetSchema = z.object({
  name: z.string().min(1).max(70),
  slug: z.string().min(1).max(255),
  abstract: z.string().min(1).max(200),
  domainId: z.string().optional().nullable(),
  areaType: z.string().max(4).optional().nullable(),
  activityType: z.string().max(4).optional().nullable(),
  expectedEffects: z.string().default(''),
  consequences: z.string().default(''),
  resources: z.string().optional().nullable(),
  imageAlt: z.string().max(50).optional().nullable(),
  imageCredit: z.string().max(50).optional().nullable(),
});

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createProjectSheet(formData: FormData): Promise<void> {
  await assertAdmin();
  const raw = Object.fromEntries(formData);
  const slug = (raw.slug as string) || slugify((raw.name as string) ?? '');
  const parsed = projectSheetSchema.safeParse({
    ...raw,
    slug,
    domainId: raw.domainId || null,
    areaType: raw.areaType || null,
    activityType: raw.activityType || null,
    resources: raw.resources || null,
    imageAlt: raw.imageAlt || null,
    imageCredit: raw.imageCredit || null,
  });
  if (!parsed.success) throw new Error('Formulaire invalide');
  const data = parsed.data;

  const now = new Date();
  await prisma.project_sheet_detail.create({
    data: {
      id: randomUUID(),
      name: data.name,
      slug: data.slug,
      abstract: data.abstract,
      domain_id: data.domainId ?? null,
      area_type: data.areaType ?? null,
      activity_type: data.activityType ?? null,
      expected_effects: data.expectedEffects,
      consequences: data.consequences,
      resources: data.resources ?? null,
      image_alt: data.imageAlt ?? null,
      image_credit: data.imageCredit ?? null,
      created_at: now,
      updated_at: now,
    },
  });
  revalidatePath('/gestion/project-sheet-management');
  redirect('/gestion/project-sheet-management');
}

export async function updateProjectSheet(id: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const raw = Object.fromEntries(formData);
  const parsed = projectSheetSchema.safeParse({
    ...raw,
    domainId: raw.domainId || null,
    areaType: raw.areaType || null,
    activityType: raw.activityType || null,
    resources: raw.resources || null,
    imageAlt: raw.imageAlt || null,
    imageCredit: raw.imageCredit || null,
  });
  if (!parsed.success) throw new Error('Formulaire invalide');
  const data = parsed.data;

  await prisma.project_sheet_detail.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      abstract: data.abstract,
      domain_id: data.domainId ?? null,
      area_type: data.areaType ?? null,
      activity_type: data.activityType ?? null,
      expected_effects: data.expectedEffects,
      consequences: data.consequences,
      resources: data.resources ?? null,
      image_alt: data.imageAlt ?? null,
      image_credit: data.imageCredit ?? null,
      updated_at: new Date(),
    },
  });
  revalidatePath('/gestion/project-sheet-management');
  redirect('/gestion/project-sheet-management');
}

export async function deleteProjectSheet(id: string): Promise<void> {
  await assertAdmin();
  await prisma.project_sheet_detail.delete({ where: { id } });
  revalidatePath('/gestion/project-sheet-management');
}
