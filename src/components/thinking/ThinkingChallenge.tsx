import { Badge } from "@/components/ui/badge";
import type { ChallengeView } from "./types";

export function ThinkingChallenge({ challenge, compact }: { challenge: ChallengeView; compact?: boolean }) {
  return (
    <article className="rounded-2xl border-l-4 border-gold bg-card p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Thinking Challenge</p>
      <h2 className="mt-1 text-xl font-bold">{challenge.title}</h2>
      <p className={compact ? "mt-2 line-clamp-2 text-muted-foreground" : "mt-2 whitespace-pre-wrap text-foreground/90"}>{challenge.prompt_text}</p>
      {challenge.prompt_image && !compact && (
        <img src={challenge.prompt_image} alt="Challenge illustration" className="mt-3 max-h-64 rounded-xl object-contain" />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {challenge.concept_tokens.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
      </div>
    </article>
  );
}
