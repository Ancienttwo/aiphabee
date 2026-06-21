# Task Contract: p0-tool-catalog-consistency

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint31-p0-tool-catalog-consistency
> **Last Updated**: 2026-06-21 18:45 +08
> **Notes File**:
> `tasks/notes/p0-tool-catalog-consistency.notes.md`

## Goal

Close the PRD §9.2 P0 tool catalog consistency gap by ensuring all 16 required
tools are present across registry, schema, MCP validation/versioning/usage,
pagination limits, golden fixtures, and agent enforcement contracts.

## Scope

- In scope:
  - shared Tool Registry 16-tool catalog;
  - strict input/output schema pairs for the 16 tools;
  - MCP schema validation, versioning, pagination/row/time limit, and usage
    envelope catalog lists;
  - Agent runtime registered-tool count, evidence/numeric-source/budget
    coverage;
  - Evidence/Lineage tool-to-dataset descriptors;
  - one no-live golden fixture per P0 tool;
  - `check:p0-tool-catalog` cross-surface contract.
- Out of scope:
  - live tool execution;
  - live partner/vendor rows;
  - frontend;
  - `run_event_study`.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "All PRD §9.2 P0 16 tools are present in the shared registry"
    - "Tool schema contract exposes exactly 16 schema pairs"
    - "MCP schema validation/versioning/usage/pagination contracts include all 16 tools where applicable"
    - "Golden manifest includes exactly one fixture for every P0 tool"
    - "Agent tool enforcement reports registered_tool_count=16"
    - "No live execution, arbitrary SQL/URL, frontend, or partner data access is introduced"
  commands_succeed:
    - npm run check:p0-tool-catalog
    - npm run check:tool-registry
    - npm run check:tool-schemas
    - npm run check:mcp-tool-schema-validation
    - npm run check:mcp-tool-versioning
    - npm run check:mcp-pagination-limits
    - npm run check:mcp-usage-envelope
    - npm run check:tool-enforcement
    - npm run test:golden
    - npm run typecheck
    - npm run test
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task closes catalog consistency only.
- It does not claim live MCP tool execution, production data readiness, or
  frontend completion.

## Rollback Point

- Revert the commit that adds `p0-tool-catalog` contract/checker, expands
  registry/schema/MCP/agent/evidence/golden surfaces to 16 tools, and updates
  tracker/governance docs.
