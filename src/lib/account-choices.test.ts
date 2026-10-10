import { describe, expect, it } from 'vitest';
import { ACCOUNT_CHOICES, validAccountChoice, requestedAccessRole, showAccessRequest } from './account-choices';
describe('signup account choices', () => {
  it('offers student, teacher and school', () => { expect(ACCOUNT_CHOICES).toEqual(['student', 'teacher', 'school']); });
  it('defaults invalid or privileged values to student', () => { expect(validAccountChoice('school_admin')).toBe('student'); expect(validAccountChoice(null)).toBe('student'); });
  it('students have no elevated access request', () => { expect(requestedAccessRole('student')).toBeNull(); expect(showAccessRequest('student')).toBe(false); });
  it('teacher and school choices request the corresponding approved access', () => { expect(requestedAccessRole('teacher')).toBe('teacher'); expect(requestedAccessRole('school')).toBe('school_admin'); expect(showAccessRequest('school')).toBe(true); });
});