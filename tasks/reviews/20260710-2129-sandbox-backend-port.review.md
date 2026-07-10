# Task Review: sandbox-backend-port

> **Status**: Reviewed
> **Plan**: plans/plan-20260710-2129-sandbox-backend-port.md
> **Contract**: tasks/contracts/20260710-2129-sandbox-backend-port.contract.md
> **Notes File**: tasks/notes/20260710-2129-sandbox-backend-port.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-10 22:16
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:1fd9e182f6e2b53ef19a6191f1a3277af3b99d075c8e4b9d6637ab13488c1d3b
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS; no open P1/P2 or hard-stop finding.
- Change type: code-change
- Intended files changed: Agent Runtime source/test, two capability context
  files, Sprint row 2/3/7 ownership text, and row-2 plan/contract/notes/review.
- Actual files changed: the nine contract-allowed paths only; no manifest,
  lockfile, dependency, provider adapter, route, database, deployment, secret,
  or live-runtime state.
- Commands passed: targeted 54/54; full regression 975 passed and 1 skipped;
  root TypeScript typecheck and lint; answer-evidence and context guards;
  capability assertions; no-package/no-manifest checks; `git diff --check`.
- External acceptance: manual override. Claude's first exact-diff review found
  one P1 and five P2 items; every item was removed, corrected, or durably owned
  by a later Sprint row. The required current-diff rerun then hit Claude's
  vendor session limit, so it is recorded as unavailable rather than a pass.
  Independent architecture and security specialists reviewed the remediated
  exact diff and both returned PASS/no findings.
- Residual risks: row 3 must implement a private grant-bound lease table without
  activation; row 7 must atomically add executable `runner_remote` selection,
  FastClaw enablement, private frozen-grant minting, and activation coverage.
- Reviewer action required: none for row 2.
- Rollback: revert the single stacked row-2 commit; no external state exists.

## Mode Evidence

- Selected route: Waza `/check`, adversarial contract review, architecture and
  security specialists, and Claude cross-model review.
- P1/P2/P3 evidence: P1 maps Agent Runtime as runner and policy authority, with
  a provider-neutral port but no adapter. P2 traces Generic, Research/edge, and
  Research/FastClaw through blocked-only access, plus a conformance fixture
  through output/file/kill/destroy failure states. P3 keeps the port sealed
  until row 7 and records row-3 lease ownership as a server-side invariant.
- Root cause or plan evidence: approved Sprint row 2 and captured think plan;
  this is not a bugfix.

## Verification Evidence

- Waza `/check` run: PASS after all in-scope findings were remediated.
- Commands run:
  - `npx vitest run packages/agent-runtime/src/index.test.ts` -> 1 file, 54 tests passed.
  - `npm test -- --run` -> 79 files passed, 1 skipped; 975 tests passed, 1 skipped.
  - `npm run typecheck` -> all workspaces passed.
  - `npm run lint` -> all workspaces passed.
  - `npm run check:answer-evidence-contract` -> `status=ok`.
  - `repo-harness run check-context-files` -> `SAFE`.
  - capability JSON assertions, no new package/manifest change, and
    `git diff --check` -> passed.
- Manual checks: no production adapter/consumer/sink; blocked-only access;
  opaque grant forgery rejection; fixed frozen deny-only policy; workspace path
  rejection; unknown/cross-lease failure; untrusted output; idempotent destroy;
  durable row-3/row-7 authority ownership.
- Supporting artifacts: Sprint, plan, contract, implementation notes,
  capability source map, and targeted tests.
- Implementation notes reviewed: yes.
- Run snapshot: `.ai/harness/runs/run-20260710T222151-26312-20260710-2129-sandbox-backend-port.json`.

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Claude
> **External Source**: claude-review
> **External Started**: 2026-07-10T22:05:29+0800
> **External Completed**: 2026-07-10T22:14:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:1fd9e182f6e2b53ef19a6191f1a3277af3b99d075c8e4b9d6637ab13488c1d3b
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: Claude's successful review found a P1 structurally dead
  allowed branch and P2 issues in test strength, missing-grant isolation,
  invalid-path representation, caller-supplied policy, and lease ownership.
  The current diff removes the allowed branch and policy input, isolates the
  negative type guard, makes path failure single-authority, exercises unknown
  lease failures, and records row-3/row-7 ownership in the durable Sprint.
  Claude's mandatory remediated-diff rerun returned only its session-limit error.
  Exact-current-diff architecture and security reviews independently report no
  findings, so the orchestrator accepts the row with the external result marked
  unavailable rather than passed.
- P1 blockers: none remaining.
- P2 advisories: none remaining in row 2; real lease binding and activation are
  explicit blocking acceptance criteria for rows 3 and 7 respectively.
- Acceptance checklist: blocked-only access, sealed grant, fixed policy,
  provider-neutral failures, honest capability readback, no adapter/live claim,
  and durable downstream ownership all pass.

## Behavior Diff Notes

- Agent Runtime now exports one versioned provider-neutral `SandboxBackend`
  port and fixed safety policy: no allowed egress targets, 180-second soft
  timeout, 600-second hard timeout, kill, and idempotent destroy.
- Sandbox access remains blocked for every current input. Generic is rejected
  before runner selection; Research/edge is family-blocked; Research/FastClaw
  remains disabled/non-executable. No grant mint or backend handle exists.
- Create requires an opaque readonly grant, and file operations require a
  validated branded workspace-relative path. Output stays explicitly untrusted.
- Capability readback reports port ready while adapter, backend registration,
  dispatch, and live execution remain false.

## Residual Risks / Follow-ups

- Row 3 must make unknown, cross-owner, and cross-tenant lease operations
  indistinguishable at any external error boundary and keep ownership in a
  private server-side table.
- Row 7 must never make grant minting reachable by flipping `enabled` alone;
  executable selection, minting, adapter dispatch, and activation tests land as
  one authority change.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Port and failure contracts pass; live adapter is intentionally absent. |
| Product depth | 9/10 | Generic/Research and runner/provider boundaries remain distinct and fail closed. |
| Design quality | 9/10 | One Agent Runtime-owned port, fixed policy, sealed activation, no second authority. |
| Code quality | 9/10 | Discriminated results, branded paths/grant, conformance failures, focused tests. |

## Failing Items

- None blocking.

## Retest Steps

- Re-run targeted Vitest, root typecheck/lint/full tests, answer/context guards,
  strict contract verification, current fingerprint, and
  `HARNESS_DIFF_BASE=2be96ce... repo-harness run verify-sprint`.
- Re-check the review fingerprint after Sprint/contract status backfill.

## Summary

- PASS. Row 2 defines the sandbox backend seam without enabling a sandbox or
  creating a second authority. Claude's P1 exposed a real cross-row activation
  contradiction; the dead branch is gone, and rows 3/7 now durably own the only
  safe implementation path.
