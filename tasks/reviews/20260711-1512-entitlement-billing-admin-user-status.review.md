# Task Review: entitlement-billing-admin-user-status

> **Status**: Reviewed
> **Plan**: plans/plan-20260711-1512-entitlement-billing-admin-user-status.md
> **Contract**: tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md
> **Notes File**: tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 15:36
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:15eff7f329f32085bdadc5e9d17f0a414ae052ee74a9903c4912589b8bf7e39e
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS for the private Row-9 product-control boundary. Live dispatch,
  kill wiring, posted billing, migration apply and deployment remain false.
- Change type: code-change plus local migration contract.
- Intended/actual files: Worker service/tests, one RLS migration, usage/admin
  machine contract/checker, capability/workflow artifacts; no public route.
- Commands passed: focused 21; broader targeted 56 with 5 skipped; full 1204
  with 6 skipped; all-workspace typecheck/lint; database/env/JSON/diff checks.
- External acceptance: manual override after Claude CLI returned no review text.
- Residual risk: Row 10 must compose live dispatch/kill/usage sinks, apply the
  migration, run cross-tenant load/security evidence and calibrate actual cost.
- Rollback: revert one Row-9 commit; no external cleanup.

## Mode Evidence

- Selected route: captured Waza think work package, isolated contract worktree,
  direct implementation, deterministic verification and adversarial review.
- P1: platform identity/entitlement and Row-6 profile/lifecycle remain status
  authority; generic usage tables remain billing trace; Row-5 kill is injected.
- P2: Better Auth -> temporal status snapshot -> five-state projection;
  observed terminal measurement -> usage event/preview ledger/detail transaction;
  current admin -> target check -> request event -> lifecycle/kill -> final audit.
- P3: one private service and detail table preserve the existing authorities,
  keep paid entitlement separate from routing, and reject fabricated pricing.

## Verification Evidence

- Main-thread adversarial review found and fixed four material issues: profile
  existence is required before ready/retryable/provisioning; admin targets are
  exact tenant members/profiles; PG bigint/time replays are normalized and
  compared in stable field order; failed/cancelled/killed usage keeps its Row-5
  terminal state and generic quality is HOLD rather than fabricated PASS.
- Preview credit is exactly zero under the pending Row-10 methodology. The
  migration and runtime reject estimates, nonzero preview credits, wrong policy,
  invalid terminal states and changed replays.
- Tests cover all five states, no runner selection, exact/mismatched usage
  replay, observed failure usage, owner/admin action replay, unauthorized and
  invalid targets, lifecycle/kill dependency outcomes and tenant audit SQL.
- Implementation notes reviewed: yes.
- Strict snapshot is recorded after this review is rebound to the final diff.

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Claude CLI attempted; deterministic closure by main thread
> **External Source**: read-only local Claude review attempt
> **External Started**: 2026-07-11T15:27:00+0800
> **External Completed**: 2026-07-11T15:31:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:15eff7f329f32085bdadc5e9d17f0a414ae052ee74a9903c4912589b8bf7e39e
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: Claude CLI was invoked with read-only Read/Grep/Glob tools
  against base `3d70cb6` and the complete uncommitted/untracked Row-9 diff. It
  exited without assistant stdout or usable reviewer findings. This is a tool
  failure, not evidence of a clean diff, so no external PASS is claimed.
- P1 blockers: none for the deterministic Row-9 scope after the fixes above.
- P2 advisories: Row 10 must prove real live dispatch, kill, terminal usage sink,
  staging migration/readback, 10-way tenant isolation and current provider cost.
- Acceptance: status, observed attribution, exact preview trace, current admin
  authority, idempotent side effects, audit and non-leakage all pass locally.

## Behavior Diff Notes

- Entitlement now exposes FastClaw availability and five product states while
  Agent Runtime remains the only runner selector and Edge stays the default.
- Actual per-run model/tool/sandbox/storage measurements, including failure
  terminal states, bind to generic usage and a zero-credit preview ledger trace.
- Current owner/admin actors can request audited retry/disable/delete/kill via
  existing lifecycle and injected killer authorities; raw provider control data
  and errors do not enter product responses or audit rows.

## Residual Risks / Follow-ups

- Live kill dispatch and the terminal usage caller are intentionally not wired.
- The migration is not applied to staging and no provider billing is posted.
- Current Cloudflare security/load/cost and independent live acceptance are
  Sprint Row 10 release gates, not satisfied by these fixtures.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Deterministic status, usage and admin matrices pass. |
| Product depth | 8/10 | Concrete PG adapters exist; live composition is correctly held. |
| Design quality | 9/10 | Authority split, exact replay and no-auto-route invariants are explicit. |
| Code quality | 9/10 | Focused service/repository, strict validation and adversarial fixtures. |

## Failing Items

- None blocking Row 9. Credentialed Row-10 acceptance remains intentionally false.

## Retest Steps

- Re-run machine checker, focused/broader suites, full Vitest, all-workspace
  typecheck/lint, DB/env/JSON/diff checks, review fingerprint and strict harness.

## Summary

- PASS. Row 9 adds truthful private product/account/usage/admin control without
  enabling automatic FastClaw routing, posted billing or live provider control.
