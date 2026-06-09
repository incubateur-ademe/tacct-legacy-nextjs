'use client';

import { useEffect, useRef, useState } from 'react';
import { smileForValue } from '@/lib/review-average';

const OPTIONS: { value: number; label: string; icon: string }[] = [
  { value: 4, label: 'Très satisfaisant', icon: 'large-smile dark-green-smile' },
  { value: 3, label: 'Satisfaisant', icon: 'light-smile green-smile' },
  { value: 2, label: 'Peu satisfaisant', icon: 'neutral-smile orange-smile' },
  { value: 1, label: 'Insatisfaisant', icon: 'unhappy-smile red-smile' },
];

/**
 * Port de `app-review-item` (legacy) : un smiley cliquable qui ouvre un menu de
 * notation (1 à 4). La valeur 0 = non évaluée (smiley neutre).
 */
export function ReviewItem({
  value,
  disabled = false,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className={`sc-review-item ${disabled ? 'c-no-event' : ''}`}>
      <button
        type="button"
        className="sc-review-item__button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        <em className={`c-icon ${smileForValue(value)} large`} aria-hidden="true" />
      </button>
      {open && (
        <div className="sc-review-item__select-box">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="sc-review-item__select-review-btn"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <em className={`c-icon ${opt.icon} medium`} aria-hidden="true" />
              <span className="sc-review-item__select-review-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
