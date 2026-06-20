# Task Contract: resolve-security-tool-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-resolve-security-tool-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-resolve-security-tool
> **Last Updated**: 2026-06-21 00:40 +08
> **Notes File**:
> `tasks/notes/resolve-security-tool-scaffold.notes.md`

## Goal

Create a no-live `resolve_security` tool scaffold that resolves synthetic code,
symbol, name, and historical-name lookups to instrument candidates while
preserving ambiguity.

## Scope

- In scope:
  - `@aiphabee/security-tools` package;
  - synthetic security master fixture rows;
  - code/symbol/name/historical-name lookup;
  - ambiguity candidate output without silent selection;
  - `POST /tools/resolve-security` Worker route;
  - standard success/error envelope usage;
  - registry entry update for `resolve_security`;
  - repo-level resolve-security contract checker;
  - tracker/governance updates.
- Out of scope:
  - live security master DB reads;
  - partner market data rows;
  - MCP endpoint implementation;
  - other tool handlers;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/registry.contract.json
  - deploy/tools/resolve-security.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/resolve-security-tool-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/security-tools/**
  - packages/tool-registry/**
  - plans/plan-resolve-security-tool-scaffold.md
  - scripts/check-security-tools-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/resolve-security-tool-scaffold.contract.md
  - tasks/notes/resolve-security-tool-scaffold.notes.md
  - tasks/notes/shared-tool-registry-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Code/symbol variants resolve to one synthetic instrument id"
    - "Chinese, English, and historical names resolve to one synthetic instrument id"
    - "Ambiguous lookups return candidates without selectedInstrumentId"
    - "Unknown lookups return NOT_FOUND through the Worker route"
    - "Empty lookups return SCOPE_DENIED through the Worker route"
    - "Registry marks resolve_security as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP endpoint, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/security-tools/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:security-tools
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/resolve-security with 00700.HK returns selectedInstrumentId=eq_hk_00700"
    - "POST /tools/resolve-security with ABC returns ambiguous candidates and no selectedInstrumentId"
    - "GET /tools/runtime reports handler_ready_tool_count=1"
```

## Acceptance Notes

- This task completes a no-live `resolve_security` scaffold only.
- It does not replace partner-approved security master data or live database
  reads.
- Other Sprint 1.2 tools remain unimplemented.

## Rollback Point

- Revert the commit that adds `@aiphabee/security-tools`, the Worker
  resolve-security route, registry status update, contract checker, and tracker
  update.
