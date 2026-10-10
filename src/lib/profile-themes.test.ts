import { describe, expect, it } from 'vitest';
import { SCHOOL_THEMES, KIDS_THEMES, ALL_THEMES, validTheme } from './profile-themes';
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
  it('offers exactly the three requested kids themes alongside school themes', () => {
    expect(KIDS_THEMES.map(t => t.id)).toEqual(['spongebob', 'minecraft', 'powerpuff']);
    expect(ALL_THEMES).toHaveLength(6);
  });
  it('persists supported kids theme preferences without falling back', () => {
    expect(validTheme('spongebob')).toBe('spongebob');
    expect(validTheme('minecraft')).toBe('minecraft');
    expect(validTheme('powerpuff')).toBe('powerpuff');
  });
});