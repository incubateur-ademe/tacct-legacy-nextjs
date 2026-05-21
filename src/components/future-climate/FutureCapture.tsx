'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { StepStatus } from '@/components/ui/StepStatus';
import { typeExposure } from '@/lib/typeExposure';
import { futureExposureLabel, TREND_LABELS } from '@/lib/futureExposure';
import { patchFutureExposureField } from '@/server/future-exposure/actions';

/**
 * Port de `app-capture` (Angular legacy).
 *
 * Pour chaque exposition observée, affiche une « grosse » card en deux parties :
 *  – Haut : layout horizontal (infos aléa à gauche + panneau exposition
 *    observée à droite).
 *  – Bas : seconde card avec le formulaire d'exposition future (2 selects +
 *    justification textarea).
 *
 * Les selects sont **filtrés dynamiquement** selon la règle métier legacy
 * (cf. `future-exposures-reducers.ts`) :
 *   – si `observedExposure === 0` → on retire l'option « decrease »
 *   – si `trends === 'identical'` → seule valeur d'exposition possible :
 *     celle de l'observée
 *   – si `trends === 'increase'`  → exposition future > observée
 *   – si `trends === 'decrease'`  → exposition future < observée
 *   – si `trends === 'predictible'` ou null → tous les niveaux 0..4
 *
 * Auto-save : chaque changement déclenche `patchFutureExposureField` côté
 * serveur, puis `router.refresh()` pour rafraîchir le panneau et les selects
 * filtrés.
 */

export type FutureCaptureItem = {
  id: string;
  categoryIcon: string;
  hazardName: string;
  climateFeatures: string | null;
  trends: string | null;
  sources: string | null;
  observedExposure: number | null;
  observedJustification: string | null;
  futureTrends: string | null;
  futureExposure: number | null;
  futureJustification: string | null;
};

export function FutureCapture({ items }: { items: FutureCaptureItem[] }) {
  return (
    <>
      {items.map((item) => (
        <CaptureRow key={item.id} item={item} />
      ))}
    </>
  );
}

function CaptureRow({ item }: { item: FutureCaptureItem }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const valid = item.futureTrends !== null && item.futureExposure !== null;

  const onChangeField = (
    field: 'trends' | 'exposure' | 'justification',
    value: string,
  ) => {
    startTransition(async () => {
      await patchFutureExposureField(item.id, field, value === '' ? null : value);
      router.refresh();
    });
  };

  // Options « tendance » selon l'observée (cf. reducer legacy)
  const trendOptions = computeTrendOptions(item.observedExposure);

  // Options « exposition future » selon trend + observée
  const exposureOptions = computeExposureOptions(item.observedExposure, item.futureTrends);

  return (
    <div className="c-exposure row mt-5">
      <div className="col-lg-12 col-md-16">
        {/* Card du HAUT : infos aléa + panneau exposition observée */}
        <div className="o-card-p-0">
          <div className="row">
            <div className="container w-100">
              <div className="cord-two-cols">
                <div className="content">
                  <section>
                    <div className="row">
                      <BlockTitleIcon
                        className="col-16"
                        pageTitle={item.hazardName}
                        icon={item.categoryIcon}
                        size="medium"
                        contour={false}
                      />
                      <div className="mt-2 ml-3 pb-3">
                        {!valid && <StepStatus status="incomplete" />}
                      </div>
                    </div>
                  </section>
                  {item.climateFeatures && (
                    <section>
                      <label className="title-disabled">
                        Caractéristiques actuelles du climat du territoire
                      </label>
                      <p className="title-normal">{item.climateFeatures}</p>
                    </section>
                  )}
                  {item.trends && (
                    <section>
                      <label className="title-disabled">Evolutions tendancielles passées</label>
                      <p className="title-normal">{item.trends}</p>
                    </section>
                  )}
                  {item.sources && (
                    <section>
                      <label className="title-disabled">Sources</label>
                      <p className="title-normal sc-capture__justification-text">{item.sources}</p>
                    </section>
                  )}
                </div>
                <section className="card-right d-flex">
                  <div className="o-section-info content section-ghost">
                    <div className="o-section--right__body">
                      {item.observedExposure !== null && item.observedExposure >= 0 && (
                        <>
                          <div className="o-centred-elements d-flex align-items-center">
                            <em
                              className="c-icon project-primary-secondary eye icon-nb"
                              aria-hidden="true"
                            />
                            <span className="o-observed-exposure__nb">
                              {item.observedExposure}
                            </span>
                          </div>
                          <span className="o-observed-exposure__type-exposition mt-1">
                            Exposition {typeExposure(item.observedExposure)}
                          </span>
                        </>
                      )}
                      {item.observedJustification && (
                        <p className="o-observed-exposure__type-exposition-2 mt-2">
                          {item.observedJustification}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Card du BAS : formulaire exposition future */}
        <div className="o-card c-second-block">
          <section className="row o-section__container">
            <div className="c-input__group required col-16 c-select__future_evolution">
              <select
                id={`trend${item.id}`}
                className="c-input"
                value={item.futureTrends ?? ''}
                onChange={(e) => onChangeField('trends', e.target.value)}
              >
                <option value="" disabled>
                  Evolution future
                </option>
                {trendOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="c-required">*requis</div>
              <label className="c-input__label" htmlFor={`trend${item.id}`}>
                Evolution future
              </label>
            </div>
            <div className="c-input__group required col-16 c-select__future_evolution">
              <select
                id={`futureExposure${item.id}`}
                className="c-input"
                value={item.futureExposure === null ? '' : String(item.futureExposure)}
                onChange={(e) => onChangeField('exposure', e.target.value)}
                disabled={exposureOptions.length === 0}
              >
                <option value="" disabled>
                  {exposureOptions.length === 0
                    ? "Veuillez renseigner l'évolution future"
                    : 'Exposition future'}
                </option>
                {exposureOptions.map((v) => (
                  <option key={v} value={v}>
                    {v} - {futureExposureLabel(v)}
                  </option>
                ))}
              </select>
              <div className="c-required">*requis</div>
              <label className="c-input__label" htmlFor={`futureExposure${item.id}`}>
                Exposition future
              </label>
            </div>
            <div className="c-input__group w-100">
              <textarea
                id={`justification${item.id}`}
                className="c-input c-justification"
                maxLength={1000}
                rows={1}
                placeholder="Justification"
                defaultValue={item.futureJustification ?? ''}
                onBlur={(e) => onChangeField('justification', e.target.value)}
              />
              <label className="c-input__label" htmlFor={`justification${item.id}`}>
                Justification
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function computeTrendOptions(observedExposure: number | null): { id: string; name: string }[] {
  if (observedExposure === null) return [];
  const all = Object.entries(TREND_LABELS).map(([id, name]) => ({ id, name }));
  if (observedExposure === 0) return all.filter((t) => t.id !== 'decrease');
  return all;
}

function computeExposureOptions(
  observedExposure: number | null,
  trend: string | null,
): number[] {
  if (observedExposure === null || trend === null) return [];
  const all = [0, 1, 2, 3, 4];
  if (trend === 'identical') return [observedExposure];
  if (trend === 'increase') return all.filter((v) => v > observedExposure);
  if (trend === 'decrease') return all.filter((v) => v < observedExposure);
  if (trend === 'predictible') return all;
  return [];
}
