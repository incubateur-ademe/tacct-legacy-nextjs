import Link from 'next/link';

export interface ExposureOption {
  id: string;
  label: string;
}

export interface ImpactFormDefaults {
  description?: string | null;
  sensitivity?: number | null;
  justification?: string | null;
  primaryExposureId?: string | null;
  secondaryExposureIds?: string[];
  observedImpact?: string | null;
  actionPlan?: string | null;
}

const SENSITIVITY_OPTIONS = [
  { value: '', label: '— Non renseignée —' },
  { value: '1', label: '1 — Faible' },
  { value: '2', label: '2 — Modérée' },
  { value: '3', label: '3 — Forte' },
  { value: '4', label: '4 — Très forte' },
];

export function ImpactFormFields({
  exposures,
  defaults,
}: {
  exposures: ExposureOption[];
  defaults?: ImpactFormDefaults;
}) {
  const selectedSecondary = new Set(defaults?.secondaryExposureIds ?? []);

  return (
    <>
      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Description</h2>
        <div className="c-input__group">
          <label className="c-input__label" htmlFor="description">
            Description courte (max 255 caractères)
          </label>
          <input
            id="description"
            name="description"
            type="text"
            maxLength={255}
            defaultValue={defaults?.description ?? ''}
            className="c-input w-100"
          />
        </div>
        <div className="c-input__group mt-3">
          <label className="c-input__label" htmlFor="observedImpact">
            Description longue de l&apos;impact observé
          </label>
          <textarea
            id="observedImpact"
            name="observedImpact"
            rows={4}
            defaultValue={defaults?.observedImpact ?? ''}
            className="c-input w-100"
          />
        </div>
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Sensibilité</h2>
        <div className="c-input__group">
          <label className="c-input__label" htmlFor="sensitivity">
            Note de sensibilité (1 à 4)
          </label>
          <select
            id="sensitivity"
            name="sensitivity"
            defaultValue={defaults?.sensitivity ?? ''}
            className="c-input"
          >
            {SENSITIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="c-input__group mt-3">
          <label className="c-input__label" htmlFor="justification">
            Justification de la sensibilité
          </label>
          <textarea
            id="justification"
            name="justification"
            rows={3}
            defaultValue={defaults?.justification ?? ''}
            className="c-input w-100"
          />
        </div>
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Aléa principal</h2>
        <select
          name="primaryExposureId"
          defaultValue={defaults?.primaryExposureId ?? ''}
          className="c-input w-100"
        >
          <option value="">— Aucun —</option>
          {exposures.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Aléas secondaires</h2>
        <p className="c-subtitle-grey">
          Coche les aléas observés qui contribuent secondairement à cet impact.
        </p>
        {exposures.map((e) => (
          <div key={e.id} className="c-checkbox__group">
            <input
              id={`sec-${e.id}`}
              type="checkbox"
              name="secondaryExposureIds"
              value={e.id}
              defaultChecked={selectedSecondary.has(e.id)}
              className="mr-2"
            />
            <label htmlFor={`sec-${e.id}`}>{e.label}</label>
          </div>
        ))}
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Politiques et actions existantes</h2>
        <textarea
          name="actionPlan"
          rows={3}
          defaultValue={defaults?.actionPlan ?? ''}
          className="c-input w-100"
        />
      </div>

      <div className="d-flex justify-content-between">
        <Link href="/workspace/sensibility" className="c-btn--tertiary">
          Annuler
        </Link>
        <button type="submit" className="c-btn--primary">
          Enregistrer
        </button>
      </div>
    </>
  );
}
