# Task Contract: tool-loop-agent-planner-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-tool-loop-agent-planner-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-tool-loop-agent-planner
> **Last Updated**: 2026-06-21 03:14 +08
> **Notes File**:
> `tasks/notes/tool-loop-agent-planner-scaffold.notes.md`

## Goal

Create a no-model ToolLoopAgent planner that turns an Agent run context and
registered tools into phased tool steps with public progress events,
parallelism limits, and stop/retry policy.

## Scope

- In scope:
  - `createToolLoopAgentPlan()` in `@aiphabee/agent-runtime`;
  - `POST /agent/runs/plan`;
  - `POST /agent/runs/stream`;
  - phased plan for security resolution, entitlement gate, data fetch, evidence
    binding, and answer contract;
  - max 3 parallel read-only tool calls per step;
  - requested max-step enforcement;
  - public tool progress event names and backend SSE serialization;
  - no chain-of-thought exposure;
  - stop conditions for max steps, budget exhaustion, two consecutive same
    error, scope denial, and completion;
  - retry policy with non-billable retries;
  - contract checker;
  - tracker/governance updates.
- Out of scope:
  - actual tool execution;
  - live `streamText` / `generateText`;
  - live model token streaming;
  - chain-of-thought streaming;
  - live entitlement reads;
  - usage ledger writes;
  - frontend Ask/evidence cards.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/tool-loop-planner.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/tool-loop-agent-planner-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-tool-loop-agent-planner-scaffold.md
  - scripts/check-tool-loop-agent-contract.mjs
  - tasks/contracts/tool-loop-agent-planner-scaffold.contract.md
  - tasks/notes/tool-loop-agent-planner-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime reports tool_loop_agent.planner_ready=true"
    - "POST /agent/runs/plan returns status=planned_no_model"
    - "POST /agent/runs/stream returns text/event-stream public progress events"
    - "Planner output keeps model_calls=false and actual_tool_execution=false"
    - "Planner output keeps chain_of_thought_exposed=false"
    - "Planner phases include security_resolution, entitlement_gate, data_fetch, evidence_binding, and answer_contract"
    - "Each step has at most 3 planned read-only tool calls"
    - "Planner rejects plans that exceed requested max_steps"
    - "Progress events are public tool/run events, not hidden reasoning"
    - "Stop conditions include two_consecutive_same_error"
    - "Retry policy keeps retries non-billable"
    - "No live model calls, actual tool execution, model token stream, chain-of-thought, live entitlement reads, or frontend changes are claimed"
  commands_succeed:
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:tool-loop-agent
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /agent/runtime returns tool_loop_agent.status=tool_loop_agent_planner_scaffold"
    - "POST /agent/runs/plan returns planned phases, <=3 tool calls per step, public progress events, and no model/tool execution"
    - "POST /agent/runs/stream returns run/tool progress SSE events with no prompt text"
```

## Acceptance Notes

- This task completes the no-model planner scaffold for the Sprint 1.3
  ToolLoopAgent item.
- Live model token streaming, actual tool execution, real model calls, and
  frontend progress rendering remain separate follow-up work.

## Rollback Point

- Revert the commit that adds ToolLoopAgent planner behavior, Worker plan route,
  planner contract checker, and tracker/governance changes.
