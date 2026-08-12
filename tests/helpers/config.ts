export const BASE_URL = (process.env.TEST_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export const BASE_PATH = process.env.TEST_BASE_PATH ?? '/workspace-tacct';

export function routeUrl(route: string): string {
  // `/` seul donnerait `${BASE_PATH}/`, que Next redirige en 308 vers `${BASE_PATH}`.
  return `${BASE_URL}${BASE_PATH}${route === '/' ? '' : route}`;
}
