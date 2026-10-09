import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ANNOTATION_STARTERS, STEP_LABELS, isAnnotationAllowed } from "@/lib/thinking";
import { ConfidenceDots } from "./ConfidenceScale";
import type { AnnotationView, ArtifactView } from "./types";

export function ArtifactDetail({ a, annotations, onClose, onAnnotate, big }: {
  a: ArtifactView | null; annotations: AnnotationView[]; onClose?: () => void;
  onAnnotate?: (step: number, text: string, x: number | null, y: number | null) => Promise<void>; big?: boolean;
}) {
  if (!a) return null;
  const body = <ArtifactBody a={a} annotations={annotations} onAnnotate={onAnnotate} big={big} />;
  if (!onClose) return body;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{a.name}'s thinking</DialogTitle></DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

export function ArtifactBody({ a, annotations, onAnnotate, big }: { a: ArtifactView; annotations: AnnotationView[]; onAnnotate?: (step: number, text: string, x: number | null, y: number | null) => Promise<void>; big?: boolean }) {
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [pin, setPin] = useState<{ step: number; x: number; y: number } | null>(null);

  const submit = async (step: number) => {
    const text = (draft[step] ?? "").trim();
    if (!isAnnotationAllowed(text)) return toast.error("Let's keep notes kind and helpful.");
    const pos = pin?.step === step ? pin : null;
    await onAnnotate?.(step, text, pos?.x ?? null, pos?.y ?? null);
    setDraft({ ...draft, [step]: "" });
    setPin(null);
  };

  return (
    <div className={big ? "space-y-6 text-2xl" : "space-y-4"}>
      <div className="flex items-center gap-2"><Badge variant="secondary">{a.concept}</Badge><ConfidenceDots value={a.confidence} /></div>
      {[1, 2, 3].map((step) => {
        const img = a.images.find((x) => x.step === step);
        const notes = annotations.filter((n) => n.step_ref === step);
        return (
          <section key={step} className="rounded-2xl border bg-card p-4">
            <p className="font-semibold text-primary">{STEP_LABELS[step - 1]}</p>
            <div className="relative mt-2" onClick={(e) => {
              if (!onAnnotate) return;
              const r = e.currentTarget.getBoundingClientRect();
              setPin({ step, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
            }}>
              <p className="whitespace-pre-wrap">{a.steps[step - 1] || <span className="text-muted-foreground">(empty)</span>}</p>
              {img && <img src={img.url} alt={img.alt} className="mt-2 max-h-72 rounded-xl" />}
              {notes.filter((n) => n.x != null).map((n) => (
                <span key={n.id} title={n.text} className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-gold px-1.5 py-0.5 text-xs text-gold-foreground shadow-soft"
                  style={{ left: `${(n.x ?? 0) * 100}%`, top: `${(n.y ?? 0) * 100}%` }}>📌</span>
              ))}
              {pin?.step === step && <span className="absolute -translate-x-1/2 -translate-y-1/2 text-lg" style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}>📍</span>}
            </div>
            {notes.length > 0 && (
              <ul className="mt-3 space-y-1">
                {notes.map((n) => <li key={n.id} className="rounded-lg bg-gold/20 px-3 py-1.5 text-sm">📝 {n.text}</li>)}
              </ul>
            )}
            {onAnnotate && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {ANNOTATION_STARTERS.map((s) => <button key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => setDraft({ ...draft, [step]: s.replace("…", " ") })}>{s}</button>)}
                </div>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(step); }}>
                  <Input aria-label={`Add a note on step ${step}`} value={draft[step] ?? ""} onChange={(e) => setDraft({ ...draft, [step]: e.target.value })}
                    placeholder={pin?.step === step ? "Pinned — write your note" : "Write a kind, helpful note (tap the step to pin it)"} />
                  <Button type="submit" size="sm">Add</Button>
                </form>
              </div>
            )}
          </section>
        );
      })}
      {a.voiceUrl && <audio controls src={a.voiceUrl} className="w-full" />}
      {a.transcript && <p className="rounded-xl bg-muted p-3 text-sm"><b>Transcript:</b> {a.transcript}</p>}
    </div>
  );
}
