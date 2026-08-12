import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { auth } from '@/server/auth';
import { getPublicOrigin } from '@/lib/public-origin';

export const getCurrentUser = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      study_office: true,
      commune: true,
      // Tri explicite : sans lui l'ordre des lignes varie d'une requête à
      // l'autre, donc l'étude par défaut aussi.
      user_study: { include: { study: true }, orderBy: { id: 'asc' } },
    },
  });
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${await getPublicOrigin()}/mon-compte`);
  }
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
