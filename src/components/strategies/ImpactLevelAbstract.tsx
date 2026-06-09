'use client';

import { useState } from 'react';

export type ImpactLevelData = {
  indicateur_suivi: string;
  description1: string;
  description2: string;
  description3: string;
  finalite1: string;
  finalite2: string;
  finalite3: string;
  seuil1: string;
  seuil2: string;
} | null;

/**
 * Port de `app-impact-level-abstract` (legacy) : panneau pliable récapitulant
 * les 3 niveaux d'impact, leurs finalités et les seuils de franchissement.
 */
export function ImpactLevelAbstract({ impactLevel }: { impactLevel: ImpactLevelData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sc-impact-level-abstract">
      <div className="sc-impact-level-abstract__header">
        <em className="c-icon project-primary-secondary medium niveaux" aria-hidden="true" />
        <span className="sc-impact-level-abstract__title">Récapitulatif des niveaux d&apos;impact</span>
        <button
          type="button"
          aria-label="Plier / Déplier"
          className="u-margin__left--auto sc-impact-level-abstract__toggle"
          onClick={() => setOpen((o) => !o)}
        >
          <em className={`c-icon medium project-primary ${open ? 'chevron-up' : 'chevron-down'}`} />
        </button>
      </div>

      {open && (
        <div className="sc-impact-level-abstract__flex-column">
          <div className="sc-impact-level-abstract__flex sc-impact-level-abstract__timeline">
            <div className="sc-impact-level-abstract__timeline-elem sc-impact-level-abstract__timeline-1">
              <span className="sc-impact-level-abstract__flex sc-impact-level-abstract__timeline-number">1</span>
            </div>
            <div className="sc-impact-level-abstract__timeline-elem sc-impact-level-abstract__timeline-2">
              <span className="sc-impact-level-abstract__flex sc-impact-level-abstract__timeline-number">2</span>
            </div>
            <div className="sc-impact-level-abstract__timeline-elem sc-impact-level-abstract__timeline-3">
              <span className="sc-impact-level-abstract__flex sc-impact-level-abstract__timeline-number">3</span>
            </div>
          </div>

          <div className="sc-impact-level-abstract__flex">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="sc-impact-level-abstract__flex-column sc-impact-level-abstract__text-group pt-4 pb-1"
              >
                <span className="sc-impact-level-abstract__title">Niveau d&apos;impact {n}</span>
                <span className="sc-impact-level-abstract__text">
                  {impactLevel?.[`description${n}` as keyof NonNullable<ImpactLevelData>]}
                </span>
              </div>
            ))}
          </div>

          <span className="sc-impact-level-abstract__subtitle-group">Finalités des actions</span>
          <div className="sc-impact-level-abstract__flex">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className="sc-impact-level-abstract__text sc-impact-level-abstract__text-group pt-2 pb-2"
              >
                {impactLevel?.[`finalite${n}` as keyof NonNullable<ImpactLevelData>]}
              </span>
            ))}
          </div>

          <span className="sc-impact-level-abstract__subtitle-group">Seuil de franchissement</span>
          <div className="sc-impact-level-abstract__tracking-indicator sc-impact-level-abstract__flex-column pt-2">
            <span className="sc-impact-level-abstract__legend">Indicateur de suivi</span>
            <span className="sc-impact-level-abstract__text">{impactLevel?.indicateur_suivi}</span>
          </div>
          <div className="sc-impact-level-abstract__flex sc-impact-level-abstract__limit">
            <span className="sc-impact-level-abstract__text sc-impact-level-abstract__limit-text">
              {impactLevel?.seuil1}
            </span>
            <span className="sc-impact-level-abstract__text sc-impact-level-abstract__limit-text">
              {impactLevel?.seuil2}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
