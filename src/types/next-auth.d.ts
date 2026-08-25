import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { id: string; sessionJti?: string } & DefaultSession['user'];
  }
}
