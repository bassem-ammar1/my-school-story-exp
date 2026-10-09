import { CONFIDENCE_EMOJI, COPY } from "@/lib/thinking";
import { cn } from "@/lib/utils";

export function ConfidenceScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <fieldset className="rounded-2xl bg-card p-5 shadow-soft">
      <legend className="sr-only">Confidence</legend>
      <p className="font-semibold">{COPY.confidence}</p>
      <div className="mt-3 flex gap-2" role="radiogroup">
        {CONFIDENCE_EMOJI.map((e, i) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={value === i + 1}
            aria-label={`Confidence ${i + 1} of 5`}
            onClick={() => onChange(i + 1)}
            className={cn("grid h-12 w-12 place-items-center rounded-full border-2 text-2xl transition", value === i + 1 ? "scale-110 border-primary bg-secondary" : "border-transparent bg-muted")}
          >{e}</button>
        ))}
      </div>
    </fieldset>
  );
}

export function ConfidenceDots({ value }: { value: number }) {
  return (
    <span className="flex gap-1" aria-label={`Confidence ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn("h-2 w-2 rounded-full", i <= value ? "bg-primary" : "bg-muted")} />)}
    </span>
  );
}
