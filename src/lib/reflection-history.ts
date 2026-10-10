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
const EXAMPLE_GRADES = [
 [3.2, 3.8, 3.1, 4.0, 3.4, 3.7],
 [3.7, 3.2, 3.6, 3.4, 3.9, 3.3],
 [3.1, 3.9, 3.3, 4.2, 3.5, 4.0],
 [4.0, 3.5, 4.1, 3.7, 4.2, 3.6],
 [3.6, 4.3, 3.7, 4.4, 3.8, 4.2],
 [4.2, 3.9, 4.4, 4.0, 4.5, 3.9],
];
export const EXAMPLE_HISTORY = ['2024-10-24','2025-01-24','2025-07-24','2026-01-24','2026-07-24','2026-10-10'].map((date,i)=>({date,grades:Object.fromEntries(CATEGORIES.map((c,k)=>[c.id,EXAMPLE_GRADES[i]?.[k] ?? 3]))}));
export function historyChartData(attempts: HistoryAttempt[], category: string, examples: boolean) {
 const real = allHistoryPoints(attempts, category).map(p=>({...p,sampleValue:null as number|null}));
 const sample = examples ? EXAMPLE_HISTORY.map(r=>({date:r.date,value:null as number|null,sampleValue:r.grades[category]??null})) : [];
 return [...real,...sample].sort((a,b)=>a.date.localeCompare(b.date));
}
export function combinedHistoryPoints(attempts: HistoryAttempt[], category: string, examples: boolean) {
 return historyChartData(attempts,category,examples).map(p=>({date:p.date,value:p.value??p.sampleValue,illustrative:p.sampleValue!==null}));
}