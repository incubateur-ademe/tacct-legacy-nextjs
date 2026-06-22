'use client';

import { BlockHeader } from '@/components/ui/BlockHeader';
import { deleteImpactTheme, updateImpactThemeJustification } from '@/server/sensibility/actions';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { SensibilityCard, type SensibilityCardItem } from './SensibilityCard';

export type SensibilityThemeItem = {
  id: string;
  name: string;
  icon: string;
  justification: string;
  impacts: SensibilityCardItem[];
};

/**
 * Port de `app-sensibility-theme` du legacy.
 *
 * Accordéon repliable par thématique. L'en-tête contient l'icône, le nom, le
 * compteur d'impacts, le step-status (incomplet si un impact n'a pas de
 * sensitivity) et le chevron up/down. Le panneau ouvert affiche :
 *  – la justification de la thématique avec un bouton crayon pour éditer
 *    (en place, avec textarea + Enregistrer/Annuler)
 *  – la liste des impacts sous forme de `<SensibilityCard>`
 *  – en bas : « Supprimer la thématique » + « Ajouter un impact »
 */
export function SensibilityTheme({ theme }: { theme: SensibilityThemeItem }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(theme.justification);
  const [, startTransition] = useTransition();

  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : '';
  const addImpactHref = `/sensibility/impact-theme/impact/add/${theme.id}${suffix}`;

  const allImpactsValid = theme.impacts.every((i) => i.sensitivity !== null);
  const showThemeStatus = theme.impacts.length === 0 || !allImpactsValid;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onClose = () => {
      document.body.style.overflow = '';
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  const openDelete = () => {
    document.body.style.overflow = 'hidden';
    dialogRef.current?.showModal();
  };
  const cancelDelete = () => {
    document.body.style.overflow = '';
    dialogRef.current?.close();
  };
  const confirmDelete = () => {
    document.body.style.overflow = '';
    dialogRef.current?.close();
    startTransition(async () => {
      await deleteImpactTheme(theme.id);
      router.refresh();
    });
  };

  const saveJustification = () => {
    startTransition(async () => {
      await updateImpactThemeJustification(theme.id, draft);
      setEditing(false);
      router.refresh();
    });
  };
  const cancelEdit = () => {
    setDraft(theme.justification);
    setEditing(false);
  };

  return (
    <>
      <div className="c-exposure c-sensibility-theme mt-5">
        <div className="o-card-p-0">
          <div className="c-accordion__header d-flex align-items-center align-content-center justify-content-between w-100">
            <BlockHeader
              className="col-16"
              pageTitle={theme.name}
              icon={theme.icon || 'suspended'}
              size="medium"
              nbElement={theme.impacts.length}
            />
            {/* <div className="mt-3 ml-3 mr-auto pb-3">
              {showThemeStatus && <StepStatus status="incomplete" />}
            </div> */}
            <button
              type="button"
              aria-label={opened ? 'Replier' : 'Déplier'}
              aria-expanded={opened}
              className="c-sensibility-theme__toggle"
              onClick={() => setOpened((v) => !v)}
            >
              <em
                className={`c-icon medium project-primary ${
                  opened ? 'chevron-up' : 'chevron-down'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {opened && (
            <div className="c-sensibility-theme__panel">
              {!editing ? (
                <div className="d-flex">
                  <p>{theme.justification}</p>
                  <button
                    type="button"
                    aria-label="Modifier la justification"
                    className="c-btn--secondary-icon-circle c-sensibility-theme__edit-theme mr-2 ml-auto"
                    title="Modifier la thematique"
                    onClick={() => setEditing(true)}
                  >
                    <em className="c-icon pen" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div>
                  <section>
                    <div className="row">
                      <div className="c-input__group col-md-12 col-sm-16 input-size-large">
                        <textarea
                          className="c-input"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                        />
                        <label className="c-input__label">Justification</label>
                      </div>
                    </div>
                  </section>
                  <div className="c-box__sensibilite-bottom-theme">
                    <button type="button" onClick={cancelEdit} className="c-input__sensibilite">
                      Annuler
                    </button>
                    <button type="button" onClick={saveJustification} className="c-btn--primary">
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {theme.impacts.map((impact) => (
                <SensibilityCard key={impact.id} impact={impact} />
              ))}

              <div className="c-box__sensibilite-bottom-theme c-box__edit-theme">
                <button type="button" onClick={openDelete} className="c-input__sensibilite">
                  Supprimer la thématique
                </button>
                <Link href={addImpactHref} className="c-btn--primary">
                  Ajouter un impact
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <dialog ref={dialogRef} className="modal-dialog">
        <div className="modal-content">
          <button
            type="button"
            aria-label="Fermer"
            className="sc-modal__close project-link"
            onClick={cancelDelete}
          >
            <em className="c-icon close" aria-hidden="true" />
          </button>
          <div className="sc-modal__type">
            <em className="c-icon project-primary-secondary status-incomplete" aria-hidden="true" />
          </div>
          <div className="sc-modal__container">
            <div className="sc-modal__content">
              <div className="sc-modal__content__titles">
                <h3>Suppression d&apos;une thématique</h3>
              </div>
              {theme.impacts.length > 0 && (
                <p>La suppression d&apos;une thématique supprimera ses impacts</p>
              )}
              <p>Confirmez-vous la suppression de la thématique ?</p>
              <div className="c-group-buttons c-group-buttons--end">
                <button type="button" className="c-btn--tertiary" onClick={cancelDelete}>
                  Non
                </button>
                <button type="button" className="c-btn--primary" onClick={confirmDelete}>
                  Oui
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
