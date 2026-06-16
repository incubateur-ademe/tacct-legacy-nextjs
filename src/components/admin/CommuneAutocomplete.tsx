'use client';

import { useEffect, useRef, useState } from 'react';
import { searchCommunesAction } from '@/server/admin/actions';

interface CommuneItem {
  id: string;
  label: string;
  postalCode: string | null;
}

function format(commune: { label: string; postalCode: string | null }): string {
  return commune.postalCode ? `${commune.label} - ${commune.postalCode}` : commune.label;
}

/**
 * Autocomplete de communes (port de `select-communes` legacy : typeahead ≥ 2
 * caractères). Renseigne un champ caché `name` avec l'id de la commune choisie.
 */
export function CommuneAutocomplete({
  name,
  defaultCommuneId,
  defaultLabel,
}: {
  name: string;
  defaultCommuneId?: string | null;
  defaultLabel?: string | null;
}) {
  const [query, setQuery] = useState(defaultLabel ?? '');
  const [selectedId, setSelectedId] = useState(defaultCommuneId ?? '');
  const [results, setResults] = useState<CommuneItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    let active = true;
    const handle = setTimeout(async () => {
      if (trimmed.length < 2) {
        if (active) {
          setResults([]);
          setOpen(false);
        }
        return;
      }
      const items = await searchCommunesAction(trimmed);
      if (active) {
        setResults(items);
        setOpen(true);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const select = (commune: CommuneItem) => {
    setSelectedId(commune.id);
    setQuery(format(commune));
    setOpen(false);
  };

  return (
    <div className="sc-commune-autocomplete" ref={containerRef}>
      <input type="hidden" name={name} value={selectedId} />
      <input
        type="text"
        className="c-input__large w-100"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId('');
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Saisir une commune"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="sc-commune-autocomplete__list">
          {results.map((commune) => (
            <li key={commune.id}>
              <button
                type="button"
                className="sc-commune-autocomplete__item"
                onClick={() => select(commune)}
              >
                {format(commune)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
