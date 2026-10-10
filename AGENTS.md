<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Pre-optimize Recharts, every installed Radix package and discovered TanStack runtime dependencies with React in Vite because route-split controls otherwise trigger late dependency optimization and invalidate the active React graph during navigation.

- Birth dates live in owner-only student_safety, not publicly readable profiles; age is derived and consent fields cannot be self-edited.
- School owners are scoped through schools and school_enrollments, never a global school_admin grant; test schools have no assessment or post-management access.
- Guardian emails create pending connections only; verified email acceptance and separate student/guardian approvals never substitute for a jurisdiction-specific consent policy.
- Assessment question illustrations are presentation-only dimension emojis, leaving versioned questions and scoring unchanged.
- Reflection history plots every compatible submitted attempt; combined portfolio curves retain per-point illustrative provenance in tooltips and shared images/captions, preventing fabricated grades from becoming student evidence.
- Reflection feed sharing publishes only a previewed image and category summary through the existing posts table; raw answers, goals, identity details and coach consent never enter the share payload.

- Signup choices are non-authoritative preferences in account_preferences; only school-admin review assigns privileged roles in user_roles, so signup metadata cannot elevate access.
- Profile covers and post images use durable media URLs on their existing rows and render through the shared profile/post views, keeping media consistent across feed and member pages.

- Account themes are allowlisted profile preferences applied through semantic CSS tokens by SchoolTheme; example portfolio achievements stay separate from verified teacher awards to preserve trust.
- ThemePicker groups school and kids choices; global theme tokens control wallpaper and shared app-button shapes without changing route layouts.
- Education entries are owner-managed with explicit member-profile sharing; chronology groups consecutive years at one school and labels planned moves separately from completed history.

- Thinking Lab rules (limits, answer-leak guard, curation validity, copy detection) live as pure functions in `src/lib/thinking.ts` with tests in `src/lib/thinking.test.ts` — one source of truth for client and server.
- All AI calls go through `src/lib/ai.server.ts` (Lovable AI, streamed structured output) and are invoked only from server functions in `src/lib/thinking.functions.ts` — keeps prompts, keys and the private final answer server-side.
- A challenge's final answer is stored in a separate teacher-only table (`challenge_answers`) and never selected by client code — so it can't leak through student queries.
- Teacher-only privileges = `teacher` role AND a school identity (Google/Microsoft/SAML) via `is_sso_teacher()`; enforced in database policies, route guards are only UX.
- The synthesis misconception pick is stored as a teacher-only `flags` row until reveal — session rows are readable by students.
- Writes students must not forge (AI interactions, AI flags) are done with the admin client inside server functions after verifying ownership.
- Demo mode uses static data in `src/lib/demo-data.ts` with no database writes except analytics — so it needs no login and resets each visit.
- Cognitive question mapping and scoring live in a versioned pure `src/lib/cognitive.ts` module with adjacent tests — client and server must derive identical self-report results, separate from teacher evidence.
- Cognitive attempts are account-owned and owner-only in database policies; a trigger freezes submitted responses while permitting coach-consent revocation and owner deletion — school roles never imply access.
- Cognitive persistence uses authenticated server functions in `src/lib/cognitive.functions.ts`; optional minimal context reaches the existing coach through `thinking.functions.ts` only — raw responses and identities are excluded from prompts.
- Feed posts, likes, comments/replies live in `posts`/`post_likes`/`post_comments` via `src/lib/posts.ts`; reports in `reports` are moderated only by school admins — database policies enforce who can write what.
- The bottom-nav Assessment tab (/lab) is only the private cognitive assessment; class joining and teacher challenges live on the Thinking Lab page (/challenges) — keeps self-reflection separate from teacher work.
- The shared header derives its actions from reactive router state using `header-actions.ts`; sign-out cancels queries and clears cached private data before auth teardown and a history-replacing redirect — prevents stale actions and protected-state restoration.
- Endorsements on `artifacts` are trigger-guarded to the class teacher; published thinking also posts to `posts.challenge_id`, and non-members see it only via view-only `challenge_preview` RPC — membership stays the solve boundary.
