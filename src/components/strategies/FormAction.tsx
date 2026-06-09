'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createImpactAction,
  updateImpactAction,
} from '@/server/strategies/impact-actions';
import { TYPES_ACTIONS, TYPES_APPROCHES } from '@/lib/action-catalogs';
import {
  setColor,
  setColorAnticipation,
  setManageDotsBorderLeft,
  setManageDotsBorderRight,
  type Finalite,
} from '@/lib/manage-dots';
import { Dots } from './Dots';
import type { OwnerType } from '@/server/strategies/impact-queries';

export type ActionFormValues = {
  id: string;
  intitule: string;
  typeApproche: string | null;
  description: string | null;
  typeAction: string | null;
  finalite1: boolean;
  finalite2: boolean;
  finalite3: boolean;
  anticipe1: boolean;
  anticipe2: boolean;
  incompatibles: string[];
};

export function FormAction({
  type,
  ownerId,
  finaliteLabels,
  otherActions,
  action,
  onDone,
}: {
  type: OwnerType;
  ownerId: string;
  /** Libellés des finalités du niveau d'impact (finalite1/2/3 de l'impact). */
  finaliteLabels: [string, string, string];
  /** Autres actions de l'impact, pour le choix des incompatibilités. */
  otherActions: { id: string; intitule: string }[];
  /** Action existante en cas d'édition. */
  action?: ActionFormValues;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const initialFinalites = (): Finalite[] => {
    const f: Finalite[] = [1, 2, 3].map((value) => ({
      value,
      libelle: finaliteLabels[value - 1] || 'Non renseigné',
      isSelectable: true,
      selected: action ? Boolean(action[`finalite${value}` as keyof ActionFormValues]) : false,
    }));
    // Règle legacy : finalité 1 sans finalité 2 ⇒ finalité 3 non sélectionnable.
    if (action?.finalite1 && !action.finalite2 && f[2]) {
      f[2].isSelectable = false;
    }
    return f;
  };

  const [finalites, setFinalites] = useState<Finalite[]>(initialFinalites);
  const [anticipe1, setAnticipe1] = useState(action?.anticipe1 ?? false);
  const [anticipe2, setAnticipe2] = useState(action?.anticipe2 ?? false);

  const f1 = finalites.find((f) => f.value === 1)!;
  const f2 = finalites.find((f) => f.value === 2)!;
  const f3 = finalites.find((f) => f.value === 3)!;
  const anticipe1Disabled = f1.selected;
  const anticipe2Disabled = f1.selected || f2.selected;
  const hasFinalite = finalites.some((f) => f.selected);

  // Garde les anticipations cohérentes avec les finalités sélectionnées.
  useEffect(() => {
    if (anticipe1Disabled && anticipe1) setAnticipe1(false);
    if (anticipe2Disabled && anticipe2) setAnticipe2(false);
  }, [anticipe1Disabled, anticipe2Disabled, anticipe1, anticipe2]);

  const manageFinalite = (value: number) => {
    setFinalites((prev) => {
      const target = prev.find((f) => f.value === value);
      if (target && !target.isSelectable) return prev;

      const next = prev.map((f) => ({ ...f, isSelectable: true }));
      const t = next.find((f) => f.value === value)!;
      t.selected = !t.selected;
      const n1 = next.find((f) => f.value === 1)!;
      const n2 = next.find((f) => f.value === 2)!;
      const n3 = next.find((f) => f.value === 3)!;

      // Finalité 1 seule (sans finalité 2) : finalité 3 non sélectionnable.
      if (n1.selected && !n2.selected) {
        n3.isSelectable = false;
        n3.selected = false;
      }
      return next;
    });
  };

  const toggleAnticipe1 = (checked: boolean) => {
    setAnticipe1(checked);
    // Legacy : anticiper niv.1 avec une finalité 3 ⇒ anticipe niv.2 aussi.
    if (checked && finalites.find((f) => f.value === 3)?.selected) {
      setAnticipe2(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!hasFinalite) return;

    const formData = new FormData(e.currentTarget);
    if (!formData.get('intitule')) return;

    startTransition(async () => {
      if (action) {
        await updateImpactAction(type, ownerId, action.id, formData);
      } else {
        await createImpactAction(type, ownerId, formData);
      }
      onDone();
      router.refresh();
    });
  };

  return (
    <form className="sc-form-action" onSubmit={handleSubmit}>
      {submitted && !hasFinalite && (
        <div className="c-required mb-2">Au moins un champ Finalité doit être sélectionné.</div>
      )}

      <div className="row">
        <div className="c-input__group col-sm-16 w-50">
          <textarea
            className="c-input__large"
            id="intitule"
            name="intitule"
            maxLength={255}
            required
            defaultValue={action?.intitule ?? ''}
          />
          <label className="c-input__label" htmlFor="intitule">
            Intitulé
          </label>
          <div className="c-required">* requis (limité à 255 caractères)</div>
        </div>

        <div className="c-input__group col-sm-16 w-50">
          <select
            className="c-input"
            id="typeApproche"
            name="typeApproche"
            defaultValue={action?.typeApproche ?? ''}
          >
            <option value="">Type d&apos;approche</option>
            {TYPES_APPROCHES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.libelle}
              </option>
            ))}
          </select>
          <label className="c-input__label" htmlFor="typeApproche">
            Type d&apos;approche
          </label>
        </div>
      </div>

      <div className="row u-margin__bottom--m">
        <div className="c-input__group col-sm-16 w-50">
          <textarea
            className="c-input__large"
            id="description"
            name="description"
            maxLength={255}
            defaultValue={action?.description ?? ''}
          />
          <label className="c-input__label" htmlFor="description">
            Description
          </label>
        </div>

        <div className="c-input__group col-sm-16 w-50">
          <select
            className="c-input"
            id="typeAction"
            name="typeAction"
            defaultValue={action?.typeAction ?? ''}
          >
            <option value="">Type d&apos;action</option>
            {TYPES_ACTIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.libelle}
              </option>
            ))}
          </select>
          <label className="c-input__label" htmlFor="typeAction">
            Type d&apos;action
          </label>
        </div>
      </div>

      <span className="c-subtitle-black-bold">
        A quel(s) niveau(x) d&apos;impact répond cette action ?
      </span>

      <div className="sc-form-action__row sc-form-action__finalites">
        {finalites.map((finalite) => (
          <div
            key={finalite.value}
            className={`sc-form-action__finalite ${finalite.isSelectable ? '' : 'c-no-event'}`}
          >
            <button
              type="button"
              className={`c-icon__circle large project-primary u-margin__bottom ${
                finalite.selected ? 'selected' : ''
              }`}
              onClick={() => manageFinalite(finalite.value)}
            >
              {finalite.selected ? (
                <em className="sc-form-action__selected-icon c-icon small status-validate" />
              ) : (
                <em className="sc-form-action__add-icon c-icon__circle project-primary">+</em>
              )}
              <span>{finalite.value}</span>
            </button>
            <button
              type="button"
              className="u-txt-small u-txt-primary u-margin__bottom u-margin__right u-margin__left"
              onClick={() => manageFinalite(finalite.value)}
            >
              {finalite.libelle}
            </button>
            <Dots
              selected={finalite.selected}
              colorLine={setColor(finalite)}
              colorDots={
                anticipe1 || anticipe2
                  ? setColorAnticipation(finalite, anticipe1, anticipe2)
                  : null
              }
              borderLeft={setManageDotsBorderLeft(finalite, finalites)}
              borderRight={setManageDotsBorderRight(finalite, finalites)}
            />
          </div>
        ))}
      </div>

      {/* Champs cachés soumis au serveur (reflètent l'état des boutons finalité). */}
      <input type="checkbox" name="finalite1" checked={f1.selected} readOnly hidden />
      <input type="checkbox" name="finalite2" checked={f2.selected} readOnly hidden />
      <input type="checkbox" name="finalite3" checked={f3.selected} readOnly hidden />

      <span className="c-subtitle-black-bold">
        L&apos;action doit-elle être anticipée à partir d&apos;un niveau inférieur ?
      </span>

      <div className="row">
        <div
          className={`c-checkbox__group u-margin__left u-margin__right--m ${
            anticipe1Disabled ? 'c-no-event' : ''
          }`}
        >
          <input
            className="c-checkbox__input"
            type="checkbox"
            id="niv1"
            name="anticipe1"
            checked={anticipe1}
            disabled={anticipe1Disabled}
            onChange={(e) => toggleAnticipe1(e.target.checked)}
          />
          <label className="c-checkbox__label c-input__legend" htmlFor="niv1">
            A anticiper au Niv. 1
          </label>
        </div>
        <div className={`c-checkbox__group ${anticipe2Disabled ? 'c-no-event' : ''}`}>
          <input
            className="c-checkbox__input"
            type="checkbox"
            id="niv2"
            name="anticipe2"
            checked={anticipe2}
            disabled={anticipe2Disabled}
            onChange={(e) => setAnticipe2(e.target.checked)}
          />
          <label className="c-checkbox__label c-input__legend" htmlFor="niv2">
            A anticiper au Niv. 2
          </label>
        </div>
      </div>

      {otherActions.length > 0 && (
        <div className="c-input__group col-sm-16 w-100 u-margin__bottom-l mt-3">
          <span className="c-input__label">Incompatibilité avec d&apos;autres actions</span>
          <div className="sc-form-action__incompatibles">
            {otherActions.map((other) => (
              <div key={other.id} className="c-checkbox__group">
                <input
                  className="c-checkbox__input"
                  type="checkbox"
                  id={`inc-${other.id}`}
                  name="incompatibles"
                  value={other.id}
                  defaultChecked={action?.incompatibles.includes(other.id)}
                />
                <label className="c-checkbox__label c-input__legend" htmlFor={`inc-${other.id}`}>
                  {other.intitule}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="c-group-buttons c-group-buttons--end">
        <button
          type="button"
          className="c-btn--tertiary"
          title="Annuler"
          onClick={onDone}
          disabled={isPending}
        >
          Annuler
        </button>
        <button className="c-btn--primary" title="Enregistrer" disabled={isPending}>
          Enregistrer
        </button>
      </div>
    </form>
  );
}
