'use client';

import { useState, useMemo } from 'react';
import type { ExposureOption } from './ImpactFormFields';

/**
 * Port de la section « Aléa principal + Aléas secondaires » du legacy
 * `add-impact.component.html` :
 *  – un select pour l'aléa principal
 *  – la liste des aléas secondaires déjà choisis (input disabled + bouton X)
 *  – un select pour ajouter un aléa secondaire (exclut le primary + ceux déjà
 *    sélectionnés)
 *
 * Pour rester compatible avec le `parseImpactForm` côté serveur qui fait un
 * `formData.getAll('secondaryExposureIds')`, on rend un `<input type="hidden"
 * name="secondaryExposureIds" />` par aléa sélectionné.
 */
export function SecondaryExposuresSectionClient({
  exposures,
  initialPrimary,
  initialSecondaries,
}: {
  exposures: ExposureOption[];
  initialPrimary: string | null;
  initialSecondaries: string[];
}) {
  const [primary, setPrimary] = useState<string>(initialPrimary ?? '');
  const [secondaries, setSecondaries] = useState<string[]>(initialSecondaries);

  const byId = useMemo(() => {
    const map = new Map<string, ExposureOption>();
    for (const e of exposures) map.set(e.id, e);
    return map;
  }, [exposures]);

  const availableForSecondary = useMemo(
    () =>
      exposures.filter(
        (e) => e.id !== primary && !secondaries.includes(e.id),
      ),
    [exposures, primary, secondaries],
  );

  const removeSecondary = (id: string) => {
    setSecondaries((prev) => prev.filter((x) => x !== id));
  };

  const addSecondary = (id: string) => {
    if (!id) return;
    setSecondaries((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <section className="o-section--even">
      <h2 className="c-legend mb-2">Aléa principal</h2>
      <div className="col-sm-16 c-input__group pl-0 pr-0 mt-3">
        <select
          name="primaryExposureId"
          className="c-input"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
        >
          <option value="" disabled>
            Aléa
          </option>
          {exposures.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <label className="c-input__label">Aléa</label>
        <div className="c-required">*obligatoire</div>
      </div>

      <h2 className="c-legend mb-2 mt-3 mb-3">Aléas secondaires</h2>

      {secondaries.map((id) => {
        const e = byId.get(id);
        if (!e) return null;
        return (
          <div key={id} className="pb-3">
            {/* Hidden inputs lus par parseImpactForm via formData.getAll() */}
            <input type="hidden" name="secondaryExposureIds" value={id} />
            <div className="d-flex flex-nowrap">
              <div className="col-sm-16 w-100 c-input__group mt-0 mb-0 pl-0 pr-0">
                <input
                  className="c-input__large"
                  disabled
                  type="text"
                  value={e.label}
                  readOnly
                />
                <label className="c-input__label">Aléa</label>
              </div>
              <div className="o-btn--next-input__btn-zone pl-3">
                <button
                  type="button"
                  aria-label="Supprimer"
                  onClick={() => removeSecondary(id)}
                  className="c-btn--secondary-icon-square"
                >
                  <em className="c-icon delete medium" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="d-flex flex-nowrap pt-1">
        <div className="col-sm-16 w-100 c-input__group">
          <select
            className="c-input"
            value=""
            onChange={(e) => {
              addSecondary(e.target.value);
              e.target.value = '';
            }}
            disabled={availableForSecondary.length === 0}
          >
            <option value="" disabled>
              {availableForSecondary.length === 0 ? 'Aucun aléa' : 'Aléa'}
            </option>
            {availableForSecondary.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
