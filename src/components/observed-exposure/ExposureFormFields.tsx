import Link from 'next/link';

export interface ExposureFormDefaults {
  climateFeatures?: string | null;
  trends?: string | null;
  sources?: string | null;
  exposure?: number | null;
  justification?: string | null;
}

export function ExposureFormFields({ defaults }: { defaults?: ExposureFormDefaults }) {
  return (
    <>
      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Caractéristiques climatiques</h2>
        <textarea
          name="climateFeatures"
          defaultValue={defaults?.climateFeatures ?? ''}
          rows={4}
          className="c-input w-100"
        />
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Tendances passées</h2>
        <textarea
          name="trends"
          defaultValue={defaults?.trends ?? ''}
          rows={4}
          className="c-input w-100"
        />
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Sources</h2>
        <textarea
          name="sources"
          defaultValue={defaults?.sources ?? ''}
          rows={2}
          className="c-input w-100"
        />
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Notation de l&apos;exposition</h2>
        <div className="c-input__group">
          <label className="c-input__label" htmlFor="exposure">
            Niveau d&apos;exposition (0 à 3)
          </label>
          <select
            id="exposure"
            name="exposure"
            defaultValue={defaults?.exposure ?? ''}
            className="c-input"
          >
            <option value="">— Non renseigné —</option>
            <option value="0">0 — Aucune</option>
            <option value="1">1 — Faible</option>
            <option value="2">2 — Modérée</option>
            <option value="3">3 — Forte</option>
          </select>
        </div>
        <div className="c-input__group mt-3">
          <label className="c-input__label" htmlFor="justification">
            Justification
          </label>
          <textarea
            id="justification"
            name="justification"
            defaultValue={defaults?.justification ?? ''}
            rows={3}
            className="c-input w-100"
          />
        </div>
      </div>

      <div className="d-flex justify-content-between">
        <Link
          href="/workspace/observed-climate/observed-exposure"
          className="c-btn--tertiary"
        >
          Annuler
        </Link>
        <button type="submit" className="c-btn--primary">
          Enregistrer
        </button>
      </div>
    </>
  );
}
