import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MicroTaskModal } from "@/components/thinking/MicroTaskModal";
import { BadgeIssuer } from "@/components/thinking/BadgeIssuer";
import { requireSsoTeacher } from "@/lib/teacher-guard";
import { CONFIDENCE_EMOJI, wordDiff } from "@/lib/thinking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trace/$classId")({
  ssr: false,
  beforeLoad: requireSsoTeacher,
  head: () => ({ meta: [{ title: "Reasoning trace · Thinking Lab" }, { name: "description", content: "Every step of a student's reasoning." }] }),
  component: () => <ReasoningTrace />,
});

type Item = { at: string; kind: string; body: React.ReactNode };

export function ReasoningTrace() {
  const { classId } = Route.useParams();
  const qc = useQueryClient();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [modal, setModal] = useState<null | { type: "task" | "badge"; submissionId: string; artifactId: string | null }>(null);
  const [flagNote, setFlagNote] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["trace-students", classId],
    queryFn: async () => {
      const { data: m } = await supabase.from("class_members").select("user_id").eq("class_id", classId);
      const ids = (m ?? []).map((x) => x.user_id);
      return ids.length ? (await supabase.from("profiles").select("id,display_name").in("id", ids)).data ?? [] : [];
    },
  });
  const sid = studentId ?? students[0]?.id;
  const student = students.find((s) => s.id === sid);

  const { data: subs = [] } = useQuery({
    queryKey: ["trace", classId, sid], enabled: !!sid,
    queryFn: async () => {
      const { data: chs } = await supabase.from("challenges").select("id,title").eq("class_id", classId);
      const { data: ss } = await supabase.from("submissions").select("*").eq("student_id", sid!).in("challenge_id", (chs ?? []).map((c) => c.id));
      return Promise.all((ss ?? []).map(async (s) => {
        const [v, ai, fl, art, tr] = await Promise.all([
          supabase.from("submission_versions").select("*").eq("submission_id", s.id).order("version"),
          supabase.from("ai_interactions").select("*").eq("submission_id", s.id).order("created_at"),
          supabase.from("flags").select("*").eq("submission_id", s.id).order("created_at"),
          supabase.from("artifacts").select("id,published_at").eq("submission_id", s.id).maybeSingle(),
          supabase.from("transfer_responses").select("*").eq("student_id", sid!),
        ]);
        const anns = art.data ? (await supabase.from("annotations").select("*").eq("artifact_id", art.data.id)).data ?? [] : [];
        return { s, title: chs?.find((c) => c.id === s.challenge_id)?.title, versions: v.data ?? [], ai: ai.data ?? [], flags: fl.data ?? [], artifact: art.data, anns, transfers: tr.data ?? [] };
      }));
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Reasoning trace</h1>
        <Select value={sid} onValueChange={setStudentId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Choose a student" /></SelectTrigger>
          <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {!students.length && <p className="text-muted-foreground">No students have joined this class yet.</p>}
      {subs.map(({ s, title, versions, ai, flags, artifact, anns, transfers }) => {
        const items: Item[] = [];
        const all = [...versions, { ...s, version: s.version, created_at: s.updated_at }];
        all.forEach((v: any, i) => {
          const prev: any = all[i - 1];
          const text = `${v.step1_text ?? ""}\n${v.step2_text ?? ""}\n${v.step3_text ?? ""}`;
          items.push({ at: v.created_at, kind: `Version ${v.version}`, body: prev
            ? <p className="whitespace-pre-wrap text-sm">{wordDiff(`${prev.step1_text}\n${prev.step2_text}\n${prev.step3_text}`, text).map((d, k) => <span key={k} className={cn(d.type === "add" && "bg-gold/40", d.type === "del" && "text-destructive line-through")}>{d.text}</span>)}</p>
            : <p className="whitespace-pre-wrap text-sm">{text}</p> });
        });
        ai.forEach((a) => items.push({ at: a.created_at, kind: a.blocked_answer_attempt ? "AI hints · answer leak blocked" : "AI hints", body: <ul className="list-disc pl-5 text-sm">{a.hints.map((h, k) => <li key={k}>{h}</li>)}{a.request_text && <li className="italic">Student asked: {a.request_text}</li>}</ul> }));
        flags.forEach((f) => items.push({ at: f.created_at, kind: `Flag (${f.source})`, body: <p className="text-sm"><Badge variant="outline">{f.type === "possible_copy" ? "Worth a look" : f.type.replace("_", " ")}</Badge> {f.note}</p> }));
        anns.forEach((n) => items.push({ at: n.created_at, kind: "Annotation received", body: <p className="text-sm">📝 {n.text}</p> }));
        transfers.forEach((t) => items.push({ at: t.created_at, kind: "Transfer task", body: <p className="text-sm">{t.completed ? "✅" : "⏳"} {t.response}</p> }));
        items.sort((a, b) => a.at.localeCompare(b.at));
        return (
          <section key={s.id} className="rounded-2xl bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="text-sm">Confidence {s.confidence_initial ? CONFIDENCE_EMOJI[s.confidence_initial - 1] : "–"} → {s.confidence ? CONFIDENCE_EMOJI[s.confidence - 1] : "–"}</p>
            </div>
            {s.voice_transcript && <p className="mt-2 rounded-lg bg-muted p-2 text-sm"><b>Voice:</b> {s.voice_transcript}</p>}
            <ol className="mt-4 space-y-4 border-l-2 border-secondary pl-5">
              {items.map((it, k) => (
                <li key={k} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-primary">{it.kind}</p><span className="text-xs text-muted-foreground">{new Date(it.at).toLocaleString()}</span>
                    <span className="ml-auto flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setModal({ type: "task", submissionId: s.id, artifactId: artifact?.id ?? null })}>Assign 5-min micro-task</Button>
                      <Button size="sm" variant="outline" onClick={() => setModal({ type: "badge", submissionId: s.id, artifactId: artifact?.id ?? null })}>Issue badge</Button>
                    </span></div>
                  <div className="mt-1">{it.body}</div>
                </li>
              ))}
            </ol>
            <form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await supabase.from("flags").insert({ submission_id: s.id, type: "needs_support", source: "teacher", note: flagNote }); setFlagNote(""); qc.invalidateQueries({ queryKey: ["trace"] }); }}>
              <Input placeholder="Add a teacher flag note (needs support)" value={flagNote} onChange={(e) => setFlagNote(e.target.value)} />
              <Button size="sm" type="submit" variant="secondary">Flag</Button>
            </form>
          </section>
        );
      })}
      {student && modal?.type === "task" && <MicroTaskModal open onClose={() => setModal(null)} studentId={student.id} studentName={student.display_name} submissionId={modal.submissionId} artifactId={modal.artifactId} />}
      {student && modal?.type === "badge" && <BadgeIssuer open onClose={() => setModal(null)} studentId={student.id} studentName={student.display_name} artifactId={modal.artifactId} />}
    </main>
  );
}
