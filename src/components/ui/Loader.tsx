import styles from './Loader.module.scss';

/**
 * Indicateur de chargement centré, repris de l'outil principal.
 *
 * Pas de `'use client'` : le composant n'est que du balisage, l'animation est
 * entièrement CSS. Il reste donc rendu côté serveur, ce qui est le but — il doit
 * s'afficher avant que le moindre JS n'arrive.
 */
export const Loader = ({ minHeight }: { minHeight?: string }) => (
  <div
    role="status"
    aria-label="Chargement en cours"
    className={styles.wrapper}
    style={minHeight ? { minHeight } : undefined}
  >
    <div className={styles.spinner} />
  </div>
);
