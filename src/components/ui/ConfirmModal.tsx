'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modale de confirmation générique (overlay React contrôlé via portal sur
 * document.body — fiable quel que soit le contexte de mise en page).
 */
export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  pending = false,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="sc-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="sc-modal-box"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="sc-modal-box__title">{title}</h3>
        {children && <div className="sc-modal-box__body">{children}</div>}
        <div className="c-group-buttons c-group-buttons--end">
          <button
            type="button"
            className="c-btn--tertiary"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="c-btn--primary"
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
