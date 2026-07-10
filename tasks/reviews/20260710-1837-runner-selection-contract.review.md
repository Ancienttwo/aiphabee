# Task Review: runner-selection-contract

> **Status**: Reviewed
> **Plan**: plans/plan-20260710-1837-runner-selection-contract.md
> **Contract**: tasks/contracts/20260710-1837-runner-selection-contract.contract.md
> **Notes File**: tasks/notes/20260710-1837-runner-selection-contract.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-10 19:08
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:5ef8c9efd7b6d10109005967e15eb91e375e1d782e51e29ed27f08c0cf5a77a3
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS; zero open P1/P2 or hard-stop findings.
- Change type: code-change
- Intended files changed: Agent Runtime and Worker source/tests, two capability
  context files, Sprint row 1, and its plan/contract/notes/review artifacts.
- Actual files changed: intended paths only; no manifest, lockfile, dependency,
  database, migration, deployment, credential, or live-runtime configuration.
- Commands passed: targeted 308/308; full regression 973 passed and 1 skipped;
  all-workspace TypeScript lint; Agent Runtime typecheck; answer-evidence and
  context guards; contract assertions; `git diff --check`.
- External acceptance: manual override because Claude Code returned only its
  vendor session-limit error. Independent architecture and security specialists
  reviewed the exact current diff; the sole architecture finding was fixed and
  re-reviewed to closure.
- Residual risks: registry selection is implemented but dispatch is deliberately
  false; operational enablement, provisioning, sandbox lifecycle, credentials,
  and live acceptance remain later Sprint rows.
- Reviewer action required: none for row 1.
- Rollback: revert the single stacked commit; there is no external state.

## Mode Evidence

- Selected route: Waza `/check`, deep code review, architecture and security
  specialists, plus an adversarial trust-boundary pass.
- P1/P2/P3 evidence: P1 maps Agent Runtime as registry/selector authority and
  Worker as the public adapter. P2 traces `runner_family` from JSON input through
  the pure selector to selected readback or a structured pre-planning 400. P3
  keeps family orthogonal to layer/mode, derives runner identity/modes from one
  registry entry, and leaves dispatch disabled.
- Root cause or plan evidence: approved Sprint row 1 and captured plan; this is
  not a bugfix.

## Verification Evidence

- Waza `/check` run: PASS after one architecture MEDIUM was fixed; security
  specialist found no actionable issue; architecture re-review found none.
- Commands run:
  - `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts` → 2 files, 308 tests passed.
  - `npm run test` → 79 files passed, 1 skipped; 973 tests passed, 1 skipped.
  - `npm run lint` → all workspaces passed TypeScript lint.
  - `npm run typecheck -w @aiphabee/agent-runtime` → passed, including the
    registry-derived type-level mismatch guard.
  - `npm run check:answer-evidence-contract` → `status=ok`.
  - `repo-harness run check-context-files` → `SAFE`.
  - capability JSON assertions and `git diff --check` → passed.
- Manual checks: selector precedence, omitted-family default, invalid/non-string
  input, disabled FastClaw, incompatible mode, non-executable mode, public
  readback, no-planner-on-block, and no-dispatch capability state were re-read.
- Supporting artifacts: plan, contract, implementation notes, capability source
  map, and targeted tests.
- Implementation notes reviewed: yes.
- Run snapshot: `.ai/harness/runs/run-20260710T191048-44781-20260710-1837-runner-selection-contract.json`.

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Claude
> **External Source**: claude-review
> **External Started**: 2026-07-10T18:57:00+0800
> **External Completed**: 2026-07-10T18:57:13+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:5ef8c9efd7b6d10109005967e15eb91e375e1d782e51e29ed27f08c0cf5a77a3
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: Claude Code produced no review because the vendor session
  limit is exhausted until 21:00 Asia/Hong_Kong. This is recorded as unavailable,
  not a pass. The orchestrator accepts row 1 after exact-diff architecture and
  security specialist reviews, remediation and re-review of the only finding,
  targeted/full regressions, type-level contract proof, and deep adversarial
  review.
- P1 blockers: none.
- P2 advisories: none remaining; the registry/runner identity drift finding was
  fixed by deriving `family`, `runner_id`, and exact `supported_modes` from one
  `AgentRegisteredRunner` entry.
- Acceptance checklist: exact family vocabulary, one registry authority,
  fail-closed selection, no fallback, no planning on blocked input, unchanged
  dry-run-only execution, and no live-dispatch claim all pass.

## Behavior Diff Notes

- Agent Runtime now owns a two-entry runner registry and pure selection contract.
  `edge.worker-v0` is selectable for `dry_run`; `fastclaw.personal-v0` is
  registered but disabled; invalid, incompatible, disabled, and non-executable
  combinations return stable blocked reasons.
- Worker accepts optional snake-case `runner_family`, exposes requested/selected
  family and concrete runner ID on successful `/agent/*` planning readback, and
  returns before tool policy/planning when selection blocks.
- No model, tool, runner, network, persistence, sandbox, or deployment dispatch
  was added.

## Residual Risks / Follow-ups

- `dispatch_implemented=false` is intentional. Enabling either guarded-live or
  FastClaw execution without later adapter/lifecycle/security rows would be a
  contract violation and remains blocked by capabilities and tests.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Exact selection matrix and Worker readback pass; live dispatch is intentionally absent. |
| Product depth | 9/10 | Separates product layer from runner family and preserves no-fallback semantics. |
| Design quality | 9/10 | Registry is the single identity/mode authority; Worker only adapts results. |
| Code quality | 9/10 | Pure selector, discriminated results, type-level mismatch guard, and focused tests. |

## Failing Items

- None blocking.

## Retest Steps

- Re-run targeted Vitest, Agent Runtime typecheck, full tests, context scan,
  strict contract verification, and `HARNESS_DIFF_BASE=a3c3966... verify-sprint`.
- Re-check the review fingerprint after contract/Sprint status backfill.

## Summary

- PASS. Row 1 establishes one Agent Runtime-owned runner-selection contract and
  honest Worker readback without enabling dispatch. The only specialist finding
  is closed; Claude unavailability is explicitly a manual override, not a peer
  pass.
