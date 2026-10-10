import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StepwiseSubmission } from "@/components/thinking/StepwiseSubmission";
import { ArtifactFeed } from "@/components/thinking/ArtifactFeed";
import { ArtifactCard } from "@/components/thinking/ArtifactCard";
import { ArtifactDetail } from "@/components/thinking/ArtifactDetail";
import { demoArtifacts, demoChallenges, demoCuration, demoHints, demoPrompts, demoSession } from "@/lib/demo-data";
import { COPY, MAX_HINTS_PER_SUBMISSION } from "@/lib/thinking";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import type { ArtifactView } from "@/components/thinking/types";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Try the demo · Thinking Lab" },
      { name: "description", content: "A guided 5-step tour: submit, get a hint, publish, curate and run a Synthesis Ritual." },
      { property: "og:title", content: "Try the Thinking Lab demo" },
      { property: "og:description", content: "No login needed. See how students show their thinking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});

const STEPS = ["Student submits", "Coach hints", "Publish", "Teacher curates", "Synthesis"];

function Demo() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<ArtifactView | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  useEffect(() => { track("demo_started"); sessionStorage.setItem("demo_started", "1"); }, []);
  const next = () => { if (step === STEPS.length - 1) track("demo_completed"); setStep(Math.min(step + 1, STEPS.length - 1)); };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="rounded-2xl bg-secondary p-4">
        <p className="text-sm font-semibold">Demo class · sample data that resets every time</p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s}><button onClick={() => setStep(i)} className={cn("rounded-full px-3 py-1 text-sm", i === step ? "bg-primary text-primary-foreground" : "bg-card")}>{i + 1}. {s}</button></li>
          ))}
        </ol>
      </div>

      {step <= 2 && (
        <>
          <p className="text-center text-muted-foreground">
            {step === 0 && "Fill in the steps, pick a concept and confidence, then press “Get a hint”."}
            {step === 1 && "The coach gives hints one at a time and never the answer. Try asking it for the answer!"}
            {step === 2 && "Revise a step, then press “Share my thinking”."}
          </p>
          <StepwiseSubmission
            challenge={demoChallenges[0]!}
            initialStatus="draft"
            initial={{ steps: ["Maya has 36 cookies and 3 boxes. She gives 1 box away.", "", ""], images: [], voice: { url: null, duration: 0, transcript: "" }, concept: null, confidence: null }}
            uploadImage={async (b) => ({ path: "demo", url: URL.createObjectURL(b) })}
            onSave={async () => {}}
            onRequestHint={async (_s, msg) => {
              await new Promise((r) => setTimeout(r, 900));
              if (hintsUsed >= MAX_HINTS_PER_SUBMISSION) return { limited: true, message: COPY.hintLimit };
              setHintsUsed(hintsUsed + 1);
              if (step === 0) setStep(1);
              if (msg && /answer/i.test(msg)) return { limited: false, hints: [COPY.refuse], next_step: demoHints.next_step, praise: "Asking for help is a smart move.", remaining: MAX_HINTS_PER_SUBMISSION - hintsUsed - 1 };
              return { limited: false, ...demoHints, remaining: MAX_HINTS_PER_SUBMISSION - hintsUsed - 1 };
            }}
            onSubmit={async () => {}}
            onPublish={async () => { setTimeout(() => setStep(3), 1200); }}
          />
          {step === 1 && <div className="text-center"><Button variant="outline" onClick={next}>Next: publish →</Button></div>}
        </>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Teacher Orchestrator · “{COPY.curate}”</h2>
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-3 md:grid-cols-2">
              {demoCuration.map((c, i) => { const a = demoArtifacts.find((x) => x.id === c.id)!; return (
                <div key={c.id}><p className="mb-1 text-xs font-bold text-primary">Artifact {String.fromCharCode(65 + i)}</p><ArtifactCard a={a} why={c.why} tag={c.misconception ? "Misconception" : undefined} onOpen={() => setOpen(a)} /></div>); })}
            </div>
            <aside className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
              <p className="font-semibold">Discussion prompts</p>
              <ul className="list-disc space-y-2 pl-5 text-sm">{demoPrompts.map((p) => <li key={p}>{p}</li>)}</ul>
              <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" onClick={next}>{COPY.synthesis}</Button>
            </aside>
          </div>
          <h3 className="text-lg font-bold">Class feed</h3>
          <ArtifactFeed artifacts={demoArtifacts} onOpen={setOpen} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-card p-8 text-2xl shadow-soft">
            <p className="text-sm text-muted-foreground">Projector mode preview</p>
            <p className="mt-2 text-3xl font-bold">Artifact E · What would you tell this student?</p>
            <p className="mt-4">{demoArtifacts[2]?.steps[1]}</p>
            <p className="mt-2 rounded-lg bg-gold/20 p-3 text-xl">📝 “I wonder why you took away 3 — is 3 the number of cookies or boxes?”</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[["Participation", demoSession.participation], ["Live notes", demoSession.notes], ["Transfer done", demoSession.transferDone]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-card p-5 shadow-soft"><p className="text-sm text-muted-foreground">{k}</p><p className="text-3xl font-bold">{v}</p></div>))}
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-soft"><b>Misconceptions:</b> {demoSession.misconceptions.join(", ")}<br /><b>Didn't finish:</b> {demoSession.missing.join(", ")}</div>
          <div className="flex flex-wrap justify-center gap-3 rounded-2xl bg-secondary p-6">
            <p className="w-full text-center font-semibold">That's the tour! Bring it to your class.</p>
            <Button onClick={() => track("demo_completed")} asChild><Link to="/auth" search={{ redirect: undefined }}>Create a free account</Link></Button>
            <Button variant="outline" onClick={() => { setStep(0); setHintsUsed(0); }}>Restart demo</Button>
          </div>
        </div>
      )}

      <ArtifactDetail a={open} annotations={[]} onClose={() => setOpen(null)} />
    </main>
  );
}
