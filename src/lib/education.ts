export type EducationEntry = { id: string; school_name: string; grade: number; start_year: number; end_year: number; status: string; shared: boolean; is_example: boolean };
export function educationGroups(entries: EducationEntry[]) {
  const ordered = [...entries].sort((a,b) => a.start_year - b.start_year || a.end_year - b.end_year);
  const groups: { school: string; entries: EducationEntry[] }[] = [];
  for (const entry of ordered) {
    const last = groups.at(-1);
    if (last?.school === entry.school_name) last.entries.push(entry);
    else groups.push({ school: entry.school_name, entries: [entry] });
  }
  return groups;
}
export function educationError(entry: { school_name: string; grade: number; start_year: number; end_year: number }) {
  if (entry.school_name.trim().length < 2 || entry.school_name.trim().length > 120) return 'Enter a school name between 2 and 120 characters.';
  if (!Number.isInteger(entry.grade) || entry.grade < 1 || entry.grade > 12) return 'Grade must be from 1 to 12.';
  if (!Number.isInteger(entry.start_year) || entry.start_year < 1900 || entry.start_year > 2200 || !Number.isInteger(entry.end_year) || entry.end_year <= entry.start_year || entry.end_year > 2201) return 'Enter valid school years, with the end after the start.';
  return null;
}