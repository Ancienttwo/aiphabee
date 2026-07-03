# Task Review: users-ancienttwo-projects-aiphabee-worker-route-decision-readback

> **Status**: Passed
> **Plan**: plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md
> **Contract**: tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md
> **Notes File**: tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-03 21:11
> **Recommendation**: pass

## Human Review Card

- Verdict: pass
- Change type: code-change
- Intended files changed: `apps/worker/src/index.ts`, `apps/worker/src/index.test.ts`, active plan/contract/review/notes artifacts
- Actual files changed: intended files plus existing Task 1 runtime contract files already present in this worktree
- Commands passed:
  - `npx vitest run apps/worker/src/index.test.ts`
  - `npx vitest run packages/agent-runtime/src/index.test.ts`
  - `npm run typecheck --workspace @aiphabee/worker`
  - `npm run typecheck --workspace @aiphabee/agent-runtime`
- External acceptance: unavailable; local Worker contract slice only
- Residual risks: Research-only `parse_chart_image` layer tool policy is not implemented in this slice.
- Reviewer action required: inspect diff before promotion
- Rollback: revert branch `codex/users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen`

## Mode Evidence

- Selected route: planning -> approved work package -> same contract worktree execution
- P1/P2/P3 evidence: Worker consumes `@aiphabee/agent-runtime` `control_plane`; `/agent/runs/plan` and `/agent/runs/dry-run` attach route readback; unsupported non-executable modes fail closed.
- Root cause or plan evidence: after Task 1 created the runtime control-plane contract, Worker needed visible readback before layer tool policy could be wired safely.

## Verification Evidence

- Waza `/check` run: not run; targeted local verification used for this bounded code slice.
- Commands run:
  - `npx vitest run apps/worker/src/index.test.ts`
  - `npx vitest run packages/agent-runtime/src/index.test.ts`
  - `npm run typecheck --workspace @aiphabee/worker`
  - `npm run typecheck --workspace @aiphabee/agent-runtime`
- Manual checks:
  - No `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker` paths were introduced.
  - Worker route readback derives supported layers/modes from runtime capability.
  - `guarded_live` remains non-executable and returns `runner_required`.
- Supporting artifacts:
  - `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md`
  - `tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md`
  - `tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md`
- Implementation notes reviewed: yes
- Run snapshot: terminal output in current Codex session

## External Acceptance Advice

> **External Acceptance**: unavailable
> **External Reviewer**:
> **External Source**:
> **External Started**:
> **External Completed**:

- P1 blockers: none for Task 2.
- P2 advisories: layer tool policy is still required before `parse_chart_image` can be exposed through Research.
- Acceptance checklist:
  - Worker response includes `requested_layer`, `selected_layer`, and `route_reason`: pass
  - Route values come from runtime control-plane contract: pass
  - Worker targeted tests pass: pass
  - Runtime targeted tests pass: pass

## Behavior Diff Notes

- `/agent/runtime` now exposes the Task 1 `control_plane` block through Worker tests.
- `/agent/runs/dry-run` defaults to `generic` + `dry_run` route readback.
- `/agent/runs/plan` accepts explicit `agent_layer`/`layer` and `run_mode`/`mode` values and returns route readback.
- A supported but non-executable mode such as `guarded_live` is rejected before planning with `SCOPE_DENIED` and `x-aiphabee-route-reason: runner_required`.

## Residual Risks / Follow-ups

- Next slice should implement layer tool policy and explicitly block Generic `parse_chart_image` before tool/model execution.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 8/10 | Worker readback and fail-closed non-executable mode are covered; policy enforcement is next slice. |
| Product depth | 7/10 | Preserves Generic/Research layer separation without claiming live execution. |
| Design quality | 8/10 | Worker consumes runtime control-plane instead of owning route semantics. |
| Code quality | 8/10 | Small adapter with focused test coverage and no new package split. |

## Failing Items

- None.

## Retest Steps

- Re-run `npx vitest run apps/worker/src/index.test.ts`.
- Re-run `npx vitest run packages/agent-runtime/src/index.test.ts`.
- Re-run `npm run typecheck --workspace @aiphabee/worker`.
- Re-run `npm run typecheck --workspace @aiphabee/agent-runtime`.
- Re-run `repo-harness run verify-contract --contract tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md --strict`.

## Summary

- Recommendation: pass. This slice makes Worker route decisions observable while keeping runtime as the only Agent control-plane authority.
