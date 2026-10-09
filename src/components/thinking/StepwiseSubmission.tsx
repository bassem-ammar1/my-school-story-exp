import { useRef, useState } from "react";
import { ImagePlus, PenLine, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { COPY, MAX_IMAGE_BYTES, MAX_STEP_CHARS, STEP_LABELS, canSubmit } from "@/lib/thinking";
import { ThinkingChallenge } from "./ThinkingChallenge";
import { ConfidenceScale } from "./ConfidenceScale";
import { SketchCanvas } from "./SketchCanvas";
import { VoiceRecorder, type VoiceValue } from "./VoiceRecorder";
import { SocraticCoach } from "./SocraticCoach";
import type { ChallengeView, CoachState } from "./types";

export type SubmissionState = {
  steps: [string, string, string];
  images: { step: number; path: string; url: string; alt: string }[];
  voice: VoiceValue;
  concept: string | null;
  confidence: number | null;
};

export type HintResult = { limited: true; message: string } | { limited: false; hints: string[]; next_step: string; praise: string; remaining: number };

type Props = {
  challenge: ChallengeView;
  initial: SubmissionState;
  initialStatus: string;
  uploadImage: (b: Blob, ext: string) => Promise<{ path: string; url: string }>;
  voiceDisabledReason?: string;
  onSave: (s: SubmissionState) => Promise<void>;
  onRequestHint: (s: SubmissionState, message?: string) => Promise<HintResult>;
  onPublish: (s: SubmissionState) => Promise<void>;
};

const STATUS_LABEL: Record<string, string> = { draft: "Draft", queued: "Queued", hinted: "Hint ready", revised: "Revised", published: "Published" };

export function StepwiseSubmission(p: Props) {
  const [s, setS] = useState<SubmissionState>(p.initial);
  const [status, setStatus] = useState(p.initialStatus);
  const [coach, setCoach] = useState<CoachState>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [limited, setLimited] = useState(false);
  const [sketchFor, setSketchFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isMobile = useIsMobile();

  const ready = canSubmit({ step1: s.steps[0], step2: s.steps[1], step3: s.steps[2], hasVoice: !!s.voice.url, concept: s.concept, confidence: s.confidence });

  const setStep = (i: number, v: string) => {
    const steps = [...s.steps] as SubmissionState["steps"];
    steps[i] = v.slice(0, MAX_STEP_CHARS);
    setS({ ...s, steps });
  };

  const addImage = async (step: number, blob: Blob, ext: string) => {
    if (blob.size > MAX_IMAGE_BYTES) return toast.error("Images must be 5MB or smaller.");
    try {
      const { path, url } = await p.uploadImage(blob, ext);
      setS((cur) => ({ ...cur, images: [...cur.images.filter((x) => x.step !== step), { step, path, url, alt: `Student ${ext === "png" ? "sketch" : "photo"} for Step ${step}` }] }));
    } catch (e) { toast.error((e as Error).message); }
  };

  const ask = async (message?: string) => {
    setCoachOpen(true);
    setStatus("queued");
    setLoading(true);
    try {
      const r = await p.onRequestHint(s, message);
      if (r.limited) { setLimited(true); setStatus("hinted"); }
      else { setCoach({ hints: r.hints, next_step: r.next_step, praise: r.praise, remaining: r.remaining }); setLimited(r.remaining <= 0); setStatus("hinted"); }
    } catch (e) {
      toast.error((e as Error).message);
      setStatus("draft");
    } finally { setLoading(false); }
  };

  const wrap = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } };

  const coachPanel = <SocraticCoach coach={coach} loading={loading} limited={limited} onAsk={(m) => ask(m)} />;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Badge variant={status === "published" ? "default" : "secondary"}>{loading ? "Your coach is thinking…" : STATUS_LABEL[status] ?? status}</Badge>
        {coach && !coachOpen && <Button size="sm" variant="outline" onClick={() => setCoachOpen(true)}>Open coach</Button>}
      </div>
      <ThinkingChallenge challenge={p.challenge} />

      {STEP_LABELS.map((label, i) => {
        const img = s.images.find((x) => x.step === i + 1);
        return (
          <section key={label} className="rounded-2xl bg-card p-5 shadow-soft">
            <label htmlFor={`step${i}`} className="font-semibold">{label}</label>
            <Textarea id={`step${i}`} rows={4} className="mt-2" value={s.steps[i]} onChange={(e) => setStep(i, e.target.value)} maxLength={MAX_STEP_CHARS} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input ref={(el) => { fileRefs.current[i] = el; }} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(i + 1, f, f.name.split(".").pop() || "jpg"); e.target.value = ""; }} />
              <Button type="button" size="sm" variant="outline" onClick={() => fileRefs.current[i]?.click()}><ImagePlus className="mr-1 h-4 w-4" />Add a photo or sketch</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setSketchFor(i + 1)}><PenLine className="mr-1 h-4 w-4" />Sketch</Button>
              <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">{s.steps[i].length}/{MAX_STEP_CHARS}</span>
            </div>
            {img && (
              <div className="mt-3 flex items-start gap-3">
                <div className="relative">
                  <img src={img.url} alt={img.alt} className="h-24 w-24 rounded-xl border object-cover" />
                  <button aria-label="Remove image" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                    onClick={() => setS({ ...s, images: s.images.filter((x) => x.step !== i + 1) })}><X className="h-3 w-3" /></button>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium" htmlFor={`alt${i}`}>Image description (alt text, optional)</label>
                  <Input id={`alt${i}`} value={img.alt} onChange={(e) => setS({ ...s, images: s.images.map((x) => (x.step === i + 1 ? { ...x, alt: e.target.value } : x)) })} />
                </div>
              </div>
            )}
          </section>
        );
      })}

      <VoiceRecorder value={s.voice} onChange={(voice) => setS((cur) => ({ ...cur, voice }))} disabledReason={p.voiceDisabledReason} />

      <section className="rounded-2xl bg-card p-5 shadow-soft">
        <p className="font-semibold">Concept</p>
        <Select value={s.concept ?? undefined} onValueChange={(v) => setS({ ...s, concept: v })}>
          <SelectTrigger className="mt-2"><SelectValue placeholder="Pick the concept you used" /></SelectTrigger>
          <SelectContent>{p.challenge.concept_tokens.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </section>

      <ConfidenceScale value={s.confidence} onChange={(confidence) => setS({ ...s, confidence })} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={() => wrap(async () => { await p.onSave(s); toast.success("Draft saved"); })}>Save draft</Button>
        <Button disabled={!ready || loading || busy} onClick={() => wrap(async () => { await p.onSave(s); await ask(); })}>{COPY.submit}</Button>
        {status !== "draft" && status !== "published" && (
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={busy || !ready}
            onClick={() => wrap(async () => { await p.onPublish(s); setStatus("published"); toast.success(COPY.published); })}>{COPY.publish}</Button>
        )}
      </div>
      {!ready && <p className="text-right text-xs text-muted-foreground">Fill in Step 1, add a voice note or Step 3, then pick a concept and confidence.</p>}

      <Sheet open={coachOpen} onOpenChange={setCoachOpen} modal={false}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "max-h-[80vh] overflow-y-auto" : "w-[380px] overflow-y-auto"}>
          {coachPanel}
        </SheetContent>
      </Sheet>

      <SketchCanvas open={sketchFor != null} onClose={() => setSketchFor(null)} onSave={(b) => sketchFor && addImage(sketchFor, b, "png")} />
    </div>
  );
}
