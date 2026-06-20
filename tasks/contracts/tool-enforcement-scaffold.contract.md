# Task Contract: tool-enforcement-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-tool-enforcement-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-tool-enforcement
> **Last Updated**: 2026-06-21 04:00 +08
> **Notes File**: `tasks/notes/tool-enforcement-scaffold.notes.md`

## Goal

Create a no-live Agent planner contract proving requested tools are registered,
versioned, schema-bound, permission-aware, no-arbitrary-SQL/URL, and read-only
before any future execution boundary can consume them.

## Scope

- In scope:
  - `tool_enforcement` in `GET /agent/runtime`;
  - `tool_enforcement` in `POST /agent/runs/plan`;
  - registry version, registered tool count, requested tools, and denied tool
    behavior;
  - per-tool checks for registration, version, schemas, scope, rights-aware
    metadata, standard response envelope, no arbitrary SQL/URL, and no live data;
  - planned tool-call fields carrying enforcement metadata;
  - rejection of `sql.query` / `http.fetch` as unregistered tool names;
  - contract checker and tracker/governance updates.
- Out of scope:
  - actual tool execution;
  - runtime schema serving;
  - MCP protocol endpoint;
  - live entitlement DB reads;
  - frontend Ask or evidence cards.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/tool-enforcement.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/tool-enforcement-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-tool-enforcement-scaffold.md
  - scripts/check-tool-enforcement-contract.mjs
  - tasks/contracts/tool-enforcement-scaffold.contract.md
  - tasks/notes/tool-enforcement-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime advertises tool_enforcement"
    - "POST /agent/runs/plan returns tool_enforcement with all_checks_passed=true for registered tools"
    - "Each planned tool call carries version, input/output schema IDs, required scope, rights-aware flag, data classes, no arbitrary SQL/URL flags, live_data_access=false, and standard response envelope flag"
    - "sql.query and http.fetch are rejected as unregistered tools with SCOPE_DENIED"
    - "No model calls, actual tool calls, live data, or frontend changes are claimed"
  commands_succeed:
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:tool-enforcement
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/plan with registered tools returns tool_enforcement.status=allowed"
    - "POST /agent/runs/dry-run with sql.query/http.fetch returns 403 SCOPE_DENIED"
```

## Acceptance Notes

- This task completes a deterministic AGT-04 planner scaffold for Sprint 1.3.
- It builds on the Sprint 1.2 Tool Registry scaffold but does not replace future
  live execution enforcement.

## Rollback Point

- Revert the commit that adds tool enforcement behavior, contract checker, and
  tracker/governance updates.
