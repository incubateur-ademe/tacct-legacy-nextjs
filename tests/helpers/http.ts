import { routeUrl } from './config';

/** Seules les méthodes sans effet de bord sont autorisées : la cible est la prod. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export type SmokeResponse = {
  status: number;
  location: string | null;
  contentType: string | null;
  body: string;
};

export async function request(
  route: string,
  options: { method?: string; cookie?: string } = {},
): Promise<SmokeResponse> {
  const method = options.method ?? 'GET';
  if (!SAFE_METHODS.has(method)) {
    throw new Error(
      `Méthode ${method} interdite : la suite de smoke est en lecture seule (GET/HEAD/OPTIONS).`,
    );
  }

  const headers: Record<string, string> = {
    accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  };
  if (options.cookie) headers.cookie = options.cookie;

  const res = await fetch(routeUrl(route), {
    method,
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(45_000),
  });

  return {
    status: res.status,
    location: res.headers.get('location'),
    contentType: res.headers.get('content-type'),
    body: method === 'GET' ? await res.text() : '',
  };
}
