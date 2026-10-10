export const ACCOUNT_CHOICES = ['student', 'teacher', 'school'] as const;
export type AccountChoice = (typeof ACCOUNT_CHOICES)[number];
export function validAccountChoice(value: unknown): AccountChoice {
  return ACCOUNT_CHOICES.find(choice => choice === value) ?? 'student';
}
export function requestedAccessRole(choice: AccountChoice) {
  return choice === 'student' ? null : choice === 'school' ? 'school_admin' : 'teacher';
}
export function showAccessRequest(choice: unknown) {
  return validAccountChoice(choice) !== 'student';
}