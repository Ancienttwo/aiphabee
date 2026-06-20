# Plan: Tool Loop Agent Planner Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 03:14 +08
> **Slug**: tool-loop-agent-planner-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/tool-loop-agent-planner-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/tool-loop-agent-planner-scaffold.notes.md`

## Agentic Routing

- Selected route: no-model ToolLoopAgent planner for Sprint 1.3.
- Routing reason: Agent run context is now complete; the next backend Agent
  requirement is a deterministic multi-step tool plan with public progress
  events, parallel read-only limits, and stop/retry rules before real model or
  tool execution.
- Due diligence:
  - P1 map: `@aiphabee/agent-runtime`, Worker `GET /agent/runtime`, Worker
    `POST /agent/runs/plan`, Tool Registry metadata, and
    `deploy/agent/tool-loop-planner.contract.json`.
  - P2 trace: run context request -> registered tool validation -> phased
    planner -> max-3 parallel chunks -> public progress event contract -> stop
    and retry policy -> standard response envelope.
  - P3 decision rationale: add no-model planning and progress contracts without
    enabling live `streamText`, actual tool calls, chain-of-thought exposure,
    live entitlement reads, or frontend Ask.

## Workflow Inventory

- Active plan: `plans/plan-tool-loop-agent-planner-scaffold.md`
- Task contract:
  `tasks/contracts/tool-loop-agent-planner-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/tool-loop-agent-planner-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/tool-loop-agent-planner-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `createToolLoopAgentPlan()` in `@aiphabee/agent-runtime`.
- Plan phases:
  - security resolution;
  - entitlement gate;
  - read-only data fetch chunks;
  - evidence binding;
  - answer contract.
- Enforce `max_parallel_tools=3` and requested `max_steps`.
- Add public progress event names while keeping chain-of-thought hidden.
- Add stop conditions and retry policy for two consecutive same-class errors.
- Add Worker `POST /agent/runs/plan`.
- Add `deploy/agent/tool-loop-planner.contract.json` and
  `npm run check:tool-loop-agent`.

## Task Breakdown

- [x] Add no-model ToolLoopAgent planner and tests.
- [x] Add Worker route and route tests.
- [x] Add planner contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
