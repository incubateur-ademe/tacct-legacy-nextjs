'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * Port de `app-dashboard-potential-future` (Angular legacy).
 *
 * Affichage en deux colonnes :
 *  – gauche : radar chart Chart.js (datasets observé en vert / futur en orange)
 *  – droite : liste textuelle par thématique (icône + nom + nb observé + nb futur)
 */

/**
 * Mapping icône thématique → code-point glyphe dans la police `font-icon`.
 * Port direct de `thematicsicons.ts` legacy. Utilisé pour afficher l'icône
 * thématique en label de point du radar (au lieu du texte).
 */
const ICON_CODEPOINTS: Record<string, string> = {
  eau: 'e93a',
  foret: 'e952',
  ecosysteme: 'e93b',
  sante: 'e996',
  agriculture: 'e90c',
  structure: 'e9ac',
  train: 'e9b3',
  alea: 'e90d',
  location: 'e965',
  photo: 'e98b',
  home: 'e95b',
  peche: 'e981',
  suspended: 'e9a9',
};

export type LevelImpact = {
  themeId: string;
  thematicName: string;
  thematicIcon: string | null;
  observed: number;
  future: number;
  nbImpacts: number;
};

export function DashboardPotentialFuture({ impacts }: { impacts: LevelImpact[] }) {
  const { labels, observed, future } = useMemo(() => {
    return {
      labels: impacts.map((i) => {
        const cp = ICON_CODEPOINTS[i.thematicIcon ?? ''] ?? ICON_CODEPOINTS.suspended!;
        return String.fromCharCode(parseInt(cp, 16));
      }),
      observed: impacts.map((i) => i.observed),
      future: impacts.map((i) => i.future),
    };
  }, [impacts]);

  if (impacts.length === 0) return null;

  return (
    <div className="c-dashboard-potential-future">
      <div className="c-chart">
        <Radar
          data={{
            labels,
            datasets: [
              {
                label: 'Observé',
                data: observed,
                borderColor: '#009f79',
                backgroundColor: 'rgba(0, 159, 121, 0.3)',
                pointBackgroundColor: '#009f79',
                borderWidth: 1,
                pointRadius: 0,
              },
              {
                label: 'Futur',
                data: future,
                borderColor: '#dd7c00',
                backgroundColor: 'rgba(221, 124, 0, 0.3)',
                pointBackgroundColor: '#dd7c00',
                borderWidth: 1,
                pointRadius: 0,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              r: {
                min: 0,
                ticks: { stepSize: 4 },
                pointLabels: {
                  font: {
                    family: 'font-icon',
                    size: 40,
                    style: 'normal',
                  },
                  color: '#1d837b',
                },
              },
            },
          }}
        />
      </div>
      <div className="c-data ml-3">
        <div className="d-flex o-legend">
          <div className="o-centred-elements mr-2 d-flex align-items-center">
            <span className="c-icon__circle green project-primary mr-2 p-2" />
            <span className="c-subtitle-black">Observé</span>
          </div>
          <div className="o-centred-elements mr-4 d-flex align-items-center">
            <span className="c-icon__circle orange project-primary p-2 mr-2" />
            <span className="c-subtitle-black">Futur</span>
          </div>
        </div>
        {impacts.map((i) => (
          <div key={i.themeId} className="c-thematic-list">
            <div className="item-list">
              <em
                className={`c-icon medium project-primary-secondary ${i.thematicIcon ?? 'suspended'}`}
                aria-hidden="true"
              />
            </div>
            <div className="item-list text-left">
              <span className="c-subtitle-black-bold o-ellipsis" title={i.thematicName}>
                {i.thematicName}
              </span>
            </div>
            <div className="item-list">
              <span className="c-subtitle-black ml-auto">{formatNumber(i.observed)}</span>
            </div>
            <div className="item-list">
              <span className="c-subtitle-black ml-auto">{formatNumber(i.future)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value);
}
