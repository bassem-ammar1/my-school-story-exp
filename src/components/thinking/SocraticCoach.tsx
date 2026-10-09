import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/thinking";
import type { CoachState } from "./types";

export function SocraticCoach({ coach, loading, limited, onAsk }: { coach: CoachState; loading: boolean; limited: boolean; onAsk: (msg: string) => void }) {
  const [shown, setShown] = useState(1);
  const [msg, setMsg] = useState("");
  useEffect(() => setShown(1), [coach]);

  return (
    <aside className="flex h-full flex-col gap-4" aria-label="Socratic coach">
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold" /><h3 className="text-lg font-bold">Your thinking coach</h3></div>
      {loading ? (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm text-muted-foreground">Your coach is thinking…</p>
          <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-4/5" />
        </div>
      ) : coach ? (
        <>
          {coach.praise && <p className="rounded-xl bg-gold/20 p-3 text-sm">⭐ {coach.praise}</p>}
          <ol className="space-y-3">
            {coach.hints.slice(0, shown).map((h, i) => (
              <li key={i} className="animate-in fade-in slide-in-from-right-4 rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-primary">Hint {i + 1}</p>
                <p className="mt-1">{h}</p>
              </li>
            ))}
          </ol>
          {shown < coach.hints.length ? (
            <Button variant="outline" onClick={() => setShown(shown + 1)}>Show next hint</Button>
          ) : (
            <div className="rounded-xl bg-secondary p-3 text-sm"><b>Next step:</b> {coach.next_step}</div>
          )}
          <p className="text-xs text-muted-foreground">{coach.remaining} hint request{coach.remaining === 1 ? "" : "s"} left for this version.</p>
        </>
      ) : null}
      {limited && <p className="rounded-xl bg-muted p-3 text-sm">{COPY.hintLimit}</p>}
      {!loading && !limited && coach && (
        <form className="mt-auto flex gap-2" onSubmit={(e) => { e.preventDefault(); onAsk(msg); setMsg(""); }}>
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask your coach a question…" />
          <Button type="submit">Ask</Button>
        </form>
      )}
    </aside>
  );
}
