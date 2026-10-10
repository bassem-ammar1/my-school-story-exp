export function studentAge(dob: string | null, today = new Date().toISOString().slice(0, 10)): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || dob > today) return null;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (!Number.isFinite(birth.getTime()) || birth.toISOString().slice(0, 10) !== dob) return null;
  const [year, month, day] = today.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return null;
  return year - birth.getUTCFullYear() - (month < birth.getUTCMonth() + 1 || (month === birth.getUTCMonth() + 1 && day < birth.getUTCDate()) ? 1 : 0);
}
export function guardianEmails(value: string): string[] {
  return [...new Set(value.split(/[,;\n]/).map(v => v.trim().toLowerCase()).filter(Boolean))];
}
export function safetyError(dob: string, emails: string[], ownEmail: string): string | null {
  const age = studentAge(dob);
  if (age === null || age > 120) return 'Enter a valid date of birth.';
  if (emails.length < 1 || emails.length > 5 || emails.some(e => e.length > 254 || !/^[\w.%+-]+@[\w.-]+\.[a-z]{2,}$/i.test(e))) return 'Add one to five valid guardian email addresses.';
  if (emails.includes(ownEmail.trim().toLowerCase())) return 'Use a guardian email different from your own.';
  return null;
}