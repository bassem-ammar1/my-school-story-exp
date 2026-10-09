import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PEOPLE } from "@/lib/social-data";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  head: () => ({ meta: [{ title: "Search · MySchoolStory" }, { name: "description", content: "Find schools and students on MySchoolStory." }, { property: "og:title", content: "Search · MySchoolStory" }, { property: "og:description", content: "Find schools and students on MySchoolStory." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q);
  const t = term.trim().toLowerCase();
  const results = PEOPLE.filter((p) => !t || `${p.name} ${p.detail} ${p.kind}`.toLowerCase().includes(t));
  return (
    <main className="space-y-3 px-3 py-4">
      <input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Type a school or student name"
        className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <ul className="divide-y rounded-xl bg-card shadow-soft">
        {results.map((p) => (
          <li key={p.name} className="flex items-center gap-3 p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-xl">{p.avatar}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="truncate text-sm text-muted-foreground">{p.kind} · {p.detail}</p>
            </div>
          </li>
        ))}
        {results.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No schools or students found.</li>}
      </ul>
    </main>
  );
}
