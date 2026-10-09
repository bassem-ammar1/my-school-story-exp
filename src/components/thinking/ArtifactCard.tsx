import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { REACTIONS } from "@/lib/thinking";
import { cn } from "@/lib/utils";
import { ConfidenceDots } from "./ConfidenceScale";
import type { ArtifactView } from "./types";

export function ArtifactCard({ a, onOpen, onReact, tag, why }: { a: ArtifactView; onOpen?: () => void; onReact?: (emoji: string) => void; tag?: string; why?: string }) {
  const [showT, setShowT] = useState(false);
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft">
      <header className="flex items-center gap-2">
        <Avatar className="h-8 w-8">{a.avatar && <AvatarImage src={a.avatar} alt="" />}<AvatarFallback>{a.name[0]}</AvatarFallback></Avatar>
        <span className="text-sm font-semibold">{a.name}</span>
        {tag && <Badge variant="destructive" className="ml-auto text-[10px]">{tag}</Badge>}
      </header>
      {why && <p className="text-xs italic text-muted-foreground">Why this one? {why}</p>}
      <button onClick={onOpen} className="grid grid-cols-3 gap-2 text-left" aria-label={`Open ${a.name}'s thinking`}>
        {[0, 1, 2].map((i) => {
          const img = a.images.find((x) => x.step === i + 1);
          return (
            <div key={i} className="aspect-square overflow-hidden rounded-lg bg-muted p-1.5 text-[10px] leading-tight text-muted-foreground">
              {img ? <img src={img.url} alt={img.alt} className="h-full w-full rounded object-cover" /> : <><b className="text-foreground">Step {i + 1}</b><br />{a.steps[i].slice(0, 70)}</>}
            </div>
          );
        })}
      </button>
      {a.voiceUrl && <audio controls src={a.voiceUrl} className="h-8 w-full" />}
      {a.transcript && (
        <button className="text-left text-xs text-muted-foreground" onClick={() => setShowT(!showT)}>
          {showT ? a.transcript : `Transcript: ${a.transcript.slice(0, 50)}${a.transcript.length > 50 ? "…" : ""}`}
        </button>
      )}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{a.concept}</Badge>
        <ConfidenceDots value={a.confidence} />
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3" />{a.annotationCount}</span>
      </div>
      <div className="flex gap-1">
        {REACTIONS.map((e) => (
          <button key={e} disabled={!onReact} onClick={() => onReact?.(e)} aria-pressed={a.mine.includes(e)}
            className={cn("rounded-full px-2 py-0.5 text-sm", a.mine.includes(e) ? "bg-secondary ring-1 ring-primary" : "bg-muted")}>
            {e} <span className="text-xs">{a.reactions[e] ?? 0}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
