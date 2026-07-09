# Task Review: research-chart-evidence-handoff

> **Status**: Reviewed
> **Plan**: plans/plan-20260709-1743-research-chart-evidence-handoff.md
> **Contract**: tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md
> **Notes File**: tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-09 18:12
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:292568aa887a4997b0eb87272ba18f55639d7ecca83b5c3ae8fcf1634604ee39
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS (one P3 scope caveat, non-blocking, orchestrator decides at commit)
- Change type: code-change
- Intended files changed (9-file plan table): types.ts, evidence.ts (new), evidence.test.ts (new), executor.ts, executor.test.ts, index.ts, tool.ts+tool.test.ts (conditional), contract.json, check script
- Actual files changed (8 tracked + 4 untracked): contract.json, executor.test.ts, executor.ts, index.ts, tool.test.ts, types.ts, check-answer-evidence-contract.mjs, tasks/todos.md; untracked evidence.ts, evidence.test.ts, plan, contract, notes, this review. tool.ts NOT edited (pass-through confirmed by test-first, per notes).
- Commands passed: `npx vitest run packages/agent-runtime/src/parse-chart-image` (45/45), `npm run check:answer-evidence-contract` (ok), `npm run typecheck` (33 workspaces clean)
- External acceptance: unavailable (no external reviewer invoked this pass)
- Residual risks: `record.status === "degraded"` warning branch is unreachable via the current executor (executor only emits `ready`/`parse_failed`); it is a declared member of `ChartParseStatus` handled exhaustively by the pure function and named by plan decision 4, tested directly. Informational, not a defect.
- Reviewer action required: orchestrator resolves the `tasks/todos.md` allowed_paths gap (P3) before commit.
- Rollback: pure additive outcome fields + one new module; revert branch or drop worktree. No data/migration surface.

## Mode Evidence

- Selected route: acceptance review (gatekeeper), review-only, zero side effects.
- P1/P2/P3 evidence: P1 — one module (`packages/agent-runtime/src/parse-chart-image`) plus two answer-evidence contract files; no external consumer of `ParseChartImageOutcome` outside the module (grep confirmed). P2 — executor assembles `record` then calls `deriveChartEvidenceHandoff({record, routing: routeDecision, repair_applied, retrieved_at: completedAt})`; `routeDecision` is `null` exactly when `attempts.result === null`, so unavailable and the fail-closed gate coincide on the real path. P3 — additive fields keep the existing outcome contract intact; strength/label mapping isolated in one exported const so compliance changes stay one-place.
- Root cause or plan evidence: not a bugfix; executed against plan Captured Planning Output decisions 1-5 and the contract Exit Criteria.

## Verification Evidence

- Commands run (this session, in the worktree):
  - `npx vitest run packages/agent-runtime/src/parse-chart-image` => Test Files 7 passed (7), Tests 45 passed (45), exit 0.
  - `npx vitest run .../evidence.test.ts --reporter=verbose` => 15 passed (15): auto_match->parsed/medium, never-strong, user_confirm->weak, visual_only->unknown, 5x non-auto reasons surfaced as warning, unavailable (no routing / parse_failed+routing / result_json null), degraded+repair warnings, chart_time_unverified always, serialization has no bytes/confidence/data URI.
  - `npm run check:answer-evidence-contract` => status "ok", exit 0.
  - `npm run typecheck` => all 33 workspaces `tsc --noEmit` clean, exit 0.
- Manual checks (contract Exit Criteria):
  - Serialized evidence_candidate contains no bytes/confidence/data:image => PASS (type-level: derive input is `record`+`routing` only, `FetchedChartImage.bytes` never in scope; runtime `stripConfidence` + `.value` extraction; full schema.ts has no nested confidence; asserted evidence.test.ts:239-259, executor.test.ts:113-116, tool.test.ts:59-62).
  - unavailable => evidence_candidate null (fail-closed, never synthesized) => PASS (evidence.ts:96-98; tests evidence.test.ts:171-210, executor.test.ts:217-218/266-267).
  - Evaluator review recommends pass => this file.
- Supporting artifacts: notes file present and accurate (documents the defensive `result_json === null` clause and the warnings-duplication tradeoff).
- Implementation notes reviewed: yes.

## External Acceptance Advice

