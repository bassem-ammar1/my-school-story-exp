import { describe, expect, it } from "vitest";
import { QUESTIONS, scoreDimension, scoreAssessment, equalCategoryAverage, parseAnswers, compatibleAttempts, reflectionContext, QUESTIONNAIRE_VERSION, SCORING_VERSION } from "./cognitive";
const qs = QUESTIONS.filter(q => q.dimension === "adaptability");
describe("private cognitive reflection scoring", () => {
  it("reverses 2 to 4 and yields 4.33 and 83.3 for the worked example", () => {
    const result = scoreDimension(qs, { "adaptability-1": 4, "adaptability-2": 5, "adaptability-3": 2 }, true);
    expect(result.average).toBeCloseTo(4.33333); expect(result.responseScore).toBeCloseTo(83.33333);
  });
  it("does not score one of three responses", () => expect(scoreDimension(qs, { "adaptability-1": 5 }, true).average).toBeNull());
  it("scores two of three without treating missing as neutral", () => expect(scoreDimension(qs, { "adaptability-1": 5, "adaptability-2": 3 }, true).average).toBe(4));
  it("requires at least three available habit questions", () => expect(scoreDimension(qs.slice(0, 2), { "adaptability-1": 5, "adaptability-2": 3 }, true).average).toBeNull());
  it("rounds two-thirds coverage up", () => expect(scoreDimension([...qs, { ...qs[0], id: "extra" }].filter((q): q is typeof qs[number] => Boolean(q.id)), { "adaptability-1": 5, "adaptability-2": 3 }, true).average).toBeNull());
  it("weights dimensions equally", () => expect(equalCategoryAverage([4, 3])).toBe(3.5));
  it("requires every category dimension to have evidence", () => expect(equalCategoryAverage([4, null, 3])).toBeNull());
  it("never normalizes interests or preferences", () => expect(scoreAssessment({ "science-1": 5 }).find(d => d.id === "science")?.responseScore).toBeNull());
  it("maps five-point extremes to zero and 100 only for habits", () => { expect(scoreDimension(qs.map(q => ({ ...q, reverse: false })), Object.fromEntries(qs.map(q => [q.id, 1])), true).responseScore).toBe(0); expect(scoreDimension(qs.map(q => ({ ...q, reverse: false })), Object.fromEntries(qs.map(q => [q.id, 5])), true).responseScore).toBe(100); });
  it("rejects unknown, fractional and out-of-range answers", () => { for (const answers of [{ unknown: 3 }, { "science-1": 0 }, { "science-1": 6 }, { "science-1": 2.5 }]) expect(() => parseAnswers(answers)).toThrow(); });
  it("compares only matching supported questionnaire and scoring versions", () => { const version = { questionnaire_version: QUESTIONNAIRE_VERSION, scoring_version: SCORING_VERSION }; expect(compatibleAttempts(version, version)).toBe(true); expect(compatibleAttempts(version, { ...version, scoring_version: "other" })).toBe(false); });
  it("sends structured coverage but not raw answers or identity to the coach", () => { const context = reflectionContext({ questionnaire_version: QUESTIONNAIRE_VERSION, scoring_version: SCORING_VERSION, responses: { "science-1": 5 }, goal: "Try a science activity", submitted_at: "2026-10-09" }); expect(context?.source).toBe("self_report"); expect(context).not.toHaveProperty("responses"); expect(context?.dimensions.find(d => d.dimension === "science")).toMatchObject({ average: 5, answered: 1, available: 1 }); });
});