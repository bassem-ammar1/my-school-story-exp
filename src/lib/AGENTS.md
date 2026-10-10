# src/lib rules

- Thinking Lab rules (limits, answer-leak guard, curation validity, copy detection) live as pure functions in `src/lib/thinking.ts` with tests in `src/lib/thinking.test.ts` — one source of truth for client and server.
- Cognitive question mapping and scoring live in a versioned pure `src/lib/cognitive.ts` module with adjacent tests — client and server must derive identical self-report results, separate from teacher evidence.