> **External Acceptance**: pass
> **External Reviewer**: Codex (gpt-5.5, read-only sandbox, reasoning effort high)
> **External Source**: codex-review
> **External Started**: 2026-07-09T18:20:00+0800
> **External Completed**: 2026-07-09T18:30:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:292568aa887a4997b0eb87272ba18f55639d7ecca83b5c3ae8fcf1634604ee39 (pre-addendum; post-addendum fingerprint below)
> **Reviewed Scope**: branch+staged+unstaged+untracked

- P1 blockers: none after adjudication + test reinforcement (see Adjudication).
- P2 advisories: warnings-vocabulary duplication (same point as internal P3-2; deferred to answer-layer cutover sprint).

### Codex raw verdict and orchestrator adjudication

Codex returned Exit Criteria Verdict: FAIL with three findings; dual-track disagreement was adjudicated by the orchestrator (synthesis, not pick-one):

1. **[Codex P1] hostile `data:image` ref could be copied verbatim into `evidence_candidate.image_ref`** — Adjudicated DOWN, test ask ACCEPTED. Unreachable through production wiring: `createStoredChartImageFetchImage` (image-store.ts:194) whitelists `charts/<tenant>/` prefixes, so a hostile ref fetches null → `parse_failed` → `data_status: "unavailable"` → candidate is `null`. Adding a local ref validator to evidence.ts would re-derive the image-store's authority downstream (repo no-fallback rule), so no product validation was added. Codex's regression-test demand landed instead: three end-to-end tests in executor.test.ts wiring the REAL production fetchImage (wrong-tenant / hostile `data:image` / removed ref → `unavailable` + candidate `null` + `model_call_count === 0`, plus a serialization assertion that the candidate surface contains no `data:image`).
2. **[Codex P2] warnings vocabulary drift ("route-reason-derived" as literal marker)** — NOT ADOPTED. Same point gatekeeper independently rated P3-manual; plan decision 4 does not mandate a literal category string; answer renderer/warning vocabulary is explicitly out of scope for this slice.
3. **[Codex P2] wrong-tenant/inactive-ref executor chain not directly tested** — ACCEPTED; closed by the same three end-to-end tests above.
- Codex could not complete `npx vitest run` in its read-only sandbox (Vite temp-dir writes blocked) — environment limitation, not a code failure; the suite runs green in this session (48/48 post-addendum).

### Post-addendum verification (orchestrator, this session, in the worktree)

> **Post-Addendum Diff Fingerprint**: sha256:cf5d58d8b13f4b6b8690be7a18f87fa98d7b5b7dfd91a0e6ce0d71d1b631f2b8
- `npx vitest run packages/agent-runtime/src/parse-chart-image` → Test Files 7 passed, Tests 48 passed (45 prior + 3 new e2e), exit 0.
- `npm run check:answer-evidence-contract` → status "ok", exit 0.
- `npm run typecheck` → clean, exit 0.
- Addendum scope: executor.test.ts (tests only), notes.md, this review file, contract allowed_paths (+`tasks/todos.md`, resolving internal P3-1). No product code changed after gatekeeper's PASS.
- Acceptance checklist (contract Exit Criteria + Row 4 wording):
  - files_exist evidence.ts / evidence.test.ts => PASS
  - artifacts_exist notes.md => PASS
  - tests_pass evidence.test.ts => PASS (15/15)
  - commands_succeed (3) => PASS
  - qa_scores functionality min 7 => PASS (9/10)
  - Row 4: outcome exposes candidate/data-status without pixels/bytes => PASS; wrong tenant / inactive ref / no ready calibration / version mismatch / insufficient sample count remain non-auto_match => PASS.

## Findings

- [P3] scope-fidelity — tasks/todos.md:5 — the `Updated` timestamp bump (`2026-07-03 21:16` -> `2026-07-09 17:45`) is outside the contract `allowed_paths` block (lines 67-75). Impact: strict allowed_paths reading is violated by exactly one path; zero product/verification impact (timestamp only, no goal-ledger content drift). Evidence: contract line 56 names `tasks/todos.md` as the deferred-goal ledger in Workflow Inventory and the plan's Execution-isolation step runs `repo-harness run plan-to-todo`, which stamps this field — i.e. the mandated projection produces this touch, but the path was omitted from allowed_paths. Smallest safe fix: add `tasks/todos.md` to the contract `allowed_paths` (honest — the projection legitimately touches it), OR revert the single timestamp line if strict allowed_paths is preferred. Regression test: n/a (contract-scope hygiene, not code). Class: gated_auto (orchestrator decides at commit).

