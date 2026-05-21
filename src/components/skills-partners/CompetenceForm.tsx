'use client';

import { useEffect, useState } from 'react';
import { saveImpactCompetences } from '@/server/skills-partners/actions';

interface SkillOption {
  id: string;
  label: string;
}

interface CompetenceLine {
  /** Identifiant local (rendu stable côté React). */
  key: string;
  /** Id en base si la ligne provient déjà d'une sauvegarde. */
  dbId: string | null;
  skillTerritoryId: string;
  otherOrganization: string;
}

/**
 * Port de `app-detail-synthese-impacts` (partie formulaire) + reset legacy.
 *
 * Comportement :
 *  – Au moins une ligne visible en permanence.
 *  – Quand l'utilisateur remplit la dernière ligne, on en ajoute une vide en
 *    dessous automatiquement (cf. `addRowIfNecessary` legacy).
 *  – Le bouton « Supprimer » apparaît dès qu'une ligne porte une valeur ET
 *    qu'il existe plus d'une ligne au total.
 *  – Le bouton « Enregistrer » est désactivé si la seule ligne est vide.
 */
export function CompetenceForm({
  impactId,
  skills,
  initial,
}: {
  impactId: string;
  skills: SkillOption[];
  initial: { id: string; skillTerritoryId: string; otherOrganization: string }[];
}) {
  const [lines, setLines] = useState<CompetenceLine[]>(() => initialiseLines(initial));

  const saveAction = saveImpactCompetences.bind(null, impactId);

  // Ajoute une ligne vide quand la dernière a été remplie
  useEffect(() => {
    const last = lines[lines.length - 1];
    if (!last) return;
    const filled = last.skillTerritoryId || last.otherOrganization.trim();
    if (filled) {
      setLines((prev) => [...prev, emptyLine()]);
    }
  }, [lines]);

  const update = (idx: number, patch: Partial<CompetenceLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const remove = (idx: number) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const someFilled = lines.some((l) => l.skillTerritoryId || l.otherOrganization.trim());

  return (
    <form action={saveAction} className="sc-detail-synthese-impacts__form">
      {lines.map((line, idx) => {
        const filled = !!(line.skillTerritoryId || line.otherOrganization.trim());
        const canDelete = lines.length > 1 && filled;
        return (
          <div key={line.key} className="row">
            <div className="c-input__group col-md-6 col-sm-16 input-size-small">
              <select
                name="skillTerritoryId"
                className="c-input"
                value={line.skillTerritoryId}
                onChange={(e) => update(idx, { skillTerritoryId: e.target.value })}
              >
                <option value="">Saisir une compétence</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <label className="c-input__label">Compétences du territoire</label>
            </div>
            <div className="c-input__group col-md-4 col-sm-16 input-size-small">
              <textarea
                name="otherOrganization"
                className="c-input__large"
                value={line.otherOrganization}
                onChange={(e) => update(idx, { otherOrganization: e.target.value })}
              />
              <label className="c-input__label">Autres organismes compétents</label>
            </div>
            <div className="c-group-buttons col-md-2">
              {canDelete && (
                <button
                  type="button"
                  className="sc-detail-synthese-impacts__btn-delete"
                  title="Supprimer"
                  onClick={() => remove(idx)}
                >
                  <span aria-hidden="true" className="c-icon delete" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="c-group-buttons c-group-buttons--end">
        <button
          type="submit"
          className="c-btn--primary sc-detail-synthese-impacts__btn-save"
          title="Enregistrer"
          disabled={!someFilled}
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}

function emptyLine(): CompetenceLine {
  return {
    key: crypto.randomUUID(),
    dbId: null,
    skillTerritoryId: '',
    otherOrganization: '',
  };
}

function initialiseLines(
  initial: { id: string; skillTerritoryId: string; otherOrganization: string }[],
): CompetenceLine[] {
  if (initial.length === 0) return [emptyLine()];
  const mapped: CompetenceLine[] = initial.map((c) => ({
    key: c.id,
    dbId: c.id,
    skillTerritoryId: c.skillTerritoryId,
    otherOrganization: c.otherOrganization,
  }));
  // Legacy : si une seule ligne, on en ajoute une vide en dessous
  if (mapped.length === 1) mapped.push(emptyLine());
  return mapped;
}
