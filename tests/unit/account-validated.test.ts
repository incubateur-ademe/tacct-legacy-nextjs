import { describe, expect, it } from 'vitest';
import { accountValidatedValue } from '@/server/acl/account';

describe('accountValidatedValue', () => {
  it('garde un admin validé, quoi qu’on demande', () => {
    expect(accountValidatedValue(true, false)).toBe(true);
    expect(accountValidatedValue(true, true)).toBe(true);
  });

  it('laisse la main sur un compte non admin', () => {
    expect(accountValidatedValue(false, false)).toBe(false);
    expect(accountValidatedValue(false, true)).toBe(true);
  });
});
