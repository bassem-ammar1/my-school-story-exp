import { describe, expect, it } from 'vitest';
import { SCHOOL_THEMES, validTheme } from './profile-themes';
describe('school themes', () => {
  it('offers exactly three distinct themes', () => {
    expect(SCHOOL_THEMES).toHaveLength(3);
    expect(new Set(SCHOOL_THEMES.map(t => t.id)).size).toBe(3);
  });
  it('accepts supported choices and safely defaults invalid preferences', () => {
    expect(validTheme('garden')).toBe('garden');
    expect(validTheme('coral')).toBe('coral');
    expect(validTheme(null)).toBe('classic');
    expect(validTheme('unknown')).toBe('classic');
  });
});