import { Suspense, useState } from "react";
import { useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, ArrowLeft, ArrowRight, LockKeyhole, History, Plus, Trash2, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, QUESTIONS, AGREEMENT, INTEREST, scoreAssessment, compatibleAttempts, parseAnswers, type Answers } from "@/lib/cognitive";
import { getCognitiveAttempts, saveCognitiveAttempt, deleteCognitiveAttempt, setCognitiveCoachPermission } from "@/lib/cognitive.functions";

type Attempt = Awaited<ReturnType<typeof getCognitiveAttempts>>[number];
export function CognitiveAssessment({ studentId }: { studentId: string }) {
  return <Suspense fallback={<p className="py-8 text-center text-muted-foreground">Loading your reflections…</p>}><Assessment studentId={studentId} /></Suspense>;
}
function Assessment({ studentId }: { studentId: string }) {
  const load = useServerFn(getCognitiveAttempts);
  const save = useServerFn(saveCognitiveAttempt);
  const remove = useServerFn(deleteCognitiveAttempt);
  const permission = useServerFn(setCognitiveCoachPermission);
  const qc = useQueryClient();
  const key = ["cognitive-attempts", studentId];
  const { data: attempts } = useSuspenseQuery({ queryKey: key, queryFn: () => load() });
  const [view, setView] = useState<"overview" | "questions" | "results">("overview");
  const [selected, setSelected] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [goal, setGoal] = useState("");
  const [coach, setCoach] = useState(false);
  const [section, setSection] = useState(0);
  const [busy, setBusy] = useState(false);
  const category = CATEGORIES[section] ?? CATEGORIES[0];
  const current = QUESTIONS.filter(q => q.category === category.id);
  const answered = Object.keys(answers).length;
  const start = (attempt?: Attempt) => {
    setSelected(attempt ?? null); setAnswers(attempt ? parseAnswers(attempt.responses) : {});
    setGoal(attempt?.goal ?? ""); setCoach(attempt?.use_for_coach ?? false); setSection(0); setView("questions");
  };
  const persist = async (submit: boolean) => {
    setBusy(true);
    try {
      const attempt = await save({ data: { id: selected?.id, responses: answers, goal, submit, useForCoach: coach } });
      setSelected(attempt); await qc.invalidateQueries({ queryKey: key });
      toast.success(submit ? "Your reflection is saved." : "Draft saved. You can come back later.");
      if (submit) setView("results");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Your reflection could not be saved."); }
    finally { setBusy(false); }
  };
  const deleteAttempt = async (attempt: Attempt) => {
    if (!window.confirm("Delete this private reflection permanently?")) return;
    setBusy(true);
    try { await remove({ data: { id: attempt.id } }); await qc.invalidateQueries({ queryKey: key }); setSelected(null); setView("overview"); toast.success("Reflection deleted."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete reflection."); }
    finally { setBusy(false); }
  };
  const updatePermission = async (allowed: boolean) => {
    if (!selected) return;
    setBusy(true);
    try { await permission({ data: { id: selected.id, allowed } }); setSelected({ ...selected, use_for_coach: allowed }); await qc.invalidateQueries({ queryKey: key }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not update preference."); }
    finally { setBusy(false); }
  };
  const exportAttempt = (attempt: Attempt) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...attempt, student_id: undefined, results: scoreAssessment(parseAnswers(attempt.responses)) }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "my-private-reflection.json"; link.click(); URL.revokeObjectURL(url);
  };
  if (view === "questions") return <div className="space-y-5 py-3">
    <div className="flex items-center justify-between"><Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Leave this page? Save your draft first to keep unsaved answers.")) setView("overview"); }}><ArrowLeft className="size-4" />Back</Button><span className="text-xs text-muted-foreground">{answered} / {QUESTIONS.length} answered</span></div>
    <progress aria-label="Questionnaire progress" className="h-2 w-full accent-primary" value={answered} max={QUESTIONS.length} />
    <div><p className="text-xs font-semibold text-primary">{section + 1} OF 6</p><h2 className="mt-1 text-xl font-bold">{category.label}</h2><p className="mt-2 text-sm text-muted-foreground">{category.note}</p></div>
    {current.map((question, i) => <fieldset key={question.id} className="rounded-lg bg-card p-4 shadow-soft">
      <legend className="sr-only">{question.text}</legend><p id={`${question.id}-label`} className="mb-4 font-medium">{i + 1}. {question.text}</p>
      <RadioGroup aria-labelledby={`${question.id}-label`} value={answers[question.id] ? String(answers[question.id]) : ""} onValueChange={value => setAnswers(prev => ({ ...prev, [question.id]: Number(value) }))}>
        {(question.format === "interest" ? INTEREST : AGREEMENT).map((label, index) => <label key={label} className="flex min-h-9 cursor-pointer items-center gap-3 text-sm"><RadioGroupItem value={String(index + 1)} />{label}</label>)}
      </RadioGroup>
      <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={() => setAnswers(prev => { const next = { ...prev }; delete next[question.id]; return next; })}>Skip / clear answer</Button>
    </fieldset>)}
    {section === 5 && <div className="space-y-3 border-t pt-4"><label htmlFor="reflection-goal" className="font-medium">A goal I would like to explore (optional)</label><Textarea id="reflection-goal" value={goal} maxLength={300} onChange={e => setGoal(e.target.value)} placeholder="For example: try a new way of planning my homework" /><label className="flex items-start gap-3 text-sm"><Checkbox checked={coach} onCheckedChange={value => setCoach(value === true)} /><span>Use a summary of this reflection for my thinking coach. I can turn this off later.</span></label><p className="text-xs text-muted-foreground">Skipped questions stay unanswered. Partial results will show their coverage.</p></div>}
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => persist(false)}><Save className="size-4" />Save draft</Button>{section > 0 && <Button size="icon" variant="outline" aria-label="Previous category" onClick={() => setSection(s => s - 1)}><ArrowLeft className="size-4" /></Button>}{section < 5 ? <Button className="ml-auto" onClick={() => { setSection(s => s + 1); window.scrollTo({ top: 0 }); }}>Next<ArrowRight className="size-4" /></Button> : <Button className="ml-auto" disabled={busy} onClick={() => persist(true)}>Save & view results</Button>}</div>
  </div>;
  if (view === "results" && selected) {
    const results = scoreAssessment(parseAnswers(selected.responses));
    const previous = attempts.find(a => a.id !== selected.id && a.status === "submitted" && (a.submitted_at ?? "") < (selected.submitted_at ?? "") && compatibleAttempts(a, selected));
    const previousScores = previous ? scoreAssessment(parseAnswers(previous.responses)) : [];
    return <div className="space-y-5 py-3">
      <Button variant="ghost" size="sm" onClick={() => setView("overview")}><ArrowLeft className="size-4" />My reflections</Button>
      <div><h2 className="text-xl font-bold">My reflection</h2><p className="mt-1 text-sm text-muted-foreground">{new Date(selected.submitted_at ?? selected.created_at).toLocaleDateString()} · {Object.keys(parseAnswers(selected.responses)).length} of {QUESTIONS.length} answered</p></div>
      <p className="text-sm text-muted-foreground">Your responses describe how you see yourself today. They are not an ability score, diagnosis or fixed personality label. Mood and context can affect your answers.</p>
      {CATEGORIES.map(c => <section key={c.id} className="space-y-3 border-t pt-4"><h3 className="font-bold">{c.label}</h3>{results.filter(d => d.category === c.id).map(d => {
        const prev = previousScores.find(p => p.id === d.id);
        return <div key={d.id} className="rounded-lg bg-card p-4 shadow-soft"><h4 className="font-medium">{d.label}</h4><p className="mt-1 text-xs text-muted-foreground">{d.answered} of {d.available} answered{d.available === 1 ? " · Single-response indicator" : d.answered < d.available ? " · Provisional" : ""}</p>
          <p className="mt-3 text-sm">{d.average === null ? "Not enough responses yet." : d.kind === "habit" ? `${d.average.toFixed(2)} / 5 · Self-reported average` : (d.kind === "interest" ? INTEREST : AGREEMENT)[Math.round(d.average) - 1]}</p>
          {d.average !== null && <><p className="mt-2 text-sm text-muted-foreground">{d.kind === "habit" && d.average >= 4 ? `You often report habits related to ${d.label.toLowerCase()}. ` : ""}You could try: {d.activity}</p>{prev?.average !== null && prev?.average !== undefined && <p className="mt-2 text-xs text-muted-foreground">Previous: {prev.average.toFixed(2)} / 5 → Now: {d.average.toFixed(2)} / 5. This is a response change, not proof of improvement or decline.</p>}</>}
        </div>;
      })}</section>)}
      {selected.goal && <section className="border-t pt-4"><h3 className="font-bold">My reflection goal</h3><p className="mt-2 whitespace-pre-wrap text-sm">{selected.goal}</p></section>}
      <TeacherEvidence studentId={studentId} />
      <label className="flex items-start gap-3 border-t pt-4 text-sm"><Checkbox disabled={busy} checked={selected.use_for_coach} onCheckedChange={value => updatePermission(value === true)} /><span>Let my thinking coach use a summary of this reflection. Only the latest reflection can supply context.</span></label>
      <p className="text-xs text-muted-foreground">Private to your account. Not shared with schools or teachers. You can delete it or download a copy.</p>
      <div className="flex flex-wrap gap-2"><Button onClick={() => start()}><Plus className="size-4" />Retake</Button><Button variant="outline" size="icon" aria-label="Download reflection" title="Download reflection" onClick={() => exportAttempt(selected)}><Download className="size-4" /></Button><Button variant="outline" size="icon" disabled={busy} aria-label="Delete reflection" title="Delete reflection" onClick={() => deleteAttempt(selected)}><Trash2 className="size-4" /></Button></div>
    </div>;
  }
  return <div className="space-y-5 py-4">
    <div className="flex items-center gap-3"><Brain className="size-8 text-primary" /><div><h2 className="text-xl font-bold">Get to know yourself</h2><p className="text-sm text-muted-foreground">Six areas. Your own perspective.</p></div></div>
    <p className="text-sm text-muted-foreground">Reflect on your habits, learning preferences and current interests. There are no right or wrong answers. This is not a clinical test or a measure of intelligence.</p>
    <div className="flex items-start gap-3 border-y py-4"><LockKeyhole className="size-5 shrink-0 text-primary" /><p className="text-sm">Private to you. Schools and teachers cannot see your answers. Skip any question and save a draft whenever you need.</p></div>
    <div className="divide-y">{CATEGORIES.map((c, i) => <div key={c.id} className="flex items-center justify-between py-3"><span className="font-medium">{i + 1}. {c.label}</span><span className="text-xs text-muted-foreground">{QUESTIONS.filter(q => q.category === c.id).length} questions</span></div>)}</div>
    <Button className="w-full" onClick={() => start()}><Plus className="size-4" />Start a reflection</Button>
    {attempts.length > 0 && <section className="space-y-3 border-t pt-4"><h3 className="flex items-center gap-2 font-bold"><History className="size-4" />My reflection history</h3>{attempts.map(a => <div key={a.id} className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-soft"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{a.status === "draft" ? "Saved draft" : "Reflection"} · {new Date(a.created_at).toLocaleDateString()}</p><p className="text-xs text-muted-foreground">{Object.keys(parseAnswers(a.responses)).length} of {QUESTIONS.length} answered</p></div><Button size="sm" variant="outline" onClick={() => { if (a.status === "draft") start(a); else { setSelected(a); setView("results"); } }}>{a.status === "draft" ? "Resume" : "View"}</Button><Button size="icon" variant="ghost" aria-label="Delete saved reflection" disabled={busy} onClick={() => deleteAttempt(a)}><Trash2 className="size-4" /></Button></div>)}</section>}
  </div>;
}
function TeacherEvidence({ studentId }: { studentId: string }) {
  const { data: awards = [] } = useQuery({ queryKey: ["reflection-teacher-evidence", studentId], queryFn: async () => {
    const { data, error } = await supabase.from("badge_awards").select("id,note,created_at,competency_badges(name)").eq("student_id", studentId).order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  } });
  return <section className="space-y-2 border-t pt-4"><h3 className="font-bold">Teacher-assessed evidence</h3><p className="text-xs text-muted-foreground">Teacher-awarded badges are separate from your self-report. Challenge rubric scores are not included here because they can be AI-generated.</p>{awards.length ? awards.map(a => <div key={a.id} className="py-2 text-sm"><p className="font-medium">{a.competency_badges?.name} · Teacher badge</p>{a.note && <p className="text-muted-foreground">{a.note}</p>}</div>) : <p className="text-sm text-muted-foreground">No teacher-awarded evidence yet.</p>}</section>;
}
