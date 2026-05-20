import 'server-only';
import { cache } from 'react';
import { prisma } from '@/server/db';
import { getEnv } from '@/lib/env';

/**
 * Helper unique pour récupérer l'utilisateur courant côté serveur.
 *
 * - **Phase actuelle (dev)** : impersonation via la variable d'environnement
 *   `DEV_AUTH_EMAIL` qui pointe vers un user existant en base.
 * - **Phase finale** : sera basculé sur ProConnect (NextAuth) sans changer
 *   les call-sites — toute la couche métier passe par cette fonction.
 *
 * Le résultat est mémoïsé pour la durée d'une requête (cache React).
 */
export const getCurrentUser = cache(async () => {
  const { DEV_AUTH_EMAIL } = getEnv();

  if (!DEV_AUTH_EMAIL) return null;

  return prisma.user.findUnique({
    where: { email: DEV_AUTH_EMAIL },
    include: {
      study_office: true,
      commune: true,
      user_study: { include: { study: true } },
    },
  });
});

/**
 * Variante qui throw une 401 si pas authentifié. À utiliser dans les Server
 * Components / Route Handlers qui exigent un user connecté.
 */
export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
