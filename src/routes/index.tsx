import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thinking Lab · AI that teaches thinking" },
      { name: "description", content: "Students share their reasoning step by step, get Socratic hints, and teachers see every step." },
      { property: "og:title", content: "Thinking Lab · AI that teaches thinking" },
      { property: "og:description", content: "Step-by-step reasoning, Socratic AI hints, and teacher-led synthesis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Thinking Lab</p>
      <h1 className="mt-2 max-w-3xl text-5xl font-bold leading-tight">Show <span className="rounded-lg bg-gold px-2">how</span> you think, not just the answer.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Students explain their thinking in three steps and a 30-second voice note. A coach asks questions — never gives answers. Teachers see the whole path and run a class discussion around different strategies.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90" asChild><Link to="/demo">Try the demo</Link></Button>
        <Button size="lg" variant="outline" asChild><Link to="/lab">Open the Thinking Lab</Link></Button>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {[["1 · Think in steps", "What do I know? What's my plan? Try it and check."], ["2 · Get a hint", "Up to 3 Socratic hints, one at a time."], ["3 · Learn together", "Classmates annotate, teachers curate and run a Synthesis Ritual."]].map(([t, d]) => (
          <div key={t} className="rounded-2xl bg-card p-6 shadow-soft"><h2 className="font-bold">{t}</h2><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </div>
    </main>
  );
}
