import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COPY, MAX_VOICE_SECONDS, clampVoiceSeconds } from "@/lib/thinking";
import { cn } from "@/lib/utils";

export type VoiceValue = { url: string | null; blob?: Blob | null; duration: number; transcript: string };

export function VoiceRecorder({ value, onChange, disabledReason }: { value: VoiceValue; onChange: (v: VoiceValue) => void; disabledReason?: string }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const speech = useRef<any>(null);
  const liveText = useRef("");

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        const duration = clampVoiceSeconds((Date.now() - started.current) / 1000);
        onChange({ url: URL.createObjectURL(blob), blob, duration, transcript: liveText.current.trim() || value.transcript });
      };
      rec.current = mr;
      started.current = Date.now();
      liveText.current = "";
      mr.start();
      setRecording(true);
      setElapsed(0);
      timer.current = setInterval(() => {
        const s = (Date.now() - started.current) / 1000;
        setElapsed(s);
        if (s >= MAX_VOICE_SECONDS) stop();
      }, 100);
      // waveform
      const ac = new AudioContext();
      const an = ac.createAnalyser();
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const draw = () => {
        const c = canvas.current; if (!c) return;
        const ctx = c.getContext("2d")!;
        an.getByteTimeDomainData(buf);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.strokeStyle = getComputedStyle(c).color; ctx.lineWidth = 2; ctx.beginPath();
        buf.forEach((v, i) => { const x = (i / buf.length) * c.width, y = (v / 255) * c.height; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
        raf.current = requestAnimationFrame(draw);
      };
      draw();
      // live transcription (browser speech recognition)
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const sr = new SR();
        sr.continuous = true; sr.interimResults = false;
        sr.onresult = (e: any) => { for (let i = e.resultIndex; i < e.results.length; i++) liveText.current += e.results[i][0].transcript + " "; };
        sr.start();
        speech.current = sr;
      }
    } catch {
      alert("Microphone access is needed to record a voice note.");
    }
  };

  function stop() {
    if (timer.current) clearInterval(timer.current);
    cancelAnimationFrame(raf.current);
    try { speech.current?.stop(); } catch { /* ignore */ }
    if (rec.current && rec.current.state !== "inactive") {
      // give speech recognition a moment to flush the last result
      setTimeout(() => rec.current?.state !== "inactive" && rec.current?.stop(), 300);
    }
    setRecording(false);
  }

  const R = 38, C = 2 * Math.PI * R;
  const remaining = Math.max(0, MAX_VOICE_SECONDS - Math.floor(elapsed));
  const hasClip = !!value.url && !recording;

  return (
    <section className="rounded-2xl bg-card p-5 shadow-soft">
      <h3 className="font-semibold">Explain your thinking</h3>
      {disabledReason ? (
        <p className="mt-2 text-sm text-muted-foreground">{disabledReason}</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative h-[84px] w-[84px]">
              <svg viewBox="0 0 84 84" className="absolute inset-0 -rotate-90">
                <circle cx="42" cy="42" r={R} className="fill-none stroke-muted" strokeWidth="5" />
                <circle cx="42" cy="42" r={R} className="fill-none stroke-gold transition-all" strokeWidth="5"
                  strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(elapsed, MAX_VOICE_SECONDS) / MAX_VOICE_SECONDS)} />
              </svg>
              <button
                type="button"
                aria-label="Record a 30-second voice explanation."
                onClick={recording ? stop : start}
                className={cn("absolute left-[10px] top-[10px] grid h-16 w-16 place-items-center rounded-full text-primary-foreground shadow-soft transition", recording ? "bg-destructive" : "bg-primary")}
              >{recording ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}</button>
            </div>
            <div className="flex-1">
              <p aria-live="polite" className="text-sm font-medium">
                {recording ? `${COPY.voiceRecording} · ${remaining}s` : hasClip ? COPY.voiceDone : COPY.voiceIdle}
              </p>
              {recording && <canvas ref={canvas} width={300} height={40} className="mt-2 h-10 w-full text-primary" />}
              {hasClip && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <audio controls src={value.url!} className="h-9" />
                  <Button size="sm" variant="outline" onClick={start}><RotateCcw className="mr-1 h-4 w-4" />Re-record</Button>
                  <Button size="sm" variant="ghost" aria-label="Delete voice note" onClick={() => onChange({ url: null, blob: null, duration: 0, transcript: "" })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
          </div>
          {(hasClip || value.transcript) && (
            <div className="mt-3">
              <label className="text-sm font-medium" htmlFor="transcript">Transcript (you can edit it)</label>
              <Textarea id="transcript" rows={3} value={value.transcript} placeholder="Type what you said if the transcript is empty."
                onChange={(e) => onChange({ ...value, transcript: e.target.value })} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
