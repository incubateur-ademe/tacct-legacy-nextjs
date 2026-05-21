'use client';

import { useRef, useState } from 'react';
import type { SynthesisCell, SynthesisItem } from '@/server/dashboard/queries';

/**
 * Port de `app-dashboard-synthese-impact` (Angular legacy).
 *
 * Matrice 4×4 (sensibilité 1-4 en ordonnée, exposition 1-4 en abscisse) où
 * chaque cellule liste les impacts en icônes circulaires colorées :
 *   – vert  → exposition observée
 *   – orange → exposition future
 *
 * Au survol d'une icône, toutes les autres icônes correspondant à un autre
 * `observed_exposure` deviennent semi-transparentes, et un popover affiche
 * le détail (thématique, exposition observée + future, tendance, description).
 *
 * Convention legacy : axe Y descend de 4 à 1 (le rang 1 = sensibilité 1 est en
 * BAS du graphe). Axe X démarre à 1 (notre matrice côté serveur démarre à 0,
 * on shift pour l'affichage).
 */
export function DashboardSyntheseImpacts({ matrix }: { matrix: SynthesisCell[][] }) {
  const [hoveredItem, setHoveredItem] = useState<SynthesisItem | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasData = matrix.some((row) =>
    row.some((cell) => cell.observed.length > 0 || cell.future.length > 0),
  );
  if (!hasData) return null;

  const onEnter = (item: SynthesisItem, e: React.MouseEvent<HTMLSpanElement>) => {
    setHoveredItem(item);
    const target = e.currentTarget.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    if (container) {
      setPopoverPos({
        top: target.bottom - container.top + 4,
        left: target.left - container.left,
      });
    }
  };

  const onLeave = () => {
    setHoveredItem(null);
    setPopoverPos(null);
  };

  const isDimmed = (item: SynthesisItem) =>
    hoveredItem !== null && hoveredItem.observedExposureId !== item.observedExposureId;

  return (
    <div className="c-synthesis-impacts mt-5" ref={containerRef}>
      <div className="c-sensitivity">
        <span className="c-subtitle-black-bold">Sensibilité</span>
      </div>

      {/* Grille 4 lignes × 5 colonnes (1 tick + 4 cellules) */}
      <div className="c-container-icons ml-5">
        {matrix.map((row, rowIdx) => {
          // row 0 → sensibilité 4 (haut), row 3 → sensibilité 1 (bas)
          const sensitivity = 4 - rowIdx;
          return (
            <RowFragment
              key={rowIdx}
              row={row}
              sensitivity={sensitivity}
              isDimmed={isDimmed}
              onEnter={onEnter}
              onLeave={onLeave}
            />
          );
        })}
      </div>

      {/* Axe X (ticks 1..4) */}
      <div className="x-ticks mt-3">
        <div className="x-tick" />
        <div className="x-tick c-subtitle-black">1</div>
        <div className="x-tick c-subtitle-black">2</div>
        <div className="x-tick c-subtitle-black">3</div>
        <div className="x-tick c-subtitle-black">4</div>
      </div>
      <div className="text-center mt-2">
        <span className="c-subtitle-black-bold">Exposition</span>
      </div>

      {/* Popover hover */}
      {hoveredItem && popoverPos && (
        <div
          className="c-synthesis-popover"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <div className="container-tooltip">
            <div className="o-centred-elements flex-nowrap mr-3 d-flex align-items-center">
              <em
                className={`c-icon medium project-primary-secondary ${hoveredItem.thematicIcon ?? ''}`}
                aria-hidden="true"
              />
              <div className="c-subtitle-black-bold text-nowrap mr-3">
                {hoveredItem.thematicName}
              </div>
            </div>
            <div className="d-flex align-content-center align-items-center flex-nowrap">
              {hoveredItem.observedExposure !== null && hoveredItem.observedExposure > 0 && (
                <span className="o-observed-exposure c-icon__circle green-light pl-1 pr-1">
                  <span className="p-small-bold">{hoveredItem.observedExposure}</span>
                </span>
              )}
              {hoveredItem.observedExposure !== null &&
                hoveredItem.observedExposure > 0 &&
                hoveredItem.futureExposure !== null &&
                hoveredItem.futureExposure > 0 &&
                hoveredItem.trendIcon && (
                  <em
                    className={`c-icon large ${hoveredItem.trendIcon}`}
                    aria-hidden="true"
                  />
                )}
              {hoveredItem.futureExposure !== null && hoveredItem.futureExposure > 0 && (
                <span className="o-futur-exposure c-icon__circle orange-light pl-1 pr-1 mr-2">
                  <span className="p-small-bold">{hoveredItem.futureExposure}</span>
                </span>
              )}
            </div>
          </div>
          <div className="o-name-exposure">
            <p className="p-small">{hoveredItem.nameExposure}</p>
            <p className="p-small-bold">{hoveredItem.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RowFragment({
  row,
  sensitivity,
  isDimmed,
  onEnter,
  onLeave,
}: {
  row: SynthesisCell[];
  sensitivity: number;
  isDimmed: (item: SynthesisItem) => boolean;
  onEnter: (item: SynthesisItem, e: React.MouseEvent<HTMLSpanElement>) => void;
  onLeave: () => void;
}) {
  // Légende du tick à gauche, puis 4 cellules (exposition 0..3 → affichées en 1..4)
  return (
    <>
      <div className="item o-tick">
        <div className="c-subtitle-black">{sensitivity}</div>
      </div>
      {row.map((cell) => (
        <div key={cell.exposure} className="item">
          <div className="icons">
            {cell.observed.map((item, k) => (
              <span
                key={`obs-${item.impactId}-${k}`}
                onMouseEnter={(e) => onEnter(item, e)}
                onMouseLeave={onLeave}
                className={`c-icon__circle green project-primary-secondary mr-1 mt-2 mb-2 ${
                  isDimmed(item) ? 'disabled' : ''
                }`}
              >
                <em
                  className={`c-icon medium project-primary-secondary ${item.thematicIcon ?? ''}`}
                  aria-hidden="true"
                />
              </span>
            ))}
            {cell.future.map((item, k) => (
              <span
                key={`fut-${item.impactId}-${k}`}
                onMouseEnter={(e) => onEnter(item, e)}
                onMouseLeave={onLeave}
                className={`c-icon__circle orange project-primary-secondary mr-2 mt-2 mb-2 ${
                  isDimmed(item) ? 'disabled' : ''
                }`}
              >
                <em
                  className={`c-icon medium project-primary-secondary ${item.thematicIcon ?? ''}`}
                  aria-hidden="true"
                />
              </span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
