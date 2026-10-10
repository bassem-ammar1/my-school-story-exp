import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { loadPostsBy, loadProfile } from "@/lib/posts";
import { PostCard } from "@/components/thinking/PostCard";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/u/$id")({
  head: () => ({ meta: [{ title: "Profile · MySchoolStory" }, { name: "description", content: "See a member's public profile and posts." }, { property: "og:title", content: "Profile · MySchoolStory" }, { property: "og:description", content: "See a member's public profile and posts." }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const { data: prof, isLoading } = useQuery({ queryKey: ["profile", id], queryFn: () => loadProfile(id) });
  const { data: posts = [] } = useQuery({ queryKey: ["posts", "by", id], queryFn: () => loadPostsBy(id) });
  if (isLoading) return null;
  if (!prof) return <main className="p-8 text-center text-muted-foreground">This profile isn't available.</main>;
  return (
    <main className="space-y-2 bg-muted pb-4">
      <section className="bg-card pb-4">
        {prof.cover_url ? <img src={prof.cover_url} alt="Profile cover" width={1536} height={768} className="h-32 w-full object-cover" /> : <div className="h-24 bg-gradient-to-r from-primary to-accent" />}
        <div className="px-4">
          {prof.avatar_url ? <img src={prof.avatar_url} alt={`${prof.display_name}'s avatar`} className="relative -mt-12 h-24 w-24 rounded-full border-4 border-card object-cover" /> :
            <div className="-mt-12 grid h-24 w-24 place-items-center rounded-full border-4 border-card bg-primary text-4xl font-bold text-primary-foreground">{prof.display_name.charAt(0).toUpperCase()}</div>}
          <h1 className="mt-2 text-2xl font-bold">{prof.display_name}</h1>
          {prof.headline && <p className="mt-1 text-sm">{prof.headline}</p>}
          {prof.grade && <p className="text-sm">Grade {prof.grade}</p>}
          <p className="mt-1 text-sm font-semibold text-primary">{posts.length} posts</p>
        </div>
      </section>
      {prof.about && <section className="bg-card p-4"><h2 className="font-semibold">About</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{prof.about}</p></section>}
      {posts.length === 0 && <p className="bg-card p-8 text-center text-muted-foreground">No posts yet.</p>}
      {posts.map((p) => <PostCard key={`${p.id}-${p.mine}`} p={p} meId={me?.id} />)}
    </main>
  );
}
