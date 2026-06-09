'use client';

import { useState } from 'react';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { pluralize } from '@/lib/pluralize';
import { FormAction } from './FormAction';
import { CardAction, type CardActionData } from './CardAction';
import type { OwnerType } from '@/server/strategies/impact-queries';

/**
 * Page « Définition des actions » (port de define-actions.component) : titre +
 * compteur + bouton d'ajout, formulaire de création, puis la liste des cartes
 * d'action (chacune éditable/supprimable).
 */
export function DefineActions({
  type,
  ownerId,
  title,
  icon,
  actions,
  finaliteLabels,
}: {
  type: OwnerType;
  ownerId: string;
  title: string;
  icon: string;
  actions: CardActionData[];
  finaliteLabels: [string, string, string];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="sc-define-actions">
      <div className="o-card u-margin__bottom--m">
        <div className="row">
          <BlockTitleIcon pageTitle="Définition des actions" subtitle={title} icon={icon} />
        </div>
        <div className="o-centred-elements">
          <span className="ml-0 mr-auto">
            {pluralize(actions.length, `${actions.length} action`, `${actions.length} actions`)}
          </span>
          {!showForm && (
            <button
              type="button"
              className="ml-auto mr-0 c-btn--primary"
              onClick={() => setShowForm(true)}
            >
              Ajouter une action
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="u-margin__bottom">
          <FormAction
            type={type}
            ownerId={ownerId}
            finaliteLabels={finaliteLabels}
            otherActions={actions}
            onDone={() => setShowForm(false)}
          />
        </div>
      )}

      {actions.map((action) => (
        <CardAction
          key={action.id}
          type={type}
          ownerId={ownerId}
          action={action}
          finaliteLabels={finaliteLabels}
          otherActions={actions.filter((a) => a.id !== action.id)}
        />
      ))}
    </div>
  );
}
