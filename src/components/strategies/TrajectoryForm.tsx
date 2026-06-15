'use client';

import { useState } from 'react';
import Link from 'next/link';
import { findTypeAction } from '@/lib/action-catalogs';
import type { ReviewCriterion } from '@/lib/review-average';
import { ActionDotsTimeline, type TimelineAction } from './ActionDotsTimeline';
import { ImpactLevelAbstract, type ImpactLevelData } from './ImpactLevelAbstract';
import type { OwnerType } from '@/server/strategies/impact-queries';

export type EditorAction = TimelineAction & {
  id: string;
  intitule: string;
  description: string | null;
  typeAction: string | null;
  incompatibles: string[];
};

export function TrajectoryForm({
  type,
  ownerId,
  actions,
  criteria,
  impactLevel,
  initial,
  existingNames,
  submitAction,
}: {
  type: OwnerType;
  ownerId: string;
  actions: EditorAction[];
  criteria: ReviewCriterion[];
  impactLevel: ImpactLevelData;
  initial?: { name: string; actionIds: string[] };
  existingNames: string[];
  submitAction: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.actionIds ?? []);

  const nameAlreadyUsed = existingNames.includes(name.trim());
  const valid = name.trim().length > 0 && !nameAlreadyUsed;

  // Actions rendues incompatibles par celles déjà choisies.
  const blocked = new Set<string>();
  for (const id of selectedIds) {
    const a = actions.find((x) => x.id === id);
    if (!a) continue;
    for (const inc of a.incompatibles) {
      if (!selectedIds.includes(inc)) blocked.add(inc);
    }
  }

  const chosen = selectedIds
    .map((id) => actions.find((a) => a.id === id))
    .filter((a): a is EditorAction => Boolean(a));
  const available = actions.filter((a) => !selectedIds.includes(a.id));

  const add = (id: string) => {
    if (blocked.has(id)) return;
    setSelectedIds((cur) => [...cur, id]);
  };
  const remove = (id: string) => setSelectedIds((cur) => cur.filter((x) => x !== id));

  const cancelHref = `/impacts/${type}/${ownerId}/build-trajectories`;

  return (
    <form className="sc-create-trajectory" action={submitAction}>
      {nameAlreadyUsed && (
        <p className="mb-2 u-txt-bold c-required">
          Attention, un nom de trajectoire ne peut être utilisé qu&apos;une fois.
        </p>
      )}
      <div className="c-input__group w-75">
        <label className="c-input__label" htmlFor="name">
          Nom de la trajectoire
        </label>
        <input
          className="c-input__large"
          type="text"
          id="name"
          name="name"
          value={name}
          maxLength={255}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="c-required">* requis</div>
      </div>

      <ImpactLevelAbstract impactLevel={impactLevel} />

      <p className="u-txt-empty u-txt-small">
        Cliquer sur + dans Actions possibles à choisir pour ajouter une action à votre trajectoire.
      </p>
      <p className="mb-4 u-txt-empty u-txt-small">
        Cliquer sur x dans Actions déjà choisies pour supprimer une action de votre trajectoire.
      </p>

      {chosen.length === 0 ? (
        <AllocatedActionsPlaceholder />
      ) : (
        <div className="u-margin__bottom--m">
          <ListActions
            title="Actions déjà choisies"
            actions={chosen}
            mode="remove"
            criteria={criteria}
            blocked={blocked}
            onAdd={add}
            onRemove={remove}
          />
        </div>
      )}

      <ListActions
        title="Actions possibles à choisir"
        actions={available}
        mode="add"
        criteria={criteria}
        blocked={blocked}
        onAdd={add}
        onRemove={remove}
      />

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="actionIds" value={id} />
      ))}

      <div className="c-group-buttons c-group-buttons--end u-margin__top">
        <Link href={cancelHref} className="c-btn--tertiary">
          Annuler
        </Link>
        <button className="c-btn--primary" type="submit" disabled={!valid}>
          Enregistrer
        </button>
      </div>
    </form>
  );
}

function LevelsHeader({ prefix }: { prefix: string }) {
  return (
    <div className={`${prefix}__levels`}>
      <span className={`${prefix}__lvl`}>1</span>
      <span className={`${prefix}__lvl`}>2</span>
      <span className={`${prefix}__lvl`}>3</span>
    </div>
  );
}

function ListActions({
  title,
  actions,
  mode,
  criteria,
  blocked,
  onAdd,
  onRemove,
}: {
  title: string;
  actions: EditorAction[];
  mode: 'add' | 'remove';
  criteria: ReviewCriterion[];
  blocked: Set<string>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="sc-list-actions">
      <div className="row u-margin__bottom">
        <span className="c-legend w-50">{title}</span>
        {actions.length > 0 && <LevelsHeader prefix="sc-list-actions" />}
      </div>

      {actions.length > 0 ? (
        actions.map((action) => (
          <ItemActionRow
            key={action.id}
            action={action}
            mode={mode}
            criteria={criteria}
            incompatible={mode === 'add' && blocked.has(action.id)}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))
      ) : (
        <span>Toutes vos actions ont été attribuées.</span>
      )}
    </div>
  );
}

function ItemActionRow({
  action,
  mode,
  criteria,
  incompatible,
  onAdd,
  onRemove,
}: {
  action: EditorAction;
  mode: 'add' | 'remove';
  criteria: ReviewCriterion[];
  incompatible: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const typeAction = findTypeAction(action.typeAction);

  return (
    <div className="sc-item-action">
      <div className={`sc-allocated-actions__row ${incompatible ? 'c-no-event' : ''}`}>
        {mode === 'add' && !incompatible && (
          <button
            type="button"
            aria-label="Ajouter l'action"
            className="c-btn--tertiary-icon"
            onClick={() => onAdd(action.id)}
          >
            <em className="c-icon add" aria-hidden="true" />
          </button>
        )}
        {mode === 'remove' && (
          <button
            type="button"
            aria-label="Retirer l'action"
            className="c-btn--tertiary-icon"
            onClick={() => onRemove(action.id)}
          >
            <em className="c-icon close" aria-hidden="true" />
          </button>
        )}
        {typeAction && (
          <img
            src={`/assets/img/impact-strategy/${typeAction.icon}`}
            alt=""
            width={40}
            height={40}
            style={incompatible ? { marginLeft: 32 } : undefined}
          />
        )}
        <div className="sc-item-action__col" style={!typeAction ? { marginLeft: 40 } : undefined}>
          <span style={incompatible ? { textDecoration: 'line-through' } : undefined}>
            {action.intitule}
          </span>
          {action.description && (
            <span className="u-txt-empty u-txt-small">{action.description}</span>
          )}
        </div>
      </div>
      <ActionDotsTimeline action={action} criteria={criteria} />
    </div>
  );
}

function AllocatedActionsPlaceholder() {
  return (
    <div className="sc-allocated-actions u-margin__bottom-l">
      <div className="row">
        <span className="c-legend w-50">Actions déjà choisies</span>
        <LevelsHeader prefix="sc-allocated-actions" />
      </div>
      <div className="row">
        <span className="w-50 u-txt-empty pt-3 pr-5 u-txt-small">
          Sélectionnez des actions dans la liste ci-dessous pour établir votre trajectoire.
        </span>
      </div>
    </div>
  );
}
