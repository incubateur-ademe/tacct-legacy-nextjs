import 'server-only';
import { headers } from 'next/headers';
import { getEnv } from '@/lib/env';

export async function getPublicOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host');
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? 'https';
    return `${proto}://${host}`;
  }
  return getEnv().APP_URL;
}
