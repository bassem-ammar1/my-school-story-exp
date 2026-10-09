import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/thinking/AuthForm";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in · MySchoolStory" },
      { name: "description", content: "Sign in to MySchoolStory." },
      { property: "og:title", content: "Sign in · MySchoolStory" },
      { property: "og:description", content: "Students and teachers sign in to MySchoolStory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthForm,
});
