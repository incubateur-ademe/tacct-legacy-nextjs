import { BASE_URL, BASE_PATH, routeUrl } from './config';

/** Vérifie qu'une app répond avant de dérouler le smoke, pour éviter 45 échecs identiques. */
export async function ensureServerReachable(): Promise<void> {
  const target = routeUrl('/');
  let detail: string;

  try {
    const res = await fetch(target, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status < 500) return;
    detail = `statut ${res.status}`;
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error);
  }

  throw new Error(
    [
      `Aucune app joignable sur ${target} (${detail}).`,
      '',
      "Lance l'app dans un autre terminal :",
      '  pnpm dev            # http://localhost:3001',
      '',
      'Ou vise une autre instance :',
      '  TEST_BASE_URL=https://tacct.ademe.fr pnpm test:routes',
      '',
      `BASE_URL=${BASE_URL} BASE_PATH=${BASE_PATH}`,
    ].join('\n'),
  );
}
