import 'server-only';
import NextAuth from 'next-auth';

const sessionCookieName =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

export const { auth } = NextAuth({
  secret: process.env.AUTH_TACCT_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  providers: [],
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
