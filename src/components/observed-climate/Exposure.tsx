'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { typeExposure } from '@/lib/typeExposure';
import { deleteObservedExposure } from '@/server/observed-exposure/actions';

export type ExposureItem = {
  id: string;
  categoryIcon: string;
  hazardName: string;
  climateFeatures: string | null;
  trends: string | null;
  sources: string | null;
  exposure: number | null;
  justification: string | null;
};

/**
 * Port de `app-exposure` (Angular legacy).
 *
 * Affiche une carte par exposition observée avec :
 *  – contenu principal à gauche (nom + caractéristiques + tendances + sources)
 *  – sidebar « infos » colorée à droite (icône eye + niveau + justification)
 *  – panneau outils caché en bord droit qui se révèle au hover, avec boutons
 *    Modifier / Supprimer.
 *
 * Le bouton Supprimer ouvre une modale de confirmation (`<dialog>` natif), puis
 * appelle l'action serveur `deleteObservedExposure`.
 */
export function Exposure({ items }: { items: ExposureItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<ExposureItem | null>(null);
  const [, startTransition] = useTransition();

  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : '';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onClose = () => {
      document.body.style.overflow = '';
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  const openConfirm = (item: ExposureItem) => {
    setPending(item);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.showModal();
  };

  const cancel = () => {
    document.body.style.overflow = '';
    dialogRef.current?.close();
    setPending(null);
  };

  const confirmDelete = () => {
    if (!pending) return;
    document.body.style.overflow = '';
    dialogRef.current?.close();
    const id = pending.id;
    setPending(null);
    startTransition(async () => {
      await deleteObservedExposure(id);
      router.refresh();
    });
  };

  return (
    <>
      {items.map((item) => (
        <section key={item.id} className="sc-exposure">
          <div className="sc-exposure__content">
            <div className="sc-exposure__title">
              <em className={`c-icon ${item.categoryIcon}`} aria-hidden="true" />
              {item.hazardName}
            </div>
            {item.climateFeatures && (
              <>
                <label>Caractéristiques actuelles du climat du territoire</label>
                <p>{item.climateFeatures}</p>
              </>
            )}
            {item.trends && (
              <>
                <label>Evolutions tendancielles passées</label>
                <p>{item.trends}</p>
              </>
            )}
            {item.sources && (
              <>
                <label>Sources</label>
                <p>{item.sources}</p>
              </>
            )}
          </div>
          <div className="sc-exposure__infos">
            {item.exposure !== null && item.exposure >= 0 && (
              <>
                <div className="sc-exposure__infos-expo">
                  <em className="c-icon eye" aria-hidden="true" />
                  <span>{item.exposure}</span>
                </div>
                <span>Exposition {typeExposure(item.exposure)}</span>
              </>
            )}
            {item.justification && <p className="u-margin__top">{item.justification}</p>}
          </div>
          <div className="sc-exposure__tools">
            <Link
              aria-label="Modifier"
              href={`/observed-climate/observed-exposure/${item.id}/edit${suffix}`}
              className="c-icon__circle project-secondary"
            >
              <em className="c-icon default-secondary pen" aria-hidden="true" />
            </Link>
            <button
              type="button"
              aria-label="Supprimer"
              onClick={() => openConfirm(item)}
              className="c-icon__circle project-secondary"
            >
              <em className="c-icon default-secondary delete" aria-hidden="true" />
            </button>
          </div>
        </section>
      ))}

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
                <h3>Suppression d&apos;un aléa</h3>
              </div>
              <p>Confirmez-vous la suppression de l&apos;aléa ?</p>
              <div className="c-group-buttons c-group-buttons--end">
                <button
                  type="button"
                  className="c-btn--tertiary"
                  onClick={cancel}
                  title="Non"
                >
                  Non
                </button>
                <button
                  type="button"
                  className="c-btn--primary"
                  onClick={confirmDelete}
                  title="Oui"
                >
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
