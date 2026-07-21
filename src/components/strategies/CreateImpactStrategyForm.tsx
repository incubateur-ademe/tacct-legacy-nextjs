'use client';

import { useState, useTransition } from 'react';
import { Thematic } from '@/components/sensibility/Thematic';
import { createImpactStrategy } from '@/server/strategies/actions';

export type ThematicOption = {
  id: string;
  name: string;
  icon: string;
};

const CUSTOM_ID = 'custom';

/**
 * Port de `create-strategie-impact` (Angular legacy) : description courte, puis
 * grille de tuiles thématiques (catalogue + « Thématique personnalisée »), et
 * enfin le champ nom personnalisé quand cette dernière est retenue. Le bouton de
 * validation n'apparaît qu'une fois une thématique sélectionnée.
 */
export function CreateImpactStrategyForm({
  studyId,
  thematics,
}: {
  studyId: string;
  thematics: ThematicOption[];
}) {
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [pending, startTransition] = useTransition();

  const isCustom = selected === CUSTOM_ID;
  const canSubmit =
    description.trim().length > 0 && selected !== null && (!isCustom || customName.trim().length > 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const fd = new FormData();
    fd.set('studyId', studyId);
    fd.set('description', description);
    if (isCustom) {
      fd.set('customThematicName', customName);
    } else if (selected) {
      fd.set('thematicId', selected);
    }
    startTransition(async () => {
      await createImpactStrategy(fd);
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="c-input__group w-100">
        <input
          id="impactDescription"
          type="text"
          maxLength={100}
          className="c-input__large"
          placeholder="Description de l'impact"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="c-input__label" htmlFor="impactDescription">
          Description courte
        </label>
        <span className="c-required">*obligatoire</span>
      </div>

      <span className="sc-create-strategy-impact__thematic-list-title">
        Selectionnez la thématique de l&apos;impact :
      </span>

      <div className="c-add-thematic__list-thematics">
        {thematics.map((t) => (
          <Thematic
            key={t.id}
            id={t.id}
            name={t.name}
            icon={t.icon}
            selected={selected === t.id}
            used={false}
            onSelect={setSelected}
          />
        ))}
        <Thematic
          id={CUSTOM_ID}
          name="Thématique personnalisée"
          icon="suspended"
          selected={isCustom}
          used={false}
          onSelect={setSelected}
        />
      </div>

      {isCustom && (
        <div className="c-input__group w-100">
          <input
            id="thematicName"
            type="text"
            maxLength={50}
            className="c-input__large"
            placeholder="Nom de la thématique personnalisée"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <span className="c-required">*obligatoire</span>
        </div>
      )}

      {selected !== null && (
        <div className="c-group-buttons c-group-buttons--end">
          <button type="submit" disabled={!canSubmit || pending} className="c-btn--primary">
            Ajouter l&apos;impact
          </button>
        </div>
      )}
    </form>
  );
}
