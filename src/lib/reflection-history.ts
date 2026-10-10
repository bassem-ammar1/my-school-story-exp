import { CATEGORIES, QUESTIONNAIRE_VERSION, SCORING_VERSION, knownAnswers, scoreCategory } from './cognitive';
import { addMonths } from 'date-fns';
export type HistoryAttempt = {status:string;submitted_at:string|null;created_at:string;questionnaire_version:string;scoring_version:string;responses:unknown};
export function allHistoryPoints(attempts: HistoryAttempt[], category: string) {
 return attempts.filter(a=>a.status==='submitted'&&a.questionnaire_version===QUESTIONNAIRE_VERSION&&a.scoring_version===SCORING_VERSION).map(a=>({date:a.submitted_at??a.created_at,value:scoreCategory(category,knownAnswers(a.responses)).average})).filter(a=>a.value!==null).sort((a,b)=>a.date.localeCompare(b.date));
}
export function historyPoints(attempts: HistoryAttempt[], category: string) {
 const rows=attempts.filter(a=>a.status==='submitted'&&a.questionnaire_version===QUESTIONNAIRE_VERSION&&a.scoring_version===SCORING_VERSION).map(a=>({date:(a.submitted_at??a.created_at).slice(0,10),value:scoreCategory(category,knownAnswers(a.responses)).average})).filter(a=>a.value!==null).sort((a,b)=>a.date.localeCompare(b.date));
 const result:typeof rows=[];
 for(const row of rows){const last=result.at(-1);if(last){const next=addMonths(new Date(`${last.date}T00:00:00Z`),3);if(row.date<next.toISOString().slice(0,10))continue;}result.push(row);}
 return result;
}
export const EXAMPLE_HISTORY = ['2024-10-10','2025-01-10','2025-07-10','2026-01-10','2026-07-10','2026-10-10'].map((date,i)=>({date,grades:Object.fromEntries(CATEGORIES.map((c,k)=>[c.id,Number((2.6+i*0.22+((i+k)%3)*0.15).toFixed(1))]))}));