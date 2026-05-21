'use client';

import { useState } from 'react';

export type AlertMessage = {
  title: string;
  details: string[];
};

/**
 * Port de `app-alert-form` + `app-alert` (Angular legacy) : bannière d'erreur
 * orange pleine largeur en haut du formulaire, fermable.
 */
export function AlertForm({ messages }: { messages: AlertMessage[] }) {
  const [opened, setOpened] = useState(true);

  if (!opened || messages.length === 0) return null;

  return (
    <div className="alert-custom-danger" role="alert">
      <div className="alert-custom-danger__oval">!</div>
      <div style={{ flex: 1 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <div className="alert-custom-danger__title">{msg.title} :</div>
            {msg.details.map((d, j) => (
              <div key={j} className="alert-custom-danger__detail">
                {d}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Fermer l'alerte"
        onClick={() => setOpened(false)}
        style={{
          background: 'transparent',
          border: 0,
          color: 'inherit',
          fontSize: '1.5rem',
          cursor: 'pointer',
          marginLeft: '1rem',
        }}
      >
        ×
      </button>
    </div>
  );
}
