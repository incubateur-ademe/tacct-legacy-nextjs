'use client';

/**
 * Port de `app-thematic` du legacy.
 *
 * Tuile cliquable pour sélectionner une thématique lors de la création :
 *  – icône xl cerclée (couleur dépend de l'état sélectionné ou désactivé)
 *  – pastille « selectionne.svg » en haut à droite quand sélectionnée
 *  – label sous l'icône
 *  – désactivée si la thématique est déjà utilisée par l'étude
 */
type Props = {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
  used: boolean;
  onSelect: (id: string) => void;
};

export function Thematic({ id, name, icon, selected, used, onSelect }: Props) {
  const color = used ? 'empty' : selected ? 'project-primary' : 'project-primary';
  const showCheckmark = selected && !used;

  return (
    <div className="o-thematic">
      <div className="container-selected">
        {showCheckmark && <span className="thematic-selected" aria-hidden="true" />}
      </div>
      <button
        type="button"
        aria-label={`Sélectionner ${name}`}
        onClick={() => !used && onSelect(id)}
        disabled={used}
      >
        <span className={`c-icon__circle ${color} ${showCheckmark ? 'selected' : ''}`}>
          <em className={`c-icon ${icon} ${color} xl`} aria-hidden="true" />
        </span>
      </button>
      <span className={`c-legend-action pt-1 text-center c-${color}`}>{name}</span>
    </div>
  );
}
