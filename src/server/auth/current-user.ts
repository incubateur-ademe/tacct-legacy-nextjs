import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { auth } from '@/server/auth';
import { getEnv } from '@/lib/env';

export const getCurrentUser = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      study_office: true,
      commune: true,
      user_study: { include: { study: true } },
    },
  });
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${getEnv().APP_URL}/mon-compte`);
  }
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
