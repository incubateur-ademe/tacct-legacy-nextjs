'use client';

import { useEffect, useRef } from 'react';

/**
 * Carte SVG interactive (France métropolitaine ou Outre-Mer).
 *
 * Le SVG est livré côté serveur (via la prop `svgMarkup`, lu depuis
 * `public/assets/img/trend-climate/`). On l'inline via
 * `dangerouslySetInnerHTML`, puis on attache les click handlers et la classe
 * `.selected` sur les régions (`<polygon class="region" data-region="73">`).
 *
 * Au clic sur une région, `onSelect(regionId)` est appelé : la page parente
 * relit alors la `climate` correspondante et la passe en prop `selectedRegion`.
 */
export function InteractiveMap({
  svgMarkup,
  selectedRegion,
  onSelect,
}: {
  svgMarkup: string;
  selectedRegion: string | null;
  onSelect: (regionId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronise la classe `.selected` sur la région courante après chaque
  // changement de `selectedRegion`.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const regions = container.querySelectorAll<SVGElement>('.region');
    regions.forEach((el) => {
      const id = el.getAttribute('data-region');
      if (id && id === selectedRegion) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }, [selectedRegion, svgMarkup]);

  // Attache un click listener par délégation sur le conteneur.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const handler = (e: Event) => {
      const target = e.target as Element | null;
      const region = target?.closest?.('.region') as SVGElement | null;
      if (!region) return;
      const id = region.getAttribute('data-region');
      if (id) onSelect(id);
    };
    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
  }, [onSelect]);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      style={{ width: '100%' }}
    />
  );
}
