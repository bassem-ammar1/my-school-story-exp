import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { educationGroups, educationError, type EducationEntry } from '@/lib/education';

const blank = { id: '', school_name: '', grade: 1, start_year: 2026, end_year: 2027, status: 'current', shared: false, is_example: false };
export function EducationJourney({ userId, editable = false }: { userId: string; editable?: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<EducationEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const { data: schools = [] } = useQuery({ queryKey: ['school-directory'], enabled: editable, queryFn: async()=> { const {data,error}=await supabase.from('schools').select('id,name'); if(error)throw error;return data??[]; }});
  const { data: enrollments = [] } = useQuery({queryKey:['education-enrollments',userId],enabled:editable,queryFn:async()=>{const{data,error}=await supabase.from('school_enrollments').select('education_id,status').eq('student_id',userId);if(error)throw error;return data??[];}});
  const { data: entries = [], isError } = useQuery({ queryKey: ['education', userId, editable], queryFn: async () => {
    let query = supabase.from('education_entries').select('*').eq('user_id',userId).order('start_year', { ascending: false });
    if (!editable) query = query.eq('shared',true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } });
  const save = async () => {
    if (!form) return;
    const errorMessage = educationError(form);
    if (errorMessage) { toast.error(errorMessage); return; }
    setBusy(true);
    const { id, ...values } = form;
    const payload = { ...values, school_name: values.school_name.trim(), user_id: userId, is_example: false };
    const { data: saved, error } = id ? await supabase.from('education_entries').update(payload).eq('id',id).select('id').single() : await supabase.from('education_entries').insert(payload).select('id').single();
    setBusy(false);
    if (error) { toast.error(error.code === '23505' ? 'Mark the existing current grade as previous before adding another current grade.' : 'Your education entry could not be saved.'); return; }
    if(schoolId && saved){const{error:requestError}=await supabase.rpc('request_school_enrollment',{_education:saved.id,_school:schoolId});if(requestError){toast.error('Education saved, but the school request failed. Please try again.');return;} await qc.invalidateQueries({queryKey:['education-enrollments',userId]});}
    setForm(null); await qc.invalidateQueries({queryKey:['education',userId]}); toast.success('Education saved');
  };
  const remove = async (id: string) => {
    if (!confirm('Remove this education entry?')) return;
    const { error } = await supabase.from('education_entries').delete().eq('id',id);
    if (error) toast.error('Could not remove this entry.');
    else qc.invalidateQueries({queryKey:['education',userId]});
  };
  if (!editable && !entries.length) return null;
  return <section className="mt-2 bg-card p-4"><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold"><GraduationCap className="h-5 w-5 text-primary" />Education</h2>{editable && <Button size="icon" variant="ghost" aria-label="Add education" title="Add education" onClick={()=>{setSchoolId('');setForm({...blank,status:entries.some(e=>e.status==='current')?'planned':'current'});}}><Plus /></Button>}</div>
    {editable && enrollments.map(e=><p key={e.education_id} className="text-xs text-muted-foreground">School enrollment: {e.status}</p>)}
    {isError && <p className="text-sm text-destructive">Education could not be loaded.</p>}
    {entries.some(e=>e.is_example) && <p className="mt-1 text-xs text-muted-foreground">Example education journey · replace with your own schools and grades.</p>}
    {!entries.length && !isError && <p className="mt-2 text-sm text-muted-foreground">No education added yet.</p>}
    <div className="mt-3 space-y-4">{educationGroups(entries).map((group,index)=><div key={`${group.school}-${index}`} className="relative border-l-2 border-primary/30 pl-4"><span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary" /><h3 className="font-semibold">{group.school}</h3><ol className="mt-2 space-y-3">{group.entries.map(e=><li key={e.id} className="flex items-center justify-between gap-2 border-l border-border pl-3"><div className="min-w-0"><p className="text-sm font-medium">Grade {e.grade} <span className={`ml-1 text-xs ${e.status==='current'?'text-primary':'text-muted-foreground'}`}>{e.status==='current'?'Current':e.status==='planned'?'Planned':'Previous'}</span></p><p className="text-xs text-muted-foreground">{e.start_year}–{e.end_year}{editable && !e.shared?' · Only you':''}</p></div>{editable && <div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label={`Edit grade ${e.grade} at ${e.school_name}`} title="Edit entry" onClick={()=>setForm(e)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Remove grade ${e.grade} at ${e.school_name}`} title="Remove entry" onClick={()=>remove(e.id)}><Trash2 /></Button></div>}</li>)}</ol></div>)}</div>
    {form && <form onSubmit={e=>{e.preventDefault();save();}} className="mt-4 space-y-3 border-t pt-4"><div className="space-y-1"><Label htmlFor="education-school">School name</Label><Input id="education-school" maxLength={120} required value={form.school_name} onChange={e=>setForm({...form,school_name:e.target.value})} /></div><div className="space-y-1"><Label htmlFor="education-registered-school">Request school approval</Label><select id="education-registered-school" className="w-full rounded-md border bg-background p-2 text-sm" value={schoolId} onChange={e=>{setSchoolId(e.target.value);const school=schools.find(s=>s.id===e.target.value);if(school)setForm({...form,school_name:school.name});}}><option value="">No registered school selected</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><p className="text-xs text-muted-foreground">Enrollment stays pending until your selected school approves.</p></div><div className="grid grid-cols-3 gap-2">{([['grade','Grade',1,12],['start_year','Start year',1900,2200],['end_year','End year',1901,2201]] as const).map(([key,label,min,max])=><div key={key} className="space-y-1"><Label htmlFor={`education-${key}`}>{label}</Label><Input id={`education-${key}`} type="number" min={min} max={max} required value={form[key as 'grade'|'start_year'|'end_year']} onChange={e=>setForm({...form,[key]:Number(e.target.value)})} /></div>)}</div><div className="space-y-1"><Label>Status</Label><Select value={form.status} onValueChange={status=>setForm({...form,status})}><SelectTrigger aria-label="Education status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="previous">Previous</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="planned">Planned</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between gap-2"><Label htmlFor="education-shared">Show on my member profile</Label><Switch id="education-shared" checked={form.shared} onCheckedChange={shared=>setForm({...form,shared})} /></div><div className="flex gap-2"><Button type="submit" disabled={busy}><Check />{busy?'Saving…':'Save education'}</Button><Button type="button" variant="outline" onClick={()=>setForm(null)}>Cancel</Button></div></form>}
  </section>;
}