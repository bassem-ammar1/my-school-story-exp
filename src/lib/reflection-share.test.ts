import { expect,it } from 'vitest';
import { allHistoryPoints } from './reflection-history';
import { QUESTIONS, QUESTIONNAIRE_VERSION, SCORING_VERSION } from './cognitive';
it('includes every new completed reflection even on the same day and excludes drafts',()=>{
 const attempt={status:'submitted',created_at:'2026-10-10T06:00:00Z',submitted_at:'2026-10-10T06:00:00Z',questionnaire_version:QUESTIONNAIRE_VERSION,scoring_version:SCORING_VERSION,responses:Object.fromEntries(QUESTIONS.map(q=>[q.id,q.reverse?2:4]))};
 const rows=[attempt,{...attempt,submitted_at:'2026-10-10T07:00:00Z'},{...attempt,status:'draft'},{...attempt,questionnaire_version:'old'}];
 expect(allHistoryPoints(rows,'personal')).toEqual([{date:'2026-10-10T06:00:00Z',value:4},{date:'2026-10-10T07:00:00Z',value:4}]);
});