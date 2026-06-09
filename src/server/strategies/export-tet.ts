import 'server-only';
import { prisma } from '@/server/db';

/**
 * Port de `CsvExportTeTService` (+ `ImpactTrajectoryProcessor`, `ImpactStudiedService`)
 * du backend Symfony legacy : génère le CSV « plan d'action TeT » d'une étude.
 *
 * Structure d'une ligne :
 *  - Axe          = description de l'impact étudié
 *  - Sous-axe     = nom de la trajectoire
 *  - Sous-sous axe= « N - » + description N du niveau d'impact de l'impact étudié
 *  - + l'action (titre/descriptif) positionnée au premier niveau (1→2→3) dont sa
 *    finalité/anticipation est cochée.
 */

// 35 colonnes, ordre identique au legacy (EXPORT_TET_HEADERS).
const EXPORT_TET_HEADERS = [
  'Axe (x)',
  'Sous-axe (x.x)',
  'Sous-sous axe (x.x.x)',
  'Titre de la fiche action',
  'Descriptif',
  'Instances de gouvernance',
  'Objectifs',
  'Indicateurs liés',
  'Structure pilote',
  'Moyens humains et techniques',
  'Partenaires',
  'Direction ou service pilote',
  'Personne pilote',
  'Élu·e référent·e',
  'Participation Citoyenne',
  'Financements',
  'Financeur 1',
  'Montant € HT',
  'Financeur 2',
  'Montant € HT',
  'Financeur 3',
  'Montant € HT',
  'Budget prévisionnel total € HT',
  'Statut',
  'Niveau de priorité',
  'Date de début',
  'Date de fin',
  'Action en amélioration continue',
  'Calendrier',
  'Actions liées',
  'Fiches des plans liées',
  'Note de suivi',
  'Etapes de la fiche action',
  'Notes complémentaires',
  'Documents et liens',
] as const;

const EXPORT_TET_STATUT = 'À venir';
const EXPORT_TET_NIVEAU_PRIORITE = 'Moyen';
const EXPORT_TET_ACTION_AMELIORATION_CONTINUE = 'TRUE';
const EXPORT_TET_FILE_NAME = 'Export-TACCT_Plan_Action_';

const PREFIX_SOUS_SOUS_AXE: Record<1 | 2 | 3, string> = {
  1: '1 - ',
  2: '2 - ',
  3: '3 - ',
};

type Level = 1 | 2 | 3;
const LEVELS: Level[] = [1, 2, 3];

// ── Modèles normalisés (indépendants impact / impact_strategy) ───────────────

interface ActionNode {
  id: string;
  intitule: string;
  description: string | null;
  finalite1: boolean;
  finalite2: boolean;
  finalite3: boolean;
  anticipe1: boolean;
  anticipe2: boolean;
  hasTrajectory: boolean;
}

interface TrajectoryNode {
  name: string;
  actions: ActionNode[];
}

interface ImpactLevelNode {
  description1: string;
  description2: string;
  description3: string;
  finalite1: string;
  finalite2: string;
  finalite3: string;
}

interface StudiedImpactNode {
  description: string;
  impactLevel: ImpactLevelNode | null;
  actions: ActionNode[];
  trajectories: TrajectoryNode[];
}

// Une ligne du CSV est un dictionnaire colonne → valeur ; seules ces colonnes
// sont jamais renseignées par l'export (cf. ImpactExportTeTDTO).
interface Row {
  axe?: string;
  sousAxe?: string;
  sousSousAxe?: string;
  titreDeLaFicheAction?: string;
  description?: string | null;
  objectifs?: string;
  personnePilote?: string;
  statut?: string;
  niveauDePriorite?: string;
  actionEnAmeliorationContinue?: string;
}

function rowToCells(row: Row): string[] {
  const map: Record<string, string | null | undefined> = {
    'Axe (x)': row.axe,
    'Sous-axe (x.x)': row.sousAxe,
    'Sous-sous axe (x.x.x)': row.sousSousAxe,
    'Titre de la fiche action': row.titreDeLaFicheAction,
    Descriptif: row.description,
    Objectifs: row.objectifs,
    'Personne pilote': row.personnePilote,
    Statut: row.statut,
    'Niveau de priorité': row.niveauDePriorite,
    'Action en amélioration continue': row.actionEnAmeliorationContinue,
  };
  return EXPORT_TET_HEADERS.map((header) => map[header] ?? '');
}

function levelDescription(level: Level, si: StudiedImpactNode): string {
  if (!si.impactLevel) return '';
  return level === 1
    ? si.impactLevel.description1
    : level === 2
      ? si.impactLevel.description2
      : si.impactLevel.description3;
}

function levelFinalite(level: Level, si: StudiedImpactNode): string {
  if (!si.impactLevel) return '';
  return level === 1
    ? si.impactLevel.finalite1
    : level === 2
      ? si.impactLevel.finalite2
      : si.impactLevel.finalite3;
}

