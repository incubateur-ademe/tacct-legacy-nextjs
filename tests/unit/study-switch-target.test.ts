import { describe, expect, it } from 'vitest';
import { studySwitchTarget } from '@/lib/study-switch-target';

describe('studySwitchTarget', () => {
  it('reste sur les pages génériques', () => {
    for (const pathname of [
      '/',
      '/dashboard',
      '/impacts',
      '/impacts/choose-impacts',
      '/impacts/choose-impacts/create-impact',
      '/observed-climate/observed-exposure',
      '/observed-climate/observed-exposure/add',
      '/observed-climate/observed-exposure/add/custom',
      '/sensibility',
      '/sensibility/impact-theme/add',
      '/settings',
      '/skills-partners-mobilised',
      '/gestion/studies-management',
      '/project-sheets/une-fiche',
    ]) {
      expect(studySwitchTarget(pathname), pathname).toBe(pathname);
    }
  });

  it("remonte à la section quand l'URL porte l'id d'une entité de l'étude quittée", () => {
    const id = '450889f9-c8bd-4ed4-a7c4-2dc0377d395f';

    expect(studySwitchTarget(`/impacts/impact/${id}/impact-level`)).toBe('/impacts');
    expect(studySwitchTarget(`/impacts/strategy/${id}/define-actions`)).toBe('/impacts');
    expect(studySwitchTarget(`/impacts/impact/${id}/build-trajectories/${id}`)).toBe('/impacts');
    expect(studySwitchTarget(`/impacts/choose-impacts/${id}`)).toBe('/impacts/choose-impacts');
    expect(studySwitchTarget(`/observed-climate/observed-exposure/${id}/edit`)).toBe(
      '/observed-climate/observed-exposure',
    );
    expect(studySwitchTarget(`/sensibility/impact-theme/impact/edit/${id}`)).toBe('/sensibility');
    expect(studySwitchTarget(`/sensibility/impact-theme/impact/add/${id}`)).toBe('/sensibility');
  });

  it('ne renvoie jamais vers une page hors de la section courante', () => {
    const id = '450889f9-c8bd-4ed4-a7c4-2dc0377d395f';
    const sectionOf = (path: string) => path.split('/')[1];

    for (const pathname of [
      `/impacts/impact/${id}/review-actions/criterias`,
      `/observed-climate/observed-exposure/${id}/edit`,
      `/sensibility/impact-theme/impact/edit/${id}`,
    ]) {
      expect(sectionOf(studySwitchTarget(pathname)), pathname).toBe(sectionOf(pathname));
    }
  });
});
