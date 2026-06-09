'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteImpactAction } from '@/server/strategies/impact-actions';
import { findTypeAction, findTypeApproche } from '@/lib/action-catalogs';
import {
  setColor,
  setColorAnticipation,
  setManageDotsBorderLeft,
  setManageDotsBorderRight,
  type Finalite,
} from '@/lib/manage-dots';
import { Dots } from './Dots';
import { FormAction, type ActionFormValues } from './FormAction';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { OwnerType } from '@/server/strategies/impact-queries';

export type CardActionData = ActionFormValues;

export function CardAction({
  type,
  ownerId,
  action,
  finaliteLabels,
  otherActions,
}: {
  type: OwnerType;
  ownerId: string;
  action: CardActionData;
  finaliteLabels: [string, string, string];
  otherActions: { id: string; intitule: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <FormAction
        type={type}
        ownerId={ownerId}
        finaliteLabels={finaliteLabels}
        otherActions={otherActions}
        action={action}
        onDone={() => setEditing(false)}
      />
    );
  }

  const finalites: Finalite[] = [1, 2, 3].map((value) => ({
    value,
    libelle: null,
    isSelectable: false,
    selected: Boolean(action[`finalite${value}` as keyof CardActionData]),
  }));

  const typeAction = findTypeAction(action.typeAction);
  const typeApproche = findTypeApproche(action.typeApproche);

  const confirmDelete = () => {
    startTransition(async () => {
      await deleteImpactAction(type, ownerId, action.id);
      setConfirmOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="sc-card-action">
        <div className="sc-card-action__action">
          <div className="sc-card-action__col">
            <div className="row u-margin__bottom--lower">
              <span className="u-txt-bold">{action.intitule}</span>
              {typeApproche && (
                <span className="u-txt-empty u-margin__left--auto">{typeApproche.libelle}</span>
              )}
            </div>
            {action.description && (
              <p className="u-txt-small u-margin__bottom">{action.description}</p>
            )}
            <div className="row">
              <div className="sc-card-action__dots">
                {finalites.map((finalite) => (
                  <Dots
                    key={finalite.value}
                    selected={finalite.selected}
                    colorLine={setColor(finalite)}
                    colorDots={
                      action.anticipe1 || action.anticipe2
                        ? setColorAnticipation(finalite, action.anticipe1, action.anticipe2)
                        : null
                    }
                    borderLeft={setManageDotsBorderLeft(finalite, finalites)}
                    borderRight={setManageDotsBorderRight(finalite, finalites)}
                  />
                ))}
              </div>
              {typeAction && (
                <span className="u-txt-bold sc-card-action__type">
                  <img
                    src={`/assets/img/impact-strategy/${typeAction.icon}`}
                    alt=""
                    width={40}
                    height={40}
                  />
                  {typeAction.libelle}
                </span>
              )}
            </div>
          </div>

          <div className="sc-card-action__edit-delete">
            <button
              type="button"
              aria-label="Modifier l'action"
              className="c-icon__circle project-secondary"
              onClick={() => setEditing(true)}
            >
              <em className="c-icon default-secondary pen" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Supprimer"
              className="c-icon__circle project-secondary u-margin__top--lower"
              onClick={() => setConfirmOpen(true)}
              title="Supprimer l'action"
            >
              <em className="c-icon default-secondary delete" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Êtes-vous sûr de vouloir supprimer cette action ?"
        confirmLabel="Confirmer"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        pending={isPending}
      >
        <p>
          Cette action disparaîtra du tableau d&apos;évaluation et des trajectoires qui
          l&apos;utilisent.
        </p>
      </ConfirmModal>
    </>
  );
}
