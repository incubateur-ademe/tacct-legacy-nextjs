'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCurrentUser } from '@/server/auth/current-user';
import { canAccess, CURRENT_STUDY_COOKIE } from './current-study';
import { studySwitchTarget } from '@/lib/study-switch-target';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function selectCurrentStudy(studyId: string, pathname: string): Promise<void> {
  const user = await requireCurrentUser();
  if (!canAccess(user, studyId)) return;

  const store = await cookies();
  store.set(CURRENT_STUDY_COOKIE, studyId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR,
  });

  revalidatePath('/', 'layout');

  const target = studySwitchTarget(pathname);
  if (target !== pathname) redirect(target);
}