// Une action est placée au niveau N si sa finalité N (ou son anticipation N, pour
// N ∈ {1,2}) est cochée. Pas d'anticipation au niveau 3.
function actionMatchesLevel(action: ActionNode, level: Level): boolean {
  if (level === 1) return action.finalite1 || action.anticipe1;
  if (level === 2) return action.finalite2 || action.anticipe2;
  return action.finalite3;
}

// ── Génération des lignes (port du processeur Symfony) ───────────────────────

function buildRows(impacts: StudiedImpactNode[], personnePilote: string): string[][] {
  // Partagé sur tout l'export : une action ne peut être insérée qu'une fois.
  const alreadyInserted = new Set<string>();
  const cells: string[][] = [];

  for (const si of impacts) {
    for (const row of processImpactStudied(si, personnePilote, alreadyInserted)) {
      cells.push(rowToCells(row));
    }
  }
  return cells;
}

function processImpactStudied(
  si: StudiedImpactNode,
  personnePilote: string,
  alreadyInserted: Set<string>,
): Row[] {
  const rows: Row[] = [{ axe: si.description }];

  if (si.trajectories.length === 0 && si.actions.length === 0) {
    return rows;
  }

  // Aucune trajectoire : on liste directement les actions de l'impact.
  if (si.trajectories.length === 0) {
    for (const action of si.actions) {
      rows.push({
        axe: si.description,
        titreDeLaFicheAction: action.intitule,
        description: action.description,
        personnePilote,
      });
    }
    return rows;
  }

  const trajectoriesSorted = [...si.trajectories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const trajectory of trajectoriesSorted) {
    rows.push(...processTrajectory(trajectory, si, personnePilote, alreadyInserted));
  }

  // Actions de l'impact qui ne sont rattachées à aucune trajectoire.
  for (const action of si.actions.filter((a) => !a.hasTrajectory)) {
    rows.push({
      axe: si.description,
      titreDeLaFicheAction: action.intitule,
      description: action.description,
      personnePilote,
    });
  }

  return rows;
}

function processTrajectory(
  trajectory: TrajectoryNode,
  si: StudiedImpactNode,
  personnePilote: string,
  alreadyInserted: Set<string>,
): Row[] {
  const rows: Row[] = [];

  // Trajectoire sans action : on insère la donnée minimale pour chaque niveau.
  if (trajectory.actions.length === 0) {
    for (const level of LEVELS) {
      rows.push(trajectoryDataRow(si, trajectory, level));
    }
    return rows;
  }

  const collection = [...trajectory.actions];
  let hasInserted = false;

  for (const level of LEVELS) {
    const inserted = insertActionsByLevel(
      collection,
      si,
      trajectory,
      level,
      personnePilote,
      alreadyInserted,
    );
    if (inserted.length > 0) {
      rows.push(...inserted);
      hasInserted = true;
    }

    // Plus d'action à placer : compléter les niveaux restants en donnée minimale.
    if (collection.length === 0) {
      const remaining = hasInserted ? LEVELS.slice(level) : LEVELS;
      for (const lv of remaining) {
        rows.push(trajectoryDataRow(si, trajectory, lv));
      }
      break;
    }

    // Aucune action insérée jusqu'ici (niveaux de tête) : donnée minimale.
    if (!hasInserted) {
      rows.push(trajectoryDataRow(si, trajectory, level));
    }
  }

  return rows;
}

function insertActionsByLevel(
  collection: ActionNode[],
  si: StudiedImpactNode,
  trajectory: TrajectoryNode,
  level: Level,
  personnePilote: string,
  alreadyInserted: Set<string>,
): Row[] {
  const inserted: Row[] = [];

  for (const action of [...collection]) {
    if (alreadyInserted.has(action.id)) {
      removeFrom(collection, action);
      continue;
    }

    if (actionMatchesLevel(action, level)) {
      inserted.push({
        axe: si.description,
        sousAxe: trajectory.name,
        sousSousAxe: PREFIX_SOUS_SOUS_AXE[level] + levelDescription(level, si),
        titreDeLaFicheAction: action.intitule,
        description: action.description,
        objectifs: levelFinalite(level, si),
        personnePilote,
        statut: EXPORT_TET_STATUT,
        niveauDePriorite: EXPORT_TET_NIVEAU_PRIORITE,
        actionEnAmeliorationContinue: EXPORT_TET_ACTION_AMELIORATION_CONTINUE,
      });
      removeFrom(collection, action);
      alreadyInserted.add(action.id);
    }
  }

  return inserted;
}

function trajectoryDataRow(
  si: StudiedImpactNode,
  trajectory: TrajectoryNode,
  level: Level,
): Row {
  return {
    axe: si.description,
    sousAxe: trajectory.name,
    sousSousAxe: PREFIX_SOUS_SOUS_AXE[level] + levelDescription(level, si),
  };
}

function removeFrom(collection: ActionNode[], action: ActionNode): void {
  const idx = collection.indexOf(action);
  if (idx !== -1) collection.splice(idx, 1);
}

