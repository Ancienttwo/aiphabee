# Task Review: cloudflare-sandbox-adapter-spike

> **Status**: Reviewed
> **Plan**: plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md
> **Contract**: tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md
> **Notes File**: tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 00:56
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:1b001d57e19038902830d5458b4117029837548defec0e6cac5014a895cb387d
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS; no open P1/P2 or hard-stop finding.
- Change type: code-change
- Intended files changed: Agent Runtime port/test, Cloudflare adapter and
  registry source/tests, existing bridge config/image/bindings, capability
  context, Sprint row 3, and row-3 plan/contract/notes/review.
- Actual files changed: the 16 contract-allowed paths only; no package or
  lockfile drift, public route, production grant mint, backend registration,
  runner dispatch, database, secret, deploy or live provider mutation.
- Commands passed: targeted 73/73; full regression 1026 passed and 3 skipped;
  root lint/typecheck; answer/context guards; capability/pin/drift assertions;
  Docker image plus Wrangler dry-run build; `git diff --check`.
- External acceptance: manual override. Architecture and security specialists
  found concrete concurrency, lifecycle, output-pressure, path and typed-error
  blockers. All were fixed and deterministically tested. The exact-current-diff
  architecture rerun then found the pinned SDK top-level `startProcess`
  session-forwarding defect; the adapter was switched to the session wrapper
  and retested. Both specialists hit their provider quota before returning a
  final clean token, so their result is unavailable rather than represented as
  a pass. The main Deep `/check` adversarial pass re-read every cited location
  and the installed 0.12.3 SDK implementation after remediation.
- Residual risks: no credentialed Cloudflare live acceptance is claimed;
  unconfirmed create cleanup remains durable as `pending` for Row 5 rather
  than being erased; Row 7 still owns grant mint, registration and activation.
- Reviewer action required: none for Row 3.
- Rollback: revert the single stacked Row-3 commit; no external state exists.

## Mode Evidence

- Selected route: Waza `/check` Deep review with architecture/security
  specialists and a main-thread adversarial pass.
- P1/P2/P3 evidence: P1 maps Agent Runtime as port/grant authority and the
  existing bridge as provider-only. P2 traces grant-bound create through the
  transactional `starting -> running -> killed/destroying/destroyed` registry
  and provider effects. P3 preserves one authority, one sandbox per lease,
  one active process slot, default-deny egress and off-by-default activation.
- Root cause or plan evidence: approved Sprint row 3 and captured think plan;
  this is not a bugfix.

## Verification Evidence

- Waza `/check` run: PASS after nine in-scope hard stops were remediated.
- Commands run:
  - `npx vitest run packages/agent-runtime/src/index.test.ts apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts apps/sandbox-bridge/src/lease-registry.test.ts apps/sandbox-bridge/src/index.test.ts` -> 4 files, 73 tests passed.
  - `bash /Users/ancienttwo/.codex/skills/check/scripts/run-tests.sh` -> 86 files passed, 2 skipped; 1026 tests passed, 3 skipped.
  - `npm run typecheck` -> all workspaces passed.
  - `npm run lint` -> all workspaces passed.
  - `npm run check:answer-evidence-contract` -> `status=ok`.
  - `repo-harness run check-context-files` -> `SAFE`.
  - capability, SDK/image pin, no-registration, no-deprecated-API,
    no-manifest-drift and `git diff --check` assertions -> passed.
  - `npx wrangler deploy --dry-run --config apps/sandbox-bridge/wrangler.jsonc --outdir <temp>` -> exact digest image built and all three DO bindings resolved; no deploy.
  - Detached worktree at base `f7984e7` plus the exact staged binary diff ->
    targeted 73/73, full 1026 passed with 3 skipped, root typecheck and
    unstaged-drift check all passed; the temporary worktree was removed.
- Manual checks: grant binding, runtime path revalidation, transaction CAS,
  one process slot, starting kill race, idle kill, output bounds, stream
  completion, provider/registry failures, destroy timeout recovery, cleanup
  uncertainty, exact session selection and terminal idempotence.
- Supporting artifacts: Sprint, plan, contract, implementation notes,
  capability context, official SDK/image research and targeted tests.
- Implementation notes reviewed: yes.
- Run snapshot: `.ai/harness/runs/run-20260711T005925-50712-20260710-2237-cloudflare-sandbox-adapter-spike.json`.

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Codex architecture and security specialists
> **External Source**: specialist-review
> **External Started**: 2026-07-11T00:25:00+0800
> **External Completed**: 2026-07-11T00:54:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:1b001d57e19038902830d5458b4117029837548defec0e6cac5014a895cb387d
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: the specialists' verified findings were process overwrite
  and post-start orphan races, idle kill poisoning, unrecoverable destroy,
  registry exceptions escaping the typed port, unbounded termination waits,
  unbounded output, runtime path escape and wrong SDK session forwarding. The
  current diff uses a transactional pre-start process reservation, exact state
  recovery, typed/bounded failures, bounded output, authoritative path
  revalidation and `getSession(sessionId).startProcess`. Each trigger has a
  deterministic test. Specialist final reruns failed only on provider quota;
  no finding is waived or deferred.
- P1 blockers: none remaining.
- P2 advisories: credentialed Cloudflare behavior and whole-run terminal
  orchestration remain explicit Rows 10 and 5 acceptance, not Row 3 claims.
- Acceptance checklist: exact provider pin/build, isolation binding, streamed
  output, real kill, binary files, provider failures, idempotent recovery,
  no registration/activation and no live-complete claim all pass.

## Behavior Diff Notes

- All post-create backend operations now carry the full opaque lease; the
  private DO record compares backend, lease, tenant, user, owner and runner.
- Execute reserves its final provider process ID transactionally before start,
  admits one process per lease, uses the created session wrapper, and waits for
  the SDK log-stream `onExit` before closing ordered output.
- Kill latches only an existing starting/running process, calls a bounded real
  provider kill, and never treats connection cancellation as process death.
- Destroy remains closed on timeout or uncertain registry completion; repeated
  destroy reconciles idempotently without reopening provider-unknown state.
- Capability truth says adapter implemented while backend registration,
  FastClaw dispatch and live execution remain false.

## Residual Risks / Follow-ups

- Row 5 must add whole-run terminal orchestration, cleanup audit/reconciliation
  and actual usage recording across cancellation, timeout and Worker restart.
- Row 10 must provide credentialed live isolation/latency/resource/cleanup/cost
  evidence before activation. Fixture and dry-run evidence do not satisfy it.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Adapter contract, state races, failures and dry-run image build pass; live execution stays intentionally off. |
| Product depth | 9/10 | Lease identity and lifecycle boundaries are durable without minting or registration. |
| Design quality | 9/10 | One Agent authority, provider-only adapter, transactional slot and recoverable terminal state. |
| Code quality | 9/10 | Typed results, bounded queues/timeouts, exact SDK seam and focused adversarial tests. |

## Failing Items

- None blocking.

## Retest Steps

- Re-run targeted Vitest, Waza test detection, root typecheck/lint, answer and
  context guards, pin/drift checks, Wrangler dry-run build, strict contract,
  current fingerprint and `repo-harness run verify-sprint`.
- Re-check the review fingerprint after Sprint and contract status backfill.

## Summary

- PASS. Row 3 implements the Cloudflare adapter and private lease state without
  registering or activating it, and every verified review blocker is closed.
