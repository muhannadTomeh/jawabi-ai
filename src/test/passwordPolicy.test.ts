import { describe, expect, it } from 'vitest';
import { validateNewPassword } from '@/lib/passwordPolicy';

describe('new password policy', () => {
  it('rejects passwords shorter than eight characters', () => {
    expect(validateNewPassword('Abc123')).toBeTruthy();
  });

  it('requires both letters and numbers', () => {
    expect(validateNewPassword('abcdefgh')).toBeTruthy();
    expect(validateNewPassword('12345678')).toBeTruthy();
  });

  it('accepts Arabic letters combined with numbers', () => {
    expect(validateNewPassword('جوابي2026')).toBeNull();
  });
});
