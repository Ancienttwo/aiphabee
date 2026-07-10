# Implementation Notes: sandbox-backend-port

> **Status**: Complete
> **Plan**: plans/plan-20260710-2129-sandbox-backend-port.md
> **Contract**: tasks/contracts/20260710-2129-sandbox-backend-port.contract.md
> **Review**: tasks/reviews/20260710-2129-sandbox-backend-port.review.md
> **Last Updated**: 2026-07-10 22:19
> **Lifecycle**: notes

## Design Decisions

- Keep the port in the existing Agent Runtime index beside `AgentRunner`; do not
  add a package, dependency, registry, factory, or provider implementation.
- Fix policy as an exact exported constant: default-deny/no direct Internet/no
  allowed targets, 180-second soft timeout, and 600-second hard timeout.
- Compose runtime access with `selectAgentRunner()` and require an opaque
  FastClaw grant on create. Raw family compatibility cannot authorize a disabled
  runner. This row intentionally has no grant mint because `runner_remote` is
  also non-executable; row 7 must add executable selection, a private frozen
  grant mint, and activation coverage atomically.
- Accept argv and provider-neutral `kill()` cancellation, never a shell command
  string, arbitrary env, or shared DOM type; classify process output as
  untrusted and leave semantic translation to row 7.
- Make kill and idempotent destroy result states representable; row 5 owns the
  lifecycle orchestrator and terminal audit evidence.
- Preserve run/session ownership as a discriminated union; validate and brand
  workspace-relative paths; represent operation failures and abnormal execution
  termination explicitly rather than synthesizing success/exit output.
- Keep v0 egress policy deny-only. Row 4 must add Tool Gateway as a versioned
  discriminated policy branch coupled atomically to an opaque scoped grant;
  target-kind strings cannot enable egress by themselves.
- Keep lease IDs provider-neutral, but never treat them as authorization. Row 3
  must bind them to the grant identity in its private lease table and reject
  every unknown or cross-owner operation.

## Deviations From Plan Or Spec

- Harness cannot nest a worktree because this execution is already in the
  isolated linked worktree used by row 1. Row 2 therefore uses a new stacked
  branch in the same isolated directory; primary `main` remains untouched.
- A provider-specific FastClaw sandbox smoke exists as dirty user WIP in the
  primary worktree. It was inspected only as evidence; this contract does not
  edit, copy, stage, or claim that implementation.
- The approved plan proposed exposing DOM `AbortSignal` on `SandboxExecuteInput`.
  Full workspace typecheck proved that Node-only consumers such as
  `@aiphabee/public-ops` cannot name that type. The public port now uses its
  provider-neutral `kill()` method plus fixed timeout policy; a future adapter
  may keep `AbortController` private to its own implementation.
- Claude review found one P1: file not-found was modeled as empty-byte success,
  paths were unbounded, and operation/abnormal-exit failures were missing.
  Architecture review also found raw-family access bypassed disabled runner
  selection, ownership omitted sessions, and exact-empty egress policy blocked
  row 4. All were remediated in the public contract and tests before acceptance.
- Final Claude review then found the apparent allowed grant branch was
  structurally unreachable because `runner_remote` is not executable, plus
  test/contract ambiguities. The dead branch was removed; the row-7 activation
  boundary is now explicit; caller-supplied policy and duplicate invalid-path
  failure shapes were removed; unknown-lease failures replace tautological
  result literals in the conformance fixture.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| New `packages/sandbox-runtime` | Reject | One port and one planned adapter do not justify another package authority. |
| sandbank dependency | Reject | Duplicates the seam and adds immature compliance-path dependency risk. |
| Cloudflare-shaped interface | Reject | Would leak the first provider into Agent Runtime authority. |
| Agent Runtime-local port | Use | Smallest contract that protects runner/provider separation. |

## Open Questions

- None.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Test-first baseline: targeted Agent Runtime suite had 3 failures before
  implementation: missing capability readback, missing access guard, and missing
  port constants.
- Post-implementation targeted suite: 1 file, 54 tests passed.
- Agent Runtime typecheck passed, including negative type guards for missing and
  structurally forged access grants.
- Full regression: 79 files passed, 1 skipped; 975 tests passed, 1 skipped.
- Root typecheck and lint passed across all workspaces; answer-evidence returned
  `status=ok`; context scan returned `SAFE`; strict contract returned 18/18 and
  `Fulfilled`.
- Architecture and security exact-diff re-reviews returned PASS/no findings.
  Claude's successful review findings were remediated; its required final rerun
  was unavailable after the vendor session limit reset to 02:00.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- No promotion: backend-selection reasoning already lives in
  `docs/researches/20260709-fastclaw-sandbox-backend-selection.md`; execution
  evidence stays in this task note.
