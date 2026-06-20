# Task Contract: tool-schema-contract-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-tool-schema-contract-scaffold.md`
> **Task Profile**: docs-and-contracts
> **Owner**: Codex
> **Capability ID**: sprint12-tool-schema-contract
> **Last Updated**: 2026-06-21 02:39 +08
> **Notes File**:
> `tasks/notes/tool-schema-contract-scaffold.notes.md`

## Goal

Create a local JSON Schema contract for every registered Sprint 1.2 tool so
input schemas, output schemas, standard response envelope fields, and standard
error codes are checkable before MCP protocol serving exists.

## Scope

- In scope:
  - `deploy/tools/tool-schemas.contract.json`;
  - input schema IDs `tool.<tool>.input.v0` for all 9 tools;
  - output schema IDs `tool.<tool>.output.v0` for all 9 tools;
  - standard envelope fields: `ok`, `request_id`, `as_of`, `market_status`,
    `provenance`, and `usage`;
  - success `data` payload with `toolName`, `status`, and `liveDataAccess`;
  - standard error schema with machine-readable error code enum;
  - checker guard for no arbitrary SQL/URL input properties;
  - `npm run check:tool-schemas`;
  - tracker/governance updates.
- Out of scope:
  - runtime JSON Schema request validation;
  - MCP protocol schema serving;
  - generated TypeScript types;
  - per-tool golden fixture response validation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - deploy/tools/tool-schemas.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/tool-schema-contract-scaffold.md
  - package.json
  - plans/plan-tool-schema-contract-scaffold.md
  - scripts/check-tool-schemas-contract.mjs
  - tasks/contracts/tool-schema-contract-scaffold.contract.md
  - tasks/notes/tool-schema-contract-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "All 9 registered tools have input and output JSON Schema objects"
    - "Schema IDs match tool.<tool>.input.v0 and tool.<tool>.output.v0"
    - "Output schemas require standard envelope fields and data payload"
    - "Error schema enumerates standard machine-readable error codes"
    - "Input schemas disallow arbitrary SQL/URL properties"
    - "No runtime validator, MCP protocol serving, generated types, or frontend changes are committed"
  commands_succeed:
    - npm run check:tool-schemas
    - npm run check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes a local schema contract scaffold only.
- It does not claim runtime JSON Schema validation, MCP schema serving, or
  golden response validation.

## Rollback Point

- Revert the commit that adds `deploy/tools/tool-schemas.contract.json`,
  `scripts/check-tool-schemas-contract.mjs`, `check:tool-schemas`, and
  tracker/governance updates.
