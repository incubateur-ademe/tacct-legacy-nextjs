import Link from 'next/link';
import { sensibilityLabel } from '@/lib/sensibility';
import { SecondaryExposuresSectionClient } from './SecondaryExposuresSectionClient';

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

/**
 * Port des champs de form impact du legacy (add-impact + edit-impact).
 *
 * Structure :
 *  – Description courte (input avec floating label, max 50)
 *  – Sensibilité observée : select 1-4 + justification (en row flex-nowrap)
 *  – Section "Aléa principal" (`o-section--even`) : select primary + liste
 *    secondaires (input disabled + bouton supprimer) + select pour ajouter
 *  – Description longue (textarea)
 *  – Politiques/actions (textarea)
 *  – Boutons Annuler/Enregistrer
 *
 * Les aléas secondaires sont gérés en client (état local) pour pouvoir
 * supprimer/ajouter sans rechargement.
 */
export function ImpactFormFields({
  exposures,
  defaults,
}: {
  exposures: ExposureOption[];
  defaults?: ImpactFormDefaults;
}) {
  return (
    <>
      <section>
        <div className="row">
          <div className="c-input__group col-sm-16 w-100">
            <input
              id="description"
              name="description"
              type="text"
              maxLength={50}
              className="c-input__large"
              defaultValue={defaults?.description ?? ''}
            />
            <label className="c-input__label" htmlFor="description">
              Description courte
            </label>
            <div className="c-required">*obligatoire</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="c-legend-paragraphe mb-2">Sensibilité observée</h2>
        <div className="row flex-nowrap col-md-16">
          <div className="c-input__group col-sm-16" id="c-add-impact__sensitivity">
            <select
              id="sensitivity"
              name="sensitivity"
              className="c-input"
              defaultValue={defaults?.sensitivity ?? ''}
            >
              <option value="" disabled>
                Sensibilité du territoire
              </option>
              {[1, 2, 3, 4].map((v) => (
                <option key={v} value={v}>
                  {v} - {sensibilityLabel(v)}
                </option>
              ))}
            </select>
            <div className="c-required">*requis</div>
            <label className="c-input__label" htmlFor="sensitivity">
              Sensibilité du territoire
            </label>
          </div>

          <div className="c-input__group col-sm-16 w-100">
            <textarea
              id="justification"
              name="justification"
              className="c-input__large"
              defaultValue={defaults?.justification ?? ''}
            />
            <label className="c-input__label" htmlFor="justification">
              Justification
            </label>
          </div>
        </div>
      </section>

      <SecondaryExposuresSectionClient
        exposures={exposures}
        initialPrimary={defaults?.primaryExposureId ?? null}
        initialSecondaries={defaults?.secondaryExposureIds ?? []}
      />

      <section>
        <div className="row">
          <div className="c-input__group col-sm-16 w-100">
            <textarea
              id="observedImpact"
              name="observedImpact"
              className="c-input__large"
              defaultValue={defaults?.observedImpact ?? ''}
            />
            <label className="c-input__label" htmlFor="observedImpact">
              Description longue
            </label>
          </div>
        </div>
        <div className="row">
          <div className="c-input__group col-sm-16 w-100">
            <textarea
              id="actionPlan"
              name="actionPlan"
              className="c-input__large"
              defaultValue={defaults?.actionPlan ?? ''}
            />
            <label className="c-input__label" htmlFor="actionPlan">
              Politiques, actions, projets existants
            </label>
          </div>
        </div>
      </section>

      <div className="o-btn--end">
        <Link href="/sensibility" className="c-btn--tertiary" title="Annuler">
          Annuler
        </Link>
        <button type="submit" className="c-btn--primary" title="Enregistrer">
          Enregistrer
        </button>
      </div>
    </>
  );
}