// ── Récupération des impacts étudiés (port de ImpactStudiedService) ──────────

const actionInclude = {
  impact_trajectory_impact_action: { select: { id: true } },
} as const;

const trajectoryInclude = {
  impact_trajectory_impact_action: { include: { impact_action: true } },
} as const;

type RawAction = {
  id: string;
  intitule: string;
  description: string | null;
  finalite1: boolean;
  finalite2: boolean;
  finalite3: boolean;
  anticipe1: boolean;
  anticipe2: boolean;
  // Présent uniquement sur les actions chargées au niveau de l'impact (sert à
  // savoir si l'action a au moins une trajectoire). Absent sur les actions
  // chargées via une trajectoire — non pertinent dans ce cas.
  impact_trajectory_impact_action?: { id: string }[];
};

function toActionNode(a: RawAction): ActionNode {
  return {
    id: a.id,
    intitule: a.intitule,
    description: a.description,
    finalite1: a.finalite1,
    finalite2: a.finalite2,
    finalite3: a.finalite3,
    anticipe1: a.anticipe1,
    anticipe2: a.anticipe2,
    hasTrajectory: (a.impact_trajectory_impact_action?.length ?? 0) > 0,
  };
}

async function getStudiedImpactNodes(studyId: string): Promise<StudiedImpactNode[]> {
  const [impacts, strategies] = await Promise.all([
    prisma.impact.findMany({
      where: { impact_theme: { study_id: studyId } },
      include: {
        impact_level: true,
        observed_exposure: { include: { future_exposure: true } },
        impact_action: { include: actionInclude },
        impact_trajectory: { include: trajectoryInclude },
      },
    }),
    prisma.impact_strategy.findMany({
      where: { impact_theme: { study_id: studyId } },
      include: {
        impact_level: true,
        impact_action: { include: actionInclude },
        impact_trajectory: { include: trajectoryInclude },
      },
    }),
  ]);

  // Impacts étudiés : non révoqués ET (choisis OU prioritaires score ≥ 8).
  const studiedImpacts: StudiedImpactNode[] = impacts
    .filter((i) => {
      if (i.revoked_diagnostic) return false;
      const score =
        Number(i.sensitivity ?? 0) * Number(i.observed_exposure?.future_exposure?.exposure ?? 0);
      return i.strategy_studied || score >= 8;
    })
    .map((i) => toStudiedImpactNode(i.description, i.impact_level, i.impact_action, i.impact_trajectory));

  const strategyImpacts: StudiedImpactNode[] = strategies.map((s) =>
    toStudiedImpactNode(s.description, s.impact_level, s.impact_action, s.impact_trajectory),
  );

  // Fusion puis tri par description (matching orderBy description ASC du legacy).
  return [...studiedImpacts, ...strategyImpacts].sort((a, b) =>
    a.description.localeCompare(b.description),
  );
}

function toStudiedImpactNode(
  description: string | null,
  impactLevel: ImpactLevelNode | null,
  actions: RawAction[],
  trajectories: { name: string; impact_trajectory_impact_action: { impact_action: RawAction }[] }[],
): StudiedImpactNode {
  return {
    description: description ?? '',
    impactLevel: impactLevel
      ? {
          description1: impactLevel.description1,
          description2: impactLevel.description2,
          description3: impactLevel.description3,
          finalite1: impactLevel.finalite1,
          finalite2: impactLevel.finalite2,
          finalite3: impactLevel.finalite3,
        }
      : null,
    actions: actions.map(toActionNode),
    trajectories: trajectories.map((t) => ({
      name: t.name,
      actions: t.impact_trajectory_impact_action.map((j) => toActionNode(j.impact_action)),
    })),
  };
}

// ── API publique ─────────────────────────────────────────────────────────────

export interface ExportTeTResult {
  csv: string;
  filename: string;
}

/**
 * Génère le CSV du plan d'action. Renvoie `null` s'il n'y a aucun impact étudié
 * (équivalent du 204 No Content legacy).
 */
export async function generateExportTeTCsv(
  studyId: string,
  personnePilote: string,
): Promise<ExportTeTResult | null> {
  const impacts = await getStudiedImpactNodes(studyId);
  if (impacts.length === 0) return null;

  const dataRows = buildRows(impacts, personnePilote);

  const lines = [EXPORT_TET_HEADERS.map(csvEscape).join(',')];
  for (const row of dataRows) {
    lines.push(row.map(csvEscape).join(','));
  }

  // BOM UTF-8 (comme le legacy) pour l'ouverture correcte sous Excel.
  const csv = '﻿' + lines.join('\n');
  const filename = `${EXPORT_TET_FILE_NAME}${timestamp()}.csv`;

  return { csv, filename };
}

function csvEscape(value: string | null | undefined): string {
  const v = value ?? '';
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function timestamp(): string {
  // Format YmdHis en fuseau Europe/Paris (équivalent du legacy).
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}${get('month')}${get('day')}${get('hour')}${get('minute')}${get('second')}`;
}
