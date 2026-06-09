# Harden Crab News (lobsters-clone)

Fix all react-doctor findings, verify with react-scan, enforce DRY/SRP/KISS, and audit API/backend security. Dev server runs on http://localhost:3001. Type-check with `pnpm exec tsc --noEmit`, build with `pnpm exec next build`.

## RULES
- After EACH checklist item is fully done and verified (tsc + relevant check pass), make a categorized commit AND `git push`. One concern per commit.
- Re-run `npx react-doctor@latest --json > /tmp/rd.json` when needed to confirm a category is cleared.
- Keep changes minimal and faithful to lobste.rs look. No behavior regressions.

## Checklist (one per iteration)
- [ ] 1. Security: pnpm hardening — add pnpm-workspace.yaml with minimumReleaseAge + trustPolicy (require-pnpm-hardening x2). commit+push
- [ ] 2. Security: logout GET side-effect → POST form/action; no side effects in GET handlers (nextjs-no-side-effect-in-get-handler). commit+push
- [ ] 3. Security: eliminate dangerouslySetInnerHTML — render markdown/comment bodies as safe JSX (no-danger x3 in comments/page, s/[shortId], CommentTree). commit+push
- [ ] 4. Perf: parallelize independent sequential awaits + remove await-in-loop (server-sequential-independent-await x8, async-parallel x3, async-await-in-loop x1) across page.tsx, u/[username], domains, signup, search, settings/invite, api/vote. commit+push
- [ ] 5. A11y: button type attrs, labels associated with controls, controlled inputs, keyboard handlers, remove autoFocus, fix anchor-is-valid/static-element-interactions in CommentTree/Voter/login/search/signup/settings. commit+push
- [ ] 6. SEO: add per-page metadata (generateMetadata or metadata export) for the 13 pages missing it (nextjs-missing-metadata). commit+push
- [ ] 7. Cleanup: remove unused exports (schema, SESSION_COOKIE, requireUser), fix js-index-maps in seed, hoist prefer-module-scope-static-value constant. commit+push
- [ ] 8. Re-run react-doctor; confirm score improved and P0/P1/security cleared. Fix any stragglers. commit+push
- [ ] 9. react-scan: run `npx react-scan@latest http://localhost:3001` against key routes; fix render/perf issues it surfaces (memoization, keys, unnecessary re-renders). commit+push
- [ ] 10. DRY: extract repeated patterns (byline/story-meta rendering, story-list fetch+attach, viewer vote lookups) into shared helpers/components. commit+push
- [ ] 11. SRP/KISS: ensure each module/component has one responsibility; simplify over-complex code; no dead code. commit+push
- [ ] 12. API/backend security audit: auth on every mutation, input validation/whitelisting, IDOR checks, rate-limiting consideration, no SQL injection (drizzle params), error handling that doesn't leak. Fix issues. commit+push
- [ ] 13. Final: tsc + next build clean, react-doctor + react-scan clean, all commits pushed. Summarize.

## Done when
All 51 react-doctor findings resolved (or justified), react-scan shows no actionable render issues, DRY/SRP/KISS satisfied, API security audit passes, build+typecheck green, every change committed and pushed.