- [P3] design/maintainability — packages/agent-runtime/src/parse-chart-image/evidence.ts:64-66 — `buildWarnings` pushes `routing.reason` verbatim into `warnings` for every `decision !== "auto_match"`, including the routine calibrated outcomes `threshold_user_confirm` / `threshold_visual_only`, duplicating the authoritative `route_reason` field. Impact: mild over-warning / redundancy; low harm because (a) `route_reason` remains the machine-readable authority, (b) `chart_time_unverified` is unconditional so `warnings` is never empty for any candidate — the answer layer cannot use warnings-nonempty as a degradation signal and must inspect specific strings, and (c) the answer renderer that decides user-visible warnings is explicitly out of scope. Evidence: notes "Tradeoffs Considered" documents the branch-free total rule as a deliberate choice; plan decision 4 lists "route-reason-derived" without restricting it to infra-failure reasons, so this is a defensible reading. Smallest safe fix (only if the compliance/answer-layer owner later wants infra-failure reasons only): restrict the push in `buildWarnings` to the operational-failure subset — contained in one function. Regression test: add cases pinning warnings for `threshold_user_confirm`/`threshold_visual_only`. Class: manual (deferred design call, not required to ship).

## Behavior Diff Notes

- ParseChartImageOutcome gains two required fields (`data_status`, `evidence_candidate`); all 10 existing fields unchanged (no rename/remove/retype). No external consumer exists (grep) and typecheck is clean, so additive-only holds.
- Executor now calls `now()` for `completedAt` and reuses it for both `latency_ms` and `retrieved_at`; total `now()` call count unchanged (still exactly 2), so mock-clock latency assertions are undisturbed.
- Point (a) assessment: the `record.result_json === null` fail-closed clause is legitimate, not dead defensive creep — it is type-required (buildDataPoints takes non-null `ChartParseResult`; the pure function is exported for future callers), and fail-closed on inconsistent input is the correct posture. Not a finding.
- Point (c) non-negotiables: all verified — no bytes/confidence/data:image (type-level guarantee + full-schema check + tests); unavailable => null candidate; strength never "strong" (absent from the union); claim_label literal "inference"; per-field confidence stripped (type + runtime); all three versions carried verbatim; `parse_chart_image` present in BOTH contract.json and the check script (check passes); fields additive; `model_call_count === 0` on invalid ref still asserted (executor.test.ts:259).

## Residual Risks / Follow-ups

- `degraded` warning branch currently reachable only through direct callers of `deriveChartEvidenceHandoff` (executor never emits `degraded`). Intended per plan decision 4; tested. No action.
- The two P3 items above are the only open items; neither blocks ship.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | All exit criteria and Row 4 acceptance met; 3 commands green. |
| Product depth | 8/10 | Fail-closed evidence boundary correct; warnings duplication is a minor semantic choice. |
| Design quality | 8/10 | Single-const strength mapping, type-indexed data_points, additive contract. |
| Code quality | 9/10 | Pure function, type-level pixel/confidence guarantees, thorough tests. |

## Failing Items

- None blocking. Two P3 advisories recorded above.

## Retest Steps

- Re-run: `npx vitest run packages/agent-runtime/src/parse-chart-image && npm run check:answer-evidence-contract && npm run typecheck`
- Re-check: after any allowed_paths/contract edit, `git status --short -uall` maps every path to allowed_paths.

## Summary

PASS. The slice delivers the two additive outcome fields (`data_status`, `evidence_candidate`) via a pure, fail-closed `deriveChartEvidenceHandoff`, locks `parse_chart_image` into both the contract JSON and the check script, and keeps the existing outcome contract intact. All three verification commands pass in this session; every point-c non-negotiable is verified by type structure and tests. One P3 scope caveat (`tasks/todos.md` outside allowed_paths, timestamp-only, harness-projection artifact) and one P3 design advisory (route_reason duplicated into warnings) remain for the orchestrator; neither requires re-dispatch to fast-worker.
