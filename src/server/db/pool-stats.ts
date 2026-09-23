import 'server-only';
import type { Pool } from 'pg';
import { formatProcessStats } from '@/server/process-stats';

/**
 * Jauges du pool `pg`. Pas de compteur maison : `pg` les maintient déjà, on se
 * contente de les lire (lecture synchrone, aucun coût).
 */
export interface PoolStats {
  /** Connexions ouvertes, sorties ou non. */
  total: number;
  /** Connexions ouvertes et disponibles immédiatement. */
  idle: number;
  /** Requêtes en attente d'une connexion. */
  waiting: number;
  max: number;
}

export function readPoolStats(pool: Pool, max: number): PoolStats {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    max,
  };
}

export function formatPoolStats(stats: PoolStats): string {
  return `total=${stats.total}/${stats.max} idle=${stats.idle} waiting=${stats.waiting}`;
}

/**
 * Le pool ne peut plus servir personne : toutes les connexions autorisées sont
 * ouvertes, aucune n'est disponible, et au moins une requête attend.
 *
 * C'est la signature qui distingue une fuite de clients (jamais `release()`) d'une
 * base injoignable : dans le second cas `total` reste sous `max`, le pool
 * n'arrivant pas à ouvrir de nouvelle connexion.
 */
export function isSaturated(stats: PoolStats): boolean {
  return stats.idle === 0 && stats.waiting > 0 && stats.total >= stats.max;
}

const INTERVALLE_ECHANTILLON_MS = 15_000;
const INTERVALLE_RAPPEL_MS = 60_000;

/**
 * Au-delà de cette durée de saturation *ininterrompue*, le pool est considéré
 * comme définitivement bloqué et le process s'arrête pour que Scalingo relance le
 * conteneur — exactement le geste fait à la main aujourd'hui, mais en deux
 * minutes au lieu de quelques heures.
 *
 * `DB_POOL_WATCHDOG_MS=0` désactive la bascule et ne garde que les logs.
 */
const SEUIL_REDEMARRAGE_MS_DEFAUT = 120_000;

function seuilRedemarrage(): number {
  const brut = process.env.DB_POOL_WATCHDOG_MS;
  if (brut === undefined) return SEUIL_REDEMARRAGE_MS_DEFAUT;
  const valeur = Number(brut);
  return Number.isFinite(valeur) && valeur >= 0 ? valeur : SEUIL_REDEMARRAGE_MS_DEFAUT;
}

/**
 * Surveille le pool : logue pendant les saturations, et redémarre le process si
 * l'une d'elles ne se résorbe pas. En régime normal : silence complet.
 *
 * Le déclencheur est volontairement `isSaturated()` et pas « la base ne répond
 * pas ». Quand Postgres est injoignable, le pool n'arrive pas à ouvrir de
 * connexion et `total` reste sous `max` : la condition est fausse, donc **pas de
 * redémarrage**. On ne se met pas en boucle de crash sur une panne de base, où
 * relancer le conteneur n'apporterait rien.
 *
 * `surSaturation` est appelé une fois par épisode, à son début : c'est le seul
 * moment où l'on peut photographier ce qui tient les connexions.
 */
export function watchPoolSaturation(pool: Pool, max: number, surSaturation?: () => void): void {
  const seuil = seuilRedemarrage();
  let saturePuis: number | null = null;
  let dernierLog = 0;

  const timer = setInterval(() => {
    const stats = readPoolStats(pool, max);
    const maintenant = Date.now();

    if (!isSaturated(stats)) {
      if (saturePuis !== null) {
        const duree = Math.round((maintenant - saturePuis) / 1000);
        console.warn(
          `[pg] pool de nouveau disponible après ${duree}s — ${formatPoolStats(stats)}`,
        );
        saturePuis = null;
      }
      return;
    }

    if (saturePuis === null) {
      saturePuis = maintenant;
      dernierLog = maintenant;
      console.warn(`[pg] pool saturé — ${formatPoolStats(stats)} — ${formatProcessStats()}`);
      surSaturation?.();
      return;
    }

    const dureeMs = maintenant - saturePuis;

    if (seuil > 0 && dureeMs >= seuil) {
      console.error(
        `[pg] pool bloqué depuis ${Math.round(dureeMs / 1000)}s — ${formatPoolStats(stats)}. ` +
          'Aucune connexion ne peut plus être servie et la situation ne se résorbe pas : ' +
          'arrêt du process pour que le conteneur soit relancé.',
      );
      clearInterval(timer);
      process.exit(1);
    }

    if (maintenant - dernierLog < INTERVALLE_RAPPEL_MS) return;
    dernierLog = maintenant;
    console.warn(
      `[pg] pool toujours saturé depuis ${Math.round(dureeMs / 1000)}s — ${formatPoolStats(stats)}`,
    );
  }, INTERVALLE_ECHANTILLON_MS);

  // Ne maintient pas le process en vie à lui seul.
  timer.unref();
}
