'use client';

import { useEffect, useRef, useState } from 'react';
import type { DotColor } from '@/lib/manage-dots';

const SIZE_DOT_MARGIN_PX = 16;

/**
 * Port de `app-dots` (legacy) : affiche une ligne colorée quand la finalité est
 * sélectionnée, sinon une série de points gris. Le nombre de points est calculé
 * à partir de la largeur rendue (comme le legacy).
 */
export function Dots({
  selected,
  colorLine,
  colorDots,
  borderLeft = true,
  borderRight = true,
  lineLeft = false,
  lineRight = false,
  lineSize = '2rem',
  className = '',
}: {
  selected: boolean;
  colorLine?: DotColor | null;
  colorDots?: DotColor | null;
  borderLeft?: boolean;
  borderRight?: boolean;
  lineLeft?: boolean;
  lineRight?: boolean;
  lineSize?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [nbDots, setNbDots] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const compute = () => setNbDots(Math.floor(el.offsetWidth / SIZE_DOT_MARGIN_PX));
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`sc-dots ${className}`}>
      {selected && (
        <div
          className={`line ${colorLine ? `color--${colorLine}` : ''} ${
            borderLeft ? 'line--left' : ''
          } ${borderRight ? 'line--right' : ''}`}
          style={{ width: lineLeft ? '95%' : '100%' }}
        />
      )}
      {!selected &&
        Array.from({ length: nbDots }).map((_, i) => (
          <div key={i} className={`dot ${colorDots ? `color--${colorDots}` : ''}`} />
        ))}

      {lineLeft && <div className="sc-dots__line-left" style={{ height: lineSize }} />}
      {lineRight && <div className="sc-dots__line-right" style={{ height: lineSize }} />}
    </div>
  );
}
