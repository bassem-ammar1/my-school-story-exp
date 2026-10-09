import { describe, expect, it } from "vitest";
import {
  canSubmit, clampVoiceSeconds, containsAnswer, sanitizeCoach, coachLeaks, hintsRemaining,
  isPossibleCopy, validateCuration, isAnnotationAllowed, isAnswerBeg, teacherMinutesSaved, processCompliance,
} from "./thinking";

const base = { step1: "I know 3 boxes", step2: "", step3: "", hasVoice: false, concept: "ratio", confidence: 3 };

describe("AC1 stepwise submission", () => {
  it("needs Step 1", () => expect(canSubmit({ ...base, step1: "", step3: "x" })).toBe(false));
  it("needs voice or Step 3", () => expect(canSubmit(base)).toBe(false));
  it("allows Step 1 + voice", () => expect(canSubmit({ ...base, hasVoice: true })).toBe(true));
  it("allows Step 1 + Step 3", () => expect(canSubmit({ ...base, step3: "checked" })).toBe(true));
  it("needs a concept", () => expect(canSubmit({ ...base, step3: "x", concept: null })).toBe(false));
  it("needs a confidence", () => expect(canSubmit({ ...base, step3: "x", confidence: null })).toBe(false));
  it("voice auto-stops at 30s", () => expect(clampVoiceSeconds(42)).toBe(30));
});

describe("AC2 answer guard across 10 challenges", () => {
  const cases: [string, string][] = [
    ["12", "So the answer is 12."],
    ["12", "That gives 12.0 cookies"],
    ["12", "It's twelve!"],
    ["12", "x = 12 works"],
    ["x = 7", "you get 7"],
    ["45", "forty-five degrees"],
    ["3.5", "3.5 hours"],
    ["-4", "it equals -4"],
    ["100", "one hundred"],
    ["photosynthesis", "It's Photosynthesis."],
  ];
  it.each(cases)("detects leak of %s", (ans, text) => expect(containsAnswer(text, ans)).toBe(true));
  it("does not flag unrelated numbers", () => {
    expect(containsAnswer("Look at step 2 and 120 apples", "12")).toBe(false);
    expect(containsAnswer("you have 1.25 left", "12")).toBe(false);
  });
  it("replaces leaking hints and keeps 2-3 hints", () => {
    const { out, blocked } = sanitizeCoach({ hints: ["The answer is twelve"], next_step: "Check Step 2", praise: "Nice plan" }, "12");
    expect(blocked).toBe(true);
    expect(out.hints.length).toBeGreaterThanOrEqual(2);
    expect(coachLeaks(out, "12")).toBe(false);
  });
  it("caps hints at 3", () => {
    const { out } = sanitizeCoach({ hints: ["a", "b", "c", "d"], next_step: "n", praise: "p" }, "12");
    expect(out.hints.length).toBe(3);
  });
  it("recognizes answer begging", () => expect(isAnswerBeg("just tell me the answer")).toBe(true));
  it("limits 3 hints per submission", () => expect(hintsRemaining(3)).toBe(0));
});

describe("AC3 curation", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  const pick = (id: string, m = false) => ({ artifact_id: id, why: "x", misconception: m });
  it("accepts 4-6 with exactly one misconception", () =>
    expect(validateCuration([pick("a"), pick("b"), pick("c"), pick("d", true)], ids)).toBe(true));
  it("rejects zero misconceptions", () =>
    expect(validateCuration([pick("a"), pick("b"), pick("c"), pick("d")], ids)).toBe(false));
  it("rejects two misconceptions", () =>
    expect(validateCuration([pick("a", true), pick("b"), pick("c"), pick("d", true)], ids)).toBe(false));
  it("rejects 7 cards", () =>
    expect(validateCuration(ids.map((i, k) => pick(i, k === 0)), ids)).toBe(false));
});

describe("copy flag & filters", () => {
  it("flags >85% similar", () => expect(isPossibleCopy("I split 12 into 3 equal groups of 4", ["I split 12 into 3 equal groups of 4"], 300)).toBe(true));
  it("flags submissions within 60s", () => expect(isPossibleCopy("unique", [], 30)).toBe(true));
  it("does not flag original slow work", () => expect(isPossibleCopy("I drew a number line", ["I used a table of values"], 300)).toBe(false));
  it("blocks bullying annotations", () => expect(isAnnotationAllowed("this is stupid")).toBe(false));
  it("allows kind annotations", () => expect(isAnnotationAllowed("I like how you drew it")).toBe(true));
});

describe("analytics", () => {
  it("time saved = curated*2 + microtasks*3", () => expect(teacherMinutesSaved(5, 4)).toBe(22));
  it("process compliance", () =>
    expect(processCompliance([{ step1: "a", step2: "b", step3: "c", hasVoice: true }, { step1: "a", step2: "", step3: "c", hasVoice: true }])).toBe(50));
});

import { cognitiveProfile } from "./thinking";
describe("cognitiveProfile", () => {
  it("averages reasoning+concept for problem solving, clarity for expressing, self-correction for feedback", () => {
    const p = cognitiveProfile([{ clarity: 4, reasoning: 2, concept: 4, self_correction: 1 }, { clarity: 2, reasoning: 3, concept: 3, self_correction: 3 }]);
    expect(p).toEqual({ problem_solving: 3, expressing_ideas: 3, using_feedback: 2 });
  });
  it("returns null with no scored work", () => {
    expect(cognitiveProfile([])["problem_solving"]).toBeNull();
  });
});
