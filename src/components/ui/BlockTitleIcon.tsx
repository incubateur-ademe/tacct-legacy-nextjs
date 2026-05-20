/**
 * Port de `app-block-title-icon` (Angular legacy).
 *
 * Structure : icône (avec ou sans cercle) à gauche, titre + sous-titre à droite.
 * Le sous-titre se place AU-DESSUS du titre, contrairement à un layout classique.
 */

type Size = 'xl' | 'large' | 'medium';

type Props = {
  pageTitle: string;
  subtitle?: string;
  icon?: string;
  contour?: boolean;
  size?: Size;
  year?: number | string;
  region?: string;
  className?: string;
};

export function BlockTitleIcon({
  pageTitle,
  subtitle,
  icon,
  contour = true,
  size = 'xl',
  year,
  region,
  className,
}: Props) {
  const wrapperClass = size === 'xl' ? 'sc-block-title-icon' : 'sc-block-title-icon-lower';
  const titleClass = size === 'xl' ? 'c-title-h1' : 'p-bold-primary';

  return (
    <div className={[wrapperClass, className].filter(Boolean).join(' ')}>
      {icon && contour && (
        <span className="c-icon__circle project-primary-secondary sc-block-title-icon__icon">
          <em className={`c-icon project-primary-secondary ${size} ${icon}`} aria-hidden="true" />
        </span>
      )}
      {icon && !contour && (
        <span className="sc-block-title-icon__icon">
          <em className={`c-icon project-primary-secondary ${size} ${icon}`} aria-hidden="true" />
        </span>
      )}
      <div>
        {subtitle && <h2 className="c-subtitle">{subtitle}</h2>}
        <h1 className={`${titleClass} sc-block-title-icon__title`}>{pageTitle}</h1>
        {year && (
          <div className="sc-block-title-icon__description">
            Région {region} &nbsp;&nbsp; Etude {year}
          </div>
        )}
      </div>
    </div>
  );
}
