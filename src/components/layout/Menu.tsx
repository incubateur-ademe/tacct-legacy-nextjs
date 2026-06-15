'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  getNavItemsForKey,
  getImpactStrategyNavItems,
  resolveMenuKey,
  type NavItem,
} from './menu-items';

type SmallMode = 'normal' | 'small' | 'burger';

export interface MenuProps {
  /**
   * Statut par étude (clé = `statusField` d'un nav item).
   * Permet d'afficher le badge incomplete/in-progress/validated à droite.
   */
  studyStatus?: {
    observed_exposure_valid?: string;
    exposition_future_valid?: string;
    sensibility_valid?: string;
  };
  /**
   * Rôles du user courant (parsed depuis le champ JSON `roles` en base).
   * Utilisé pour filtrer les items du menu qui exigent un rôle spécifique
   * (ex. `ROLE_ADMIN` pour les pages d'administration).
   */
  userRoles?: string[];
  initialSmallMode?: SmallMode;
}

export function Menu({
  studyStatus,
  userRoles = [],
  initialSmallMode = 'normal',
}: MenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const smallMode = initialSmallMode;

  const menuKey = resolveMenuKey(pathname);

  // Placeholder qui réserve la largeur du menu (legacy : .sc-app__zone-menu, toujours
  // présent même quand le menu lui-même est masqué — cf. accueil sans menuKey).
  const zonePlaceholder = (
    <div
      className={`sc-app__zone-menu ${
        smallMode === 'small' ? 'small' : smallMode === 'normal' ? 'normal' : ''
      }`}
    />
  );

  // Pas de menuKey (ex. /workspace accueil) : on garde l'espace réservé mais pas la nav.
  if (!menuKey) return zonePlaceholder;

  const navItems = (
    menuKey === 'IMPACT_STRATEGIE'
      ? getImpactStrategyNavItemsFromPath(pathname)
      : getNavItemsForKey(menuKey)
  ).filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

  const isItemActive = (item: NavItem) => {
    const fullPath = item.route ? `/${item.route}` : '/';
    if (item.route === '') {
      return pathname === '/';
    }
    if (item.exact) {
      return pathname === fullPath;
    }
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const isSubNavActive = (item: NavItem, sub: { subRoute: string }) =>
    pathname === `/${item.route}/${sub.subRoute}` ||
    pathname.startsWith(`/${item.route}/${sub.subRoute}/`);

  return (
    <>
      {zonePlaceholder}
      {/* Wrapper en position absolute (équivalent du host <app-menu class="sc-app__menu"> du legacy) */}
      <div className="sc-app__menu">
      <div
      className={`sc-menu ${
        smallMode === 'normal'
          ? 'normal'
          : smallMode === 'small'
            ? 'small'
            : 'burger-menu'
      } ${isOpen ? 'open' : ''}`}
    >
      {smallMode !== 'normal' && (
        <button
          type="button"
          className={`c-btn--tertiary-icon-square sc-menu__icon ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <em className={`c-icon burger medium project-primary ${isOpen ? 'close' : ''}`} />
        </button>
      )}

      <nav
        className={`sc-menu__content ${isOpen ? 'open' : ''} ${
          smallMode === 'small' ? 'small' : smallMode === 'burger' ? 'burger-menu' : ''
        }`}
      >
        {navItems.map((item) => {
          const active = isItemActive(item);
          const hasSubNav = (item.subNav?.length ?? 0) > 0;
          const fullPath = item.route ? `/${item.route}` : '/';
          const statusValue =
            item.statusField && studyStatus ? studyStatus[item.statusField] : undefined;

          return (
            <span key={item.name}>
              <Link
                href={fullPath}
                className={`sc-menu__nav ${
                  smallMode === 'normal' ? 'normal' : smallMode === 'burger' ? 'burger-menu' : ''
                } ${hasSubNav ? 'sc-menu__nav--no-event' : ''} ${active ? 'active' : ''}`}
              >
                <em className={`c-icon medium project-primary ${item.icon}`} />
                <span className="sc-menu__title-nav" title={item.title}>
                  {item.title}
                </span>
                {statusValue && (
                  <div className="ml-auto">
                    <MenuStatus status={statusValue} />
                  </div>
                )}
              </Link>

              {hasSubNav &&
                item.subNav!.map((sub) => (
                  <Link
                    key={sub.subRoute}
                    href={`/${item.route}/${sub.subRoute}`}
                    className={`sc-menu__subnav ${isSubNavActive(item, sub) ? 'active' : ''}`}
                    title={sub.subTitle}
                  >
                    {sub.subTitle}
                  </Link>
                ))}
            </span>
          );
        })}
      </nav>
    </div>
    </div>
    </>
  );
}

// Extrait type/id du chemin (/impacts/{type}/{id}/...) pour construire
// les items du menu de travail d'un impact.
function getImpactStrategyNavItemsFromPath(pathname: string): NavItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const type = segments[1] ?? '';
  const id = segments[2] ?? '';
  return getImpactStrategyNavItems(type, id);
}

// Statuts des étapes du diagnostic (port de entity/stepstatus.ts du legacy).
const STEP_STATUS = {
  'in-progress': { label: 'En cours', icon: 'status-inprogress' },
  incomplete: { label: 'Incomplet', icon: 'status-suspended' },
  validated: { label: 'Validé', icon: 'status-validate' },
} as const;

function MenuStatus({ status }: { status: string }) {
  const { label, icon } =
    STEP_STATUS[status as keyof typeof STEP_STATUS] ?? STEP_STATUS.incomplete;
  return (
    <div className={`c-menu-status ${status}`} title={label}>
      <em className={`c-icon small ${icon}`} aria-hidden="true" />
    </div>
  );
}
