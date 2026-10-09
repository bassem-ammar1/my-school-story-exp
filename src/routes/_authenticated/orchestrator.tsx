import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArtifactCard } from "@/components/thinking/ArtifactCard";
import { loadArtifacts } from "@/lib/feed-data";
import { curateArtifacts } from "@/lib/thinking.functions";
import { COPY, processCompliance, teacherMinutesSaved, type CuratedPick } from "@/lib/thinking";
import { requireSsoTeacher } from "@/lib/teacher-guard";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orchestrator")({
  ssr: false,
  beforeLoad: requireSsoTeacher,
  head: () => ({ meta: [{ title: "Orchestrator · Thinking Lab" }, { name: "description", content: "Curate diverse approaches and run a Synthesis Ritual." }] }),
  component: () => <Orchestrator />,
});

export function Orchestrator() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const curate = useServerFn(curateArtifacts);
  const [classId, setClassId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [picks, setPicks] = useState<CuratedPick[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [curating, setCurating] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ["t-classes"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      return (await supabase.from("classes").select("*").eq("teacher_id", u.user!.id).order("created_at")).data ?? [];
    },
  });
  const cls = classes.find((c) => c.id === classId) ?? classes[0];
  const { data: challenges = [] } = useQuery({
    queryKey: ["t-challenges", cls?.id], enabled: !!cls,
    queryFn: async () => {
      const { data: chs } = await supabase.from("challenges").select("*").eq("class_id", cls!.id).order("created_at");
      const { data: subs } = await supabase.from("submissions").select("challenge_id,status,step1_text,step2_text,step3_text,voice_url,rubric,id,created_at").in("challenge_id", (chs ?? []).map((c) => c.id));
      return (chs ?? []).map((c) => ({ ...c, subs: (subs ?? []).filter((s) => s.challenge_id === c.id) }));
    },
  });
  const ch = challenges.find((c) => c.id === challengeId) ?? challenges[0];
  const { data: pool = [] } = useQuery({ queryKey: ["t-pool", ch?.id], enabled: !!ch, queryFn: () => loadArtifacts({ challengeId: ch!.id }) });

  const createClass = async (name: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("classes").insert({ name, teacher_id: u.user!.id });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["t-classes"] });
  };
  const createChallenge = async (f: { title: string; prompt: string; concepts: string; answer: string }) => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("challenges").insert({ class_id: cls!.id, teacher_id: u.user!.id, title: f.title, prompt_text: f.prompt, concept_tokens: f.concepts.split(",").map((s) => s.trim()).filter(Boolean) }).select().single();
    if (error) return toast.error(error.message);
    if (f.answer) await supabase.from("challenge_answers").insert({ challenge_id: data.id, final_answer: f.answer });
    qc.invalidateQueries({ queryKey: ["t-challenges"] });
    toast.success("Challenge posted");
  };
  const runCurate = async () => {
    setCurating(true);
    try { const r = await curate({ data: { challengeId: ch!.id } }); setPicks(r.picks); setPrompts(r.prompts); }
    catch (e) { toast.error((e as Error).message); } finally { setCurating(false); }
  };
  const swap = (targetId: string, newId: string) => {
    if (picks.some((p) => p.artifact_id === newId)) return;
    setPicks(picks.map((p) => (p.artifact_id === targetId ? { ...p, artifact_id: newId, why: "Chosen by you" } : p)));
  };
  const startSynthesis = async () => {
    const { data: u } = await supabase.auth.getUser();
    const m = picks.find((p) => p.misconception);
    const { data, error } = await supabase.from("synthesis_sessions").insert({
      class_id: cls!.id, teacher_id: u.user!.id, artifact_ids: picks.filter((p) => !p.misconception).map((p) => p.artifact_id),
      misconception_artifact_id: m?.artifact_id ?? null, prompts,
    }).select().single();
    if (error) return toast.error(error.message);
    await track("synthesis_ritual_started", { artifact_count: picks.length });
    navigate({ to: "/synthesis/host/$id", params: { id: data.id } });
  };
  const updateClass = async (patch: { anonymous_mode?: boolean; allow_school?: boolean }) => {
    await supabase.from("classes").update(patch).eq("id", cls!.id);
    qc.invalidateQueries({ queryKey: ["t-classes"] });
  };

  const byId = (id: string) => pool.find((a) => a.id === id);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Orchestrator</h1>
        <div className="flex gap-2">
          {cls && <Button variant="outline" asChild><Link to="/trace/$classId" params={{ classId: cls.id }}>Reasoning traces</Link></Button>}
          <Button variant="outline" onClick={() => { localStorage.setItem("studentView", "1"); navigate({ to: "/lab" }); }}>Student view</Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr_300px]">
        {/* Left */}
        <aside className="space-y-4">
          <div className="space-y-2 rounded-2xl bg-card p-4 shadow-soft">
            <p className="text-sm font-semibold">Classes</p>
            {classes.map((c) => (
              <button key={c.id} onClick={() => { setClassId(c.id); setChallengeId(null); setPicks([]); }} className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm", cls?.id === c.id ? "bg-secondary font-semibold" : "hover:bg-muted")}>
                {c.name} <span className="text-xs text-muted-foreground">· code {c.join_code}</span>
              </button>
            ))}
            <InlineCreate placeholder="New class name" onCreate={createClass} />
          </div>
          {cls && (
            <div className="space-y-2 rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between"><Label>Anonymous mode</Label><Switch checked={cls.anonymous_mode} onCheckedChange={(v) => updateClass({ anonymous_mode: v })} /></div>
              <div className="flex items-center justify-between"><Label>Allow school-wide sharing</Label><Switch checked={cls.allow_school} onCheckedChange={(v) => updateClass({ allow_school: v })} /></div>
            </div>
          )}
          {cls && (
            <div className="space-y-2 rounded-2xl bg-card p-4 shadow-soft">
              <p className="text-sm font-semibold">Thinking Challenges</p>
              {challenges.map((c) => (
                <button key={c.id} onClick={() => { setChallengeId(c.id); setPicks([]); setPrompts([]); }} className={cn("flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm", ch?.id === c.id ? "bg-secondary font-semibold" : "hover:bg-muted")}>
                  <span>{c.title}</span><span className="text-xs">{c.subs.length}</span>
                </button>
              ))}
              <NewChallenge onCreate={createChallenge} />
            </div>
          )}
        </aside>

        {/* Center */}
        <section className="space-y-4">
          {ch ? (
            <>
              <div className="flex items-center justify-between">
                <div><h2 className="text-xl font-bold">{ch.title}</h2><p className="text-sm text-muted-foreground">{pool.length} published · drag a card from the pool onto a curated card to swap</p></div>
                <Button onClick={runCurate} disabled={curating || pool.length < 4}>{curating ? "Curating…" : COPY.curate}</Button>
              </div>
              {picks.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                  {picks.map((p, i) => { const a = byId(p.artifact_id); return a && (
                    <div key={p.artifact_id} onDragOver={(e) => e.preventDefault()} onDrop={() => dragId && swap(p.artifact_id, dragId)}>
                      <p className="mb-1 text-xs font-bold text-primary">Artifact {String.fromCharCode(65 + i)}</p>
                      <ArtifactCard a={a} why={p.why} tag={p.misconception ? "Misconception" : undefined} />
                    </div>); })}
                </div>
              )}
              <p className="pt-2 text-sm font-semibold">Pool</p>
              <div className="grid gap-3 md:grid-cols-3">
                {pool.filter((a) => !picks.some((p) => p.artifact_id === a.id)).map((a) => (
                  <div key={a.id} draggable onDragStart={() => setDragId(a.id)} className="cursor-grab"><ArtifactCard a={a} /></div>
                ))}
                {pool.length === 0 && <p className="text-sm text-muted-foreground">{COPY.empty}</p>}
              </div>
            </>
          ) : <p className="text-muted-foreground">Create a class and a challenge to begin.</p>}
        </section>

        {/* Right */}
        <aside className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
          <p className="font-semibold">Discussion prompts</p>
          {prompts.length === 0 && <p className="text-sm text-muted-foreground">Prompts appear after curating.</p>}
          {prompts.map((p, i) => <Textarea key={i} rows={3} value={p} onChange={(e) => setPrompts(prompts.map((x, j) => (j === i ? e.target.value : x)))} />)}
          <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={!picks.length} onClick={startSynthesis}>{COPY.synthesis}</Button>
        </aside>
      </div>
      <AnalyticsPanel challenges={challenges} />
    </main>
  );
}

