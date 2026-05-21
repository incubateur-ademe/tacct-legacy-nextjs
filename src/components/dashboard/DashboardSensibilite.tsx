'use client';

import { useState } from 'react';
import { BlockHeader } from '@/components/ui/BlockHeader';
import Link from 'next/link';

export type SensibiliteTheme = {
  id: string;
  thematicName: string;
  thematicIcon: string;
  impacts: {
    id: string;
    description: string;
    sensitivity: number | null;
  }[];
};

/**
 * Port de la liste `app-dashboard-sensibilite` du legacy.
 *
 * Affiche un accordéon pliable par thématique. L'en-tête contient l'icône
 * thématique + le nom + le compteur d'impacts, et un chevron qui pivote selon
 * l'état ouvert/fermé. Le panneau ouvert liste chaque impact avec sa
 * `sensitivity` à droite.
 */
export function DashboardSensibilite({
  themes,
  fallbackHref,
}: {
  themes: SensibiliteTheme[];
  fallbackHref: string;
}) {
  if (themes.length === 0) {
    return (
      <div className="o-card pl-3 pr-3">
        <div className="text-center">
          <div className="p-small-grey mb-3 mt-4 mb-4">
            Aucun impact n&apos;est encore renseigné
          </div>
          <Link className="c-legend-action-bold" href={fallbackHref}>
            SAISIR LA SENSIBILITE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="o-card p-0">
      {themes.map((theme) => (
        <SensibiliteAccordion key={theme.id} theme={theme} />
      ))}
    </div>
  );
}

function SensibiliteAccordion({ theme }: { theme: SensibiliteTheme }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="c-sensibility-theme">
      <div className="c-accordion__header d-flex align-items-center align-content-center justify-content-between">
        <BlockHeader
          className="col-16"
          pageTitle={theme.thematicName}
          icon={theme.thematicIcon || 'suspended'}
          size="medium"
          nbElement={theme.impacts.length}
          ellipsis
        />
        <button
          type="button"
          aria-label={opened ? 'Replier' : 'Déplier'}
          aria-expanded={opened}
          className="c-sensibility-theme__toggle"
          onClick={() => setOpened((o) => !o)}
        >
          <em
            className={`c-icon color-cerulean medium project-primary-secondary ${
              opened ? 'chevron-up' : 'chevron-down'
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
      {opened && (
        <div className="c-sensibility-theme__panel">
          {theme.impacts.map((impact) => (
            <div key={impact.id} className="d-flex p-2">
              <div className="o-ellipsis w-90 pr-3" title={impact.description}>
                <span className="c-subtitle-black">{impact.description}</span>
              </div>
              <div className="ml-auto">
                <span className="c-subtitle-black-bold">{impact.sensitivity ?? ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
