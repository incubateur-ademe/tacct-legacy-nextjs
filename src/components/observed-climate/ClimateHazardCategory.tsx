'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Port de `app-climate-hazard-category` (Angular legacy).
 *
 * Tuile pour sélectionner une catégorie d'aléa lors de l'ajout :
 *  – icône grande (xl) cerclée colorée (couleur `color` passée en prop)
 *  – label sous l'icône
 *  – désactivée si tous les aléas de la catégorie ont déjà été saisis
 */
type Props = {
  id: string;
  name: string;
  icon: string;
  color: string;
  disabled?: boolean;
};

export function ClimateHazardCategory({ id, name, icon, color, disabled = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onClick = () => {
    if (disabled) return;
    const qs = searchParams.toString();
    const suffix = qs ? `?${qs}` : '';
    router.push(`/observed-climate/observed-exposure/add/${id}${suffix}`);
  };

  return (
    <div className="o-climate-hazard-category">
      <button
        type="button"
        aria-label={`Sélectionner ${name}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={`c-icon__circle ${color}`}>
          <em className={`c-icon ${icon} ${color} xl`} aria-hidden="true" />
        </span>
      </button>
      <span className={`c-legend-action pt-1 text-center c-${color}`}>{name}</span>
    </div>
  );
}
