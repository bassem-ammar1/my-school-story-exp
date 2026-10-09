import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArtifactFeed } from "@/components/thinking/ArtifactFeed";
import { ArtifactDetail } from "@/components/thinking/ArtifactDetail";
import { loadArtifacts, toggleReaction } from "@/lib/feed-data";
import { track } from "@/lib/track";
import type { ArtifactView } from "@/components/thinking/types";

export const Route = createFileRoute("/_authenticated/feed/$classId")({
  head: () => ({ meta: [{ title: "Class thinking feed · Thinking Lab" }, { name: "description", content: "See how classmates approached each challenge." }, { property: "og:title", content: "Class thinking feed · Thinking Lab" }, { property: "og:description", content: "See how classmates approached each challenge." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Feed,
});

function Feed() {
  const { classId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState<ArtifactView | null>(null);
  const { data = [] } = useQuery({ queryKey: ["feed", classId], queryFn: () => loadArtifacts({ classId }) });
  const { data: anns = [] } = useQuery({
    queryKey: ["anns", open?.id], enabled: !!open,
    queryFn: async () => (await supabase.from("annotations").select("*").eq("artifact_id", open!.id).order("created_at")).data ?? [],
  });
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Class thinking feed</h1>
      <ArtifactFeed artifacts={data} onOpen={setOpen}
        onReact={async (a, e) => { await toggleReaction(a, e); qc.invalidateQueries({ queryKey: ["feed", classId] }); }} />
      <ArtifactDetail a={open} annotations={anns} onClose={() => setOpen(null)}
        onAnnotate={async (step, text, x, y) => {
          const { data: u } = await supabase.auth.getUser();
          await supabase.from("annotations").insert({ artifact_id: open!.id, author_id: u.user!.id, step_ref: step, text, x, y });
          await track("annotation_added");
          qc.invalidateQueries({ queryKey: ["anns", open!.id] });
          qc.invalidateQueries({ queryKey: ["feed", classId] });
        }} />
    </main>
  );
}
