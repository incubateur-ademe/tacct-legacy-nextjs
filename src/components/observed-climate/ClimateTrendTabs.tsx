'use client';

import { useState } from 'react';
import {
  GlobalTrend,
  FranceTrend,
  RegionalTrend,
  type ClimateData,
} from './ClimateTrendContent';

/**
 * Port du `ngb-nav` legacy avec les 4 onglets « tendances » :
 *  – Mondiales (statique, texte + image)
 *  – France (statique, texte + image)
 *  – Régionales (carte SVG France + détail région)
 *  – Outre-Mer (carte SVG outre-mer + détail région)
 *
 * State client `selected` pour pivoter d'onglet sans navigation.
 */
export function ClimateTrendTabs({
  defaultTab,
  metropoleMapSvg,
  overseasMapSvg,
  climatesByRegion,
  defaultMetropoleRegionId,
  defaultOverseasRegionId,
}: {
  defaultTab: 1 | 2 | 3 | 4;
  metropoleMapSvg: string;
  overseasMapSvg: string;
  climatesByRegion: Record<string, ClimateData>;
  defaultMetropoleRegionId: string;
  defaultOverseasRegionId: string;
}) {
  const [selected, setSelected] = useState<1 | 2 | 3 | 4>(defaultTab);

  return (
    <div className="o-card-p-0">
      <ul className="nav-tabs c-navbar-trend">
        <TabLink id={1} selected={selected} onSelect={setSelected}>
          TENDANCES MONDIALES
        </TabLink>
        <TabLink id={2} selected={selected} onSelect={setSelected}>
          TENDANCES FRANCE
        </TabLink>
        <TabLink id={3} selected={selected} onSelect={setSelected}>
          TENDANCES RÉGIONALES
        </TabLink>
        <TabLink id={4} selected={selected} onSelect={setSelected}>
          TENDANCES <span className="d-flex flex-nowrap">OUTRE-MER</span>
        </TabLink>
      </ul>
      <div className="mt-2">
        <div className="content">
          {selected === 1 && <GlobalTrend />}
          {selected === 2 && <FranceTrend />}
          {selected === 3 && (
            <RegionalTrend
              svgMarkup={metropoleMapSvg}
              climatesByRegion={climatesByRegion}
              defaultRegionId={defaultMetropoleRegionId}
              overseas={false}
            />
          )}
          {selected === 4 && (
            <RegionalTrend
              svgMarkup={overseasMapSvg}
              climatesByRegion={climatesByRegion}
              defaultRegionId={defaultOverseasRegionId}
              overseas={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabLink({
  id,
  selected,
  onSelect,
  children,
}: {
  id: 1 | 2 | 3 | 4;
  selected: number;
  onSelect: (id: 1 | 2 | 3 | 4) => void;
  children: React.ReactNode;
}) {
  return (
    <li className="nav-item">
      <a
        href="#"
        className={`nav-link ${selected === id ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          onSelect(id);
        }}
      >
        {children}
      </a>
    </li>
  );
}
