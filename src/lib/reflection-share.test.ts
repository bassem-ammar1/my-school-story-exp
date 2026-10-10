import { expect,it } from 'vitest';
import { allHistoryPoints,combinedHistoryPoints } from './reflection-history';
import { QUESTIONS, QUESTIONNAIRE_VERSION, SCORING_VERSION } from './cognitive';
import { reflectionCaption,donutGrades } from './reflection-share';
it('combines six illustrative grades with submitted grades while retaining provenance in shares',()=>{
 const row={status:'submitted',created_at:'2026-10-10',submitted_at:'2026-10-10T07:00:00Z',questionnaire_version:QUESTIONNAIRE_VERSION,scoring_version:SCORING_VERSION,responses:Object.fromEntries(QUESTIONS.map(q=>[q.id,q.reverse?2:4]))};
 const points=combinedHistoryPoints([row],'personal',true);expect(points).toHaveLength(7);expect(points.filter(p=>p.illustrative)).toHaveLength(6);expect(points.at(-1)).toEqual({date:row.submitted_at,value:4,illustrative:false});
 expect(reflectionCaption([{label:'Personal skills',points}],false)).toBe('My reflection history (includes illustrative records, not submitted assessments)\nPersonal skills\nGrades out of 5 · current self-reported tendencies, not ability.');
});
it('donut shares use selected answer-derived grades out of five without filling missing categories',()=>{
 expect(donutGrades([{label:'Personal skills',kind:'habit',points:[{date:'2026-01-10',value:2},{date:'2026-10-10',value:4.2}]},{label:'Social skills',points:[{date:'2026-10-10',value:null}]}])).toEqual([{label:'Personal skills',kind:'habit',grade:4.2},{label:'Social skills',kind:undefined,grade:null}]);
});
it('labels shared sample records as examples, never personal results',()=>{
 expect(reflectionCaption([{label:'Personal skills',points:[{date:'2026-10-10',value:4}]}],true)).toBe('Sample reflection charts (example records, not my assessment results)\nPersonal skills\nGrades out of 5 · current self-reported tendencies, not ability.');
});
it('includes every new completed reflection even on the same day and excludes drafts',()=>{
 const attempt={status:'submitted',created_at:'2026-10-10T06:00:00Z',submitted_at:'2026-10-10T06:00:00Z',questionnaire_version:QUESTIONNAIRE_VERSION,scoring_version:SCORING_VERSION,responses:Object.fromEntries(QUESTIONS.map(q=>[q.id,q.reverse?2:4]))};
 const rows=[attempt,{...attempt,submitted_at:'2026-10-10T07:00:00Z'},{...attempt,status:'draft'},{...attempt,questionnaire_version:'old'}];
 expect(allHistoryPoints(rows,'personal')).toEqual([{date:'2026-10-10T06:00:00Z',value:4},{date:'2026-10-10T07:00:00Z',value:4}]);
});