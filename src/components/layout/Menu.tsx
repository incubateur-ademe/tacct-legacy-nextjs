'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  getNavItemsForKey,
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

  if (!menuKey) return null;

  const navItems = getNavItemsForKey(menuKey).filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

  const isItemActive = (item: NavItem) => {
    const fullPath = `/workspace${item.route ? `/${item.route}` : ''}`;
    if (item.route === '') {
      return pathname === '/workspace';
    }
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const isSubNavActive = (item: NavItem, sub: { subRoute: string }) =>
    pathname === `/workspace/${item.route}/${sub.subRoute}` ||
    pathname.startsWith(`/workspace/${item.route}/${sub.subRoute}/`);

  return (
    <>
      {/* Placeholder qui réserve la largeur du menu dans le flex (legacy .sc-app__zone-menu) */}
      <div
        className={`sc-app__zone-menu ${
          smallMode === 'small' ? 'small' : smallMode === 'normal' ? 'normal' : ''
        }`}
      />
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
          const fullPath = `/workspace${item.route ? `/${item.route}` : ''}`;
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
                    href={`/workspace/${item.route}/${sub.subRoute}`}
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

function MenuStatus({ status }: { status: string }) {
  // 3 états dans le legacy : 'incomplete', 'in-progress', 'validated'
  const label =
    status === 'validated'
      ? '✓'
      : status === 'in-progress'
        ? '…'
        : '!';
  const color =
    status === 'validated'
      ? '#198754'
      : status === 'in-progress'
        ? '#f9a825'
        : '#dc3545';

  return (
    <span
      title={status}
      style={{
        display: 'inline-flex',
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: color,
        color: 'white',
        fontSize: 11,
        fontWeight: 700,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
      }}
    >
      {label}
    </span>
  );
}
