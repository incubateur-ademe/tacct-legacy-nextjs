/**
 * Port de `app-block-header` (Angular legacy).
 *
 * Variante plus compacte de `BlockTitleIcon` : icône à gauche, titre + compteur
 * "| N" à droite. Utilisé dans le dashboard pour les headers des cards
 * EXPOSITION, SENSIBILITE et chaque thématique de l'accordéon.
 */

type Size = 'xl' | 'large' | 'medium';

type Props = {
  pageTitle: string;
  icon?: string;
  nbElement?: number;
  size?: Size;
  contour?: boolean;
  ellipsis?: boolean;
  className?: string;
};

export function BlockHeader({
  pageTitle,
  icon,
  nbElement,
  size = 'xl',
  contour = false,
  ellipsis = false,
  className,
}: Props) {
  const wrapperClass = size === 'xl' ? 'sc-block-title-icon' : 'sc-block-title-icon-lower';

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
        <h1 className="sc-block-title-title-with-element">
          <div className="d-flex bd-highlight">
            {ellipsis ? (
              <div
                className="p-2 w-100 sc-block-title c-subtitle-black-bold"
                title={pageTitle}
              >
                {pageTitle}
              </div>
            ) : (
              <div className="p-2 w-100 bd-highlight p-bold-primary">{pageTitle}</div>
            )}
            {nbElement !== undefined && nbElement !== null && (
              <div className="p-2 flex-shrink-1 bd-highlight sc-block-title-number-element">
                |&nbsp;{nbElement}
              </div>
            )}
          </div>
        </h1>
      </div>
    </div>
  );
}
