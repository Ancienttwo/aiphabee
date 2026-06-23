# Workflow Task Scaffold Contract

## Objective

Complete the backend-only Sprint 2.4 AGT-09 scaffold for long-running Agent
work that returns a user-visible `task_id`, supports leave-and-resume metadata,
and plans completion/failure notifications.

## Required Surfaces

- Package: `@aiphabee/agent-runtime`
- Runtime route: `GET /agent/runtime`
- Planner route: `POST /agent/workflows/tasks/plan`
- Resume route contract: `GET /agent/workflows/tasks/:task_id`
- Contract: `deploy/agent/workflow-task.contract.json`
- Checker: `npm run check:agent-workflow-task`
- Task table scaffold: `aiphabee_core.workflow_task`
- Checkpoint table scaffold: `aiphabee_core.workflow_task_checkpoint`

## Required Guarantees

- Use standard response envelopes.
- Return a stable `task_id`.
- Keep `task_id_visible=true`.
- Include resume metadata for `GET /agent/workflows/tasks/:task_id`.
- Include notification plans for in-app/email completion and failure events.
- Link to the existing ToolLoopAgent plan.
- Reference `AIPHABEE_RESEARCH_WORKFLOW`, `AIPHABEE_EVENTS_QUEUE`, and
  `AIPHABEE_RUN_COORDINATOR` binding contracts.
- Do not start live Cloudflare Workflows.
- Do not write task/checkpoint rows.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes task and checkpoint table scaffolds.
- Package and Worker targeted tests pass.
- Worker and Agent Runtime typecheck/build pass.
- Sprint tracker row is checked and Sprint 2.4 count is updated.
