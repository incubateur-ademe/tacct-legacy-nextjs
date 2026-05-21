'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.scss';

/**
 * Port du `logo` dynamique du `app-header` legacy.
 *
 * Selon la route courante, on choisit une des 3 variantes du logo dans le
 * header :
 *   – `logoTacct` (défaut) : accueil workspace, profil, paramètres, admin
 *   – `logoTacctDiagnose` : pages du parcours « diagnostic » (dashboard,
 *     observed-climate, future-climate, sensibility, skills-partners-mobilised)
 *   – `logoTacctStrategy` : pages du parcours « stratégies » (impacts)
 *
 * Le mapping est dérivé du legacy `header.component.ts` qui regarde `menuKey`
 * sur la route ; côté Next, on regarde simplement le segment de l'URL.
 */
export function HeaderLogo() {
  const pathname = usePathname() ?? '';

  const variant = resolveLogoVariant(pathname);
  const className =
    variant === 'diagnose'
      ? styles.logoTacctDiagnose
      : variant === 'strategy'
        ? styles.logoTacctStrategy
        : styles.logoTacct;

  return (
    <Link
      href="/workspace"
      aria-label="Accueil"
      className={`justify-content-between ${className}`}
    />
  );
}

function resolveLogoVariant(pathname: string): 'default' | 'diagnose' | 'strategy' {
  // Sous /workspace, on regarde le 1er segment significatif
  const segments = pathname.split('/').filter(Boolean);
  // ['workspace', '<segment>', ...]
  const segment = segments[1] ?? '';

  if (
    segment === 'dashboard' ||
    segment === 'observed-climate' ||
    segment === 'future-climate' ||
    segment === 'sensibility' ||
    segment === 'skills-partners-mobilised'
  ) {
    return 'diagnose';
  }

  if (segment === 'impacts') {
    return 'strategy';
  }

  // accueil ('' ou rien), profile, settings, gestion → logo par défaut
  return 'default';
}
