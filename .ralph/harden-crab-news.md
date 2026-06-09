# Harden Crab News (lobsters-clone)

Fix all react-doctor findings, verify with react-scan, enforce DRY/SRP/KISS, and audit API/backend security. Dev server runs on http://localhost:3001. Type-check with `pnpm exec tsc --noEmit`, build with `pnpm exec next build`.

## RULES
- After EACH checklist item is fully done and verified (tsc + relevant check pass), make a categorized commit AND `git push`. One concern per commit.
- Re-run `npx react-doctor@latest --json > /tmp/rd.json` when needed to confirm a category is cleared.
- Keep changes minimal and faithful to lobste.rs look. No behavior regressions.

## Checklist (one per iteration)
- [x] 1. Security: pnpm hardening (require-pnpm-hardening) — DONE, pushed
- [x] 2. Security: logout GET → POST route (nextjs-no-side-effect-in-get-handler) — DONE, pushed
- [x] 3. Security: removed dangerouslySetInnerHTML, safe JSX Markdown (no-danger x3) — DONE, pushed
- [x] 4. Perf: parallelized awaits + removed N+1/await-in-loop — DONE, pushed
- [x] 5. A11y: button types, labels, controlled inputs, keyboard buttons, no autofocus — DONE, pushed
- [x] 6. SEO: per-page metadata via pageMeta helper (13 pages) — DONE, pushed
- [x] 7. Cleanup: unused exports, index maps, hoisted constants — DONE, pushed
- [x] 8. react-doctor re-run: score 39 → 82; only 1 remaining = justified false positive (u/[username] genuine data dependency, documented in code) — DONE, pushed
- [x] 9. react-scan: injected runtime scanner via CDP. Verified one upvote re-renders ONLY the clicked Voter (idle baseline=0). memoized Voter island. No actionable render issues. DONE, pushed
- [ ] 10. DRY: extract repeated patterns (byline/story-meta rendering, story-list fetch+attach, viewer vote lookups) into shared helpers/components. commit+push
- [ ] 11. SRP/KISS: ensure each module/component has one responsibility; simplify over-complex code; no dead code. commit+push
- [ ] 12. API/backend security audit: auth on every mutation, input validation/whitelisting, IDOR checks, rate-limiting consideration, no SQL injection (drizzle params), error handling that doesn't leak. Fix issues. commit+push
- [ ] 13. Final: tsc + next build clean, react-doctor + react-scan clean, all commits pushed. Summarize.

## Done when
All 51 react-doctor findings resolved (or justified), react-scan shows no actionable render issues, DRY/SRP/KISS satisfied, API security audit passes, build+typecheck green, every change committed and pushed.