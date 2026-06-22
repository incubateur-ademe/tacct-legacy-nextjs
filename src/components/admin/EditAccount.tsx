'use client';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { activateAccount, createStudyForAccount, deleteAccount } from '@/server/admin/actions';
import { useState, useTransition } from 'react';
import { CommuneAutocomplete } from './CommuneAutocomplete';
import { StatusAccount } from './StatusAccount';

interface StudyItem {
  territoryName: string;
  year: number;
}

export interface EditAccountProps {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  validated: boolean;
  commune: { id: string; label: string; postalCode: string | null } | null;
  studies: StudyItem[];
}

/**
 * Port de `edit-account` legacy. Une seule `<form>` ; les boutons utilisent
 * `formAction` pour cibler l'action serveur correspondante (Synchroniser /
 * Activer + créer l'étude / Enregistrer + créer l'étude). La suppression passe
 * par une modale de confirmation.
 */
export function EditAccount({
  id,
  firstname,
  lastname,
  email,
  validated,
  commune,
  studies,
}: EditAccountProps) {
  const hasStudies = studies.length > 0;
  const communeEditable = !hasStudies;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteAccount(id);
    });
  };

  return (
    <>
      <form>
        <h2 className="c-legend mb-2 ml-2">Coordonnées</h2>
        <section className="mt-2">
          <div className="d-flex flex-nowrap">
            <div className="c-input__group col-sm-16 w-50">
              <input
                className="c-input__large"
                type="text"
                value={firstname}
                readOnly
                id="firstName"
              />
              <label className="c-input__label" htmlFor="firstName">
                Prénom
              </label>
            </div>
            <div className="c-input__group col-sm-16 w-50">
              <input
                className="c-input__large"
                type="text"
                value={lastname}
                readOnly
                id="lastName"
              />
              <label className="c-input__label" htmlFor="lastName">
                Nom
              </label>
            </div>
          </div>
          <div className="d-flex flex-nowrap">
            <div className="c-input__group col-sm-16 w-50">
              <input className="c-input__large" type="text" value={email} readOnly id="email" />
              <label className="c-input__label" htmlFor="email">
                Adresse mail
              </label>
            </div>
            {communeEditable ? (
              <div className="w-50">
                <div className="c-input__group d-block w-100">
                  <CommuneAutocomplete
                    name="communeId"
                    defaultCommuneId={commune?.id}
                    defaultLabel={
                      commune
                        ? commune.postalCode
                          ? `${commune.label} - ${commune.postalCode}`
                          : commune.label
                        : ''
                    }
                  />
                  <label className="c-input__label">Commune de rattachement</label>
                </div>
              </div>
            ) : (
              <div className="c-input__group col-sm-16 w-50">
                <input type="hidden" name="communeId" value={commune?.id ?? ''} />
                {commune && (
                  <div className="label">
                    <span className="c-input__label">Commune de rattachement</span>
                    <div className="c-subtitle-black-bold">
                      {commune.label} - {commune.postalCode}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {!validated && (
          <>
            <section className="mt-2 ml-2">
              <h2 className="c-legend mb-2">Activation du compte</h2>
              <div className="d-flex">
                <span className="mr-2">Le compte est actuellement</span>
                <StatusAccount status={validated} />
              </div>
              <span>Une fois activé, le chargé d’étude accèdera à une nouvelle étude vierge.</span>
            </section>
            <section>
              <div className="o-btn--start">
                <button
                  className="c-btn--primary"
                  type="submit"
                  formAction={activateAccount.bind(null, id)}
                  title="Activer le compte et créer l’étude"
                >
                  Activer le compte et créer l’étude
                </button>
                {/* <button
                  className="c-btn--secondary"
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  title="Supprimer le compte"
                >
                  Supprimer le compte
                </button> */}
              </div>
            </section>
          </>
        )}

        {validated && !hasStudies && (
          <section>
            <div className="o-btn--start">
              <button
                className="c-btn--primary"
                type="submit"
                formAction={createStudyForAccount.bind(null, id)}
                title="Créer une étude"
              >
                Enregistrer et Créer l&apos;étude
              </button>
            </div>
          </section>
        )}

        {validated && (
          <section className="mt-2">
            {studies.map((study, index) => (
              <div key={index} className="o-card mb-3">
                <span className="c-subtitle-black-bold mr-2">{study.territoryName}</span>
                <span>{study.year}</span>
              </div>
            ))}
          </section>
        )}
      </form>

      <ConfirmModal
        open={confirmOpen}
        title="Suppression d'un compte"
        confirmLabel="Oui"
        cancelLabel="Non"
        pending={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      >
        <p>Confirmez-vous la suppression du compte ?</p>
      </ConfirmModal>
    </>
  );
}
