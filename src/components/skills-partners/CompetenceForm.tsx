'use client';

import { useState } from 'react';
import { saveImpactCompetences } from '@/server/skills-partners/actions';

interface SkillOption {
  id: string;
  label: string;
}

interface CompetenceLine {
  id: string;
  skillTerritoryId: string;
  otherOrganization: string;
}

export function CompetenceForm({
  impactId,
  skills,
  initial,
}: {
  impactId: string;
  skills: SkillOption[];
  initial: CompetenceLine[];
}) {
  const [lines, setLines] = useState<CompetenceLine[]>(
    initial.length > 0
      ? initial
      : [{ id: crypto.randomUUID(), skillTerritoryId: '', otherOrganization: '' }],
  );

  const saveAction = saveImpactCompetences.bind(null, impactId);

  const updateLine = (index: number, patch: Partial<CompetenceLine>) => {
    setLines((current) =>
      current.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  };

  const addLine = () => {
    setLines((current) => [
      ...current,
      { id: crypto.randomUUID(), skillTerritoryId: '', otherOrganization: '' },
    ]);
  };

  const removeLine = (index: number) => {
    setLines((current) =>
      current.length > 1 ? current.filter((_, i) => i !== index) : current,
    );
  };

  return (
    <form action={saveAction} className="mt-3">
      {lines.map((line, idx) => (
        <div key={line.id} className="row align-items-start mb-2">
          <div className="col-md-5">
            <label className="c-input__label" htmlFor={`skill-${line.id}`}>
              Compétence du territoire
            </label>
            <select
              id={`skill-${line.id}`}
              name="skillTerritoryId"
              value={line.skillTerritoryId}
              onChange={(e) => updateLine(idx, { skillTerritoryId: e.target.value })}
              className="c-input w-100"
            >
              <option value="">— Aucune —</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="c-input__label" htmlFor={`other-${line.id}`}>
              Autres partenaires / organisations
            </label>
            <textarea
              id={`other-${line.id}`}
              name="otherOrganization"
              value={line.otherOrganization}
              onChange={(e) => updateLine(idx, { otherOrganization: e.target.value })}
              rows={2}
              className="c-input w-100"
            />
          </div>
          <div className="col-md-1 d-flex align-items-end">
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(idx)}
                className="c-btn--tertiary"
                title="Supprimer la ligne"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="d-flex justify-content-between mt-3">
        <button type="button" onClick={addLine} className="c-btn--secondary">
          + Ajouter une ligne
        </button>
        <button type="submit" className="c-btn--primary">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
