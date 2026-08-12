import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import type { CurrentUser } from '@/server/auth/current-user';

/** Étude sélectionnée dans le header. Persiste tant que l'utilisateur n'en change pas. */
export const CURRENT_STUDY_COOKIE = 'tacct.current-study';

/**
 * Parse les roles (stockés en JSON dans la colonne `roles` String).
 */
export function userRoles(user: { roles: string }): string[] {
  try {
    const parsed = JSON.parse(user.roles);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isAdmin(user: { roles: string }): boolean {
  return userRoles(user).includes('ROLE_ADMIN');
}

/**
 * Récupère l'étude courante d'un utilisateur.
 *
 * - Si `studyId` est fourni (typiquement via `?study=<id>` dans l'URL) :
 *   on vérifie que l'utilisateur a le droit de la voir (admin OU
 *   l'étude est dans ses `user_study`).
 * - Sinon : on prend la première étude de l'utilisateur.
 *
 * Retourne `null` si l'utilisateur n'a pas d'étude ou pas accès à celle demandée.
 */
export const getCurrentStudy = cache(async function getCurrentStudy(
  user: CurrentUser,
  studyId?: string,
): Promise<Awaited<ReturnType<typeof loadStudy>> | null> {
  if (studyId) {
    const allowed = isAdmin(user) || user.user_study.some((us) => us.study_id === studyId);
    if (!allowed) return null;
    return loadStudy(studyId);
  }

  const selectedId = (await cookies()).get(CURRENT_STUDY_COOKIE)?.value;
  if (selectedId && canAccess(user, selectedId)) {
    const selected = await loadStudy(selectedId);
    // Cookie obsolète (étude supprimée) : on retombe sur le défaut plus bas.
    if (selected) return selected;
  }

  const firstStudyId = user.user_study[0]?.study_id;
  if (!firstStudyId) return null;
  return loadStudy(firstStudyId);
});

export function canAccess(user: CurrentUser, studyId: string): boolean {
  return isAdmin(user) || user.user_study.some((us) => us.study_id === studyId);
}

function loadStudy(id: string) {
  return prisma.study.findUnique({
    where: { id },
    include: {
      commune: { include: { department: { include: { region: true } } } },
      user_study: { include: { user: true } },
    },
  });
}

export type CurrentStudy = NonNullable<Awaited<ReturnType<typeof getCurrentStudy>>>;
