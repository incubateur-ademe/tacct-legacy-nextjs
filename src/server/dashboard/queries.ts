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
            observed_exposure: { include: { future_exposure: true } },
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

interface SynthesisItem {
  impactId: string;
  description: string;
  thematicName: string;
  thematicIcon: string | null;
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
      const observedExposure = impact.observed_exposure?.exposure;
      const futureExposure = impact.observed_exposure?.future_exposure?.exposure;
      const item: SynthesisItem = {
        impactId: impact.id,
        description: impact.description ?? '',
        thematicName: theme.name ?? '',
        thematicIcon: theme.thematic?.icon ?? null,
      };
      if (observedExposure !== null && observedExposure !== undefined) {
        const e = Number(observedExposure);
        const rowIdx = 4 - sensitivity;
        if (e >= 0 && e <= 3) matrix[rowIdx]![e]!.observed.push(item);
      }
      if (futureExposure !== null && futureExposure !== undefined) {
        const e = Number(futureExposure);
        const rowIdx = 4 - sensitivity;
        if (e >= 0 && e <= 3) matrix[rowIdx]![e]!.future.push(item);
      }
    }
  }

  return matrix;
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

  const headers = [
    'Thématique',
    'Sensibilité',
    'Description courte',
    'Description longue',
    'Aléa principal',
    'Caractéristiques climatiques',
    'Tendances passées',
    'Exposition observée',
    'Évolution future',
    'Exposition future',
    'Justification',
    'Aléas secondaires',
  ];

  const rows: string[] = [headers.map(csvEscape).join(',')];

  for (const theme of themes) {
    for (const impact of theme.impact) {
      const exp = impact.observed_exposure;
      const future = exp?.future_exposure;
      const secondary = impact.observed_exposure_impact
        .map((x) => x.observed_exposure.climate_hazard?.name ?? x.observed_exposure.climate_hazard_custom ?? '')
        .filter(Boolean)
        .join(' | ');

      rows.push(
        [
          theme.name,
          impact.sensitivity ? String(impact.sensitivity) : '',
          impact.description ?? '',
          impact.observed_impact ?? '',
          exp?.climate_hazard?.name ?? exp?.climate_hazard_custom ?? '',
          exp?.climate_features ?? '',
          exp?.trends ?? '',
          exp?.exposure === null || exp?.exposure === undefined ? '' : String(exp.exposure),
          future?.trends ?? '',
          future?.exposure === null || future?.exposure === undefined
            ? ''
            : String(future.exposure),
          impact.justification ?? '',
          secondary,
        ]
          .map(csvEscape)
          .join(','),
      );
    }
  }

  return rows.join('\n');
}

function csvEscape(value: string | null | undefined): string {
  const v = value ?? '';
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
