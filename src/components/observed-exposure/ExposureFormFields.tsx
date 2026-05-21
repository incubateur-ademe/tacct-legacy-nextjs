import Link from 'next/link';

export interface ExposureFormDefaults {
  climateFeatures?: string | null;
  trends?: string | null;
  sources?: string | null;
  exposure?: number | null;
  justification?: string | null;
}

/**
 * Sections « Caractéristiques de l'aléa » + « Notation de l'exposition » + boutons
 * Annuler / Enregistrer du formulaire d'exposition observée.
 *
 * Port direct des sections du legacy `add-exposure-hazard.component.html` et
 * `edit-exposure.component.html` (champs identiques, classes legacy `c-input__*`).
 */
export function ExposureFormFields({
  defaults,
  cancelHref = '/workspace/observed-climate/observed-exposure',
}: {
  defaults?: ExposureFormDefaults;
  cancelHref?: string;
}) {
  return (
    <>
      <section className="mt-5">
        <h2 className="c-legend mb-3">Caractéristiques de l&apos;aléa</h2>
        <div className="row">
          <div className="c-input__group col-sm-16 w-100">
            <textarea
              className="c-input__large"
              id="climateFeatures"
              name="climateFeatures"
              defaultValue={defaults?.climateFeatures ?? ''}
            />
            <label className="c-input__label" htmlFor="climateFeatures">
              Caractéristiques actuelles du climat du territoire
            </label>
          </div>
        </div>
        <div className="row">
          <div className="c-input__group col-sm-16 w-100">
            <textarea
              className="c-input__large"
              id="trends"
              name="trends"
              defaultValue={defaults?.trends ?? ''}
            />
            <label className="c-input__label" htmlFor="trends">
              Evolutions tendancielles passées
            </label>
          </div>
        </div>
        <div className="row">
          <div className="c-input__group col-sm-16 w-100">
            <textarea
              className="c-input__large"
              id="sources"
              name="sources"
              placeholder="Sources (si pertinent)"
              defaultValue={defaults?.sources ?? ''}
            />
            <label className="c-input__label" htmlFor="sources">
              Sources
            </label>
          </div>
        </div>

        <h2 className="c-legend mb-3 mt-4">Notation de l&apos;exposition</h2>
        <div className="row flex-nowrap">
          <div className="c-input__group col-sm-16 o-observed-exposure">
            <select
              id="exposure"
              name="exposure"
              defaultValue={defaults?.exposure ?? ''}
              className="c-input"
              required
            >
              <option value="" disabled>
                Exposition observée
              </option>
              <option value="0">0 - Nulle</option>
              <option value="1">1 - Faible</option>
              <option value="2">2 - Moyenne</option>
              <option value="3">3 - Élevée</option>
            </select>
            <div className="c-required">*requis</div>
            <label className="c-input__label" htmlFor="exposure">
              Exposition observée
            </label>
          </div>

          <div className="c-input__group col-sm-16 w-100">
            <textarea
              className="c-input__large"
              id="justification"
              name="justification"
              placeholder="Justification"
              defaultValue={defaults?.justification ?? ''}
            />
            <label className="c-input__label" htmlFor="justification">
              Justification
            </label>
          </div>
        </div>
      </section>

      <div className="o-btn--end">
        <Link href={cancelHref} className="c-btn--tertiary" title="Annuler">
          Annuler
        </Link>
        <button type="submit" className="c-btn--primary" title="Enregistrer">
          Enregistrer
        </button>
      </div>
    </>
  );
}
