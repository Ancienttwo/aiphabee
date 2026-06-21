# Task Replay Mode Release Gate Scaffold Notes

## Summary

Implemented the Sprint 3.3 §19.2 backend scaffold for resumable long tasks,
saved-report replay, and newbie/professional response-depth invariants.

## Current State

- `@aiphabee/agent-runtime` exposes `task_replay_mode_release_gate` under
  `GET /agent/runtime`.
- `POST /agent/release-gates/task-replay-mode/plan` returns a deterministic
  no-write release-gate plan.
- The gate reuses `createWorkflowTaskPlan()` to prove `task_id`,
  `resume_handle`, checkpoint table, notification plan, and disconnect-safe
  resume semantics.
- The gate reuses `createResearchRunSavePlan()` and
  `createResearchRunReplayPlan()` to prove deterministic replay seed, diff
  summary, immutable old report snapshot, and no silent rewrite.
- The gate reuses `createToolLoopAgentPlan()` with `responseDepth=newbie` and
  `responseDepth=professional` to prove mode switching preserves tool policy,
  numeric-source policy, evidence contract, source refs, methodology versions,
  and data values while changing presentation depth only.
- `core.task_replay_mode_release_gate` and
  `governance.task_replay_mode_release_gate_contract` exist as empty schema
  scaffolds for future persistence.
- The local contract checker verifies required checks, no-live boundaries,
  linked contracts, package script registration, and database contract coverage.

## Non-Goals

- No live Cloudflare Workflow execution.
- No live replay job execution.
- No frontend mode switch release UI.
- No live database writes.
- No live Queue writes.
- No model calls.
- No SQL or persistent writes.

## Verification

Passed on 2026-06-21:

- `npm run check:task-replay-mode-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

`npm run check` passed lint, typecheck, tests, golden checks, every contract
check through `check:secrets`, including `check:task-replay-mode-release-gate`,
then failed in the final workspace build at `@aiphabee/web` because the current
local Node runtime does not expose `node:module.registerHooks`, which
`@cloudflare/vite-plugin` imports from `apps/web/vite.config.ts`. Frontend work
is intentionally out of scope for this slice.
