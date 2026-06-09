'use client';

import { useRef, useTransition } from 'react';
import { validateStrategyConstruction } from '@/server/strategies/actions';

/**
 * Port du bouton « Exporter mon plan d'action » + modale TeT (legacy
 * studied-impacts.component). À la confirmation : valide la construction des
 * stratégies puis déclenche le téléchargement du CSV.
 */
export function ExportActionPlanButton({
  studyId,
  disabled,
}: {
  studyId: string;
  disabled: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const openModal = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  };

  const closeModal = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    document.body.style.overflow = '';
    dialog.close();
  };

  const confirmExport = () => {
    startTransition(async () => {
      await validateStrategyConstruction(studyId);
      closeModal();
      window.location.assign(`/api/export-tet/${studyId}`);
    });
  };

  return (
    <>
      <button
        type="button"
        className="c-btn--secondary sc-studied-impacts__export-tet-button"
        onClick={openModal}
        disabled={disabled}
        title={
          disabled
            ? "Vous devez renseigner au moins un impact étudié pour exporter votre plan d'action"
            : undefined
        }
      >
        <em className="c-icon download" aria-hidden="true" />
        <span>Exporter mon plan d&apos;action</span>
      </button>

      <dialog ref={dialogRef} className="modal-dialog">
        <div className="modal-content">
          <button
            type="button"
            aria-label="Fermer"
            className="sc-modal__close project-link"
            onClick={closeModal}
          >
            <em className="c-icon close" aria-hidden="true" />
          </button>

          <div className="sc-modal__type">
            <em className="c-icon project-primary-secondary status-incomplete" aria-hidden="true" />
          </div>

          <div className="sc-modal__container">
            <div className="sc-modal__content">
              <div className="sc-modal__content__titles">
                <span className="sc-modal__title-info">Construction des statégies</span>
                <h3>Terminer et télécharger votre plan d&apos;action</h3>
              </div>

              <p className="u-margin__bottom--lower">
                Lorsque vous aurez saisi les actions à mettre en place pour chacun de vos impacts
                étudiés, vous pourrez exporter votre plan d&apos;action via le bouton ci-dessous.
                Notez que vous pourrez toujours y apporter des modifications ultérieures.
              </p>
              <p>
                Si vous le souhaitez, il est possible d&apos;envoyer votre plan d&apos;action par
                mail à l&apos;équipe de Territoires en Transitions pour suivi (n&apos;oubliez pas de
                préciser le nom de votre collectivité territoriale !). Pour plus d&apos;informations,
                veuillez consulter la section “Et après ? Pilotez votre plan d&apos;action” présente
                dans le menu d&apos;aides à droite de l&apos;écran.
              </p>

              <div className="c-group-buttons c-group-buttons--end">
                <button
                  type="button"
                  aria-label="Annuler"
                  className="c-btn--tertiary"
                  title="Annuler"
                  onClick={closeModal}
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  id="export-plan-action"
                  aria-label="Terminer et exporter mon plan d'action"
                  className="c-btn--primary"
                  title="Terminer et exporter mon plan d'action"
                  onClick={confirmExport}
                  disabled={isPending}
                >
                  Terminer et exporter mon plan d&apos;action
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
