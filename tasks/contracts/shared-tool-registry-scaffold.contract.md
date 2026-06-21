# Task Contract: shared-tool-registry-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-shared-tool-registry-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-shared-tool-registry
> **Last Updated**: 2026-06-21 00:30 +08
> **Notes File**:
> `tasks/notes/shared-tool-registry-scaffold.notes.md`

## Goal

Create a shared Tool Registry scaffold that centralizes tool schema, version,
permission, execution, and testing metadata without enabling tool execution.

## Scope

- In scope:
  - `@aiphabee/tool-registry` workspace package;
  - 9 planned read-only tool definitions;
  - schema IDs and standard response envelope flags;
  - required scope and rights-aware metadata;
  - execution posture that blocks arbitrary SQL/URL and live data access;
  - required golden fixture paths, not fixture contents;
  - agent runtime registry source migration;
  - Worker `/tools/runtime` capability;
  - repo-level registry contract checker;
  - tracker/governance updates.
- Out of scope:
  - individual tool handlers;
  - MCP/API endpoint implementation;
  - live Serving reads;
  - partner market data rows;
  - golden fixture implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/agent-runtime-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/agent-runtime/**
  - packages/tool-registry/**
  - plans/plan-shared-tool-registry-scaffold.md
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/shared-tool-registry-scaffold.contract.md
  - tasks/notes/agent-runtime-scaffold.notes.md
  - tasks/notes/shared-tool-registry-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Tool registry defines planned read-only tool metadata for the Sprint 1.2 P0 tool set"
    - "Every registry entry has name, version, schema, permissions, execution, testing, and status metadata"
    - "Registry capability reports schema_ready=true, rights_aware=true, standard_response_envelope=true, execution_ready=false"
    - "Registry blocks arbitrary SQL, arbitrary URL, and unregistered tools"
    - "Agent runtime reads registered tools from shared registry"
    - "Worker exposes GET /tools/runtime"
    - "No individual tool handler, live data access, provider secret, MCP endpoint, or frontend change is committed"
  commands_succeed:
    - npm run test -- packages/tool-registry/src/index.test.ts packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /tools/runtime returns status=shared_tool_registry_scaffold"
    - "GET /tools/runtime returns tool_count=9"
    - "GET /tools/runtime returns execution_ready=false"
```

## Acceptance Notes

- This task completes the shared registry scaffold only.
- It does not implement any registered tool handler.
- Tool-specific JSON Schema refinement, golden fixtures, and Evidence/Lineage
  integration remain future work.

## Rollback Point

- Revert the commit that adds `@aiphabee/tool-registry`, `/tools/runtime`,
  registry contract checker, agent-runtime source migration, and tracker update.
