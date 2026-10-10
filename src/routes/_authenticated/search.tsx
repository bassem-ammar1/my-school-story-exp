import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadPosts } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  head: () => ({ meta: [{ title: "Search · MySchoolStory" }, { name: "description", content: "Find schools and students on MySchoolStory." }, { property: "og:title", content: "Search · MySchoolStory" }, { property: "og:description", content: "Find schools and students on MySchoolStory." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SearchPage,
});

type Person = { id: string; display_name: string; avatar_url: string | null; grade: number | null; role: "student" | "teacher" | "school_admin" };

const ROLE_LABEL: Record<Person["role"], string> = { student: "Student", teacher: "Teacher", school_admin: "School admin" };
const ROLE_AVATAR: Record<Person["role"], string> = { student: "🧑‍🎓", teacher: "👩‍🏫", school_admin: "🏫" };

function SearchPage() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q);
  const t = term.trim();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["search-people", t.toLowerCase()],
    queryFn: async () => (await supabase.rpc("search_people", { _term: t })).data ?? [],
  });

  const { data: allPosts = [] } = useQuery({ queryKey: ["posts"], queryFn: loadPosts });
  const posts = allPosts.filter(
    (p) => !t || `${p.author} ${p.body}`.toLowerCase().includes(t.toLowerCase()),
  );

  return (
    <main className="space-y-4 px-3 py-4">
      <input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Type a school or student name"
        className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />

      <section>
        <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">People</h2>
        <ul className="divide-y rounded-xl bg-card shadow-soft">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-xl">{ROLE_AVATAR[p.role]}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.display_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {ROLE_LABEL[p.role]}{p.grade ? ` · Grade ${p.grade}` : ""}
                </p>
              </div>
            </li>
          ))}
          {!isLoading && people.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">No people found.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Posts</h2>
        <ul className="divide-y rounded-xl bg-card shadow-soft">
          {posts.map((p) => (
            <li key={p.id} className="p-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-base">{p.avatar}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.author}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.subtitle} · {p.when}</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm">{p.body}</p>
            </li>
          ))}
          {posts.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No posts found.</li>}
        </ul>
      </section>

      <p className="px-1 text-center text-xs text-muted-foreground">
        Looking for a school? <Link to="/profile" className="text-primary underline">Ask a teacher to invite you</Link>
      </p>
    </main>
  );
}
