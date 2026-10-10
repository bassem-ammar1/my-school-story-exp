import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArtifactFeed } from "@/components/thinking/ArtifactFeed";
import { ArtifactDetail } from "@/components/thinking/ArtifactDetail";
import { loadArtifacts, toggleReaction } from "@/lib/feed-data";
import { track } from "@/lib/track";
import { useMe } from "@/hooks/use-me";
import { PEOPLE } from "@/lib/social-data";
import { loadPosts } from "@/lib/posts";
import { PostCard } from "@/components/thinking/PostCard";
import type { ArtifactView } from "@/components/thinking/types";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Feed · MySchoolStory" }, { name: "description", content: "See the latest posts from schools and students." }, { property: "og:title", content: "Feed · MySchoolStory" }, { property: "og:description", content: "See the latest posts from schools and students." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Home,
});

function Home() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [open, setOpen] = useState<ArtifactView | null>(null);
  const { data: posts = [] } = useQuery({ queryKey: ["posts"], queryFn: loadPosts });
  const { data = [] } = useQuery({ queryKey: ["feed", "all"], queryFn: () => loadArtifacts({}) });
  const { data: anns = [] } = useQuery({
    queryKey: ["anns", open?.id], enabled: !!open,
    queryFn: async () => (await supabase.from("annotations").select("*").eq("artifact_id", open!.id).order("created_at")).data ?? [],
  });

  return (
    <main className="space-y-2 bg-muted pb-2">
      <section aria-label="People" className="flex gap-3 overflow-x-auto bg-card px-3 py-3">
        {PEOPLE.map((p) => (
          <Link key={p.name} to="/search" search={{ q: p.name }} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-primary bg-secondary text-2xl">{p.avatar}</span>
            <span className="w-full truncate text-center text-xs">{p.name.split(" ")[0]}</span>
          </Link>
        ))}
      </section>
      {posts.map((p) => <PostCard key={`${p.id}-${p.liked}`} p={p} meId={me?.id} />)}
      {data.length > 0 && (
        <section className="bg-card p-3">
          <h2 className="mb-2 font-semibold">Thinking from your classes</h2>
          <ArtifactFeed artifacts={data} onOpen={setOpen}
            onReact={async (a, e) => { await toggleReaction(a, e); qc.invalidateQueries({ queryKey: ["feed", "all"] }); }} />
        </section>
      )}
      <ArtifactDetail a={open} annotations={anns} onClose={() => setOpen(null)}
        onAnnotate={async (step, text, x, y) => {
          await supabase.from("annotations").insert({ artifact_id: open!.id, author_id: me!.id, step_ref: step, text, x, y });
          await track("annotation_added");
          qc.invalidateQueries({ queryKey: ["anns", open!.id] });
        }} />
    </main>
  );
}
