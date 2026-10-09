// Pure, shared Thinking Lab rules (safe for client and server).

export const MAX_STEP_CHARS = 500;
export const MAX_VOICE_SECONDS = 30;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_HINTS_PER_SUBMISSION = 3;
export const COPY_SIMILARITY_THRESHOLD = 0.85;
export const COPY_FAST_SECONDS = 60;
export const REACTIONS = ["💡", "🤔", "👏", "🔁", "❤️"] as const;
export const CONFIDENCE_EMOJI = ["😟", "🙁", "😐", "🙂", "😄"] as const;
export const ANNOTATION_STARTERS = ["I like how you…", "I wonder why…", "Have you tried…"];
export const STEP_LABELS = [
  "Step 1: What do I know?",
  "Step 2: What's my plan?",
  "Step 3: Try it and check.",
];

export const COPY = {
  empty: "No thinking shared yet. Be the first to show how you'd start.",
  voiceIdle: "Explain your thinking (30 sec)",
  voiceRecording: "Talk it through. There are no wrong ideas here.",
  voiceDone: "Nice! Listen back or re-record.",
  submit: "Get a hint",
  publish: "Share my thinking",
  published: "Your thinking is live! Classmates can learn from your approach.",
  hintLimit: "You've used your hints. Try revising a step, then ask again.",
  confidence: "How sure do you feel? (It's okay not to be sure.)",
  curate: "Find diverse approaches",
  synthesis: "Start Synthesis Ritual",
  refuse: "I can't give you the answer, but I can help you get there. What do you notice about your Step 2?",
  genericHint: "Look back at your Step 2. What is the very next small thing your plan asks you to do?",
  microSent: (name: string) => `5-minute task sent to ${name}.`,
};

export type Draft = {
  step1: string;
  step2: string;
  step3: string;
  hasVoice: boolean;
  concept: string | null;
  confidence: number | null;
};

/** Submit needs Step 1, (voice OR Step 3), a concept and a confidence. */
export function canSubmit(d: Draft): boolean {
  const ok1 = d.step1.trim().length > 0;
  const ok3 = d.hasVoice || d.step3.trim().length > 0;
  return ok1 && ok3 && !!d.concept && d.confidence != null && d.confidence >= 1 && d.confidence <= 5;
}

export function clampVoiceSeconds(s: number) {
  return Math.max(0, Math.min(MAX_VOICE_SECONDS, Math.round(s)));
}

export function hintsRemaining(usedSinceRevision: number) {
  return Math.max(0, MAX_HINTS_PER_SUBMISSION - usedSinceRevision);
}

const ONES = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

export function numberToWords(n: number): string | null {
  if (!Number.isInteger(n) || n < 0 || n > 999) return null;
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  const rest = n % 100;
  return ONES[Math.floor(n / 100)] + " hundred" + (rest ? " " + numberToWords(rest) : "");
}

function norm(s: string) {
  return s.toLowerCase().replace(/[−–]/g, "-").replace(/\s+/g, " ").trim();
}

/** All the ways an answer could be leaked ("12", "12.0", "twelve", "x = 12"). */
export function answerVariants(answer: string): string[] {
  const a = norm(answer).replace(/^[a-z]\s*=\s*/, "");
  const out = new Set<string>([a]);
  const num = Number(a.replace(/,/g, ""));
  if (a !== "" && Number.isFinite(num)) {
    out.add(String(num));
    if (Number.isInteger(num)) {
      out.add(num.toFixed(1));
      out.add(num.toFixed(2));
      const w = numberToWords(Math.abs(num));
      if (w) {
        out.add(num < 0 ? "negative " + w : w);
        out.add(w.replace("-", " "));
      }
    }
  }
  return [...out].filter(Boolean);
}

/** True when text reveals the final answer in any common format. */
export function containsAnswer(text: string, answer: string): boolean {
  if (!answer.trim()) return false;
  const t = norm(text);
  return answerVariants(answer).some((v) => {
    const esc = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isNum = /^-?[\d.]+$/.test(v);
    const re = isNum
      ? new RegExp(`(^|[^\\d.])${esc}(?![\\d]|\\.\\d)`)
      : new RegExp(`(^|[^a-z])${esc}(?![a-z])`);
    return re.test(t);
  });
}

