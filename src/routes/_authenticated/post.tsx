import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { supabase } from "@/integrations/supabase/client";
import { createPost } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/post")({
  head: () => ({ meta: [{ title: "New post · MySchoolStory" }, { name: "description", content: "Share an update with your school." }, { property: "og:title", content: "New post · MySchoolStory" }, { property: "og:description", content: "Share an update with your school." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: NewPost,
});

function NewPost() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: mySchools = [] } = useQuery({
    queryKey: ["my-schools", me?.id],
    enabled: !!me?.id,
    queryFn: async () => (await supabase.from("schools").select("id,name,logo_url").eq("owner_id", me!.id).order("name")).data ?? [],
  });
  const [asSchool, setAsSchool] = useState(true);
  const [chosen, setChosen] = useState<string | null>(null);
  const schoolId = chosen ?? mySchools[0]?.id ?? null;
  const share = async () => {
    setBusy(true);
    try { await createPost(text, asSchool ? schoolId : null); } catch { setBusy(false); toast.error("Couldn't post. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["posts"] });
    toast.success(asSchool && schoolId ? "Posted as your school!" : "Posted!");
    navigate({ to: "/home" });
  };
  return (
    <main className="space-y-3 px-3 py-4">
      <h1 className="text-xl font-bold">Create a post</h1>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={8} autoFocus
        placeholder="What do you want to share with your school?"
        className="w-full rounded-xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      {mySchools.length > 0 && (
        <div className="space-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={asSchool} onChange={(e) => setAsSchool(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Post as {mySchools.length > 1 ? "a school" : mySchools[0].name} <span className="text-muted-foreground">(shown publicly as the school, not you)</span>
          </label>
          {asSchool && mySchools.length > 1 && (
            <select value={schoolId ?? ""} onChange={(e) => setChosen(e.target.value)}
              className="w-full rounded-lg border bg-background px-2 py-1.5" aria-label="Choose which school to post as">
              {mySchools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      )}
      <Button className="w-full" disabled={!text.trim() || busy} onClick={share}>Post</Button>
    </main>
  );
}
