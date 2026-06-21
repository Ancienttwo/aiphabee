# Plan: Agent Run Context Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 03:04 +08
> **Slug**: agent-run-context-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/agent-run-context-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/agent-run-context-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic Agent run context scaffold for Sprint 1.3.
- Routing reason: Sprint 1.2 tool/evidence surfaces are complete locally; the
  next non-frontend Agent Runtime requirement is a complete per-run context
  with run/user/workspace/subscription/entitlement/tool-version/budget/model
  fields before adding ToolLoopAgent streaming or real model calls.
- Due diligence:
  - P1 map: `@aiphabee/agent-runtime`, Worker `GET /agent/runtime`, Worker
    `POST /agent/runs/dry-run`, shared Tool Registry, and
    `deploy/agent/run-context.contract.json`.
  - P2 trace: dry-run request -> context normalization -> registered tool
    validation -> tool/version/scope expansion -> default-deny entitlement
    context -> standard response envelope.
  - P3 decision rationale: add context and budget planning without enabling
    live model calls, streaming, live entitlement reads, MCP redistribution, or
    frontend evidence cards.

## Workflow Inventory

- Active plan: `plans/plan-agent-run-context-scaffold.md`
- Task contract:
  `tasks/contracts/agent-run-context-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/agent-run-context-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/agent-run-context-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extend `createAgentRunSkeleton()` with `run_context`.
- Include run, user, workspace, subscription, entitlements, toolset, budget,
  and model sections.
- Keep entitlement policy synthetic/default-deny until partner rights and live
  DB policy reads are authorized.
- Keep model tier fixed to `dry_run` and `model_calls=false`.
- Add `deploy/agent/run-context.contract.json` and
  `npm run check:agent-run-context`.

## Task Breakdown

- [x] Add Agent run context and budget shape to `@aiphabee/agent-runtime`.
- [x] Wire Worker dry-run input fields into run context output.
- [x] Add package and Worker tests for user/workspace/plan/entitlement/tool
  version/budget/model context.
- [x] Add run-context contract checker and root check integration.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
