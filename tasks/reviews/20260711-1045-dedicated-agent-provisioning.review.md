# Task Review: dedicated-agent-provisioning

> **Status**: Reviewed
> **Plan**: plans/plan-20260711-1045-dedicated-agent-provisioning.md
> **Contract**: tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md
> **Notes File**: tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 11:08
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:bf61a315b9e9d78234f5367e256621376263346efe274796dea45c5f82a707a7
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS after fixing the independent review's request-ID retry P1; no
  remaining architecture, data or security hard stop.
- Change type: code-change
- Intended files changed: existing lifecycle/service tests, one declarative
  FastClaw pin/check, capability truth and Row-6 workflow artifacts.
- Actual files changed: 13 fingerprinted contract-allowed paths plus this
  excluded review artifact. No migration, dependency, route, secret, deploy,
  shared staging write, FastClaw checkout change or runtime activation.
- Commands passed: targeted 280; PostgreSQL 5; full 1153 with 6 skipped;
  all-workspace typecheck/lint; database/env/contract checks; diff check.
- External acceptance: manual override after one real Claude read-only review.
  Claude found one P1 and five actionable P2s; the P1 and relevant P2s were
  fixed with regressions. The final Claude re-review was quota-blocked at
  12:10 HKT reset, so current-diff closure is bound by deterministic tests and
  main-thread adversarial readback rather than fabricated external success.
- Residual risks: Row 7 must re-check entitlement per dispatch; Row 10 owns live
  contention, latency, residual and cost evidence.
- Reviewer action required: none for Row 6.
- Rollback: revert the single stacked Row-6 commit; no external state exists.

## Mode Evidence

- Selected route: Waza think plan, dedicated read-only repo/upstream gap study,
  Claude read-only cross-model review, then main-thread race/security review.
- P1/P2/P3 evidence: P1 preserves PostgreSQL local authority and FastClaw
  remote authority. P2 traces concurrent claim through one remote winner,
  audited loser, same-attempt replay and new-attempt convergence. P3 adds only
  the conflict/deleted/retry seams exposed by fixtures; no second state machine.
- Root cause or plan evidence: approved Sprint row 6 and captured plan; not a
  bugfix profile.

## Verification Evidence

- Waza `/check` run: PASS after independent review closure.
- Commands run:
  - `npm run check:fastclaw-dedicated-agent-provisioning` -> commit exact,
    5 routes, dispatch/live false, status ok.
  - `npx vitest run packages/agent-runtime/src/fastclaw-lifecycle.test.ts apps/worker/src/research-agent-lifecycle.test.ts apps/worker/src/index.test.ts`
    -> 3 files, 280 tests passed.
  - PostgreSQL URL scoped to `aiphabee_lifecycle_test_row6` plus lifecycle
    integration -> 5 tests passed on PostgreSQL 17.4.
  - `npm run typecheck`, `npm run lint`, `npm run check:database`,
    `npm run check:env`, capability JSON parse and `git diff --check` -> PASS.
  - `npm test` -> 94 files passed, 2 skipped; 1153 tests passed, 6 skipped.
  - FastClaw sibling readback ->
    `dev=35cd5ad006d991713c91a1fc641bcf01dbaf3a8b`; private allowlist source hash
    `5bf40f01839f3d7bd252d638393637bdbf949b62354e0ab3e2641462687de7d6`.
- Manual checks: request ID is one immutable attempt; retryable responses name
  the new-ID strategy; deleted is non-retryable; terminal race converges;
  raw remote IDs remain hash-only in responses/audit; no shared fallback.
- Supporting artifacts: Sprint, plan, contract, notes, upstream pin, capability
  context and deterministic unit/PostgreSQL fixtures.
- Implementation notes reviewed: yes.
- Run snapshot: final strict run is recorded under `.ai/harness/runs/` after
  this review is bound.

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Claude Code CLI initial review plus deterministic closure
> **External Source**: claude-review/read-only; final rerun quota-blocked
> **External Started**: 2026-07-11T10:56:00+0800
> **External Completed**: 2026-07-11T11:08:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:bf61a315b9e9d78234f5367e256621376263346efe274796dea45c5f82a707a7
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: Claude's first read-only pass was substantive, not a
  rubber stamp. Its blocking finding was: “Conflict audit event 會永久毒化同一
  requestId 的重試，與 `retryable: true` 自相矛盾.” The resolution makes
  request ID = one immutable attempt, adds
  `retry_with_new_request_id`, proves same-ID replay and new-ID terminal
  convergence, and prevents a second remote call. Final Claude rerun returned
  only the explicit session-limit message; no PASS was fabricated.
- P1 blockers: none. The poisoned/ambiguous retry contract has direct unit and
  real two-client PostgreSQL coverage.
- P2 advisories: deleted profiles now use a truthful non-retryable denial;
  post-CAS terminal races converge; brittle source/test-title checks were
  removed; PostgreSQL <16 fails explicitly and role membership is restored;
  the task contract is concrete and current. Capability verified state is
  recorded only in this final reviewed closeout.
- Acceptance checklist: one profile and remote path, audited loser,
  same-attempt replay, new-attempt retry, partial reconciliation,
  disable/re-enable/delete idempotency, entitlement/lease expiry, upstream pin,
  disabled dispatch/live posture and full regression all pass.

## Behavior Diff Notes

- Busy claim results now carry an authoritative profile. A true lease loser
  writes a hashed conflict audit without remote work.
- `retry_with_new_request_id` disambiguates idempotent replay from a new retry
  attempt for both conflict and retryable upstream failure.
- A concurrent duplicate of the lease owner's request ID reports transient
  in-progress state and cannot insert an event ahead of the owner's terminal
  audit.
- Activate/disable after deletion audit
  `RESEARCH_AGENT_PROFILE_DELETED` with `retryable=false`.
- A winner that finalizes between a loser's failed CAS and profile reread is
  returned as terminal success instead of stale conflict.
- FastClaw commit/allowlist/identity/recovery/expiry and disabled-activation
  assumptions are tracked in one machine-checked contract.

## Residual Risks / Follow-ups

- Row 7: atomic runner adapter/grant activation and entitlement recheck.
- Row 10: live FastClaw/Cloudflare concurrency, latency, resource cleanup,
  security and cost evidence.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | True concurrent/retry/expiry matrix passes; live remains intentionally Row 10. |
| Product depth | 9/10 | Identity, entitlement, audit and retry ownership are explicit. |
| Design quality | 9/10 | Existing authorities preserved; no migration, fallback or second state machine. |
| Code quality | 9/10 | Small product delta with adversarial unit and real PostgreSQL regressions. |

## Failing Items

- None blocking.

## Retest Steps

- Re-run contract checker, targeted 280, PostgreSQL 5, full Vitest,
  all-workspace typecheck/lint, DB/env/JSON/diff checks, strict contract and
  Sprint verification with base `824de72`.
- Recompute fingerprint after any non-review artifact change.

## Summary

- PASS. Row 6 now proves one dedicated identity path under concurrency and
  makes retry/audit/expiry truth explicit while keeping runner/live execution
  disabled.
