import type { ArtifactView, ChallengeView } from "@/components/thinking/types";

export const demoChallenges: ChallengeView[] = [
  { id: "c1", title: "Sharing cookies", prompt_text: "Maya baked 36 cookies. She wants to pack them equally into 3 boxes, then give away 1 box. How many cookies does she keep?", concept_tokens: ["division", "equal groups", "subtraction"] },
  { id: "c2", title: "Rectangle garden", prompt_text: "A garden is 8 m long and 5 m wide. A path 1 m wide goes all the way around the outside. What is the area of the path?", concept_tokens: ["area", "perimeter", "decomposition"] },
];

const mk = (id: string, name: string, concept: string, confidence: number, steps: [string, string, string], transcript: string, reactions: Record<string, number>, annotationCount: number, min: number): ArtifactView => ({
  id, submissionId: "s" + id, challengeId: "c1", studentId: "u" + id, name, avatar: null, concept, confidence, steps, images: [], voiceUrl: null, transcript, reactions, mine: [], annotationCount,
  publishedAt: new Date(Date.now() - min * 60000).toISOString(),
});

export const demoArtifacts: ArtifactView[] = [
  mk("a1", "Lina", "division", 4, ["36 cookies, 3 boxes, give 1 away.", "Divide 36 by 3 to get one box, then count 2 boxes.", "36 ÷ 3 = one box. Two boxes = double it. Checked by adding 3 boxes back to 36."], "I split it first and then just kept two of the groups.", { "💡": 4, "👏": 2 }, 3, 5),
  mk("a2", "Omar", "equal groups", 3, ["There are 3 boxes with the same number.", "Draw 3 boxes and deal cookies one at a time.", "I dealt them out in rounds of 3 until none were left, then crossed out one box."], "I drew it like dealing cards.", { "🤔": 1, "❤️": 3 }, 2, 12),
  mk("a3", "Sara", "subtraction", 2, ["36 total and she gives away some.", "Subtract 3 from 36 because there are 3 boxes.", "36 − 3 = 33, so she keeps 33."], "I took away the boxes.", { "🤔": 5 }, 6, 20),
  mk("a4", "Yusuf", "division", 5, ["Total 36, 3 equal boxes.", "Find the fraction she keeps: 2 out of 3 boxes.", "Two-thirds of 36. I checked with a bar model."], "Two out of three boxes is two thirds.", { "💡": 6, "👏": 4 }, 4, 25),
  mk("a5", "Nour", "equal groups", 3, ["She has 36.", "Skip count by 3s to see how many rounds.", "Counted 3, 6, 9… up to 36 and got the rounds."], "Skip counting helped me.", { "👏": 1 }, 1, 30),
  mk("a6", "Adam", "subtraction", 4, ["36 cookies, 3 boxes.", "Find one box, then take it away from 36.", "36 minus one box. Checked that it's the same as two boxes."], "I subtracted one box from everything.", { "🔁": 2 }, 2, 35),
  mk("a7", "Hana", "division", 3, ["3 boxes, 36 cookies.", "Use a table: boxes vs cookies.", "Filled the table 1 box, 2 boxes, 3 boxes."], "The table showed the pattern.", { "💡": 2 }, 0, 40),
  mk("a8", "Karim", "equal groups", 2, ["I know 36 and 3.", "Guess and check numbers that make 3 equal piles.", "Tried 10, too small. Tried 14, too big. Adjusted."], "I kept guessing until it fit.", { "❤️": 1 }, 1, 45),
];

export const demoCuration = [
  { id: "a1", why: "Divide first, then combine groups.", misconception: false },
  { id: "a4", why: "Uses fractions of the whole.", misconception: false },
  { id: "a6", why: "Subtracts one group from the total.", misconception: false },
  { id: "a8", why: "Guess and check — a different strategy.", misconception: false },
  { id: "a3", why: "Subtracts the number of boxes, not cookies in a box.", misconception: true },
];

export const demoPrompts = [
  "Compare how Artifact A and C started. Which plan is more efficient, and why?",
  "Artifact B used fractions. How is that the same as dividing first?",
  "What would you tell the student in the tricky artifact?",
];

export const demoSession = {
  participation: "22/24", notes: 31, transferDone: "21/24",
  misconceptions: ["Subtracting the number of boxes instead of the cookies in one box"],
  missing: ["Karim", "Hana", "Sara"],
};

export const demoHints = {
  hints: [
    "Look at your Step 2. What does one box hold before anything is given away?",
    "If you know one box, how could you find the boxes Maya keeps?",
    "How could you check your answer using all 3 boxes?",
  ],
  next_step: "Write the number of cookies in one box, then decide how many boxes Maya keeps.",
  praise: "You clearly listed the facts you know in Step 1.",
};
