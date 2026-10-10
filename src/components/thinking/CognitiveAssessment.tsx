import { Suspense, useState } from "react";
import { useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, ArrowLeft, ArrowRight, LockKeyhole, History, Plus, Trash2, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, QUESTIONS, AGREEMENT, INTEREST, scoreAssessment, assessmentProgress, categoryRing, knownAnswers, QUESTIONNAIRE_VERSION, SCORING_VERSION, type Answers } from "@/lib/cognitive";
import { getCognitiveAttempts, saveCognitiveAttempt, deleteCognitiveAttempt, setCognitiveCoachPermission } from "@/lib/cognitive.functions";
import { QUESTION_EMOJIS } from '@/lib/question-emojis';

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
  const start = (attempt?: Attempt) => {
    setSelected(attempt ?? null); setAnswers(attempt ? knownAnswers(attempt.responses) : {});
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
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...attempt, student_id: undefined, results: scoreAssessment(knownAnswers(attempt.responses)) }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "my-private-reflection.json"; link.click(); URL.revokeObjectURL(url);
  };
  if (view === "questions") {
    const { total, answered, questionNumber, finalStep, percent } = assessmentProgress(answers, section);
    const q = QUESTIONS[Math.min(section, total - 1)];
    if (!q) return null;
    const cat = CATEGORIES.find(c => c.id === q.category) ?? CATEGORIES[0];
    const labels = q.format === "interest" ? INTEREST : AGREEMENT;
    const sizes = ["size-12", "size-10", "size-8", "size-10", "size-12"];
    const pick = (v: number) => { setAnswers(prev => ({ ...prev, [q.id]: v })); setSection(s => Math.min(s + 1, total)); };
    return <div className="flex min-h-[70vh] flex-col gap-6 py-3">
      <div className="flex items-center justify-between"><Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Leave this page? Save your draft first to keep unsaved answers.")) setView("overview"); }}><ArrowLeft className="size-4" />Exit</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => persist(false)}><Save className="size-4" />Save draft</Button></div>
      <div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>{finalStep ? "Review and submit" : `Question ${questionNumber} of ${total}`}</span><span>{answered} of {total} answered</span></div>
        <div role="progressbar" aria-label="Questions answered" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} /></div></div>
      {finalStep ? <div className="flex-1 space-y-4"><h2 className="text-2xl font-bold">One last thing</h2><label htmlFor="reflection-goal" className="block font-medium">A goal I would like to explore (optional)</label><Textarea id="reflection-goal" value={goal} maxLength={300} onChange={e => setGoal(e.target.value)} placeholder="For example: try a new way of planning my homework" /><label className="flex items-start gap-3 text-sm"><Checkbox checked={coach} onCheckedChange={value => setCoach(value === true)} /><span>Use a summary of this reflection for my thinking coach. I can turn this off later.</span></label><p className="text-xs text-muted-foreground">Skipped questions stay unanswered. Partial results will show their coverage.</p></div>
      : <div key={q.id} className="flex flex-1 flex-col justify-center gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center"><span aria-hidden="true" className="mb-3 block text-5xl">{QUESTION_EMOJIS[q.dimension] ?? '💭'}</span><p className="text-xs font-semibold uppercase tracking-wide text-primary">{cat.label}</p><h2 className="mt-3 text-2xl font-bold leading-snug">{q.text}</h2></div>
        <div role="radiogroup" aria-label={q.text} className="space-y-3">
          <div className="flex items-center justify-between gap-1">{labels.map((label, i) => { const v = i + 1; const on = answers[q.id] === v; const tone = i < 2 ? "border-destructive/60" : i === 2 ? "border-muted-foreground/40" : "border-primary"; return <Button variant="outline" size="icon" key={label} type="button" role="radio" aria-checked={on} aria-label={label} title={label} onClick={() => pick(v)} className={`${sizes[i]} shrink-0 rounded-full border-2 transition hover:scale-110 ${tone} ${on ? (i < 2 ? "bg-destructive/70" : i === 2 ? "bg-muted-foreground/50" : "bg-primary") : "bg-card"}`} />; })}</div>
          <div className="flex justify-between text-xs font-medium text-muted-foreground"><span>{labels[0]}</span><span>{labels[4]}</span></div>
          {answers[q.id] && <p className="text-center text-sm font-medium">{labels[(answers[q.id] ?? 1) - 1]}</p>}
        </div>
      </div>}
      <div className="flex gap-2"><Button variant="outline" disabled={section === 0} onClick={() => setSection(s => s - 1)}><ArrowLeft className="size-4" />Back</Button>{finalStep ? <Button className="ml-auto" disabled={busy} onClick={() => persist(true)}>See my profile</Button> : <Button className="ml-auto" onClick={() => setSection(s => s + 1)}>{answers[q.id] ? "Next" : "Skip"}<ArrowRight className="size-4" /></Button>}</div>
    </div>;
  }
  if (view === "results" && selected && (selected.questionnaire_version !== QUESTIONNAIRE_VERSION || selected.scoring_version !== SCORING_VERSION)) return <div className="space-y-4 py-3"><Button variant="ghost" size="sm" onClick={() => setView("overview")}><ArrowLeft className="size-4" />My reflections</Button><p className="rounded-lg bg-card p-4 text-sm shadow-soft">This reflection used an older set of questions, so its results can't be calculated with the new scoring. Take a new reflection to see your profile.</p><Button onClick={() => start()}><Plus className="size-4" />Start a new reflection</Button></div>;
  if (view === "results" && selected) {
    const results = scoreAssessment(knownAnswers(selected.responses));
    const habits = results.filter(d => d.kind === "habit" && d.average !== null && d.answered === d.available);
    const top = (list: typeof results, n: number) => [...list].filter(d => d.average !== null).sort((a, b) => (b.average ?? 0) - (a.average ?? 0)).slice(0, n);
    const strengths = top(habits.filter(d => (d.average ?? 0) >= 3.5), 3);
    const grow = [...habits].sort((a, b) => (a.average ?? 0) - (b.average ?? 0)).filter(d => !strengths.includes(d)).slice(0, 2);
    const learn = top(results.filter(d => d.category === "learning" && (d.average ?? 0) >= 3.5), 2);
    const interests = top(results.filter(d => d.category === "interests" && (d.average ?? 0) >= 3), 2);
    const social = top(results.filter(d => d.category === "social" || d.id === "energy"), 2);
    const avg = (id: string) => results.find(d => d.id === id)?.average ?? 0;
    const env = [avg("structure") >= 4 ? "clear steps and checklists" : avg("exploration") >= 4 ? "open questions to explore" : "a mix of guidance and freedom", avg("discussion") >= avg("independent") ? "time to discuss with classmates" : "quiet time to work on your own"].join(", with ");
    const names = (l: typeof results) => l.map(d => d.label.toLowerCase()).join(" and ");
    return <div className="space-y-5 py-3">
      <Button variant="ghost" size="sm" onClick={() => setView("overview")}><ArrowLeft className="size-4" />My reflections</Button>
      <div><h2 className="text-xl font-bold">My student profile</h2><p className="mt-1 text-sm text-muted-foreground">{new Date(selected.submitted_at ?? selected.created_at).toLocaleDateString()} · {Object.keys(knownAnswers(selected.responses)).length} of {QUESTIONS.length} answered</p></div>
      <p className="rounded-lg bg-gold/20 p-3 text-sm">These are your current preferences and tendencies, not permanent traits, an ability score or a diagnosis. They can change as you grow.</p>
      <section className="rounded-2xl bg-foreground p-5 text-background shadow-soft">
        <div className="flex justify-between border-b border-background/15 pb-3 font-mono text-xs uppercase tracking-widest text-background/70"><span>Skills / Preferences</span><span>Profile</span></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-5">{CATEGORIES.map(c => { const ring = categoryRing(c.id, selected.responses);
          return <div key={c.id} className="flex min-w-0 flex-col items-center gap-2 text-center"><Ring value={ring.fill} tone={c.kind === "habit" ? "skill" : "pref"} label={ring.label} /><span className="text-sm">{c.label}</span></div>; })}</div>
        <p className="mt-5 text-xs text-background/60">Each circle shows your average answer out of 5, not ability. At least 4 of 5 answers are needed; a category with fewer shows how many you answered.</p></section>
      <section className="space-y-2 rounded-lg bg-card p-4 text-sm shadow-soft"><h3 className="font-bold">About you right now</h3>
        {strengths.length > 0 && <p><b>Strongest areas:</b> you often report {names(strengths)}.</p>}
        {grow.length > 0 && <p><b>Areas to develop:</b> {names(grow)} could be fun to practise.</p>}
        {learn.length > 0 && <p><b>How you like to learn:</b> {names(learn)}.</p>}
        {social.length > 0 && <p><b>With others:</b> you lean towards {names(social)}.</p>}
        {interests.length > 0 && <p><b>Main interests today:</b> {names(interests)}.</p>}
        <p><b>Suggested environment:</b> {env}.</p>
        <div><b>Activities to try:</b><ul className="mt-1 list-disc pl-5 text-muted-foreground">{[...interests, ...grow].slice(0, 3).map(d => <li key={d.id}>{d.activity}</li>)}</ul></div></section>
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
    {attempts.length > 0 && <section className="space-y-3 border-t pt-4"><h3 className="flex items-center gap-2 font-bold"><History className="size-4" />My reflection history</h3>{attempts.map(a => <div key={a.id} className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-soft"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{a.status === "draft" ? "Saved draft" : "Reflection"} · {new Date(a.created_at).toLocaleDateString()}</p><p className="text-xs text-muted-foreground">{Object.keys(knownAnswers(a.responses)).length} of {QUESTIONS.length} answered</p></div><Button size="sm" variant="outline" onClick={() => { if (a.status === "draft") start(a); else { setSelected(a); setView("results"); } }}>{a.status === "draft" ? "Resume" : "View"}</Button><Button size="icon" variant="ghost" aria-label="Delete saved reflection" disabled={busy} onClick={() => deleteAttempt(a)}><Trash2 className="size-4" /></Button></div>)}</section>}
  </div>;
}
function TeacherEvidence({ studentId }: { studentId: string }) {
  const { data: awards = [] } = useQuery({ queryKey: ["reflection-teacher-evidence", studentId], queryFn: async () => {
    const { data, error } = await supabase.from("badge_awards").select("id,note,created_at,competency_badges(name)").eq("student_id", studentId).order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  } });
  return <section className="space-y-2 border-t pt-4"><h3 className="font-bold">Teacher-assessed evidence</h3><p className="text-xs text-muted-foreground">Teacher-awarded badges are separate from your self-report. Challenge rubric scores are not included here because they can be AI-generated.</p>{awards.length ? awards.map(a => <div key={a.id} className="py-2 text-sm"><p className="font-medium">{a.competency_badges?.name} · Teacher badge</p>{a.note && <p className="text-muted-foreground">{a.note}</p>}</div>) : <p className="text-sm text-muted-foreground">No teacher-awarded evidence yet.</p>}</section>;
}
function Ring({ value, tone, label }: { value: number; tone: "skill" | "pref"; label: string }) {
  const ticks = 72, on = Math.round((value / 100) * ticks);
  return <div className="relative size-32" role="img" aria-label={label}>
    <svg viewBox="0 0 120 120" className="size-full">{Array.from({ length: ticks }, (_, i) => { const a = (i / ticks) * 2 * Math.PI - Math.PI / 2; const r1 = 48, r2 = 58; return <line key={i} x1={60 + r1 * Math.cos(a)} y1={60 + r1 * Math.sin(a)} x2={60 + r2 * Math.cos(a)} y2={60 + r2 * Math.sin(a)} strokeWidth={2.2} strokeLinecap="round" className={i < on ? (tone === "skill" ? "stroke-ring-skill" : "stroke-ring-pref") : "stroke-background/15"} />; })}</svg>
    <span className="absolute inset-0 flex items-center justify-center px-6 text-3xl font-bold leading-tight">{label}</span>
  </div>;
}
