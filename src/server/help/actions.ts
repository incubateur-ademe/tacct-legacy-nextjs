'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { setFlash } from '@/server/flash';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';

async function assertAdmin() {
  const user = await requireCurrentUser();
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
}

/** Port du `sluggler` legacy (page-info.component). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\w\d\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-|-$/g, '');
}

const savePageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional().default(''),
  content: z.string().optional().default(''),
});

/** Édition d'une page d'aide (objectif / étape / ressource). */
export async function saveHelpPage(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = savePageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Formulaire invalide');
  const { id, title, slug, content } = parsed.data;
  const finalSlug = slug ? slugify(slug) : slugify(title);

  await prisma.page.update({
    where: { id },
    data: { name: title, slug: finalSlug, content, updated_at: new Date() },
  });
  await setFlash('Page enregistrée');
  revalidatePath('/', 'layout');
}

/** Édition (ou création) du texte d'intro de la page d'aide. */
export async function saveHelpIntro(formData: FormData): Promise<void> {
  await assertAdmin();
  const introId = String(formData.get('introId') ?? '').trim();
  const pageInfoId = String(formData.get('pageInfoId') ?? '').trim();
  const content = String(formData.get('content') ?? '');

  if (introId) {
    await prisma.page.update({
      where: { id: introId },
      data: { content, updated_at: new Date() },
    });
    await setFlash('Page enregistrée');
  } else {
    if (!pageInfoId) throw new Error('page_info manquant');
    const now = new Date();
    await prisma.page.create({
      data: {
        id: randomUUID(),
        page_info_id: pageInfoId,
        name: 'intro',
        rank: BigInt(1),
        page_type: 'intro',
        content,
        created_at: now,
        updated_at: now,
      },
    });
    await setFlash('Page créée');
  }
  revalidatePath('/', 'layout');
}

/** Suppression d'une page d'aide. */
export async function deleteHelpPage(id: string): Promise<void> {
  await assertAdmin();
  await prisma.page.delete({ where: { id } });
  await setFlash('Page supprimée');
  revalidatePath('/', 'layout');
}
