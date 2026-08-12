import { encode } from 'next-auth/jwt';

/**
 * Auth.js sale le JWT avec le nom du cookie, qui dépend du NODE_ENV du serveur
 * visé. On envoie les deux variantes : le serveur ne lit que celle qu'il attend.
 */
const COOKIE_NAMES = ['authjs.session-token', '__Secure-authjs.session-token'] as const;

export async function sessionCookieHeader(userId: string): Promise<string> {
  const secret = process.env.AUTH_TACCT_SECRET;
  if (!secret) {
    throw new Error('AUTH_TACCT_SECRET absent : impossible de forger une session de test.');
  }

  const cookies = await Promise.all(
    COOKIE_NAMES.map(async (name) => {
      const token = await encode({
        token: { sub: userId },
        secret,
        salt: name,
        maxAge: 60 * 60,
      });
      return `${name}=${token}`;
    }),
  );

  return cookies.join('; ');
}
