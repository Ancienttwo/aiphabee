# Task Contract: mcp-runtime-schema-snapshot

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: mcp-runtime-schema-snapshot
> **Last Updated**: 2026-06-22 00:00 +08
> **Notes File**:
> `tasks/notes/mcp-runtime-schema-snapshot.notes.md`

## Goal

Serve MCP tool schema snapshots from runtime surfaces so Sprint 1.2 no longer
treats runtime schema serving as a route replay blocker.

## Scope

- In scope:
  - `@aiphabee/mcp-runtime` schema snapshot metadata;
  - `GET /mcp/runtime/tool-schemas` worker route;
  - `tools/list` schema snapshot summary and descriptor snapshot;
  - governance contract/checker;
  - Sprint tracker and deferred-ledger updates.
- Out of scope:
  - live MCP auth middleware;
  - live MCP `tools/call` execution;
  - hosted external schema registry;
  - server-orchestrated live route replay;
  - live DB writes or partner source rows;
  - frontend.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Runtime capability reports runtime_schema_serving=true"
    - "GET /mcp/runtime/tool-schemas returns all 16 P0 tool schema snapshots"
    - "tools/list keeps descriptor details behind the MCP rights gate"
    - "Readiness gate removes runtime_schema_serving from blockers"
    - "No live tool execution or frontend changes are introduced"
  commands_succeed:
    - npm run check:mcp-runtime-schema-snapshot
    - npm run test --workspace @aiphabee/mcp-runtime
    - npm run test --workspace @aiphabee/worker
    - npm run check:tool-route-replay-readiness
    - npm run check:tool-route-replay-readiness-fixtures
    - npm run check
    - git diff --check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- Passing the runtime schema snapshot check means schema metadata is locally
  serviceable and tied to the Tool Registry/schema contract.
- It does not claim live MCP execution, live route replay, or partner data.

## Rollback Point

- Revert the commit that adds runtime schema snapshot serving and updates the
  readiness gate.
