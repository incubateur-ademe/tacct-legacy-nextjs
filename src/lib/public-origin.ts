import 'server-only';
import { headers } from 'next/headers';
import { getEnv } from '@/lib/env';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

const firstValue = (value: string | null) => value?.split(',')[0]?.trim() ?? '';

export async function getPublicOrigin(): Promise<string> {
  const h = await headers();
  const forwardedHost = firstValue(h.get('x-forwarded-host'));

  if (forwardedHost) {
    try {
      const { hostname, host } = new URL(`http://${forwardedHost}`);
      if (LOCAL_HOSTNAMES.has(hostname)) {
        return `${firstValue(h.get('x-forwarded-proto')) || 'http'}://${host}`;
      }
      return `https://${hostname}`;
    } catch {
      // en-tête illisible : repli sur APP_URL
    }
  }

  return getEnv().APP_URL.replace(/\/+$/, '');
}
