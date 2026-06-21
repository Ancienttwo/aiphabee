# Workflow Task Scaffold Notes

## Summary

Implemented the Sprint 2.4 AGT-09 backend scaffold for long-running Agent work.

## Current State

- `@aiphabee/agent-runtime` exposes Workflow task capabilities.
- `GET /agent/runtime` includes nested `workflow_tasks` readiness.
- `POST /agent/workflows/tasks/plan` returns a deterministic no-write Workflow
  task plan with `task_id`, resume metadata, notification plan, long-task
  boundary, and linked ToolLoopAgent plan.
- `core.workflow_task` and `core.workflow_task_checkpoint` exist as empty schema
  scaffolds for future persistence.
- The local contract checker verifies binding names, no live Workflow execution,
  no writes, no SQL, task ID visibility, resume readiness, notification plan,
  and database contract linkage.

## Non-Goals

- No live Cloudflare Workflows execution.
- No task/checkpoint DB writes.
- No Durable Object coordination.
- No Queue notification fanout.
- No frontend progress or resume UI.

## Verification

Passed:

- `npm run check:agent-workflow-task`
- `npm run check:database`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
