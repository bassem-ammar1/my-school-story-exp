import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ReflectionShare } from './ReflectionShare';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from '@/lib/cognitive';
import { allHistoryPoints, combinedHistoryPoints, type HistoryAttempt } from '@/lib/reflection-history';
import { Button } from '@/components/ui/button';
export function ReflectionHistoryCharts({ attempts, examples }: { attempts: HistoryAttempt[]; examples: boolean }) {
 return <Collapsible className="space-y-4 border-t pt-4">
  <CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-between px-0 font-bold">My results<ChevronDown className="size-4" /></Button></CollapsibleTrigger>
  <CollapsibleContent className="space-y-4">
   <p className="text-xs text-muted-foreground">Grades out of 5 · every completed reflection.</p>
   {examples && <p className="text-xs text-muted-foreground">Combined history includes six illustrative records from October 2024, not submitted assessments.</p>}
   {CATEGORIES.map(c => {
    const real = allHistoryPoints(attempts, c.id);
    const data = combinedHistoryPoints(attempts, c.id, examples);
    return <section key={c.id} className="space-y-2 border-b pb-4">
     <h4 className="text-sm font-semibold">{c.label}</h4>
     <ReflectionShare label={`Share ${c.label}`} series={[{ label: c.label, kind: c.kind, points: data }]} />
     {!data.length ? <p className="text-xs text-muted-foreground">No comparable results yet.</p> : <div className="h-44 w-full" role="img" aria-label={`${c.label} history chart, ${real.length} submitted results${examples ? ', 6 illustrative records' : ''}`}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, left: -25, bottom: 4 }}>
       <CartesianGrid stroke="var(--border)" />
       <XAxis dataKey="date" tickFormatter={v => new Date(v.length === 10 ? `${v}T00:00:00Z` : v).toLocaleDateString('en', { month: 'short', year: '2-digit' })} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} minTickGap={15} />
       <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
       <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} formatter={(v, _name, item) => [`${Number(v).toFixed(1)}/5`, item.payload.illustrative ? 'Illustrative record' : 'Submitted result']} />
       <Line name="Reflection history" type="linear" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--primary)' }} connectNulls={false} isAnimationActive={false} />
      </LineChart></ResponsiveContainer>
     </div>}
    </section>;
   })}
  </CollapsibleContent>
 </Collapsible>;
}
