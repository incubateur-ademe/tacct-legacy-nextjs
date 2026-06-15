'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteProjectSheet } from '@/server/admin/actions';

export type ProjectSheetAdminItem = {
  id: string;
  name: string;
  slug: string;
  domain: { name: string; icon: string } | null;
};

/**
 * Port de `app-project-sheet-admin-list` legacy.
 *
 * Liste d'items à fond blanc avec hover-reveal d'une bande d'actions (pen +
 * delete). Le bouton delete ouvre une dialog de confirmation.
 */
export function ProjectSheetAdminList({ items }: { items: ProjectSheetAdminItem[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<ProjectSheetAdminItem | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onClose = () => {
      document.body.style.overflow = '';
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  const openConfirm = (item: ProjectSheetAdminItem) => {
    setPending(item);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.showModal();
  };

  const cancel = () => {
    document.body.style.overflow = '';
    dialogRef.current?.close();
    setPending(null);
  };

  const confirm = () => {
    if (!pending) return;
    const id = pending.id;
    document.body.style.overflow = '';
    dialogRef.current?.close();
    setPending(null);
    startTransition(async () => {
      await deleteProjectSheet(id);
      router.refresh();
    });
  };

  return (
    <>
      <div className="sc-project-sheet-admin-list">
        {items.map((item) => (
          <div key={item.id} className="sc-project-sheet-admin-list__list-item o-card-p-0">
            <p className="sc-project-sheet-admin-list__name txt-bold">{item.name}</p>
            <div className="sc-project-sheet-admin-list__domain">
              <span
                className={`c-icon medium color-project-primary-action ${
                  item.domain?.icon ?? 'status-error'
                }`}
                aria-hidden="true"
              />
              <p className="mb-0 ml-3">
                {item.domain?.name ?? "Sans domaine d'activité"}
              </p>
            </div>
            <div className="sc-project-sheet-admin-list__actions-area">
              <div className="sc-project-sheet-admin-list__actions">
                <Link
                  href={`/gestion/project-sheet-management/${item.id}`}
                  className="c-icon__circle project-secondary"
                  aria-label="Modifier"
                >
                  <span className="c-icon default-secondary pen" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => openConfirm(item)}
                  className="c-icon__circle project-secondary"
                  aria-label="Supprimer"
                >
                  <span className="c-icon default-secondary delete" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <dialog ref={dialogRef} className="modal-dialog">
        <div className="modal-content">
          <button
            type="button"
            aria-label="Fermer"
            className="sc-modal__close project-link"
            onClick={cancel}
          >
            <em className="c-icon close" aria-hidden="true" />
          </button>
          <div className="sc-modal__type">
            <em className="c-icon project-primary-secondary status-incomplete" aria-hidden="true" />
          </div>
          <div className="sc-modal__container">
            <div className="sc-modal__content">
              <div className="sc-modal__content__titles">
                <span className="sc-modal__title-info">Fiches Projet</span>
                <h3>Suppression d&apos;une fiche projet</h3>
              </div>
              <p>Souhaitez vous supprimer cette fiche projet ?</p>
              <div className="c-group-buttons c-group-buttons--end">
                <button type="button" className="c-btn--tertiary" onClick={cancel}>
                  Annuler
                </button>
                <button type="button" className="c-btn--primary" onClick={confirm}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
