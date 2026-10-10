import { describe, it, expect } from 'vitest';
import { studentAge, guardianEmails, safetyError } from './student-safety';
describe('student signup safeguards', () => {
  it('Mariam is 13 until her October 24 birthday', () => {
    expect(studentAge('2012-10-24', '2026-10-10')).toBe(13);
    expect(studentAge('2012-10-24', '2026-10-24')).toBe(14);
  });
  it('a 2018 birth date is under 13', () => expect(studentAge('2018-01-01', '2026-10-10')).toBe(8));
  it('uses the exact 13th birthday boundary', () => {
    expect(studentAge('2013-10-24', '2026-10-23')).toBe(12);
    expect(studentAge('2013-10-24', '2026-10-24')).toBe(13);
  });
  it('rejects impossible dates', () => expect(studentAge('2018-02-31')).toBeNull());
  it('accepts multiple guardian emails without duplicates', () => expect(guardianEmails('parent@school.com, Parent@school.com; other@school.com')).toEqual(['parent@school.com', 'other@school.com']));
  it('rejects self guardian and missing guardian', () => {
    expect(safetyError('2012-10-24', ['me@school.com'], 'me@school.com')).not.toBeNull();
    expect(safetyError('2012-10-24', [], 'me@school.com')).not.toBeNull();
  });
});