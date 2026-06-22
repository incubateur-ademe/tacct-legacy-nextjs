'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FlashMessage, FlashType } from '@/server/flash';
import { clearFlash } from '@/server/flash-actions';

const ICONS: Record<FlashType, string> = {
  success: 'check',
  warning: 'status-incomplete',
  error: 'close',
};

interface ToastItem extends FlashMessage {
  leaving?: boolean;
}

/**
 * Port du `ToastMessagesComponent` Angular : affiche en bas à gauche les
 * messages flash posés par les server actions (via `setFlash`). Auto-dismiss à
 * 6 s, fermeture manuelle, et nettoyage du cookie après affichage.
 */
export function Toaster({ flash }: { flash: FlashMessage | null }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastId, setLastId] = useState<string | null>(null);

  // Empile le nouveau flash (ajustement d'état pendant le rendu : pattern React
  // pour réagir au changement d'une prop, sans setState dans un effet).
  if (flash && flash.id !== lastId) {
    setLastId(flash.id);
    setToasts((prev) => (prev.some((t) => t.id === flash.id) ? prev : [...prev, flash]));
  }

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 600);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const { id } = flash;
    void clearFlash();
    const timer = setTimeout(() => dismiss(id), 6000);
    return () => clearTimeout(timer);
  }, [flash, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="sc-toast-group">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`c-toast ${toast.type}${toast.leaving ? ' is-leaving' : ''}`}
          role="status"
        >
          <section className="c-toast__figure">
            <em className={`c-icon medium ${ICONS[toast.type]}`} />
          </section>
          <section className="c-toast__text">
            <button
              type="button"
              aria-label="Fermer"
              className="c-btn--tertiary-icon-circle c-toast__button"
              onClick={() => dismiss(toast.id)}
            >
              <em className="c-icon close" />
            </button>
            <h1 className="c-toast__title">{toast.title}</h1>
            {toast.content && <p className="c-content c-toast__content">{toast.content}</p>}
          </section>
        </div>
      ))}
    </div>
  );
}
