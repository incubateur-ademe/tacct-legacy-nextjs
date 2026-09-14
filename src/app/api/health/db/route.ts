import { NextResponse } from 'next/server';
import { POOL_MAX, getPool, prisma } from '@/server/db';
import { formatPoolStats, isSaturated, readPoolStats } from '@/server/db/pool-stats';

export const dynamic = 'force-dynamic';

/**
 * Court exprès : quand le pool est épuisé, une requête attend `connectionTimeoutMillis`
 * (10s). La route doit répondre bien avant, sinon elle est inutilisable au moment
 * précis où on en a besoin.
 */
const TIMEOUT_SONDE_MS = 3_000;

/**
 * État de la connexion à la base, consultable sans accès psql ni redémarrage.
 *
 * Les jauges du pool sont lues de façon synchrone : elles répondent même si la
 * base ne répond plus du tout. C'est le point important — `pool` reste renseigné
 * quand `requete` vaut `timeout`.
 */
export async function GET() {
  const pool = getPool();
  const stats = pool ? readPoolStats(pool, POOL_MAX) : null;

  const debut = Date.now();

  // `.then(ok, ko)` plutôt qu'un `catch` séparé : la sonde ne rejette jamais, donc
  // pas de rejet non géré quand c'est le délai qui gagne la course.
  const sonde = prisma.$queryRaw`SELECT 1`.then(
    () => 'ok' as const,
    () => 'ko' as const,
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const delai = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), TIMEOUT_SONDE_MS);
  });

  const requete = await Promise.race([sonde, delai]);
  clearTimeout(timer);

  const latenceMs = Date.now() - debut;
  const sain = requete === 'ok' && (stats === null || !isSaturated(stats));

  return NextResponse.json(
    {
      sain,
      requete,
      latenceMs,
      pool: stats,
      // Même format que les lignes de log, pour comparer d'un coup d'œil.
      resume: stats ? formatPoolStats(stats) : null,
    },
    { status: sain ? 200 : 503 },
  );
}
