'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteTrajectory } from '@/server/strategies/impact-actions';
import { findTypeAction } from '@/lib/action-catalogs';
import type { ReviewCriterion } from '@/lib/review-average';
import { ActionDotsTimeline, type TimelineAction } from './ActionDotsTimeline';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { OwnerType } from '@/server/strategies/impact-queries';

export type TrajectoryAction = TimelineAction & {
  id: string;
  intitule: string;
  typeAction: string | null;
};

export type TrajectoryData = {
  id: string;
  name: string;
  actions: TrajectoryAction[];
};

export function ItemTrajectory({
  type,
  ownerId,
  trajectory,
  criteria,
}: {
  type: OwnerType;
  ownerId: string;
  trajectory: TrajectoryData;
  criteria: ReviewCriterion[];
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const editHref = `/workspace/impacts/${type}/${ownerId}/build-trajectories/${trajectory.id}`;

  const confirmDelete = () => {
    startTransition(async () => {
      await deleteTrajectory(type, ownerId, trajectory.id);
      setConfirmOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="sc-item-trajectory">
      <div className="sc-item-trajectory__header">
        <span className="u-txt-bold w-50">{trajectory.name}</span>
        <div className="sc-item-trajectory__levels">
          <span className="sc-item-trajectrory__lvl">1</span>
          <span className="sc-item-trajectrory__lvl">2</span>
          <span className="sc-item-trajectrory__lvl">3</span>
        </div>
      </div>

      <div className="sc-item-trajectory__content u-margin__top">
        {trajectory.actions.length === 0 ? (
          <span>Aucune action n&apos;a été attribuée pour cette trajectoire.</span>
        ) : (
          trajectory.actions.map((action) => {
            const typeAction = findTypeAction(action.typeAction);
            return (
              <div className="row" key={action.id}>
                <div className="sc-item-trajectory__row">
                  {typeAction && (
                    <img
                      src={`/assets/img/impact-strategy/${typeAction.icon}`}
                      alt=""
                      width={40}
                      height={40}
                    />
                  )}
                  <span style={typeAction ? undefined : { marginLeft: 40 }}>{action.intitule}</span>
                </div>
                <ActionDotsTimeline action={action} criteria={criteria} />
              </div>
            );
          })
        )}
      </div>

      <div className="sc-impact-trajectory__edit-delete">
        <Link
          href={editHref}
          aria-label="Modifier"
          className="c-icon__circle project-secondary u-margin__bottom--lower"
        >
          <em className="c-icon default-secondary pen" aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-label="Supprimer"
          className="c-icon__circle project-secondary"
          onClick={() => setConfirmOpen(true)}
          title="Supprimer la trajectoire"
        >
          <em className="c-icon default-secondary delete" aria-hidden="true" />
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Êtes-vous sûr de vouloir supprimer cette trajectoire ?"
        confirmLabel="Confirmer"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        pending={isPending}
      />
    </div>
  );
}
