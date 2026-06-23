# Task Replay Mode Release Gate Scaffold

## Purpose

This scaffold covers the Sprint 3.3 release check for resumable long tasks,
saved-report replay, and newbie/professional response-depth invariants.

## Contract Surface

- `GET /agent/runtime` exposes `task_replay_mode_release_gate`.
- `POST /agent/release-gates/task-replay-mode/plan` returns a deterministic
  no-write release-gate plan.
- The gate links the existing workflow task, research run save/replay, and
  localized response contracts instead of redefining those behaviors.

## Verified Invariants

- Long tasks return a user-visible `task_id`.
- Long tasks include a `resume_handle` and
  `GET /agent/workflows/tasks/:task_id` resume route.
- Workflow checkpoint state is anchored to `aiphabee_core.workflow_task_checkpoint`.
- Saved reports include a deterministic replay seed.
- Replay keeps the old report snapshot immutable and blocks silent rewrite.
- Newbie/professional modes preserve conclusion, values, evidence refs,
  source records, methodology versions, currency, and units.
- Mode switching changes presentation depth only.

## Non-Goals

- No live Cloudflare Workflow execution.
- No live replay job execution.
- No frontend mode switch release UI.
- No live database writes, Queue writes, tool execution, or model calls.

## Verification

- `npm run check:task-replay-mode-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
