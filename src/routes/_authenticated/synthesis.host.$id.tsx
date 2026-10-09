import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArtifactBody } from "@/components/thinking/ArtifactDetail";
import { BadgeIssuer } from "@/components/thinking/BadgeIssuer";
import { loadArtifacts } from "@/lib/feed-data";
import { requireSsoTeacher } from "@/lib/teacher-guard";
import { suggestTransferTask } from "@/lib/thinking.functions";
import { track } from "@/lib/track";
import type { AnnotationView, ArtifactView } from "@/components/thinking/types";

export const Route = createFileRoute("/_authenticated/synthesis/host/$id")({
  ssr: false,
  beforeLoad: requireSsoTeacher,
  head: () => ({ meta: [{ title: "Synthesis Ritual · Thinking Lab" }, { name: "description", content: "Projector mode for class synthesis." }] }),
  component: () => <SynthesisOverlay />,
});

function useClock(from?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return from ? Math.max(0, Math.floor((now - +new Date(from)) / 1000)) : 0;
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function SynthesisOverlay() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const suggest = useServerFn(suggestTransferTask);
  const [compare, setCompare] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationView[]>([]);
  const [responses, setResponses] = useState<{ student_id: string; completed: boolean }[]>([]);
  const [task, setTask] = useState("");
  const [minutes, setMinutes] = useState(4);
  const [badgeFor, setBadgeFor] = useState<{ id: string; name: string } | null>(null);

  const { data } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data: s } = await supabase.from("synthesis_sessions").select("*").eq("id", id).single();
      const { data: f } = await supabase.from("flags").select("submission_id").eq("note", `synthesis:${id}`).maybeSingle();
      const arts = await loadArtifacts({ ids: s!.artifact_ids });
      let mis: ArtifactView | null = null;
      if (f) { const { data: a } = await supabase.from("artifacts").select("id").eq("submission_id", f.submission_id).single(); mis = a ? (await loadArtifacts({ ids: [a.id] }))[0] ?? null : null; }
      const { count } = await supabase.from("class_members").select("user_id", { count: "exact", head: true }).eq("class_id", s!.class_id);
      const { data: an } = await supabase.from("annotations").select("*").eq("session_id", id);
      const { data: tr } = await supabase.from("transfer_responses").select("student_id,completed").eq("session_id", id);
      setAnnotations(an ?? []); setResponses(tr ?? []); setTask(s!.transfer_task ?? "");
      return { s: s!, arts, mis, members: count ?? 0, challengeId: arts[0]?.challengeId };
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`host-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "annotations", filter: `session_id=eq.${id}` }, (p) => setAnnotations((a) => [...a, p.new as AnnotationView]))
      .on("postgres_changes", { event: "*", schema: "public", table: "transfer_responses", filter: `session_id=eq.${id}` }, (p) => {
        const r = p.new as { student_id: string; completed: boolean };
        setResponses((list) => [...list.filter((x) => x.student_id !== r.student_id), r]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const s = data?.s;
  const elapsed = useClock(s?.started_at);
  const transferElapsed = useClock(s?.transfer_started_at);
  const update = async (patch: Partial<NonNullable<typeof s>>) => {
    await supabase.from("synthesis_sessions").update(patch as never).eq("id", id);
    qc.setQueryData(["session", id], (old: any) => old && { ...old, s: { ...old.s, ...patch } });
  };

  const slides: ArtifactView[] = data ? [...data.arts, ...(s?.revealed_misconception && data.mis ? [data.mis] : [])] : [];
  const idx = Math.min(s?.current_index ?? 0, Math.max(0, slides.length - 1));

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" && idx < slides.length - 1) update({ current_index: idx + 1 });
      if (e.key === "ArrowLeft" && idx > 0) update({ current_index: idx - 1 });
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!data || !s) return <div className="fixed inset-0 z-50 grid place-items-center bg-background text-2xl">Loading…</div>;
  const done = responses.filter((r) => r.completed).length;

  if (s.ended_at) return <Summary data={data} annotations={annotations} responses={responses} onBadge={setBadgeFor} badgeFor={badgeFor} />;

  const shown: ArtifactView[] = compare ? slides.slice(idx, idx + 2) : slides.slice(idx, idx + 1);
  const isMis = (a: ArtifactView) => data.mis?.id === a.id;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto bg-background text-2xl">
      <header className="flex flex-wrap items-center gap-4 border-b px-8 py-4 text-xl">
        <b>Synthesis Ritual</b>
        <span className="rounded-full bg-gold px-4 py-1 font-mono">Join code {s.code}</span>
        <span className="font-mono">⏱ {mmss(elapsed)}</span>
        <span className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setCompare(!compare)}>{compare ? "One at a time" : "Compare 2"}</Button>
          {data.mis && !s.revealed_misconception && <Button variant="secondary" onClick={() => update({ revealed_misconception: true, misconception_artifact_id: data.mis!.id, current_index: data.arts.length })}>Reveal the tricky one</Button>}
          <Button variant="destructive" onClick={() => update({ ended_at: new Date().toISOString() })}>End session</Button>
        </span>
      </header>
      <div className="grid flex-1 gap-6 p-8 lg:grid-cols-[1fr_380px]">
        <div className={compare ? "grid gap-6 md:grid-cols-2" : ""}>
          {shown.map((a, k) => (
            <div key={a.id} className="rounded-3xl bg-card p-6 shadow-soft">
              <p className="mb-3 text-3xl font-bold">Artifact {String.fromCharCode(65 + idx + k)}{isMis(a) && <span className="ml-3 text-2xl text-primary">What would you tell this student?</span>}</p>
              <ArtifactBody a={a} annotations={annotations.filter((n) => (n as AnnotationView & { artifact_id?: string }).artifact_id === a.id)} big />
            </div>
          ))}
          {!shown.length && <p>No artifacts in this session.</p>}
          <div className="col-span-full mt-4 flex items-center justify-center gap-4">
            <Button size="lg" variant="outline" disabled={idx === 0} onClick={() => update({ current_index: idx - 1 })} aria-label="Previous"><ChevronLeft /></Button>
            <span>{idx + 1} / {slides.length}</span>
            <Button size="lg" variant="outline" disabled={idx >= slides.length - 1} onClick={() => update({ current_index: idx + 1 })} aria-label="Next"><ChevronRight /></Button>
          </div>
        </div>
        <aside className="space-y-4 text-lg">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <p className="font-bold">Discussion prompts</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">{s.prompts.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
          <div className="space-y-2 rounded-2xl bg-card p-4 shadow-soft">
            <p className="font-bold">Transfer Task</p>
            {s.transfer_started_at ? (
              <>
                <p>{s.transfer_task}</p>
                <p className="font-mono">⏳ {mmss(Math.max(0, (s.transfer_minutes ?? 4) * 60 - transferElapsed))}</p>
                <p className="text-4xl font-bold" aria-live="polite">{done}/{data.members} done</p>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={async () => { if (data.challengeId) setTask((await suggest({ data: { challengeId: data.challengeId } })).task); }}>Suggest a similar problem</Button>
                <Textarea rows={4} value={task} onChange={(e) => setTask(e.target.value)} className="text-lg" />
                <div className="flex items-center gap-2">{[3, 4, 5].map((m) => <Button key={m} size="sm" variant={minutes === m ? "default" : "outline"} onClick={() => setMinutes(m)}>{m} min</Button>)}</div>
                <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={!task} onClick={() => update({ transfer_task: task, transfer_minutes: minutes, transfer_started_at: new Date().toISOString() })}>Start transfer task</Button>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Live notes: {annotations.length}</p>
        </aside>
      </div>
    </div>
  );
}

function Summary({ data, annotations, responses, onBadge, badgeFor }: any) {
  const { data: people = [] } = useQuery({
    queryKey: ["summary-people", data.s.id],
    queryFn: async () => {
      const { data: m } = await supabase.from("class_members").select("user_id").eq("class_id", data.s.class_id);
      const ids = (m ?? []).map((x: any) => x.user_id);
      const subIds = [...data.arts, data.mis].filter(Boolean).map((a: ArtifactView) => a.submissionId);
      const [{ data: p }, { data: f }] = await Promise.all([
        ids.length ? supabase.from("profiles").select("id,display_name").in("id", ids) : Promise.resolve({ data: [] as any[] }),
        supabase.from("flags").select("type,note").in("submission_id", subIds).eq("type", "misconception"),
      ]);
      return [{ people: p ?? [], misconceptions: f ?? [] }];
    },
  });
  useEffect(() => {
    const rate = data.members ? responses.filter((r: any) => r.completed).length / data.members : 0;
    track("transfer_task_completed", { session_id: data.s.id, completion_rate: Math.round(rate * 100) });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const info = people[0];
  const participants = new Set([...annotations.map((a: any) => a.author_id), ...responses.map((r: any) => r.student_id)]);
  const missing = info?.people.filter((p: any) => !responses.some((r: any) => r.student_id === p.id && r.completed)) ?? [];
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background p-10 text-xl">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between"><h1 className="text-4xl font-bold">Session summary</h1><Button variant="ghost" asChild><Link to="/orchestrator"><X /></Link></Button></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-5 shadow-soft"><p className="text-sm text-muted-foreground">Participation</p><p className="text-3xl font-bold">{participants.size}/{data.members}</p></div>
          <div className="rounded-2xl bg-card p-5 shadow-soft"><p className="text-sm text-muted-foreground">Live notes</p><p className="text-3xl font-bold">{annotations.length}</p></div>
          <div className="rounded-2xl bg-card p-5 shadow-soft"><p className="text-sm text-muted-foreground">Transfer done</p><p className="text-3xl font-bold">{responses.filter((r: any) => r.completed).length}/{data.members}</p></div>
        </div>
        <section className="rounded-2xl bg-card p-5 shadow-soft"><h2 className="font-bold">Misconceptions that came up</h2>
          <ul className="mt-2 list-disc pl-5 text-base">{info?.misconceptions.map((m: any, i: number) => <li key={i}>{m.note?.startsWith("synthesis:") ? "The revealed artifact" : m.note}</li>)}</ul></section>
        <section className="rounded-2xl bg-card p-5 shadow-soft"><h2 className="font-bold">Didn't complete the transfer task</h2>
          <ul className="mt-2 space-y-1 text-base">{missing.map((p: any) => <li key={p.id}>{p.display_name}</li>)}{!missing.length && <li>Everyone finished 🎉</li>}</ul></section>
        <section className="rounded-2xl bg-card p-5 shadow-soft"><h2 className="font-bold">Issue a badge</h2>
          <div className="mt-2 flex flex-wrap gap-2">{info?.people.map((p: any) => <Button key={p.id} size="sm" variant="outline" onClick={() => onBadge({ id: p.id, name: p.display_name })}>{p.display_name}</Button>)}</div></section>
      </div>
      {badgeFor && <BadgeIssuer open onClose={() => onBadge(null)} studentId={badgeFor.id} studentName={badgeFor.name} />}
    </div>
  );
}
