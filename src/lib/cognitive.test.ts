import { describe, expect, it } from "vitest";
import { QUESTIONS, CATEGORIES, scoreDimension, scoreCategory, parseAnswers, compatibleAttempts, reflectionContext, scoreAssessment, assessmentProgress, categoryRing, QUESTIONNAIRE_VERSION, SCORING_VERSION, type Question } from "./cognitive";
const fx = (n: number, reverse: number[] = []): Question[] => Array.from({ length: n }, (_, i) => ({ id: `q${i}`, category: "personal", dimension: "x", text: "", reverse: reverse.includes(i), format: "agreement" }));
describe("private cognitive reflection scoring", () => {
  it("has exactly 5 questions in every category", () => { for (const c of CATEGORIES) expect(QUESTIONS.filter(q => q.category === c.id)).toHaveLength(5); });
  it("starts at question 1 with 0 of 30 answered", () => expect(assessmentProgress({}, 0)).toEqual({ answered: 0, total: 30, questionNumber: 1, finalStep: false, percent: 0 }));
  it("counts only valid unique known answers, independent of navigation", () => {
    const answers = { "planning-1": 4, "planning-2": 0, "science-1": 2.5, unknown: 5 };
    expect(assessmentProgress(answers, 8)).toMatchObject({ answered: 1, questionNumber: 9 });
    expect(assessmentProgress({ ...answers, "planning-1": 5 }, 0).answered).toBe(1);
  });
  it("ends at question 30 and 100 percent for 30 valid answers", () => expect(assessmentProgress(Object.fromEntries(QUESTIONS.map(q => [q.id, 3])), 30)).toEqual({ answered: 30, total: 30, questionNumber: 30, finalStep: true, percent: 100 }));
  it("derives numeric preference results from all five answers, not the strongest alone", () => {
    const a = Object.fromEntries(QUESTIONS.filter(q => q.category === "learning").map((q, i) => [q.id, i + 1]));
    expect(categoryRing("learning", a)).toMatchObject({ label: "3/5", fill: 50 });
  });
  it("derives numeric skill results from answers including reverse items", () => expect(categoryRing("personal", { "planning-1": 5, "planning-2": 4, "adaptability-1": 3, "adaptability-2": 2, "creativity-1": 4 })).toMatchObject({ label: "75%", fill: 75 }));
  it("keeps missing answers distinct from a zero skill score", () => {
    expect(categoryRing("personal", {})).toMatchObject({ label: "0/5", fill: 0 });
    expect(categoryRing("personal", { "planning-1": 5 })).toMatchObject({ label: "1/5", fill: 0 });
    expect(categoryRing("personal", { "planning-1": 1, "planning-2": 1, "adaptability-1": 1, "adaptability-2": 5, "creativity-1": 1 }).label).toBe("0%");
  });
  it("reverses 2 to 4 and yields 4.33 and 83.3 for the worked example", () => { const r = scoreDimension(fx(3, [2]), { q0: 4, q1: 5, q2: 2 }, true); expect(r.average).toBeCloseTo(4.33333); expect(r.responseScore).toBeCloseTo(83.33333); });
  it("needs 4 of 5 answers for a habit category %", () => { expect(scoreCategory("personal", { "planning-1": 5, "planning-2": 5, "creativity-1": 5 }).responseScore).toBeNull(); expect(scoreCategory("personal", { "planning-1": 5, "planning-2": 5, "creativity-1": 5, "adaptability-1": 1 }).responseScore).toBe(75); });
  it("applies reverse scoring in categories", () => expect(scoreCategory("personal", { "planning-1": 5, "planning-2": 5, "creativity-1": 5, "adaptability-2": 1 }).average).toBe(5));
  it("never gives a % to interests or preferences", () => { expect(scoreCategory("interests", Object.fromEntries(QUESTIONS.filter(q => q.category === "interests").map(q => [q.id, 5]))).responseScore).toBeNull(); expect(scoreAssessment({ "planning-1": 5 }).every(d => d.responseScore === null)).toBe(true); });
  it("maps extremes to 0 and 100", () => { expect(scoreDimension(fx(3), { q0: 1, q1: 1, q2: 1 }, true).responseScore).toBe(0); expect(scoreDimension(fx(3), { q0: 5, q1: 5, q2: 5 }, true).responseScore).toBe(100); });
  it("rejects unknown, fractional and out-of-range answers", () => { for (const a of [{ unknown: 3 }, { "science-1": 0 }, { "science-1": 6 }, { "science-1": 2.5 }]) expect(() => parseAnswers(a)).toThrow(); });
  it("compares only matching versions", () => { const v = { questionnaire_version: QUESTIONNAIRE_VERSION, scoring_version: SCORING_VERSION }; expect(compatibleAttempts(v, v)).toBe(true); expect(compatibleAttempts(v, { ...v, scoring_version: "habits-v1" })).toBe(false); });
  it("sends coverage but not raw answers to the coach", () => { const c = reflectionContext({ ...{ questionnaire_version: QUESTIONNAIRE_VERSION, scoring_version: SCORING_VERSION }, responses: { "science-1": 5 }, goal: "g", submitted_at: null }); expect(c).not.toHaveProperty("responses"); expect(c?.dimensions.find(d => d.dimension === "science")).toMatchObject({ average: 5, answered: 1 }); });
});
