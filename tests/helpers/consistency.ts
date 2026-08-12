import { request } from './http';
import { BASE_URL } from './config';
import type { Fixtures } from './fixtures';

function databaseHost(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return '(DATABASE_URL absent)';
  try {
    return new URL(url).host;
  } catch {
    return '(DATABASE_URL illisible)';
  }
}

/**
 * Les ids de test viennent de DATABASE_URL, les requêtes vont vers TEST_BASE_URL.
 * Si les deux ne désignent pas la même base, toutes les routes paramétrées
 * répondent 404 — on le détecte ici pour échouer une fois, avec une explication,
 * plutôt qu'une quinzaine de fois sans.
 */
export async function ensureFixturesMatchTarget(
  fixtures: Fixtures,
  cookie: string,
): Promise<void> {
  const probes = [
    fixtures.impactId ? `/impacts/impact/${fixtures.impactId}/impact-level` : null,
    fixtures.strategyId ? `/impacts/choose-impacts/${fixtures.strategyId}` : null,
    fixtures.observedExposureId
      ? `/observed-climate/observed-exposure/${fixtures.observedExposureId}/edit`
      : null,
  ].filter((probe): probe is string => probe !== null);

  if (probes.length === 0) return;

  const statuses = await Promise.all(
    probes.map(async (probe) => (await request(probe, { cookie })).status),
  );

  if (!statuses.every((status) => status === 404)) return;

  throw new Error(
    [
      `Les ${probes.length} identifiants de test sont inconnus de ${BASE_URL} (404 sur tous).`,
      '',
      `Les fixtures sont lues dans la base ${databaseHost()}, mais l'app visée`,
      "utilise visiblement une autre base : les deux ont divergé (mêmes données anciennes,",
      'entités récentes différentes).',
      '',
      'Corrige en branchant les fixtures sur la base de la cible :',
      '  TEST_DATABASE_URL="postgresql://…" TEST_BASE_URL=https://tacct.ademe.fr pnpm test:routes',
      '',
      'Ou teste une app locale branchée sur cette même base.',
    ].join('\n'),
  );
}