export type CoachOutput = { hints: string[]; next_step: string; praise: string };

/** Final safety pass: any hint still leaking is replaced by a generic Socratic hint. */
export function sanitizeCoach(out: CoachOutput, answer: string): { out: CoachOutput; blocked: boolean } {
  let blocked = false;
  const fix = (s: string) => {
    if (containsAnswer(s, answer)) {
      blocked = true;
      return COPY.genericHint;
    }
    return s;
  };
  const hints = out.hints.slice(0, 3).map(fix);
  while (hints.length < 2) hints.push(COPY.genericHint);
  return {
    out: { hints: hints.map(trimWords), next_step: fix(out.next_step), praise: fix(out.praise) },
    blocked,
  };
}

export function trimWords(s: string, max = 40) {
  const w = s.trim().split(/\s+/);
  return w.length <= max ? s.trim() : w.slice(0, max).join(" ") + "…";
}

export function coachLeaks(out: CoachOutput, answer: string) {
  return [...out.hints, out.next_step, out.praise].some((s) => containsAnswer(s, answer));
}

export function isAnswerBeg(text: string) {
  return /(just|please)?\s*(tell|give|show)\s+(me\s+)?(the\s+)?(answer|solution)|what('?s| is) the answer/i.test(text);
}

function shingles(s: string) {
  const w = norm(s).replace(/[^a-z0-9 ]/g, "").split(" ").filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i < w.length - 1; i++) set.add(w[i] + " " + w[i + 1]);
  if (w.length === 1) set.add(w[0]);
  return set;
}

/** Jaccard similarity of word bigrams, 0..1. */
export function similarity(a: string, b: string) {
  const A = shingles(a), B = shingles(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  return inter / (A.size + B.size - inter);
}

export function isPossibleCopy(mine: string, others: string[], secondsToSubmit: number) {
  if (secondsToSubmit < COPY_FAST_SECONDS) return true;
  return others.some((o) => similarity(mine, o) > COPY_SIMILARITY_THRESHOLD);
}

export type CuratedPick = { artifact_id: string; why: string; misconception: boolean };

/** Curation must have 4–6 cards with exactly one misconception, all known & unique. */
export function validateCuration(picks: CuratedPick[], knownIds: string[]) {
  const ids = picks.map((p) => p.artifact_id);
  return (
    picks.length >= 4 &&
    picks.length <= 6 &&
    picks.filter((p) => p.misconception).length === 1 &&
    new Set(ids).size === ids.length &&
    ids.every((id) => knownIds.includes(id))
  );
}

const BLOCKED = ["stupid","idiot","dumb","loser","shut up","hate you","ugly","kill","moron","fat","freak","sucks","trash","worthless"];
export function isAnnotationAllowed(text: string) {
  const t = norm(text);
  if (!t) return false;
  return !BLOCKED.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t));
}

export function processCompliance(subs: { step1: string; step2: string; step3: string; hasVoice: boolean }[]) {
  if (!subs.length) return 0;
  const ok = subs.filter((s) => s.step1.trim() && s.step2.trim() && s.step3.trim() && s.hasVoice).length;
  return Math.round((ok / subs.length) * 100);
}

export function teacherMinutesSaved(autoCurated: number, microTasks: number) {
  return autoCurated * 2 + microTasks * 3;
}

/** Word-level diff for the trace timeline. */
export function wordDiff(a: string, b: string): { text: string; type: "same" | "add" | "del" }[] {
  const x = a.split(/(\s+)/), y = b.split(/(\s+)/);
  const m = x.length, n = y.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { text: string; type: "same" | "add" | "del" }[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (x[i] === y[j]) { out.push({ text: x[i], type: "same" }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ text: x[i++], type: "del" });
    else out.push({ text: y[j++], type: "add" });
  }
  while (i < m) out.push({ text: x[i++], type: "del" });
  while (j < n) out.push({ text: y[j++], type: "add" });
  return out;
}
