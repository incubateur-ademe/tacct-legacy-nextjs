/**
 * Port de `app-label` (Angular legacy) : affichage read-only « titre / valeur »
 * empilé verticalement (titre gris au-dessus, valeur en gras dessous).
 */
export function Label({
  titleLabel,
  label,
  className,
}: {
  titleLabel: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={['sc-label', className].filter(Boolean).join(' ')}>
      <span className="sc-label__title">{titleLabel}</span>
      <span className="sc-label__value">{label}</span>
    </div>
  );
}
