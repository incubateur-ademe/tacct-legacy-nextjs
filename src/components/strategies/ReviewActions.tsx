'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { saveActionReviews } from '@/server/strategies/impact-actions';
import { averageIconClass } from '@/lib/review-average';
import { ReviewItem } from './ReviewItem';
import type { OwnerType } from '@/server/strategies/impact-queries';

type Criterion = { rank: number; name: string; weighting: number };
type ActionRow = { id: string; intitule: string; reviews: { rank: number; value: number }[] };

type ValueMap = Record<string, Record<number, number>>;

export function ReviewActions({
  type,
  ownerId,
  title,
  icon,
  actions,
  criteria,
}: {
  type: OwnerType;
  ownerId: string;
  title: string;
  icon: string;
  actions: ActionRow[];
  criteria: Criterion[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [values, setValues] = useState<ValueMap>(() => {
    const init: ValueMap = {};
    for (const a of actions) {
      init[a.id] = {};
      for (const c of criteria) {
        const existing = a.reviews.find((r) => r.rank === c.rank);
        init[a.id]![c.rank] = c.weighting === 0 ? 0 : (existing?.value ?? 0);
      }
    }
    return init;
  });

  const setReview = (actionId: string, rank: number, value: number) => {
    setValues((prev) => ({
      ...prev,
      [actionId]: { ...prev[actionId], [rank]: value },
    }));
  };

  const doSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      for (const a of actions) {
        for (const c of criteria) {
          formData.set(`review[${a.id}][${c.rank}]`, String(values[a.id]?.[c.rank] ?? 0));
        }
      }
      await saveActionReviews(type, ownerId, formData);
      setConfirmOpen(false);
      router.refresh();
    });
  };

  const onSaveClick = () => {
    const activeCriteria = criteria.filter((c) => c.weighting > 0);
    const max = actions.length * activeCriteria.length;
    let set = 0;
    for (const a of actions) {
      for (const c of activeCriteria) {
        if ((values[a.id]?.[c.rank] ?? 0) > 0) set += 1;
      }
    }
    if (set < max) setConfirmOpen(true);
    else doSave();
  };

  return (
    <div className="sc-review-actions">
      <div className="o-card u-margin__bottom--m">
        <div className="row">
          <BlockTitleIcon pageTitle="Evaluation des actions" subtitle={title} icon={icon} />
        </div>
      </div>

      <div className="o-card sc-review-actions__evaluations">
        {/* En-tête de colonnes */}
        <div className="sc-header">
          <div className="sc-header__col">
            <div className="sc-header__info">
              <Link
                href={`/impacts/${type}/${ownerId}/review-actions/criterias`}
                className="sc-header__button c-btn--secondary"
              >
                Modifier les critères
              </Link>
            </div>
            <div className="sc-header__weightings">Pondération du critère</div>
          </div>
          {criteria.map((c) => (
            <div className="sc-header__col" key={c.rank}>
              <div className="sc-header__info">
                <span className="sc-header__criteria">{c.name}</span>
              </div>
              <div className="sc-header__weightings">x {c.weighting}</div>
            </div>
          ))}
          <div className="sc-header__col">
            <div className="sc-header__info">
              <span className="sc-header__criteria">Résultats</span>
            </div>
            <div className="sc-header__weightings" />
          </div>
        </div>

        {/* Lignes d'actions */}
        {actions.map((action) => (
          <div className="sc-table-row" key={action.id}>
            <div className="sc-table-row__elem">
              <span className="sc-table-row__action-name">{action.intitule}</span>
            </div>
            {criteria.map((c) => (
              <div className="sc-table-row__elem" key={c.rank}>
                <ReviewItem
                  value={values[action.id]?.[c.rank] ?? 0}
                  disabled={c.weighting === 0}
                  onChange={(v) => setReview(action.id, c.rank, v)}
                />
              </div>
            ))}
            <div className="sc-table-row__elem">
              <em
                className={`c-icon ${averageIconClass(values[action.id] ?? {}, criteria)} large`}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}

        <div className="c-group-buttons c-group-buttons--end">
          <button
            type="button"
            className="c-btn--primary"
            onClick={onSaveClick}
            disabled={isPending}
          >
            Enregistrer
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Attention"
        confirmLabel="Confirmer"
        onConfirm={doSave}
        onCancel={() => setConfirmOpen(false)}
        pending={isPending}
      >
        <p>
          Vous n&apos;avez pas fini d&apos;évaluer toutes vos actions. Cette étape n&apos;est pas
          bloquante mais cette évaluation vous sera utile pour choisir entre vos différentes
          trajectoires.
        </p>
      </ConfirmModal>
    </div>
  );
}
