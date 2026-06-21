# Task Contract: agent-run-context-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-agent-run-context-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-agent-run-context
> **Last Updated**: 2026-06-21 03:04 +08
> **Notes File**:
> `tasks/notes/agent-run-context-scaffold.notes.md`

## Goal

Create a deterministic Agent run context scaffold covering run/user/workspace,
subscription plan, entitlement policy posture, toolset versions, budget limits,
and model tier for Sprint 1.3.

## Scope

- In scope:
  - `run_context` on dry-run skeleton output;
  - request-provided or synthetic default user/workspace identifiers;
  - subscription plan capture;
  - default-deny entitlement context;
  - requested tool names expanded to versions, schemas, required scopes, and
    live-data flags;
  - budget dimensions for steps, parallel tools, tokens, rows, credits, and wall
    clock;
  - model tier fixed to `dry_run`;
  - Worker dry-run route parsing context fields;
  - contract checker for run context shape;
  - tracker/governance updates.
- Out of scope:
  - real model calls;
  - `streamText` / `generateText` execution;
  - live entitlement DB reads;
  - partner rights matrix loading;
  - ToolLoopAgent multi-step execution;
  - frontend Ask/evidence cards.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/run-context.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/agent-run-context-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-agent-run-context-scaffold.md
  - scripts/check-agent-run-context-contract.mjs
  - tasks/contracts/agent-run-context-scaffold.contract.md
  - tasks/notes/agent-run-context-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime reports run_context.context_ready=true and live_entitlement_reads=false"
    - "POST /agent/runs/dry-run returns run_context.run with run_id/request_id/status/mode/runtime_version"
    - "POST /agent/runs/dry-run returns user/workspace/subscription context"
    - "POST /agent/runs/dry-run returns entitlement context with default_deny and no live policy source"
    - "POST /agent/runs/dry-run expands requested registered tools to version/schema/scope metadata"
    - "POST /agent/runs/dry-run returns budget dimensions for steps, parallel tools, tokens, rows, credits, and wall clock"
    - "POST /agent/runs/dry-run keeps model tier dry_run and model_calls=false"
    - "No live model calls, streaming execution, live entitlement DB reads, partner rights matrix, MCP redistribution, or frontend changes are claimed"
  commands_succeed:
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:agent-run-context
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /agent/runtime returns run_context.status=agent_run_context_scaffold"
    - "POST /agent/runs/dry-run returns run_context with user/workspace/plan/tool versions/default-deny entitlements"
```

## Acceptance Notes

- This task completes the backend run context scaffold for Sprint 1.3.
- It does not implement ToolLoopAgent streaming, real model/provider calls,
  live entitlement reads, or frontend evidence cards.
- Root `npm run check` is not claimed for this slice because it is currently
  blocked by the out-of-scope `apps/web` Vite build under Node v22.12.0
  (`node:module.registerHooks` missing); `apps/web` was not changed.

## Rollback Point

- Revert the commit that adds Agent run context fields, Worker dry-run context
  parsing, the run-context contract checker, and tracker/governance updates.
