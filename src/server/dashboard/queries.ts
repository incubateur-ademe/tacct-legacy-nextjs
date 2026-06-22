import 'server-only';
import { prisma } from '@/server/db';

/**
 * Snapshot complet du dashboard d'une étude :
 * expositions observées + futures, impacts par thématique, matrice synthèse,
 * moyennes par thématique.
 */
export async function getDashboardData(studyId: string) {
  const [exposures, themes] = await Promise.all([
    prisma.observed_exposure.findMany({
      where: { study_id: studyId },
      include: {
        climate_hazard: { include: { climate_hazard_category: true } },
        future_exposure: true,
      },
      orderBy: { created_at: 'asc' },
    }),
    prisma.impact_theme.findMany({
      where: { study_id: studyId },
      include: {
        thematic: true,
        impact: {
          include: {
            observed_exposure: {
              include: {
                future_exposure: true,
                climate_hazard: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    }),
  ]);

  return { exposures, themes };
}

export interface SynthesisCell {
  /** axe X (exposition 0-3) */
  exposure: number;
  /** axe Y (sensibilité 1-4) */
  sensitivity: number;
  observed: SynthesisItem[];
  future: SynthesisItem[];
}

export interface SynthesisItem {
  impactId: string;
  /** id du `observed_exposure` lié — sert au "dim effect" hover de la matrice */
  observedExposureId: string | null;
  description: string;
  thematicName: string;
  thematicIcon: string | null;
  /** Exposition observée (sur 4) */
  observedExposure: number | null;
  /** Exposition future (sur 4) */
  futureExposure: number | null;
  /** Tendance climatique (icône arrow-…) */
  trendIcon: string;
  /** Nom de l'aléa principal */
  nameExposure: string;
}

/**
 * Place chaque impact dans la matrice 4×4 (sensibilité Y × exposition X), une fois
 * pour l'exposition observée et une fois pour l'exposition future.
 */
export function buildSynthesisMatrix(
  themes: Awaited<ReturnType<typeof getDashboardData>>['themes'],
): SynthesisCell[][] {
  // 4 lignes (sensibilité 1..4, axe Y), 4 colonnes (exposition 0..3, axe X)
  const matrix: SynthesisCell[][] = [];
  for (let s = 4; s >= 1; s--) {
    const row: SynthesisCell[] = [];
    for (let e = 0; e <= 3; e++) {
      row.push({ sensitivity: s, exposure: e, observed: [], future: [] });
    }
    matrix.push(row);
  }

  for (const theme of themes) {
    for (const impact of theme.impact) {
      const sensitivity = impact.sensitivity ? Number(impact.sensitivity) : 0;
      if (sensitivity < 1 || sensitivity > 4) continue;
      const observedExposureRaw = impact.observed_exposure?.exposure;
      const futureExposureRaw = impact.observed_exposure?.future_exposure?.exposure;
      const observedExposure =
        observedExposureRaw === null || observedExposureRaw === undefined
          ? null
          : Number(observedExposureRaw);
      const futureExposure =
        futureExposureRaw === null || futureExposureRaw === undefined
          ? null
          : Number(futureExposureRaw);

      const item: SynthesisItem = {
        impactId: impact.id,
        observedExposureId: impact.observed_exposure?.id ?? null,
        description: impact.description ?? '',
        thematicName: theme.name ?? '',
        thematicIcon: theme.thematic?.icon ?? null,
        observedExposure,
        futureExposure,
        trendIcon: trendIcon(observedExposure, futureExposure),
        nameExposure:
          impact.observed_exposure?.climate_hazard?.name ??
          impact.observed_exposure?.climate_hazard_custom ??
          '',
      };

      if (observedExposure !== null) {
        const rowIdx = 4 - sensitivity;
        if (observedExposure >= 0 && observedExposure <= 3)
          matrix[rowIdx]![observedExposure]!.observed.push(item);
      }
      if (futureExposure !== null) {
        const rowIdx = 4 - sensitivity;
        if (futureExposure >= 0 && futureExposure <= 3)
          matrix[rowIdx]![futureExposure]!.future.push(item);
      }
    }
  }

  return matrix;
}

function trendIcon(observed: number | null, future: number | null): string {
  if (observed === null || future === null) return '';
  if (future === observed) return 'arrow-holding';
  if (future > observed) return 'arrow-increases';
  return 'arrow-decreases';
}

/**
 * Moyennes par thématique : sensitivity × exposure observée et future.
 * Renvoie [{ thematicName, thematicIcon, observed, future, nbImpacts }, …]
 */
export function buildThematicAverages(
  themes: Awaited<ReturnType<typeof getDashboardData>>['themes'],
) {
  return themes
    .map((theme) => {
      const impacts = theme.impact;
      let sumObs = 0;
      let sumFut = 0;
      let countObs = 0;
      let countFut = 0;
      for (const impact of impacts) {
        const sensitivity = impact.sensitivity ? Number(impact.sensitivity) : 0;
        if (!sensitivity) continue;
        const obs = impact.observed_exposure?.exposure;
        const fut = impact.observed_exposure?.future_exposure?.exposure;
        if (obs !== null && obs !== undefined) {
          sumObs += sensitivity * Number(obs);
          countObs++;
        }
        if (fut !== null && fut !== undefined) {
          sumFut += sensitivity * Number(fut);
          countFut++;
        }
      }
      return {
        themeId: theme.id,
        thematicName: theme.name ?? '',
        thematicIcon: theme.thematic?.icon ?? null,
        observed: countObs > 0 ? sumObs / countObs : 0,
        future: countFut > 0 ? sumFut / countFut : 0,
        nbImpacts: impacts.length,
      };
    })
    .filter((t) => t.observed > 0 || t.future > 0);
}

/**
 * Génère un export CSV de l'étude (impacts + aléas).
 */
export async function generateStudyCsv(studyId: string): Promise<string> {
  const themes = await prisma.impact_theme.findMany({
    where: { study_id: studyId },
    include: {
      thematic: true,
      impact: {
        include: {
          observed_exposure: {
            include: {
              climate_hazard: true,
              future_exposure: true,
            },
          },
          observed_exposure_impact: {
            include: {
              observed_exposure: { include: { climate_hazard: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  // Colonnes, ordre et libellés repris à l'identique du legacy
  // (`DashboardRepository::getCsv`), export sous délimiteur `;` + BOM UTF-8.
  const headers = [
    'Thématique',
    'Thématique justification',
    'Description courte',
    'Sensibilité',
    'Justification',
    'Description longue',
    "Plan d'action",
    'Aléa principal',
    'Aléa principal - Caractéristiques actuelles du climat du territoire',
    'Aléa principal - Evolutions tendancielles passées',
    'Aléa principal - Sources',
    'Aléa principal - Exposition observée',
    "Aléa principal - Justification de l'exposition observée",
    'Aléa principal - Evolution future',
    'Aléa principal - Exposition future',
    "Aléa principal - Justification de l'exposition future",
    'Aléas secondaires',
  ];

  const rows: string[] = [headers.map(csvEscape).join(';')];

  for (const theme of themes) {
    const themeName = theme.thematic?.name ?? theme.name ?? '';

    // Thématique sans impact : une ligne « thématique seule » (cf. LEFT JOIN legacy).
    if (theme.impact.length === 0) {
      rows.push(
        [
          themeName,
          theme.justification ?? '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          futureTrendLabel(null),
          '',
          '',
          '',
        ]
          .map(csvEscape)
          .join(';'),
      );
      continue;
    }

    for (const impact of theme.impact) {
      const exp = impact.observed_exposure;
      const future = exp?.future_exposure;
      const secondary = impact.observed_exposure_impact
        .map((x) => x.observed_exposure.climate_hazard?.name ?? x.observed_exposure.climate_hazard_custom ?? '')
        .filter(Boolean)
        .join(', ');

      rows.push(
        [
          themeName,
          theme.justification ?? '',
          impact.description ?? '',
          impact.sensitivity ? String(impact.sensitivity) : '',
          impact.justification ?? '',
          impact.observed_impact ?? '',
          impact.action_plan ?? '',
          exp?.climate_hazard?.name ?? exp?.climate_hazard_custom ?? '',
          exp?.climate_features ?? '',
          exp?.trends ?? '',
          exp?.sources ?? '',
          exp?.exposure === null || exp?.exposure === undefined ? '' : String(exp.exposure),
          exp?.justification ?? '',
          futureTrendLabel(future?.trends),
          future?.exposure === null || future?.exposure === undefined
            ? ''
            : String(future.exposure),
          future?.justification ?? '',
          secondary,
        ]
          .map(csvEscape)
          .join(';'),
      );
    }
  }

  // BOM UTF-8 pour qu'Excel (locale FR) interprète correctement l'encodage.
  return '﻿' + rows.join('\n');
}

/** Traduction FR de l'évolution future, fidèle au CASE SQL du legacy. */
function futureTrendLabel(trends: string | null | undefined): string {
  switch (trends) {
    case 'identical':
      return 'Identique';
    case 'increase':
      return 'Augmentation';
    case 'decrease':
      return 'Diminution';
    default:
      return 'Non prévisible';
  }
}

function csvEscape(value: string | null | undefined): string {
  const v = value ?? '';
  if (/[;,"\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
