# Task Contract: mcp-protocol-tool-execution-smoke

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-mcp-protocol-tool-execution-smoke
> **Last Updated**: 2026-06-22 00:00 +08
> **Notes File**:
> `tasks/notes/mcp-protocol-tool-execution-smoke.notes.md`

## Goal

Prove a guarded MCP `POST /mcp` `tools/call` request can execute an existing
Worker tool route after origin, rights, scope, revocation, and schema planning.

## Scope

- In scope:
  - smoke-token gated MCP protocol execution path;
  - registered MCP tool to Worker route map;
  - focused Worker tests for public default-deny, success, missing scope, and
    revoked credential;
  - machine-checkable contract and readiness-ledger integration;
  - tracker, docs, and deferred-ledger updates.
- Out of scope:
  - live OAuth provider;
  - SDK/Inspector or target-client e2e;
  - partner source rows;
  - live Evidence/Lineage DB writes;
  - frontend.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Public MCP tools/call remains default-denied without the smoke token"
    - "Smoke-token request executes a registered Worker tool route"
    - "Missing scope is denied before route execution"
    - "Revoked credential is denied before route execution"
    - "Readiness ledger moves mcp_live_protocol_execution to a validated surface"
    - "No DB writes, partner rows, or frontend are introduced"
  commands_succeed:
    - npm run test -- apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts
    - npm run check:mcp-protocol-tool-execution-smoke
    - npm run check:mcp-protocol-release-gate
    - npm run check:tool-route-replay-readiness
    - npm run check:tool-route-replay-readiness-fixtures
    - npm run check
    - git diff --check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- Passing this task proves local guarded protocol execution, not production MCP
  client readiness.
- Sprint 1.2 DoD stays unchecked until partner source rows and data-owner
  signoff have evidence.

## Rollback Point

- Revert the commit that adds the guarded MCP smoke execution path, contract,
  tests, readiness v2 update, and tracker/task documentation updates.
