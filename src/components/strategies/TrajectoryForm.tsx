'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ActionOption {
  id: string;
  intitule: string;
  /** ids d'actions incompatibles avec celle-ci */
  incompatibles: string[];
}

export interface TrajectoryFormProps {
  type: 'impact' | 'strategy';
  ownerId: string;
  actions: ActionOption[];
  initial?: {
    name: string;
    actionIds: string[];
  };
  action: (formData: FormData) => Promise<void>;
}

export function TrajectoryForm({
  type,
  ownerId,
  actions,
  initial,
  action,
}: TrajectoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.actionIds ?? []);

  // Set des actions incompatibles avec celles déjà choisies
  const blockedByIncompat = new Set<string>();
  for (const id of selectedIds) {
    const a = actions.find((x) => x.id === id);
    if (!a) continue;
    for (const inc of a.incompatibles) {
      if (!selectedIds.includes(inc)) blockedByIncompat.add(inc);
    }
  }

  const chosen = actions.filter((a) => selectedIds.includes(a.id));
  const available = actions.filter((a) => !selectedIds.includes(a.id));

  const addAction = (id: string) => {
    if (blockedByIncompat.has(id)) return;
    setSelectedIds((cur) => [...cur, id]);
  };
  const removeAction = (id: string) => {
    setSelectedIds((cur) => cur.filter((x) => x !== id));
  };

  return (
    <form action={action}>
      <div className="o-card mb-3">
        <label className="c-input__label" htmlFor="name">
          Nom de la trajectoire *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={255}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="c-input w-100"
        />
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="o-card h-100">
            <h3 className="c-subtitle-black-bold">
              Actions de la trajectoire ({chosen.length})
            </h3>
            {chosen.length === 0 && (
              <p className="text-muted">Aucune action sélectionnée.</p>
            )}
            {chosen.map((a) => (
              <div
                key={a.id}
                className="d-flex justify-content-between align-items-center mt-2 p-2"
                style={{ border: '1px solid #ddd', borderRadius: 4 }}
              >
                <span>{a.intitule}</span>
                <button
                  type="button"
                  onClick={() => removeAction(a.id)}
                  className="c-btn--tertiary"
                >
                  Retirer
                </button>
              </div>
            ))}
            {/* Hidden inputs avec les ids choisis pour la Server Action */}
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="actionIds" value={id} />
            ))}
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="o-card h-100">
            <h3 className="c-subtitle-black-bold">
              Actions disponibles ({available.length})
            </h3>
            {available.length === 0 && (
              <p className="text-muted">Toutes les actions ont été sélectionnées.</p>
            )}
            {available.map((a) => {
              const blocked = blockedByIncompat.has(a.id);
              return (
                <div
                  key={a.id}
                  className="d-flex justify-content-between align-items-center mt-2 p-2"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    opacity: blocked ? 0.5 : 1,
                  }}
                >
                  <span>
                    {a.intitule}
                    {blocked && (
                      <small className="ms-2 text-danger">(incompatible)</small>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => addAction(a.id)}
                    disabled={blocked}
                    className="c-btn--secondary"
                  >
                    Ajouter
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between">
        <Link
          href={`/workspace/impacts/${type}/${ownerId}/build-trajectories`}
          className="c-btn--tertiary"
        >
          Annuler
        </Link>
        <button type="submit" className="c-btn--primary">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
