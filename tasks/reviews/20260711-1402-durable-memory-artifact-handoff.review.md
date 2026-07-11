# Task Review: durable-memory-artifact-handoff

> **Status**: Reviewed
> **Plan**: plans/plan-20260711-1402-durable-memory-artifact-handoff.md
> **Contract**: tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md
> **Notes File**: tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 14:19
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:fa1d607f548d614901ca39a6b6e38af142b100f9f51078768c0dd710e6da9a65
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS for the deterministic Row-8 private handoff boundary. No live
  scanner, applied migration, deployment or public route claim is made.
- Change type: code-change plus local migration contract.
- Intended/actual files: focused Agent Runtime handoff/tests, Worker PG/R2
  stores/tests, one RLS migration, machine/capability/workflow artifacts.
- Commands passed: focused 14; broader targeted 60; full 1183 with 6 skipped;
  all-workspace typecheck/lint; database/env/contract/JSON/diff checks.
- Residual risk: live scanner selection, credentialed PG/R2 migration/readback,
  concurrency/cost and public auth remain closed under Rows 9-10.
- Rollback: revert one Row-8 commit; no external cleanup.

## Mode Evidence

- Selected route: captured Waza think work package, isolated contract worktree,
  direct implementation, deterministic verification and adversarial review.
- P1/P2/P3: Agent Runtime owns approval/scan/cleanup, Worker owns PG/R2,
  sandbox remains ephemeral; trace is approval-before-read through tenant-first
  durable access and destroy; design rejects sandbox approval and scan heuristics.
- Root cause/plan evidence: approved Sprint row 8; not a bugfix profile.

## Verification Evidence

- Main-thread review found and fixed the ambiguous-commit compensation risk:
  a PostgreSQL response error after commit can no longer trigger blind R2
  deletion. Exact readback preserves a committed pair; uncertain state is
  explicit `cleanup_required`.
- Tests prove rejected candidates are not read, over-limit/unsafe/scan-error
  bytes do not persist, wrong tenant never probes R2, metadata failure
  compensates, ambiguous commit preserves the pair, destroy failure is unsafe,
  and successful destroy leaves zero fixture files.
- Migration review: complete constraints, SHA-256, kind limits, retention,
  clean scan/classification equality, tenant/owner/run prefix, forced RLS and
  owner/workspace-member select policy.
- Implementation notes reviewed: yes.
- Strict snapshot is recorded after this review is rebound to the final diff.

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Codex CLI attempted; deterministic closure by main thread
> **External Source**: read-only local review attempts
> **External Started**: 2026-07-11T14:18:00+0800
> **External Completed**: 2026-07-11T14:19:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:fa1d607f548d614901ca39a6b6e38af142b100f9f51078768c0dd710e6da9a65
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: read-only `codex exec review --uncommitted` was attempted
  with two models. The configured model required a newer Codex and the fallback
  was unsupported for the ChatGPT account. These are reviewer-tool failures,
  not evidence of a clean diff, so no external PASS is claimed.
- P1 blockers: none after the ambiguous-commit/object-compensation fix.
- P2 advisories: Row 10 must validate a real scanner and live PG/R2 cleanup/
  isolation/cost; fixtures cannot satisfy that gate.
- Acceptance: exact approval, no rejected reads, bounded clean scan, complete
  metadata, tenant-first access, compensation and mandatory destroy all pass.

## Behavior Diff Notes

- A private handoff port now moves only explicitly approved sandbox files into
  AiphaBee-owned durable storage after limit/hash/authoritative-scan gates.
- R2 owns unique content-hashed object keys; PostgreSQL owns RLS metadata and
  retention. A wrong tenant cannot use record ID or object key as authority.
- Cleanup is part of the operation, not caller best-effort. Failed destroy or
  unresolved storage compensation prevents a release-safe result.

## Residual Risks / Follow-ups

- Row 9: entitlement, storage usage attribution, user status and admin retry/
  disable/delete/audit surfaces.
- Row 10: real scanner, migration/R2 live readback, cross-tenant concurrency,
  residual cleanup, latency/resource/cost evidence and independent acceptance.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Deterministic approval/scan/store/read/destroy matrix passes. |
| Product depth | 8/10 | Concrete PG/R2 path exists; product/admin surface intentionally absent. |
| Design quality | 9/10 | Authority-first, tenant-first, bounded and explicit uncertain-state handling. |
| Code quality | 9/10 | Focused ports/adapters, strict records and adversarial fixtures. |

## Failing Items

- None blocking Row 8. Credentialed live acceptance remains intentionally false.

## Retest Steps

- Re-run machine checker, focused/broader suites, full Vitest, all-workspace
  typecheck/lint, DB/env/JSON/diff checks, review fingerprint and strict harness.

## Summary

- PASS. Row 8 creates the private durable handoff and preserves the off-by-
  default/no-live-claim posture.
