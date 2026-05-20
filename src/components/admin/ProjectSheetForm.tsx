import Link from 'next/link';

export interface DomainOption {
  id: string;
  name: string;
}

export interface ProjectSheetDefaults {
  name?: string;
  slug?: string;
  abstract?: string;
  domainId?: string | null;
  areaType?: string | null;
  activityType?: string | null;
  expectedEffects?: string | null;
  consequences?: string | null;
  resources?: string | null;
  imageAlt?: string | null;
  imageCredit?: string | null;
}

export function ProjectSheetForm({
  mode,
  domains,
  defaults,
  action,
}: {
  mode: 'create' | 'edit';
  domains: DomainOption[];
  defaults?: ProjectSheetDefaults;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Informations</h2>
        <div className="row">
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="name">
              Nom * (max 70 caractères)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={70}
              defaultValue={defaults?.name ?? ''}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="slug">
              Slug (auto si vide) — unique
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              maxLength={255}
              defaultValue={defaults?.slug ?? ''}
              className="c-input w-100"
            />
          </div>
        </div>
        <div className="mb-2">
          <label className="c-input__label" htmlFor="abstract">
            Résumé * (max 200 caractères)
          </label>
          <textarea
            id="abstract"
            name="abstract"
            required
            rows={2}
            maxLength={200}
            defaultValue={defaults?.abstract ?? ''}
            className="c-input w-100"
          />
        </div>
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Taxonomies</h2>
        <div className="row">
          <div className="col-md-4 mb-2">
            <label className="c-input__label" htmlFor="domainId">
              Domaine
            </label>
            <select
              id="domainId"
              name="domainId"
              defaultValue={defaults?.domainId ?? ''}
              className="c-input w-100"
            >
              <option value="">— Aucun —</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-2">
            <label className="c-input__label" htmlFor="areaType">
              Type de territoire (4 caractères max)
            </label>
            <input
              id="areaType"
              name="areaType"
              type="text"
              maxLength={4}
              defaultValue={defaults?.areaType ?? ''}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-4 mb-2">
            <label className="c-input__label" htmlFor="activityType">
              Type d&apos;activité (4 caractères max)
            </label>
            <input
              id="activityType"
              name="activityType"
              type="text"
              maxLength={4}
              defaultValue={defaults?.activityType ?? ''}
              className="c-input w-100"
            />
          </div>
        </div>
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Contenus</h2>
        <div className="mb-2">
          <label className="c-input__label" htmlFor="expectedEffects">
            Effets attendus (une entrée par ligne, ou format libre)
          </label>
          <textarea
            id="expectedEffects"
            name="expectedEffects"
            rows={4}
            defaultValue={defaults?.expectedEffects ?? ''}
            className="c-input w-100"
          />
        </div>
        <div className="mb-2">
          <label className="c-input__label" htmlFor="consequences">
            Conséquences (une entrée par ligne, ou format libre)
          </label>
          <textarea
            id="consequences"
            name="consequences"
            rows={4}
            defaultValue={defaults?.consequences ?? ''}
            className="c-input w-100"
          />
        </div>
        <div className="mb-2">
          <label className="c-input__label" htmlFor="resources">
            Ressources (texte libre, ou JSON)
          </label>
          <textarea
            id="resources"
            name="resources"
            rows={3}
            defaultValue={defaults?.resources ?? ''}
            className="c-input w-100"
          />
        </div>
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Image</h2>
        <p className="c-subtitle-grey">
          Upload de fichier à brancher plus tard. Pour l&apos;instant on saisit
          uniquement le texte alternatif et le crédit.
        </p>
        <div className="row">
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="imageAlt">
              Texte alternatif (50 caractères max)
            </label>
            <input
              id="imageAlt"
              name="imageAlt"
              type="text"
              maxLength={50}
              defaultValue={defaults?.imageAlt ?? ''}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="imageCredit">
              Crédit photo (50 caractères max)
            </label>
            <input
              id="imageCredit"
              name="imageCredit"
              type="text"
              maxLength={50}
              defaultValue={defaults?.imageCredit ?? ''}
              className="c-input w-100"
            />
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between">
        <Link
          href="/workspace/gestion/project-sheet-management"
          className="c-btn--tertiary"
        >
          Annuler
        </Link>
        <button type="submit" className="c-btn--primary">
          {mode === 'create' ? 'Créer la fiche' : 'Mettre à jour'}
        </button>
      </div>
    </form>
  );
}
