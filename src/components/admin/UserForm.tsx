import Link from 'next/link';

export interface StudyOfficeOption {
  id: string;
  name: string;
}

export interface CommuneOption {
  id: string;
  label: string;
  postalCode: string | null;
}

export function UserForm({
  mode,
  studyOffices,
  defaults,
  action,
}: {
  mode: 'create' | 'edit';
  studyOffices: StudyOfficeOption[];
  defaults?: {
    firstname?: string;
    lastname?: string;
    email?: string;
    username?: string;
    communeId?: string | null;
    communeLabel?: string | null;
    communePostalCode?: string | null;
    studyOfficeId?: string | null;
    isAdmin?: boolean;
    validated?: boolean;
  };
  action: (formData: FormData) => Promise<void>;
}) {
  const lockIdentity = mode === 'edit';
  return (
    <form action={action}>
      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Identité</h2>
        <div className="row">
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="firstname">
              Prénom *
            </label>
            <input
              id="firstname"
              name="firstname"
              type="text"
              required
              defaultValue={defaults?.firstname ?? ''}
              readOnly={lockIdentity}
              maxLength={255}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="lastname">
              Nom *
            </label>
            <input
              id="lastname"
              name="lastname"
              type="text"
              required
              defaultValue={defaults?.lastname ?? ''}
              readOnly={lockIdentity}
              maxLength={255}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaults?.email ?? ''}
              readOnly={lockIdentity}
              maxLength={255}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="username">
              Username (laisser vide pour reprendre l&apos;email)
            </label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={defaults?.username ?? ''}
              readOnly={lockIdentity}
              maxLength={255}
              className="c-input w-100"
            />
          </div>
        </div>
        {lockIdentity && (
          <p className="c-subtitle-grey mt-1">
            Les champs d&apos;identité sont en lecture seule après création (synchronisés
            avec l&apos;annuaire).
          </p>
        )}
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Rattachement</h2>
        <div className="row">
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="communeId">
              Commune (id ou code postal pour l&apos;instant)
            </label>
            <input
              id="communeId"
              name="communeId"
              type="text"
              defaultValue={defaults?.communeId ?? ''}
              className="c-input w-100"
              placeholder="Saisis l'ID de commune"
            />
            {defaults?.communeLabel && (
              <small className="c-subtitle-grey">
                Actuelle : {defaults.communeLabel} ({defaults.communePostalCode ?? '?'})
              </small>
            )}
          </div>
          <div className="col-md-6 mb-2">
            <label className="c-input__label" htmlFor="studyOfficeId">
              Bureau d&apos;étude
            </label>
            <select
              id="studyOfficeId"
              name="studyOfficeId"
              defaultValue={defaults?.studyOfficeId ?? ''}
              className="c-input w-100"
            >
              <option value="">— Aucun —</option>
              {studyOffices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Droits</h2>
        <div className="c-checkbox__group">
          <input
            type="checkbox"
            id="isAdmin"
            name="isAdmin"
            defaultChecked={defaults?.isAdmin ?? false}
            className="mr-2"
          />
          <label htmlFor="isAdmin">Administrateur (ROLE_ADMIN)</label>
        </div>
        <div className="c-checkbox__group">
          <input
            type="checkbox"
            id="validated"
            name="validated"
            defaultChecked={defaults?.validated ?? false}
            className="mr-2"
          />
          <label htmlFor="validated">Compte validé</label>
        </div>
      </div>

      <div className="d-flex justify-content-between">
        <Link href="/gestion/account-management" className="c-btn--tertiary">
          Annuler
        </Link>
        <button type="submit" className="c-btn--primary">
          {mode === 'create' ? 'Créer le compte' : 'Mettre à jour'}
        </button>
      </div>
    </form>
  );
}
