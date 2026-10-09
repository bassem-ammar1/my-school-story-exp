import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArtifactFeed } from "@/components/thinking/ArtifactFeed";
import { ArtifactDetail } from "@/components/thinking/ArtifactDetail";
import { loadArtifacts, toggleReaction } from "@/lib/feed-data";
import { track } from "@/lib/track";
import { useMe } from "@/hooks/use-me";
import type { ArtifactView } from "@/components/thinking/types";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Feed · MySchoolStory" }, { name: "description", content: "See your classmates' latest thinking." }] }),
  component: Home,
});

function Home() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [open, setOpen] = useState<ArtifactView | null>(null);
  const { data = [] } = useQuery({ queryKey: ["feed", "all"], queryFn: () => loadArtifacts({}) });
  const { data: anns = [] } = useQuery({
    queryKey: ["anns", open?.id], enabled: !!open,
    queryFn: async () => (await supabase.from("annotations").select("*").eq("artifact_id", open!.id).order("created_at")).data ?? [],
  });

  const modes = [
    { to: "/lab", icon: "💭", title: "Thinking Lab", desc: "Solve a challenge step by step" },
    { to: "/profile", icon: "🏅", title: "My thinking", desc: "Your work, badges and tasks" },
    { to: "/synthesis/join", icon: "📺", title: "Join session", desc: "Enter your class code" },
    ...(me?.ssoTeacher ? [{ to: "/orchestrator", icon: "🎛️", title: "Orchestrator", desc: "Teacher workspace" }] : []),
  ] as const;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Hi {me?.profile?.display_name ?? "there"} 👋</h1>
        <p className="text-muted-foreground">Here's the latest thinking from your classes.</p>
      </div>
      <section aria-label="Modes" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((m) => (
          <Link key={m.to} to={m.to} className="rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5">
            <span className="text-2xl">{m.icon}</span>
            <p className="mt-1 font-semibold">{m.title}</p>
            <p className="text-sm text-muted-foreground">{m.desc}</p>
          </Link>
        ))}
      </section>
      <ArtifactFeed artifacts={data} onOpen={setOpen}
        onReact={async (a, e) => { await toggleReaction(a, e); qc.invalidateQueries({ queryKey: ["feed", "all"] }); }} />
      <ArtifactDetail a={open} annotations={anns} onClose={() => setOpen(null)}
        onAnnotate={async (step, text, x, y) => {
          await supabase.from("annotations").insert({ artifact_id: open!.id, author_id: me!.id, step_ref: step, text, x, y });
          await track("annotation_added");
          qc.invalidateQueries({ queryKey: ["anns", open!.id] });
        }} />
    </main>
  );
}
