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

const SAMPLE_POSTS = [
  { avatar: "🏫", author: "Cedar Hills School", kind: "School", when: "2h ago", title: "Science fair next Friday!", body: "Grade 6–8 students: bring your experiments and explain your thinking to the judges. Sign-ups close Wednesday.", likes: 24, comments: 6 },
  { avatar: "🧑‍🎓", author: "Lina, Grade 7", kind: "Student", when: "5h ago", title: "How I solved the fraction puzzle", body: "I drew the pizza as 8 slices first, then noticed 3/4 is the same as 6/8. Drawing it made it click!", likes: 15, comments: 4 },
  { avatar: "👩‍🏫", author: "Ms. Haddad, Math", kind: "Teacher", when: "Yesterday", title: "New challenge is live 🎯", body: "Try this week's Thinking Lab challenge on patterns. Show every step — the reasoning matters more than the answer.", likes: 31, comments: 9 },
];

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
    <main className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 sm:space-y-8 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Hi {me?.profile?.display_name ?? "there"} 👋</h1>
        <p className="text-muted-foreground">Here's the latest thinking from your classes.</p>
      </div>
      <section aria-label="Modes" className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {modes.map((m) => (
          <Link key={m.to} to={m.to} className="w-40 shrink-0 rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5 sm:w-auto">
            <span className="text-2xl">{m.icon}</span>
            <p className="mt-1 font-semibold">{m.title}</p>
            <p className="text-sm text-muted-foreground">{m.desc}</p>
          </Link>
        ))}
      </section>
      <section aria-label="Latest posts" className="space-y-3">
        <h2 className="text-xl font-semibold">Latest posts</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {SAMPLE_POSTS.map((p) => (
            <article key={p.title} className="rounded-2xl bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xl">{p.avatar}</span>
                <div>
                  <p className="font-semibold leading-tight">{p.author}</p>
                  <p className="text-xs text-muted-foreground">{p.kind} · {p.when}</p>
                </div>
              </div>
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              <p className="mt-3 text-sm">💡 {p.likes} · 💬 {p.comments}</p>
            </article>
          ))}
        </div>
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
