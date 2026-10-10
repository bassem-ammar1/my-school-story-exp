import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { loadPostsByName } from "@/lib/posts";
import { PostCard } from "@/components/thinking/PostCard";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/author/$name")({
  head: () => ({ meta: [{ title: "Page · MySchoolStory" }, { name: "description", content: "See a school or member page and its posts." }, { property: "og:title", content: "Page · MySchoolStory" }, { property: "og:description", content: "See a school or member page and its posts." }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthorPage,
});

function AuthorPage() {
  const { name } = Route.useParams();
  const { data: me } = useMe();
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["posts", "name", name], queryFn: () => loadPostsByName(name) });
  if (isLoading) return null;
  const first = posts[0];
  if (!first) return <main className="p-8 text-center text-muted-foreground">This page isn't available.</main>;
  return (
    <main className="space-y-2 bg-muted pb-4">
      <section className="bg-card pb-4">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <div className="px-4">
          <div className="-mt-12 grid h-24 w-24 place-items-center rounded-full border-4 border-card bg-secondary text-5xl">{first.avatar}</div>
          <h1 className="mt-2 text-2xl font-bold">{first.author}</h1>
          <p className="text-sm">{first.subtitle}</p>
          <p className="mt-1 text-sm font-semibold text-primary">{posts.length} posts</p>
        </div>
      </section>
      {posts.map((p) => <PostCard key={`${p.id}-${p.mine}`} p={p} meId={me?.id} />)}
    </main>
  );
}
