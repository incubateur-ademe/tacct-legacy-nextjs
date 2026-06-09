'use client';

import { useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setImpactStudied, deleteImpactStrategy } from '@/server/strategies/actions';
import { pluralize } from '@/lib/pluralize';

export type ImpactItemData = {
  /** 'impact' = impact diagnostiqué, 'strategy' = impact stratégie ex nihilo. */
  kind: 'impact' | 'strategy';
  id: string;
  description: string;
  thematicIcon: string;
  thematicName: string;
  nbActions: number;
  nbTrajectories: number;
  /** Seuls les impacts stratégie sont éditables (legacy isEditable). */
  editable: boolean;
  /** Suppression désactivée pour les impacts prioritaires (legacy isDisabled). */
  deleteDisabled: boolean;
};

/**
 * Port de `app-impact-item` (legacy) : carte cliquable vers le niveau d'impact,
 * compteurs actions/trajectoires, et au survol un bloc éditer/supprimer.
 */
export function ImpactItem({ impact }: { impact: ImpactItemData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : '';

  const levelHref = `/workspace/impacts/${impact.kind}/${impact.id}/impact-level${suffix}`;
  const editHref = `/workspace/impacts/choose-impacts/${impact.id}${suffix}`;

  const messageEdit = impact.editable
    ? "Modifier l'impact"
    : impact.deleteDisabled
      ? 'Un impact prioritaire peut être modifié uniquement dans l’étape du diagnostic'
      : 'Un impact non prioritaire peut être modifié uniquement dans l’étape du diagnostic';

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

  const confirmDelete = () => {
    startTransition(async () => {
      if (impact.kind === 'strategy') {
        await deleteImpactStrategy(impact.id);
      } else {
        await setImpactStudied(impact.id, false);
      }
      closeModal();
      router.refresh();
    });
  };

  return (
    <>
      <div className="sc-impact-item__card mb-4">
        <Link href={levelHref} className="sc-impact-item__button">
          <em className={`c-icon sc-impact-item__icon ${impact.thematicIcon} blue medium`} aria-hidden="true" />
          <div className="sc-impact-item__text ml-3">
            <span className="sc-block-title-icon__title p-bold-primary">{impact.description}</span>
            <span className="title-normal my-0">{impact.thematicName}</span>
          </div>
        </Link>

        <div className="sc-impact-item__datas">
          <div className="sc-impact-item__data-item">
            <em className="c-icon sc-impact-item__icon module-report blue medium" aria-hidden="true" />
            <span className="title-normal my-0">
              <strong>{impact.nbActions}</strong> {pluralize(impact.nbActions, 'Action', 'Actions')}
            </span>
          </div>
          <div className="sc-impact-item__data-item">
            <em className="c-icon sc-impact-item__icon module-scenario blue medium" aria-hidden="true" />
            <span className="title-normal my-0">
              <strong>{impact.nbTrajectories}</strong>{' '}
              {pluralize(impact.nbTrajectories, 'Trajectoire', 'Trajectoires')}
            </span>
          </div>
        </div>

        <div className="sc-impact-item__edit-delete">
          {impact.editable ? (
            <Link
              href={editHref}
              aria-label="Modifier l'impact"
              className="c-icon__circle project-secondary"
              title={messageEdit}
            >
              <em className="c-icon default-secondary pen" aria-hidden="true" />
            </Link>
          ) : (
            <div
              aria-label="Modifier l'impact"
              className="c-icon__circle project-secondary link-disabled"
              title={messageEdit}
            >
              <em className="c-icon default-secondary pen" aria-hidden="true" />
            </div>
          )}
          <button
            type="button"
            aria-label="Supprimer"
            className="c-icon__circle project-secondary u-margin__top--lower"
            onClick={openModal}
            disabled={impact.deleteDisabled}
            title={
              impact.deleteDisabled
                ? 'Les impacts prioritaires sont obligatoirement étudiés'
                : "Supprimer l'impact"
            }
          >
            <em className="c-icon default-secondary delete" aria-hidden="true" />
          </button>
        </div>
      </div>

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
                <h3>Êtes-vous sûr de vouloir supprimer cet impact ?</h3>
              </div>

              <p>
                La suppression de cet impact va entraîner la suppression des actions et trajectoires
                qui y sont liées.
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
                  aria-label="Confirmer"
                  className="c-btn--primary"
                  title="Confirmer"
                  onClick={confirmDelete}
                  disabled={isPending}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
