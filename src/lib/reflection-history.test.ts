import { expect,it } from 'vitest';
import { EXAMPLE_HISTORY,historyPoints,allHistoryPoints } from './reflection-history';
import { QUESTIONS,QUESTIONNAIRE_VERSION,SCORING_VERSION } from './cognitive';
it('keeps six example records spanning two years',()=>{expect(EXAMPLE_HISTORY).toHaveLength(6);expect(EXAMPLE_HISTORY[0]?.date).toBe('2024-10-10');expect(EXAMPLE_HISTORY[5]?.date).toBe('2026-10-10');});
it('only compares compatible submitted results at least three months apart',()=>{
 const rows=['2026-01-10','2026-02-10','2026-04-10'].map(date=>({status:'submitted',submitted_at:date,created_at:date,questionnaire_version:QUESTIONNAIRE_VERSION,scoring_version:SCORING_VERSION,responses:Object.fromEntries(QUESTIONS.map(q=>[q.id,q.reverse?2:4]))}));
 expect(historyPoints(rows,'personal')).toEqual([{date:'2026-01-10',value:4},{date:'2026-04-10',value:4}]);
 expect(allHistoryPoints(rows,'personal')).toEqual([{date:'2026-01-10',value:4},{date:'2026-02-10',value:4},{date:'2026-04-10',value:4}]);
 expect(historyPoints([{...rows[0],status:'draft'}] as typeof rows,'personal')).toEqual([]);
});