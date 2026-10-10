import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { loadSchool, setFollow } from "@/lib/schools";
import { loadPosts } from "@/lib/posts";
import { PostCard } from "@/components/thinking/PostCard";

export const Route = createFileRoute("/_authenticated/schools/$id")({
  head: () => ({ meta: [{ title: "School profile · MySchoolStory" }, { name: "description", content: "School mission, facts and posts on MySchoolStory." }, { property: "og:title", content: "School profile · MySchoolStory" }, { property: "og:description", content: "School mission, facts and posts on MySchoolStory." }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] }),
  component: SchoolPage,
});

function SchoolPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["school", id], queryFn: () => loadSchool(id) });
  const { data: all = [] } = useQuery({ queryKey: ["posts"], queryFn: loadPosts });
  const posts = all.filter((p) => p.schoolId === id);
  if (isLoading) return <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>;
  const s = data?.school;
  if (!s) return <p className="p-6 text-center text-sm text-muted-foreground">School not found.</p>;

  const toggle = async () => {
    setBusy(true);
    try { await setFollow(id, !data.following); await qc.invalidateQueries({ queryKey: ["school", id] }); }
    catch { toast.error("Couldn't update follow. Try again."); }
    finally { setBusy(false); }
  };

  const facts: [string, string][] = [
    ["📅 Founded", s.founded_year ? String(s.founded_year) : "—"],
    ["📍 Location", s.location ?? "—"],
    ["🧑‍🎓 Students", s.student_count?.toLocaleString() ?? "—"],
    ["👩‍🏫 Teachers", s.teacher_count?.toLocaleString() ?? "—"],
    ["🗣️ Languages", s.languages.length ? s.languages.join(", ") : "—"],
    ["📝 Posts", String(data.posts)],
  ];

  return (
    <main className="space-y-3 pb-4">
      <section className="bg-card shadow-soft">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <div className="px-4 pb-4">
          {s.logo_url ? <img src={s.logo_url} alt={`${s.name} logo`} className="-mt-10 h-20 w-20 rounded-full border-4 border-card bg-card object-cover" />
            : <span className="-mt-10 grid h-20 w-20 place-items-center rounded-full border-4 border-card bg-secondary text-3xl">🏫</span>}
          <h1 className="mt-2 text-xl font-bold">{s.name} {s.verified && <span className="text-primary" title="Verified">✔</span>}</h1>
          <p className="text-sm text-muted-foreground">School · {data.followers} follower{data.followers === 1 ? "" : "s"}</p>
          <button onClick={toggle} disabled={busy}
            className={`mt-3 rounded-full px-5 py-1.5 text-sm font-semibold ${data.following ? "border border-primary text-primary" : "bg-primary text-primary-foreground"}`}>
            {data.following ? "✓ Following" : "+ Follow"}
          </button>
        </div>
      </section>
      {s.mission && (
        <section className="mx-3 rounded-xl bg-card p-4 shadow-soft">
          <h2 className="font-semibold">Mission</h2>
          <p className="mt-1 text-sm">{s.mission}</p>
        </section>
      )}
      <section className="mx-3 grid grid-cols-2 gap-2 rounded-xl bg-card p-4 shadow-soft">
        {facts.map(([k, v]) => (
          <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-semibold">{v}</p></div>
        ))}
      </section>
      <h2 className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Posts</h2>
      {posts.map((p) => <PostCard key={p.id} p={p} />)}
      {posts.length === 0 && <p className="px-4 text-sm text-muted-foreground">No posts yet.</p>}
    </main>
  );
}
