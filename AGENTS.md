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

- Thinking Lab rules (limits, answer-leak guard, curation validity, copy detection) live as pure functions in `src/lib/thinking.ts` with tests in `src/lib/thinking.test.ts` — one source of truth for client and server.
- All AI calls go through `src/lib/ai.server.ts` (Lovable AI, streamed structured output) and are invoked only from server functions in `src/lib/thinking.functions.ts` — keeps prompts, keys and the private final answer server-side.
- A challenge's final answer is stored in a separate teacher-only table (`challenge_answers`) and never selected by client code — so it can't leak through student queries.
- Teacher-only privileges = `teacher` role AND a school identity (Google/Microsoft/SAML) via `is_sso_teacher()`; enforced in database policies, route guards are only UX.
- The synthesis misconception pick is stored as a teacher-only `flags` row until reveal — session rows are readable by students.
- Writes students must not forge (AI interactions, AI flags) are done with the admin client inside server functions after verifying ownership.
- Demo mode uses static data in `src/lib/demo-data.ts` with no database writes except analytics — so it needs no login and resets each visit.
