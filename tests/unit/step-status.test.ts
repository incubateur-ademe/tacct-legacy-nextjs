import { describe, expect, it } from 'vitest';
import {
  statusesAfterFutureExposureChange,
  statusesAfterObservedExposureChange,
} from '@/lib/step-status';

const validated = {
  sensibility_valid: 'validated',
  exposition_future_valid: 'validated',
};

describe('statusesAfterObservedExposureChange', () => {
  it('remet les trois étapes en cours quand il ne reste aucun aléa', () => {
    expect(statusesAfterObservedExposureChange({ exposures: [], current: validated })).toEqual({
      observed_exposure_valid: 'in-progress',
      exposition_future_valid: 'in-progress',
      sensibility_valid: 'in-progress',
    });
  });

  it("rétrograde les étapes aval validées dès qu'un aléa change", () => {
    expect(
      statusesAfterObservedExposureChange({
        exposures: [{ exposure: 2 }, { exposure: 0 }],
        current: validated,
      }),
    ).toEqual({
      observed_exposure_valid: 'in-progress',
      exposition_future_valid: 'in-progress',
      sensibility_valid: 'in-progress',
    });
  });

  it("passe incomplete si un aléa n'a pas de niveau d'exposition", () => {
    const { observed_exposure_valid } = statusesAfterObservedExposureChange({
      exposures: [{ exposure: 2 }, { exposure: null }],
      current: validated,
    });

    expect(observed_exposure_valid).toBe('incomplete');
  });

  it('ne repose jamais validated : seule la validation explicite le fait', () => {
    const statuses = statusesAfterObservedExposureChange({
      exposures: [{ exposure: 3 }],
      current: validated,
    });

    expect(Object.values(statuses)).not.toContain('validated');
  });

  it('laisse les statuts non validés inchangés', () => {
    expect(
      statusesAfterObservedExposureChange({
        exposures: [{ exposure: 1 }],
        current: { sensibility_valid: 'incomplete', exposition_future_valid: 'incomplete' },
      }),
    ).toEqual({
      observed_exposure_valid: 'in-progress',
      exposition_future_valid: 'incomplete',
      sensibility_valid: 'incomplete',
    });
  });

  it("force l'exposition future à incomplete quand on ajoute un aléa", () => {
    const { exposition_future_valid } = statusesAfterObservedExposureChange({
      exposures: [{ exposure: 1 }, { exposure: 2 }],
      current: { sensibility_valid: 'in-progress', exposition_future_valid: 'in-progress' },
      resetFutureExposure: true,
    });

    expect(exposition_future_valid).toBe('incomplete');
  });
});

describe('statusesAfterFutureExposureChange', () => {
  const complete = { trends: 'increase', exposure: 3 };

  it('passe en cours quand toutes les expositions futures sont renseignées', () => {
    expect(
      statusesAfterFutureExposureChange({
        exposures: [{ futureExposure: complete }, { futureExposure: complete }],
        current: { sensibility_valid: 'validated' },
      }),
    ).toEqual({
      exposition_future_valid: 'in-progress',
      sensibility_valid: 'in-progress',
    });
  });

  it("passe incomplete s'il manque une tendance, un niveau ou l'exposition entière", () => {
    for (const futureExposure of [
      null,
      { trends: null, exposure: 3 },
      { trends: 'increase', exposure: null },
    ]) {
      expect(
        statusesAfterFutureExposureChange({
          exposures: [{ futureExposure: complete }, { futureExposure }],
          current: { sensibility_valid: 'in-progress' },
        }).exposition_future_valid,
        JSON.stringify(futureExposure),
      ).toBe('incomplete');
    }
  });

  it('accepte le niveau 0, qui est une valeur renseignée', () => {
    expect(
      statusesAfterFutureExposureChange({
        exposures: [{ futureExposure: { trends: 'decrease', exposure: 0 } }],
        current: { sensibility_valid: 'in-progress' },
      }).exposition_future_valid,
    ).toBe('in-progress');
  });
});
