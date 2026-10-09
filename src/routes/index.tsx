import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blank Page" },
      { name: "description", content: "An empty page." },
      { property: "og:title", content: "Blank Page" },
      { property: "og:description", content: "An empty page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-6xl font-semibold tracking-tight text-foreground">lovable</p>
    </main>
  );
}
