# Implementation Notes: users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen

> **Status**: Complete
> **Plan**: plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md
> **Contract**: tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md
> **Review**: tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md
> **Last Updated**: 2026-07-03 20:55
> **Lifecycle**: notes

## Design Decisions

- Added the control-plane contract to `packages/agent-runtime/src/index.ts`, keeping `@aiphabee/agent-runtime` as the single authority.
- Exported `AgentLayer = "generic" | "research"` and `AgentRunMode = "dry_run" | "guarded_live" | "runner_remote"` from the existing runtime surface.
- Added `AgentExecutionRequest`, `AgentExecutionEvent`, and `AgentRunner` as typed contracts only; no model execution, Worker routing, or live runner implementation was added.
- Added `control_plane` to `getAgentRuntimeCapabilities()` so Worker can later read supported layers, declared modes, currently executable modes, route decisions, and authority package from runtime instead of redefining them.
- Kept `AGENT_EXECUTABLE_RUN_MODES = ["dry_run"]` to prevent the new `guarded_live` / `runner_remote` enum values from being misread as available execution paths.

## Deviations From Plan Or Spec

- The captured worktree was based on PR #21 rather than PR #22. This slice does not require PR #22 upload-routing code because it only changes the shared runtime control-plane contract and targeted parse-chart-image regression still passes.
- The generated contract initially omitted `packages/agent-runtime/` from `allowed_paths`; the contract was corrected before runtime edits.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| New `packages/agent-contracts` package | Rejected | Explicitly forbidden by the PRD/sprint; would create a second runtime authority. |
| Put route/event semantics in Worker | Rejected | Worker should consume runtime contracts in the next slice, not own competing semantics. |
| Declare only `dry_run` in `AgentRunMode` | Rejected | The PRD names `guarded_live` and `runner_remote` as control-plane modes; capability readback separately marks only `dry_run` executable. |
| Implement tool policy for `parse_chart_image` now | Deferred | That belongs to the next layer-tool-policy task; Task 1 is the base contract. |

## Open Questions

- Production entitlement field names remain unresolved and should be handled in the Research/tool-policy slice.
- Worker route readback shape should be wired in the next task using the runtime `control_plane` contract.

## Verification

- `npx vitest run packages/agent-runtime/src/index.test.ts`: pass, 39 tests.
- `npx vitest run packages/agent-runtime/src/parse-chart-image`: pass, 4 files / 15 tests.
- `npm run typecheck --workspace @aiphabee/agent-runtime`: pass.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Review: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md`

## Promotion Candidates

- Promote the dry-run-only executable-mode distinction to future Worker route docs if the next slice needs to explain why `guarded_live` is not yet available.
