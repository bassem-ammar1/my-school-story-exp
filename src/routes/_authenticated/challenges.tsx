import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThinkingChallenge } from "@/components/thinking/ThinkingChallenge";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({ meta: [{ title: "Thinking Lab · MySchoolStory" }, { name: "description", content: "Join your class and solve teacher challenges step by step." }, { property: "og:title", content: "Thinking Lab · MySchoolStory" }, { property: "og:description", content: "Join your class and solve teacher challenges step by step." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ThinkingLab,
});

function ThinkingLab() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const { data: classes = [] } = useQuery({
    queryKey: ["my-classes"],
    queryFn: async () => (await supabase.from("classes").select("id,name,join_code,teacher_id, challenges(id,title,prompt_text,concept_tokens,created_at)").order("created_at")).data ?? [],
  });
  const studentView = typeof window !== "undefined" && localStorage.getItem("studentView") === "1";

  const join = async () => {
    const { error } = await supabase.rpc("join_class", { _code: code });
    if (error) { toast.error(error.message); return; }
    toast.success("Joined!"); setCode(""); qc.invalidateQueries({ queryKey: ["my-classes"] });
  };

  return (
    <main className="space-y-4 px-3 py-4">
      <h1 className="text-2xl font-bold">Thinking Lab</h1>
      {studentView && me?.ssoTeacher && (
        <div className="flex items-center justify-between rounded-xl bg-gold/30 px-4 py-2 text-sm">Student view (read-only preview)
          <Button size="sm" variant="outline" onClick={() => { localStorage.removeItem("studentView"); location.href = "/orchestrator"; }}>Exit</Button></div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Challenges from your teachers. Show how you think, step by step.</p></div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); join(); }}>
          <Input placeholder="Class code" value={code} onChange={(e) => setCode(e.target.value)} className="w-36 uppercase" />
          <Button type="submit" disabled={!code}>Join class</Button>
        </form>
      </div>
      {classes.length === 0 && <p className="rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-soft">Ask your teacher for a class code to get started.</p>}
      {classes.map((c: any) => (
        <section key={c.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{c.name}</h2>
            <Button size="sm" variant="outline" asChild><Link to="/feed/$classId" params={{ classId: c.id }}>Class thinking feed</Link></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(c.challenges ?? []).map((ch: any) => (
              <Link key={ch.id} to="/challenge/$id" params={{ id: ch.id }} className="block transition hover:-translate-y-0.5">
                <ThinkingChallenge challenge={ch} compact />
              </Link>
            ))}
            {!c.challenges?.length && <p className="text-sm text-muted-foreground">No challenges yet.</p>}
          </div>
        </section>
      ))}
    </main>
  );
}
