import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ThumbsUp, MessageSquare, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArtifactFeed } from "@/components/thinking/ArtifactFeed";
import { ArtifactDetail } from "@/components/thinking/ArtifactDetail";
import { loadArtifacts, toggleReaction } from "@/lib/feed-data";
import { track } from "@/lib/track";
import { useMe } from "@/hooks/use-me";
import { SAMPLE_POSTS, PEOPLE, loadMyPosts, type Post } from "@/lib/social-data";
import type { ArtifactView } from "@/components/thinking/types";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Feed · MySchoolStory" }, { name: "description", content: "See the latest posts from schools and students." }] }),
  component: Home,
});

function PostCard({ p }: { p: Post }) {
  const [liked, setLiked] = useState(false);
  return (
    <article className="bg-card">
      <div className="flex items-start gap-3 px-3 pt-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-2xl">{p.avatar}</span>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{p.author}</p>
          <p className="truncate text-xs text-muted-foreground">{p.subtitle}</p>
          <p className="text-xs text-muted-foreground">{p.when}</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-3 py-3 text-sm">{p.body}</p>
      <div className="flex justify-between px-3 pb-2 text-xs text-muted-foreground">
        <span>👍 {p.likes + (liked ? 1 : 0)}</span><span>{p.comments} comments</span>
      </div>
      <div className="grid grid-cols-3 border-t text-sm font-medium text-muted-foreground">
        <button onClick={() => setLiked(!liked)} className={`flex items-center justify-center gap-1.5 py-2.5 ${liked ? "text-primary" : ""}`}><ThumbsUp className="h-4 w-4" />Like</button>
        <button className="flex items-center justify-center gap-1.5 py-2.5"><MessageSquare className="h-4 w-4" />Comment</button>
        <button className="flex items-center justify-center gap-1.5 py-2.5"><Share2 className="h-4 w-4" />Share</button>
      </div>
    </article>
  );
}

function Home() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [open, setOpen] = useState<ArtifactView | null>(null);
  const [mine, setMine] = useState<Post[]>([]);
  useEffect(() => setMine(loadMyPosts()), []);
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
      {[...mine, ...SAMPLE_POSTS].map((p) => <PostCard key={p.id} p={p} />)}
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
