import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { useQueryClient } from "@tanstack/react-query";
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
  void me;
  const share = async () => {
    setBusy(true);
    try { await createPost(text); } catch { setBusy(false); toast.error("Couldn't post. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["posts"] });
    toast.success("Posted!");
    navigate({ to: "/home" });
  };
  return (
    <main className="space-y-3 px-3 py-4">
      <h1 className="text-xl font-bold">Create a post</h1>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={8} autoFocus
        placeholder="What do you want to share with your school?"
        className="w-full rounded-xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <Button className="w-full" disabled={!text.trim() || busy} onClick={share}>Post</Button>
    </main>
  );
}
