import { describe, expect, it } from 'vitest';
import { educationGroups, educationError, type EducationEntry } from './education';
const make = (id: string, school_name: string, start_year: number, status: string): EducationEntry => ({ id,school_name,start_year,end_year:start_year+1,grade:8,shared:false,is_example:false,status });
describe('education journey', () => {
  it('groups previous and current grades at the same school before a planned move', () => {
    const groups = educationGroups([make('c','Next school',2027,'planned'),make('b','Current school',2026,'current'),make('a','Current school',2025,'previous')]);
    expect(groups.map(g=>g.school)).toEqual(['Current school','Next school']);
    expect(groups[0]?.entries.map(e=>e.id)).toEqual(['a','b']);
    expect(groups[1]?.entries[0]?.status).toBe('planned');
  });
  it('rejects end dates that precede start dates', () => { expect(educationError({school_name:'School',grade:8,start_year:2026,end_year:2025})).not.toBeNull(); });
  it('accepts grade 1 through 12 but not grade 0', () => { expect(educationError({school_name:'School',grade:0,start_year:2026,end_year:2027})).not.toBeNull(); expect(educationError({school_name:'School',grade:12,start_year:2026,end_year:2027})).toBeNull(); });
});