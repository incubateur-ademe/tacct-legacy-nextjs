'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Thematic } from './Thematic';
import { addImpactTheme } from '@/server/sensibility/actions';

export type ThematicOption = {
  id: string;
  name: string;
  icon: string;
  used: boolean;
};

const CUSTOM_ID = '__custom__';

/**
 * Wrapper client pour la page « Ajouter une thématique » :
 *  – état local `selectedThematic`
 *  – si sélection custom : affiche un input pour le nom + textarea justification
 *  – sinon : juste la justification
 *  – bouton « Ajouter » disponible une fois une thématique sélectionnée
 */
export function AddThematicForm({
  studyId,
  thematics,
}: {
  studyId: string;
  thematics: ThematicOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [justification, setJustification] = useState('');
  const [pending, startTransition] = useTransition();

  const isCustom = selected === CUSTOM_ID;
  // La justification n'est pas obligatoire (fidèle au legacy) : seul le nom
  // d'une thématique personnalisée l'est.
  const canSubmit = selected !== null && (!isCustom || customName.trim().length > 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const fd = new FormData();
    fd.set('studyId', studyId);
    fd.set('justification', justification);
    if (isCustom) {
      fd.set('customName', customName);
    } else if (selected) {
      fd.set('thematicId', selected);
    }
    startTransition(async () => {
      await addImpactTheme(fd);
      // `addImpactTheme` redirige côté serveur, mais on rafraîchit au cas où.
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="container">
        <div className="c-add-thematic__list-thematics">
          {thematics.map((t) => (
            <div key={t.id} className="c-thematic-item">
              <Thematic
                id={t.id}
                name={t.name}
                icon={t.icon}
                selected={selected === t.id}
                used={t.used}
                onSelect={setSelected}
              />
            </div>
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
          <div className="c-input__group col-sm-16 w-100">
            <input
              className="c-input__large"
              placeholder="Nom de la thématique personnalisée"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              maxLength={255}
            />
            <div className="c-required">*Obligatoire</div>
          </div>
        )}

        {selected !== null && (
          <div className="c-input__group col-sm-16 w-100">
            <textarea
              className="c-input__large"
              placeholder="Justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>
        )}

        {selected !== null && (
          <div className="o-centred-elements mr-2 mt-3 d-flex">
            <button
              type="submit"
              disabled={!canSubmit || pending}
              className="ml-auto mr-0 c-btn--primary"
            >
              Ajouter
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