function InlineCreate({ placeholder, onCreate }: { placeholder: string; onCreate: (v: string) => void }) {
  const [v, setV] = useState("");
  return <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); if (v) { onCreate(v); setV(""); } }}><Input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} /><Button size="sm" type="submit">Add</Button></form>;
}

function NewChallenge({ onCreate }: { onCreate: (f: { title: string; prompt: string; concepts: string; answer: string }) => void }) {
  const [f, setF] = useState({ title: "", prompt: "", concepts: "", answer: "" });
  const [open, setOpen] = useState(false);
  if (!open) return <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}>+ Post a challenge</Button>;
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); onCreate(f); setF({ title: "", prompt: "", concepts: "", answer: "" }); setOpen(false); }}>
      <Input required placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea required placeholder="Problem prompt" value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
      <Input required placeholder="Concepts, comma separated" value={f.concepts} onChange={(e) => setF({ ...f, concepts: e.target.value })} />
      <Input placeholder="Final answer (private, never shown)" value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} />
      <Button size="sm" type="submit" className="w-full">Post</Button>
    </form>
  );
}

function AnalyticsPanel({ challenges }: { challenges: any[] }) {
  const subs = challenges.flatMap((c) => c.subs);
  const { data } = useQuery({
    queryKey: ["t-analytics", subs.length],
    queryFn: async () => {
      const ids = subs.map((s) => s.id);
      const [{ data: flags }, { data: ev }] = await Promise.all([
        ids.length ? supabase.from("flags").select("submission_id,type").in("submission_id", ids).eq("type", "possible_copy") : Promise.resolve({ data: [] as any[] }),
        supabase.from("analytics_events").select("event").in("event", ["auto_curated", "micro_task_assigned", "demo_started", "demo_completed", "demo_converted"]),
      ]);
      return { flags: flags ?? [], ev: ev ?? [] };
    },
  });
  const stats = useMemo(() => {
    const compliance = processCompliance(subs.map((s) => ({ step1: s.step1_text, step2: s.step2_text, step3: s.step3_text, hasVoice: !!s.voice_url })));
    const scored = subs.filter((s) => s.rubric);
    const quality = scored.length ? (scored.reduce((t, s) => t + (s.rubric.clarity + s.rubric.reasoning + s.rubric.concept + s.rubric.self_correction) / 4, 0) / scored.length).toFixed(1) : "–";
    const first = subs.length ? Math.min(...subs.map((s) => +new Date(s.created_at))) : 0;
    const cutoff = first + 14 * 86400000;
    const pct = (list: any[]) => list.length ? (list.filter((s) => data?.flags.some((f) => f.submission_id === s.id)).length / list.length) * 100 : 0;
    const early = subs.filter((s) => +new Date(s.created_at) < cutoff), later = subs.filter((s) => +new Date(s.created_at) >= cutoff);
    const count = (e: string) => data?.ev.filter((x) => x.event === e).length ?? 0;
    return { compliance, quality, copyDelta: later.length ? (pct(later) - pct(early)).toFixed(0) + " pts" : "Needs 2+ weeks", saved: teacherMinutesSaved(count("auto_curated"), count("micro_task_assigned")), funnel: `${count("demo_started")} → ${count("demo_completed")} → ${count("demo_converted")}` };
  }, [subs, data]);
  const tiles = [["Process compliance", `${stats.compliance}%`], ["Explanation quality (1–4)", stats.quality], ["Copying change", stats.copyDelta], ["Teacher time saved", `${stats.saved} min`], ["Demo funnel", stats.funnel]];
  return (
    <section className="grid gap-3 sm:grid-cols-5">
      {tiles.map(([k, v]) => <div key={k} className="rounded-2xl bg-card p-4 shadow-soft"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}
    </section>
  );
}
