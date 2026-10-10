import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { coachChat } from "@/lib/thinking.functions";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "AI Coach · MySchoolStory" }, { name: "description", content: "Chat with your AI thinking coach for hints, strategies and explanations." }, { property: "og:title", content: "AI Coach · MySchoolStory" }, { property: "og:description", content: "Chat with your AI thinking coach for hints, strategies and explanations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CoachPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const STARTERS = ["Help me plan a fair science experiment", "How can I check my maths answer?", "Give me a study plan for this week"];

function CoachPage() {
  const chat = useServerFn(coachChat);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (q: string) => {
    const content = q.trim().slice(0, 1000);
    if (!content || busy) return;
    const next = [...msgs, { role: "user" as const, content }];
    setMsgs(next); setText(""); setBusy(true); setError(null);
    try {
      const r = await chat({ data: { messages: next.slice(-12) } });
      setMsgs([...next, { role: "assistant", content: r.reply }]);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <main className="flex min-h-[calc(100dvh-8rem)] flex-col gap-3 px-3 py-4">
      <div className="flex items-center gap-2"><Bot className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold">AI Coach</h1></div>
      <p className="text-sm text-muted-foreground">Ask for hints, strategies and explanations. Your coach helps you think — it won't do the work for you.</p>
      <div className="flex-1 space-y-3">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => <Button key={s} size="sm" variant="outline" onClick={() => send(s)}>{s}</Button>)}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground" : "max-w-[90%] whitespace-pre-wrap rounded-2xl bg-card px-4 py-2 text-sm shadow-soft"}>{m.role === "assistant" ? m.content.replace(/\*\*/g, "") : m.content}</div>
        ))}
        {busy && <p className="text-sm text-muted-foreground" aria-live="polite">Your coach is thinking…</p>}
        {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div ref={end} />
      </div>
      <form className="sticky bottom-16 flex gap-2 bg-background py-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <Textarea rows={1} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Ask your coach…" className="min-h-10 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
        <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </main>
  );
}
