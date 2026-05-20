'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Bouton "Accéder aux trajectoires" + modale conditionnelle si le diagnostic
 * n'est pas terminé.
 *
 * Port de `app-construct-strategy` (Angular legacy) :
 * - Si une des 3 étapes du diagnostic n'est pas `validated`, on affiche une
 *   modale "Vous n'avez pas fini votre diagnostic" au clic.
 * - Sinon le bouton est un lien direct vers `/workspace/impacts`.
 */
export function DiagnosticIncompleteButton({
  diagnosticComplete,
}: {
  diagnosticComplete: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Préserve `?study=…` et autres query params (équivalent du
  // `queryParamsHandling="preserve"` Angular).
  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : '';
  const impactsHref = `/workspace/impacts${suffix}`;
  const dashboardHref = `/workspace/dashboard${suffix}`;

  // Verrouille le scroll de la page derrière la modale ouverte.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onClose = () => {
      document.body.style.overflow = '';
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  if (diagnosticComplete) {
    return (
      <Link
        id="worskpace-acceder-trajectoires"
        className="c-btn--primary"
        href={impactsHref}
        title="Accéder aux trajectoires"
      >
        Accéder aux trajectoires
      </Link>
    );
  }

  const openModal = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  };

  const closeModal = (returnValue?: 'redirectStrategy' | 'redirectDiagnostic') => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    document.body.style.overflow = '';
    dialog.close(returnValue ?? '');
    if (returnValue === 'redirectStrategy') router.push(impactsHref);
    if (returnValue === 'redirectDiagnostic') router.push(dashboardHref);
  };

  return (
    <>
      <button
        id="worskpace-acceder-trajectoires"
        className="c-btn--primary"
        type="button"
        title="Accéder aux trajectoires"
        onClick={openModal}
      >
        Accéder aux trajectoires
      </button>

      <dialog ref={dialogRef} className="modal-dialog sc-diagnostic-modal">
        <div className="modal-content">
          <button
            type="button"
            aria-label="Fermer"
            className="sc-modal__close project-link"
            onClick={() => closeModal()}
          >
            <em className="c-icon close" aria-hidden="true" />
          </button>

          <div className="sc-modal__type">
            <em className="c-icon project-primary-secondary status-incomplete" aria-hidden="true" />
          </div>

          <div className="sc-modal__container">
            <div className="sc-modal__content">
              <div className="sc-modal__content__titles">
                <span className="sc-modal__title-info">Construction des stratégies</span>
                <h3>Vous n&apos;avez pas fini votre diagnostic</h3>
              </div>

              <p className="u-margin__bottom--lower">
                L&apos;une des étapes de votre diagnostic n&apos;a pas été validée. Pour déterminer
                des stratégies d&apos;action, nous réutilisons les impacts renseignés précédemment.
              </p>
              <p>
                Si vous avez effectué votre diagnostic de vulnérabilité en dehors de la plateforme
                TACCT, vous pouvez néanmoins accéder directement l&apos;étape{' '}
                <span className="u-txt-bold">Construire des Stratégies</span> en entrant
                manuellement les informations sur les impacts du changement climatique qui affectent
                votre territoire.
              </p>

              <div className="c-group-buttons c-group-buttons--end">
                <button
                  type="button"
                  aria-label="Revenir au diagnostic"
                  className="c-btn--tertiary"
                  title="REVENIR AU DIAGNOSTIC"
                  onClick={() => closeModal('redirectDiagnostic')}
                >
                  REVENIR AU DIAGNOSTIC
                </button>
                <button
                  type="button"
                  id="worskpace-commencer-strategie"
                  aria-label="Commencer sa stratégie"
                  className="c-btn--primary"
                  title="COMMENCER SA STRATEGIE"
                  onClick={() => closeModal('redirectStrategy')}
                >
                  COMMENCER SA STRATEGIE
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
