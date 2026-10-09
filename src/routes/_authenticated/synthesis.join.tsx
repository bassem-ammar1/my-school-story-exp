import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArtifactBody } from "@/components/thinking/ArtifactDetail";
import { loadArtifacts } from "@/lib/feed-data";
import { track } from "@/lib/track";
import type { ArtifactView } from "@/components/thinking/types";

export const Route = createFileRoute("/_authenticated/synthesis/join")({
  head: () => ({ meta: [{ title: "Join a Synthesis session · Thinking Lab" }, { name: "description", content: "Join your class discussion with a 6-digit code." }, { property: "og:title", content: "Join a Synthesis session · Thinking Lab" }, { property: "og:description", content: "Join your class discussion with a 6-digit code." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Join,
});

type Session = { id: string; artifact_ids: string[]; misconception_artifact_id: string | null; revealed_misconception: boolean; current_index: number; transfer_task: string | null; transfer_started_at: string | null; ended_at: string | null };

function Join() {
  const [code, setCode] = useState("");
  const [s, setS] = useState<Session | null>(null);
  const [arts, setArts] = useState<ArtifactView[]>([]);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const join = async () => {
    const { data, error } = await supabase.rpc("find_session_by_code", { _code: code });
    if (error || !data) { toast.error("No live session with that code in your class."); return; }
    const { data: row } = await supabase.from("synthesis_sessions").select("*").eq("id", data).single();
    setS(row as Session);
  };

  useEffect(() => {
    if (!s) return;
    const ids = [...s.artifact_ids, ...(s.revealed_misconception && s.misconception_artifact_id ? [s.misconception_artifact_id] : [])];
    loadArtifacts({ ids }).then((list) => setArts(ids.map((i) => list.find((a) => a.id === i)).filter(Boolean) as ArtifactView[]));
  }, [s?.id, s?.revealed_misconception]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!s) return;
    const ch = supabase.channel(`join-${s.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "synthesis_sessions", filter: `id=eq.${s.id}` }, (p) => setS(p.new as Session))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return (
    <main className="mx-auto max-w-sm space-y-4 px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Join the discussion</h1>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); join(); }}>
        <Input inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="text-center text-2xl tracking-widest" />
        <Button type="submit" disabled={code.length !== 6}>Join</Button>
      </form>
    </main>
  );
  if (s.ended_at) return <p className="p-16 text-center text-xl">Session ended. Great thinking today! 🎉</p>;

  const a = arts[Math.min(s.current_index, arts.length - 1)];
  const sendTransfer = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("transfer_responses").upsert({ session_id: s.id, student_id: u.user!.id, response: answer, completed: true }, { onConflict: "session_id,student_id" });
    if (error) toast.error(error.message); else setSubmitted(true);
  };

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      {s.transfer_started_at ? (
        <section className="space-y-3 rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold">Transfer Task</h2>
          <p>{s.transfer_task}</p>
          {submitted ? <p className="font-semibold text-primary">Sent! ✅</p> : <>
            <Textarea rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Show your thinking…" />
            <Button onClick={sendTransfer} disabled={!answer.trim()}>I'm done</Button></>}
        </section>
      ) : a ? (
        <section className="rounded-2xl bg-card p-5 shadow-soft">
          <p className="mb-2 font-bold">On screen: Artifact {String.fromCharCode(65 + s.current_index)}{a.id === s.misconception_artifact_id && " · What would you tell this student?"}</p>
          <ArtifactBody a={a} annotations={[]} onAnnotate={async (step, text, x, y) => {
            const { data: u } = await supabase.auth.getUser();
            const { error } = await supabase.from("annotations").insert({ artifact_id: a.id, author_id: u.user!.id, session_id: s.id, step_ref: step, text, x, y });
            if (error) toast.error(error.message); else { toast.success("Your note is on the big screen"); track("annotation_added", { session: true }); }
          }} />
        </section>
      ) : <p>Waiting for your teacher…</p>}
    </main>
  );
}
