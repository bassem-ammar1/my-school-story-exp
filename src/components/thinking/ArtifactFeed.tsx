import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COPY, similarity } from "@/lib/thinking";
import { ArtifactCard } from "./ArtifactCard";
import type { ArtifactView } from "./types";

type Sort = "newest" | "annotated" | "strategies";

export function ArtifactFeed({ artifacts, onOpen, onReact, onEndorse }: { artifacts: ArtifactView[]; onOpen: (a: ArtifactView) => void; onReact?: (a: ArtifactView, emoji: string) => void; onEndorse?: ((a: ArtifactView) => void) | undefined }) {
  const [concept, setConcept] = useState("all");
  const [sort, setSort] = useState<Sort>("newest");
  const concepts = [...new Set(artifacts.map((a) => a.concept))];

  const list = useMemo(() => {
    let l = artifacts.filter((a) => concept === "all" || a.concept === concept);
    if (sort === "newest") l = [...l].sort((x, y) => y.publishedAt.localeCompare(x.publishedAt));
    if (sort === "annotated") l = [...l].sort((x, y) => y.annotationCount - x.annotationCount);
    if (sort === "strategies") {
      const picked: ArtifactView[] = [];
      for (const a of l) if (!picked.some((p) => similarity(p.steps[1], a.steps[1]) > 0.4)) picked.push(a);
      l = picked;
    }
    return l;
  }, [artifacts, concept, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={concept} onValueChange={setConcept}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All concepts</SelectItem>{concepts.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        {(["newest", "annotated", "strategies"] as Sort[]).map((k) => (
          <Button key={k} size="sm" variant={sort === k ? "default" : "outline"} onClick={() => setSort(k)}>
            {k === "newest" ? "Newest" : k === "annotated" ? "Most annotated" : "Different strategies"}
          </Button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-soft">{COPY.empty}</p>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => <ArtifactCard key={a.id} a={a} onOpen={() => onOpen(a)} onReact={onReact ? (e) => onReact(a, e) : undefined} onEndorse={onEndorse ? () => onEndorse(a) : undefined} />)}
        </div>
      )}
    </div>
  );
}
