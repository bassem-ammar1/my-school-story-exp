// Versioned, client-safe reflection definitions. No clinical or ability scores.
export const QUESTIONNAIRE_VERSION = "self-reflection-v2";
export const SCORING_VERSION = "habits-v2";
export type Answers = Record<string, number>;
export type Question = { id: string; category: string; dimension: string; text: string; reverse: boolean; format: "agreement" | "interest" };
export const AGREEMENT = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
export const INTEREST = ["Not at all interested", "Slightly interested", "Moderately interested", "Very interested", "Extremely interested"];
export const CATEGORIES = [
  { id: "personal", label: "Personal skills", kind: "habit", note: "Think about your habits recently, not how you wish you would act." },
  { id: "social", label: "Social skills", kind: "habit", note: "Think about recent moments with your classmates." },
  { id: "communication", label: "Communication", kind: "habit", note: "Think about how you share ideas and listen." },
  { id: "learning", label: "Learning preferences", kind: "preference", note: "You can enjoy several ways of learning. None is better than another." },
  { id: "interests", label: "Academic interests", kind: "interest", note: "Your interests today can change. They do not predict your ability or career." },
  { id: "personality", label: "Personality preferences", kind: "preference", note: "These are current tendencies, not fixed personality types." },
] as const;
export const DIMENSIONS = [
  { id: "planning", category: "personal", label: "Planning and follow-through", activity: "Choose one task and write its next two steps. Check them off as you go." },
  { id: "adaptability", category: "personal", label: "Adaptability", activity: "Try a different approach to a familiar task. Reflect on what changed." },
  { id: "creativity", category: "personal", label: "Creative problem-solving", activity: "Sketch two different ways to tackle one problem before choosing an approach." },
  { id: "collaboration", category: "social", label: "Collaboration and inclusion", activity: "Invite a classmate to share an idea and find a part you can work on together." },
  { id: "empathy", category: "social", label: "Empathy", activity: "Ask someone how they felt about an event and listen without guessing their answer." },
  { id: "conflict", category: "social", label: "Conflict resolution", activity: "Practice describing a disagreement calmly and suggesting a next step that helps both people." },
  { id: "expression", category: "communication", label: "Expressing ideas", activity: "Explain an idea in two sentences and ask a listener what they understood." },
  { id: "listening", category: "communication", label: "Listening", activity: "Let a partner finish, then repeat their main idea in your own words." },
  { id: "feedback", category: "communication", label: "Giving and using feedback", activity: "Ask for one specific suggestion on your work and try it before deciding what helped." },
  { id: "independent", category: "learning", label: "Independent work", activity: "Try a short task on your own, then compare ideas with a partner." },
  { id: "discussion", category: "learning", label: "Collaborative discussion", activity: "Talk through a new idea with a classmate, then write your own summary." },
  { id: "practical", category: "learning", label: "Practical learning", activity: "Build or draw an example of something you are learning." },
  { id: "exploration", category: "learning", label: "Exploration", activity: "Write one new question about a topic that interests you." },
  { id: "structure", category: "learning", label: "Structured steps", activity: "Try turning a task into a short checklist." },
  { id: "science", category: "interests", label: "Science", activity: "Choose a question about nature and plan a safe way to investigate it." },
  { id: "technology", category: "interests", label: "Technology", activity: "Sketch a tool that could solve a small everyday problem." },
  { id: "arts", category: "interests", label: "Arts and creativity", activity: "Tell a short story through a drawing, music or writing." },
  { id: "business", category: "interests", label: "Business and entrepreneurship", activity: "Think of a helpful service and describe who it could help." },
  { id: "society", category: "interests", label: "History and society", activity: "Explore how one local place has changed over time." },
  { id: "energy", category: "personality", label: "Group energy", activity: "Notice how you feel after group time and quiet time on two different days." },
  { id: "reflection", category: "personality", label: "Reflection before speaking", activity: "Try jotting down a thought before sharing it." },
  { id: "evidence", category: "personality", label: "Evidence-based decisions", activity: "List what you know and what you still need to find out before making a choice." },
  { id: "feelings", category: "personality", label: "Considering feelings", activity: "Consider who might be affected by a choice and ask for their perspective." },
  { id: "comfort", category: "personality", label: "Planning comfort", activity: "Notice when a plan helps you feel comfortable and when flexibility helps." },
];
function items(category: string, dimension: string, texts: (string | [string, boolean])[]): Question[] {
  return texts.map((item, i) => ({ id: `${dimension}-${i + 1}`, category, dimension, text: typeof item === "string" ? item : item[0], reverse: typeof item === "string" ? false : item[1], format: category === "interests" ? "interest" : "agreement" }));
}
export const QUESTIONS: Question[] = [
  ...items("personal", "planning", ["I plan my tasks before starting them.", "I complete my responsibilities on time."]),
  ...items("personal", "adaptability", ["I adapt easily when plans change.", ["I find it hard to adjust when a plan changes.", true]]),
  ...items("personal", "creativity", ["I enjoy finding creative solutions to problems."]),
  ...items("social", "collaboration", ["I enjoy working with other students.", "I include classmates who feel left out."]),
  ...items("social", "empathy", ["I try to understand how others feel."]),
  ...items("social", "conflict", ["I try to resolve disagreements peacefully.", "I try to find a solution that works for everyone."]),
  ...items("communication", "expression", ["I can express my ideas clearly.", "I feel comfortable sharing my opinions."]),
  ...items("communication", "listening", ["I listen carefully when others speak.", ["I interrupt when others are talking.", true]]),
  ...items("communication", "feedback", ["I learn from feedback provided by others."]),
  ...items("learning", "independent", ["I enjoy solving problems independently."]),
  ...items("learning", "discussion", ["I learn well by discussing ideas with others."]),
  ...items("learning", "practical", ["I enjoy learning through practical activities."]),
  ...items("learning", "exploration", ["I enjoy exploring new ideas and possibilities."]),
  ...items("learning", "structure", ["I prefer clear instructions and structured steps."]),
  ...items("interests", "science", ["How interested are you in science?"]),
  ...items("interests", "technology", ["How interested are you in technology and computers?"]),
  ...items("interests", "arts", ["How interested are you in arts and creative activities?"]),
  ...items("interests", "business", ["How interested are you in business and entrepreneurship?"]),
  ...items("interests", "society", ["How interested are you in history, society, and human behavior?"]),
  ...items("personality", "energy", ["I feel energized after spending time with a group of people."]),
  ...items("personality", "reflection", ["I think carefully before sharing my ideas."]),
  ...items("personality", "evidence", ["I tend to make decisions based on logic and evidence."]),
  ...items("personality", "feelings", ["I consider other people's feelings when making decisions."]),
  ...items("personality", "comfort", ["I feel more comfortable when I have a clear plan."]),
];
export function validAnswer(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5; }
export function parseAnswers(value: unknown): Answers {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid answers");
  const result: Answers = {};
  for (const [id, answer] of Object.entries(value)) {
    if (!QUESTIONS.some(q => q.id === id) || !validAnswer(answer)) throw new Error("Choose a whole-number answer from 1 to 5 for a known question.");
    result[id] = answer;
  }
  return result;
}
export function scoreDimension(questions: Question[], answers: Answers, habit: boolean) {
  const values = questions.flatMap(q => validAnswer(answers[q.id]) ? [q.reverse ? 6 - Number(answers[q.id]) : Number(answers[q.id])] : []);
  const eligible = habit ? questions.length >= 3 && values.length >= 2 && values.length >= Math.ceil(questions.length * 2 / 3) : values.length > 0;
  const average = eligible ? values.reduce((a, b) => a + b, 0) / values.length : null;
  return { answered: values.length, available: questions.length, average, responseScore: habit && average !== null ? (average - 1) / 4 * 100 : null };
}
export function equalCategoryAverage(values: (number | null)[]) { return values.length && values.every(v => v !== null) ? values.reduce<number>((sum, v) => sum + (v ?? 0), 0) / values.length : null; }
export function scoreAssessment(answers: Answers) {
  return DIMENSIONS.map(d => ({ ...d, kind: CATEGORIES.find(c => c.id === d.category)?.kind ?? "habit", ...scoreDimension(QUESTIONS.filter(q => q.dimension === d.id), answers, false) }));
}
// Habit percentages are scored per category (5 questions, needs 4 answers); sub-skills show answers only.
export function scoreCategory(categoryId: string, answers: Answers) {
  const kind = CATEGORIES.find(c => c.id === categoryId)?.kind;
  return scoreDimension(QUESTIONS.filter(q => q.category === categoryId), answers, kind === "habit");
}
export function knownAnswers(value: unknown): Answers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id, v]) => QUESTIONS.some(q => q.id === id) && validAnswer(v))) as Answers;
}
export function assessmentProgress(value: unknown, index: number) {
  const answered = Object.keys(knownAnswers(value)).length;
  const total = QUESTIONS.length;
  const position = Math.max(0, Math.min(Math.trunc(index), total));
  return { answered, total, questionNumber: Math.min(position + 1, total), finalStep: position === total, percent: answered / total * 100 };
}
// Missing evidence is a numeric answer count, never a fabricated zero score.
export function categoryRing(categoryId: string, value: unknown) {
  const score = scoreCategory(categoryId, knownAnswers(value));
  if (score.average === null) return { label: `${score.answered}/${score.available}`, fill: 0 };
  return { label: `${Number(score.average.toFixed(1))}/5`, fill: (score.average - 1) / 4 * 100 };
}
export function compatibleAttempts(a: { questionnaire_version: string; scoring_version: string }, b: { questionnaire_version: string; scoring_version: string }) { return a.questionnaire_version === b.questionnaire_version && a.scoring_version === b.scoring_version && a.questionnaire_version === QUESTIONNAIRE_VERSION && a.scoring_version === SCORING_VERSION; }
export function reflectionContext(attempt: { questionnaire_version: string; scoring_version: string; responses: unknown; goal: string; submitted_at: string | null }) {
  if (attempt.questionnaire_version !== QUESTIONNAIRE_VERSION || attempt.scoring_version !== SCORING_VERSION) return null;
  return { source: "self_report", questionnaireVersion: attempt.questionnaire_version, scoringVersion: attempt.scoring_version, date: attempt.submitted_at, goal: attempt.goal, categories: CATEGORIES.map(c => ({ category: c.id, kind: c.kind, ...scoreCategory(c.id, parseAnswers(attempt.responses)) })).map(({ responseScore: _r, ...c }) => c), dimensions: scoreAssessment(parseAnswers(attempt.responses)).map(d => ({ dimension: d.id, kind: d.kind, average: d.average, answered: d.answered, available: d.available })), uncertainty: "Unvalidated self-report; mood and context affect answers. Not evidence of ability, diagnosis or fixed traits. Never rank or make placement decisions." };
}