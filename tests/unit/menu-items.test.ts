import { describe, expect, it } from 'vitest';
import { adminNavItems, getNavItemsForKey, resolveMenuKey } from '@/components/layout/menu-items';

describe('menu d’administration', () => {
  const settings = adminNavItems.find((item) => item.name === 'settings');

  it('propose une entrée Paramétrage vers /settings', () => {
    expect(settings).toBeDefined();
    expect(settings?.route).toBe('settings');
    expect(settings?.roles).toEqual(['ROLE_ADMIN']);
  });

  it("masque cette entrée quand l'utilisateur n'a pas d'étude", () => {
    // /settings redirige vers la liste des études sans étude courante :
    // l'entrée doit disparaître plutôt que d'être un lien mort.
    expect(settings?.requiresStudy).toBe(true);
  });

  it('conserve le menu admin sur /settings pour un admin', () => {
    expect(resolveMenuKey('/settings')).toBe('SETTINGS');

    const forAdmin = getNavItemsForKey('SETTINGS', true);
    expect(forAdmin.map((i) => i.name)).toContain('studies-management');

    const forUser = getNavItemsForKey('SETTINGS', false);
    expect(forUser.map((i) => i.name)).not.toContain('studies-management');
  });
});
