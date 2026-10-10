import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/hooks/use-me";
import { CognitiveAssessment } from "@/components/thinking/CognitiveAssessment";

export const Route = createFileRoute("/_authenticated/lab")({
  head: () => ({ meta: [{ title: "Assessment · MySchoolStory" }, { name: "description", content: "A private six-category self-reflection on your habits, learning preferences and interests." }, { property: "og:title", content: "Assessment · MySchoolStory" }, { property: "og:description", content: "Explore your habits, learning preferences and current interests privately." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Assessment,
});

function Assessment() {
  const { data: me } = useMe();
  return (
    <main className="space-y-4 px-3 py-4">
      <h1 className="text-2xl font-bold">Cognitive assessment</h1>
      {me && <CognitiveAssessment studentId={me.id} />}
    </main>
  );
}
