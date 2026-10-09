# Cognitive assessment: framework and scoring plan

## What will change
Replace the current Cognitive assessment tab's teacher-rubric summary with a student self-reflection questionnaire and personal results. Keep Teacher assessment separate and unchanged. Any teacher-scored evidence will be explicitly labeled and never mixed into self-report scores.

This is a reflection tool, not a clinical cognitive test, intelligence test or validated personality instrument. The supplied questions are a starting bank, not a validated assessment.

## 1. Assessment framework

| Category | Subdimensions | How results are presented |
|---|---|---|
| Personal skills | Planning and follow-through; adaptability; creative problem-solving | Self-reported habits, possible strengths and areas to practice |
| Social skills | Collaboration and inclusion; empathy; conflict resolution | Self-reported social habits |
| Communication | Expressing ideas; listening; giving and using feedback | Self-reported communication habits |
| Learning preferences | Independent work; collaborative discussion; practical learning; exploration; structure | Separate preference indicators, not better/worse scores |
| Academic interests | Science; technology; arts; business; society and history | Current interest levels, not aptitude or career predictions |
| Personality preferences | Group energy; reflection before speaking; evidence-based decisions; consideration of feelings; planning comfort | Descriptive tendencies, never MBTI types or fixed labels |

**Why:** distinguish habits, preferences and interests. A student can enjoy both independent and collaborative learning, or use both evidence and empathy. These are not opposite ends of one personality scale. Planning in Personal skills describes actions; planning comfort in Personality describes preference.

## 2. Question mapping and initial bank

Use the 30 questions in your second upload as the seed bank, with small wording changes only where needed for clarity and age suitability.

Every question has a stable ID, category, primary dimension, response format, reverse-scoring flag and questionnaire version. Start with one scored dimension per question to avoid double-counting; secondary descriptive tags do not affect scores.

Examples from your bank:

| Statement | Dimension | Format | Reverse? |
|---|---|---|---|
| I plan my tasks before starting them. | Planning and follow-through | Five-point agreement | No |
| I try different solutions when facing difficulties. | Creative problem-solving | Five-point agreement | No |
| I try to understand how others feel. | Empathy | Five-point agreement | No |
| I learn from feedback provided by others. | Giving and using feedback | Five-point agreement | No |
| I enjoy solving problems independently. | Independent work | Five-point agreement | No |
| How interested are you in science? | Science interest | Not at all / Slightly / Moderately / Very / Extremely interested | No |

Before enabling multi-item habit scores, add enough carefully reviewed questions to reach at least three items per scored dimension. Some supplied dimensions currently have only one question. Until then, show individual responses, not confident dimension scores. Add simple reverse-worded items selectively, without double negatives; review comprehension before use. A reverse-worded question is not a reliability or honesty test.

**Why:** a single response can describe a preference but provides weak evidence of a broader skill or habit. Avoid producing a large bank before approving the framework.

## 3. Scoring architecture

- Agreement values: Strongly disagree = 1, Disagree = 2, Neutral = 3, Agree = 4, Strongly agree = 5.
- Interest values use the equivalent 1–5 interest labels, with their own meaning.
- Reverse scoring for negatively keyed habit items: `adjusted = 6 - answer`.
- Per-dimension average: sum adjusted answered items / number of answered items. Missing answers are missing, never zero or Neutral.
- A scored habit dimension needs at least three available items, at least two answered, and at least two-thirds answered, rounded up. Otherwise show “Not enough responses yet.”
- For habit dimensions only, optionally show `(average - 1) / 4 × 100`, labeled **Self-reported response score**, alongside the original five-point average. Never call it percent ability or percentile.
- No overall cognitive, personality or student ranking score. If a habit category summary is shown, average its eligible dimension averages equally, not all questions pooled; require all its dimensions to be eligible. This prevents larger question sets from dominating.
- Preferences and interests remain labeled response profiles rather than percentage skill scores. A single item is marked as a single-response indicator.
- Drafts can be resumed; questions can be skipped. Completed attempts retain their coverage and missing-response markers. Partial results can be viewed without pretending all dimensions have enough evidence.

### Worked examples

For a dimension with answers `4, 2, 5`, where the second item is reversed: adjusted values are `4, 4, 5`; average is `4.33`; response score is `83.3/100`. This means stronger agreement with the habit statements, **not 83.3% ability**.

For three available items with only one answered, do not show a dimension score. With two answered, show a provisional score with “2 of 3 answered.”

For two eligible dimensions averaging `4` and `3`, their category average is `3.5` even if they have different numbers of questions.

**Limitations:** five-point averages assume approximately equal spacing between answer options. Mood, context, reading comprehension and self-perception can change responses. This bank has no population norms, diagnostic thresholds or established validity. Do not compare students or infer objective competence.

## 4. Student experience and results

Keep the existing vertical app layout. The Cognitive assessment tab will offer a short privacy notice, six category sections, accessible five-choice answers, progress, skipping and saved drafts.

Results will show:
- Current self-reported habits, preferences and interests with answer coverage.
- “You often report…” strengths and “You could try…” development suggestions, not labels or judgments.
- Relevant activities and a student-selected reflection goal.
- Separate teacher-assessed evidence where available, with its original rubric scale and source.
- Retake history with dates and side-by-side comparable dimensions; describe response changes, not proven improvement or decline.

Allow student-initiated retakes, optionally suggesting a termly check-in. No forced retake interval. Keep every submitted attempt immutable and its question/scoring version attached; compare only compatible versions and sufficiently answered dimensions.

## 5. Coach integration and privacy

Provide a structured context containing: questionnaire/scoring version, attempt date, evidence source `self_report`, coverage, eligible dimension averages, descriptive preferences/interests, uncertainty notes and the student's chosen goal. Keep teacher evidence in a separate field with its own source and scale.

The coach uses this context only for reflection and suggested activities. It must not diagnose, assign permanent personality types, rank students, make placement decisions or infer ability from interests. Use the existing guarded coach service; do not send names, school identities or unnecessary raw answers.

Results belong to the student's account, not a school, so transfers do not reset the portfolio. Drafts, answers and history are private to the student by default. A teacher role or school sign-in alone does not grant access. School sharing requires an explicit, revocable permission for the current school and must respect applicable guardian requirements.

Before enabling school sharing or minors' production assessment collection, confirm the intended age range, jurisdiction and guardian-consent process. Do not substitute a child's checkbox for required guardian consent. Build the private assessment first; keep school sharing disabled until that policy is confirmed. Support deletion of personal assessment records and withdrawal of sharing permissions.

## Technical implementation

1. Add versioned question definitions, mapping and pure scoring functions with focused tests. Preserve the Thinking Lab rule module and teacher scoring independently.
2. Store account-owned attempts, versioned responses, draft status and submitted results in Lovable Cloud with owner-only access policies; prohibit users from modifying submitted attempts. Derive scores through the shared rules rather than trusting client-provided totals.
3. Replace the Cognitive assessment tab with the questionnaire, results and history views. Read saved data through the project's existing route/query conventions.
4. Feed minimal structured context into the existing server-only coach path, with ownership checks and the safeguards above.
5. Test concrete scoring values, reverse scoring, missing answers, coverage thresholds, equal dimension weighting and version comparability. Verify saving, resuming, submitting, reading results and retaking while signed in; test denied cross-account access.

## Delivery sequence
Approve this framework first. Then refine the supplied bank, implement private questionnaires and results, add history and guarded coach context, and verify the full student flow. School sharing remains blocked until consent and access requirements are confirmed.