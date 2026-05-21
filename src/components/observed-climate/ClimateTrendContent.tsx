'use client';

import { useState } from 'react';
import { InteractiveMap } from './InteractiveMap';

/**
 * Contenu des onglets « tendances climatiques », port des `app-global-trend`,
 * `app-trend-france`, `app-regional-trend` du legacy.
 */

export type ClimateData = {
  regionId: string;
  regionLabel: string;
  temperatureEvolution: string | null;
  levelPrecipitationFirst: string | null;
  levelPrecipitationSecond: string | null;
  /** Chemin (ou null) vers l'image du graphe de température, calculé côté
   * serveur à partir du `region_id` (cf. legacy `getTemperatureImage()`). */
  temperatureImage: string | null;
  /** Idem pour le graphe de précipitations. */
  precipitationImage: string | null;
};

export function GlobalTrend() {
  return (
    <div className="c-trend-global row">
      <div>
        <h2 className="c-legend mb-2">Evolution des températures moyennes annuelles</h2>
        <p className="c-legend-paragraphe">
          Depuis 1850, on constate une tendance claire au réchauffement climatique, et même
          une accélération de celui-ci. En raison d&apos;une forte variabilité naturelle, la
          température moyenne du globe peut, certaines années, être plus élevée ou plus
          basse que celle des années précédentes. Mais cette variabilité interannuelle ne
          doit pas être confondue avec l&apos;évolution de fond : une tendance générale à
          la hausse marquée depuis plus d&apos;un siècle. Selon l&apos;Organisation
          météorologique mondiale (OMM), l&apos;année 2020 a été l&apos;une des trois plus
          chaudes jamais enregistrées : la température moyenne a atteint environ 14,9°C,
          soit 1,2°C (±0,1°C) de plus que sa valeur préindustrielle (période 1850-1900).
          Les six années les plus chaudes ont toutes été enregistrées depuis 2015, les
          années 2016, 2019 et 2020 arrivant en tête du classement. Depuis les années
          1980, chaque décennie est plus chaude que la précédente.
        </p>
        <img
          alt="Evolution des températures moyennes annuelles"
          src="/assets/img/trend-climate/global-trend/GLOBAL_TEMPERATURE.png"
          title="Anomalie de la température moyenne annuelle de l'air, en surface, par rapport à la normale de référence : température moyenne du globe (données du Climatic Research Unit, University of East Anglia). Le zéro correspond à la moyenne de l'indicateur sur la période 1961-1990, soit 14,0°C."
        />
      </div>
    </div>
  );
}

export function FranceTrend() {
  return (
    <div className="c-trend-france row">
      <div>
        <h2 className="c-legend mb-2">Evolution des températures moyennes annuelles</h2>
        <p className="c-legend-paragraphe">
          En France métropolitaine, l&apos;effet du changement climatique le plus sensible
          est la hausse des températures moyennes. De 1900 à 2018, le réchauffement atteint
          environ +1,7°C, une valeur plus forte que celle observée en moyenne mondiale,
          estimée à +1,1°C par l&apos;OMM en 2019). Le réchauffement s&apos;est accéléré
          au cours des 3 dernières décennies.
        </p>
        <img
          alt="Evolution des températures moyennes annuelles"
          src="/assets/img/trend-climate/trend-france/FRANCE_TEMPERATURE.png"
          title="La normale est la moyenne des températures relevées sur les trente dernières années."
        />
        <h2 className="c-legend mt-5">Niveau des précipitations</h2>
        <img
          alt="Niveau des précipitations"
          src="/assets/img/trend-climate/trend-france/FRANCE_PRECIPITATION.png"
        />
      </div>
    </div>
  );
}

/**
 * Tendances régionales / outre-mer interactives : carte SVG cliquable +
 * panneau détail à droite avec l'évolution de température et les
 * précipitations pour la région sélectionnée.
 */
export function RegionalTrend({
  svgMarkup,
  climatesByRegion,
  defaultRegionId,
  overseas,
}: {
  svgMarkup: string;
  climatesByRegion: Record<string, ClimateData>;
  defaultRegionId: string;
  overseas: boolean;
}) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>(defaultRegionId);

  const selectedRegion = climatesByRegion[selectedRegionId] ?? null;
  const noTemperature = !selectedRegion?.temperatureEvolution;
  const noPrecipitation = !selectedRegion?.levelPrecipitationFirst;

  return (
    <div className="c-regional-climate">
      <div className="row">
        <div className="col-xl-8 pl-0 trend-map">
          <div className={overseas ? 'text-center mt-2 ml-2 mb-5' : 'c-map-france'}>
            <InteractiveMap
              svgMarkup={svgMarkup}
              selectedRegion={selectedRegionId}
              onSelect={setSelectedRegionId}
            />
          </div>
        </div>
        <div className="col-xl-4">
          {noTemperature && selectedRegion && (
            <div>
              <h1 className="c-title-h1">{selectedRegion.regionLabel}</h1>
              <p className="c-legend-paragraphe">Aucune donnée disponible pour la région.</p>
            </div>
          )}
          {!noTemperature && selectedRegion && (
            <div className="pl-3">
              <h1 className="c-title-h1 mt-3">{selectedRegion.regionLabel}</h1>
              <span className="ml-auto mr-auto c-legend-paragraphe ml-3 mt-3">
                Pour en savoir plus :{' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="http://www.meteofrance.fr/climat-passe-et-futur/climathd"
                >
                  ClimatHD
                </a>
                , l&apos;application interactive de Météo-France
              </span>
            </div>
          )}
        </div>
      </div>

      {!noTemperature && (
        <div className="row">
          <div className="col-lg-12">
            <h2 className="c-legend">Evolution des températures moyennes annuelles</h2>
            <p className="c-legend-paragraphe">{selectedRegion?.temperatureEvolution}</p>
            {selectedRegion?.temperatureImage && (
              <img
                src={selectedRegion.temperatureImage}
                alt="Evolution des températures moyennes annuelles"
              />
            )}
          </div>
        </div>
      )}

      {!noPrecipitation && (
        <>
          <div className="row mt-3">
            <div className="col-lg-12">
              <h2 className="c-legend">Niveau des précipitations</h2>
              <p className="c-legend-paragraphe">{selectedRegion?.levelPrecipitationFirst}</p>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              {selectedRegion?.precipitationImage && (
                <img
                  src={selectedRegion.precipitationImage}
                  alt="Niveau des précipitations"
                />
              )}
            </div>
            {selectedRegion?.levelPrecipitationSecond && (
              <div className="col-lg-3">
                <p className="c-legend-paragraphe mt-1">
                  {selectedRegion.levelPrecipitationSecond}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
