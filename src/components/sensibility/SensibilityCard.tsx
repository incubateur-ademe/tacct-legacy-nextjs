'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepStatus } from '@/components/ui/StepStatus';
import { sensibilityLabel } from '@/lib/sensibility';
import { deleteImpact } from '@/server/sensibility/actions';

export type SensibilityCardItem = {
  id: string;
  description: string;
  sensitivity: number | null;
  justification: string;
  observedImpact: string | null;
  actionPlan: string | null;
  primaryHazardName: string;
  primaryHazardIcon: string;
  secondaryHazardNames: string[];
};

/**
 * Port de `app-sensibility-card` du legacy.
 *
 * Card horizontale par impact :
 *  – Contenu (gauche) : description courte + status badge si invalide,
 *    aléa principal + secondaires, description longue, politiques/actions
 *  – Panneau ghost (centre) : niveau de sensibilité + libellé + justification
 *    avec "Voir plus / Voir moins" si > 50 caractères
 *  – Section bleue (droite) : boutons pen (Modifier) + delete (Supprimer)
 *
 * La suppression ouvre une dialog de confirmation.
 */
export function SensibilityCard({ impact }: { impact: SensibilityCardItem }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showMore, setShowMore] = useState(false);
  const [, startTransition] = useTransition();

  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : '';
  const editHref = `/sensibility/impact-theme/impact/edit/${impact.id}${suffix}`;

  // Sensitivity non renseignée = invalide (cf. `Utils.isValidImpact`)
  const valid = impact.sensitivity !== null;

  const justification = impact.justification ?? '';
  const justLength = justification.length;
  const truncated = justLength > 50;
  const displayedJust = !showMore && truncated ? justification.slice(0, 50) : justification;

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
      await deleteImpact(impact.id);
      router.refresh();
    });
  };

  return (
    <>
      <div className="c-exposure row mt-5">
        <div className="col-lg-12 col-md-16">
          <div className="o-card-p-0">
            <div className="row">
              <div className="container w-100">
                <div className="cord-two-cols">
                  {/* ── Contenu gauche ── */}
                  <div className="content">
                    <section>
                      <div className="w-100 d-flex align-items-center align-content-center ml-2">
                        <p className="c-subtitle-black-bold c-text__impact-description">
                          {impact.description}
                        </p>
                        <div className="mt-2 ml-3 mr-auto pb-3">
                          {!valid && <StepStatus status="incomplete" />}
                        </div>
                      </div>
                      <div className="d-flex">
                        <div>
                          <em
                            className={`c-icon lower ${impact.primaryHazardIcon} mr-1`}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-1 row">
                          <div className="p-small">
                            {impact.primaryHazardName}
                            {impact.secondaryHazardNames.length > 0 && (
                              <span className="p-small">,&nbsp;</span>
                            )}
                          </div>
                          {impact.secondaryHazardNames.map((name, i) => (
                            <div key={i}>
                              <span className="p-small">
                                {name}
                                {i < impact.secondaryHazardNames.length - 1 && (
                                  <span className="p-small">,&nbsp;</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                    <br />
                    {impact.observedImpact && (
                      <section>
                        <label className="title-disabled">Description longue</label>
                        <p className="title-normal">{impact.observedImpact}</p>
                      </section>
                    )}
                    {impact.actionPlan && (
                      <section>
                        <label className="title-disabled">
                          Politiques, actions, projets existants
                        </label>
                        <p className="title-normal">{impact.actionPlan}</p>
                      </section>
                    )}
                  </div>

                  {/* ── Panneau droit (ghost + section bleue) ── */}
                  <section className="card-right o-section-deletable d-flex">
                    <div className="o-section-info content section-ghost">
                      <div className="o-section--right__body">
                        {impact.sensitivity !== null && (
                          <>
                            <div className="o-centred-elements d-flex align-items-center">
                              <em
                                className="c-icon project-primary sensibilite icon-nb"
                                aria-hidden="true"
                              />
                              <span className="o-observed-exposure__nb">
                                {impact.sensitivity}
                              </span>
                            </div>
                            <span className="o-observed-exposure__type-exposition mt-1">
                              Sensibilité {sensibilityLabel(impact.sensitivity).toLowerCase()}
                            </span>
                          </>
                        )}

                        <div className="o-observed-exposure__type-exposition-2 mt-2">
                          <p>{displayedJust}</p>
                        </div>

                        {truncated && (
                          <button
                            type="button"
                            className="o-observed-exposure__type-exposition mt-1"
                            onClick={() => setShowMore((v) => !v)}
                            style={{
                              background: 'transparent',
                              border: 0,
                              cursor: 'pointer',
                            }}
                          >
                            {showMore ? 'Voir moins' : 'Voir plus'}
                            <em
                              className={`c-icon project-primary m ${
                                showMore ? 'chevron-up icon-nb' : 'chevron-down'
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="o-section-delete-edit section-blue">
                      <a
                        aria-label="Modifier l'impact"
                        href={editHref}
                        className="ml-auto mr-auto mt-2 c-icon__circle project-secondary sc-block-title-icon__icon"
                      >
                        <em className="c-icon default-secondary pen" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        aria-label="Supprimer l'impact"
                        onClick={openDelete}
                        className="ml-auto mr-auto mt-2 c-icon__circle project-secondary sc-block-title-icon__icon"
                      >
                        <em className="c-icon default-secondary delete" aria-hidden="true" />
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
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
                <h3>Suppression d&apos;un impact</h3>
              </div>
              <p>Confirmez-vous la suppression de l&apos;impact ?</p>
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
