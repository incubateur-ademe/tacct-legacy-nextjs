'use client';

import { useState } from 'react';
import { SyntheseImpactSimple, type SyntheseImpactItem } from './SyntheseImpactSimple';
import { pluralize } from '@/lib/pluralize';

/**
 * Port de `app-synthese-impacts`.
 *
 * - Titre « Synthèse impacts »
 * - Liste compacte des impacts prioritaires (`futureExposure >= 8`)
 * - Bloc collapsible des impacts non-prioritaires (`< 8`) avec bouton
 *   "Afficher / Masquer".
 */
const MIN_FUTURE_EXPOSURE = 8;

export function SyntheseImpacts({ impacts }: { impacts: SyntheseImpactItem[] }) {
  const [open, setOpen] = useState(false);

  const priority = impacts.filter((i) => i.futureExposure >= MIN_FUTURE_EXPOSURE);
  const notPriority = impacts.filter((i) => i.futureExposure < MIN_FUTURE_EXPOSURE);

  return (
    <>
      <h2 className="c-legend u-margin__bottom">Synthèse impacts</h2>

      {priority.length > 0 && (
        <div className="sc-synthese-impacts__list">
          {priority.map((i) => (
            <SyntheseImpactSimple
              key={i.id}
              syntheseImpact={i}
              displayButton={false}
            />
          ))}
        </div>
      )}

      {notPriority.length > 0 && (
        <div className="sc-synthese-impacts__list">
          <div
            className={`sc-synthese-impacts__list-not-priority ${open ? 'open' : ''}`}
          >
            {notPriority.map((i) => (
              <SyntheseImpactSimple
                key={i.id}
                syntheseImpact={i}
                displayButton={true}
              />
            ))}
          </div>

          <button
            type="button"
            className="sc-synthese-impacts__display-not-priority"
            onClick={() => setOpen((v) => !v)}
          >
            <em
              className={`c-icon ${open ? 'chevron-up' : 'chevron-down'}`}
              aria-hidden="true"
            />
            {open ? 'Masquer' : 'Afficher'}{' '}
            {notPriority.length === 1 ? (
              "l'impact non prioritaire"
            ) : (
              <>
                les {notPriority.length}{' '}
                {pluralize(notPriority.length, 'impact non prioritaire', 'impacts non prioritaires')}
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
