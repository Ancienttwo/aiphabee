# Task Contract: tool-route-replay-readiness

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-tool-route-replay-readiness
> **Last Updated**: 2026-06-22 00:00 +08
> **Notes File**:
> `tasks/notes/tool-route-replay-readiness.notes.md`

## Goal

Guard the Sprint 1.2 transition from static tool golden fixtures to live route
replay by making the remaining blockers explicit and machine-checkable.

## Scope

- In scope:
  - route replay readiness contract;
  - P0 catalog, registry, schema, MCP, Agent, Evidence/Lineage, and golden
    manifest cross-checks;
  - no-live posture validation;
  - fixture scenarios for early release, missing blockers, catalog drift, and
    checked DoD regressions;
  - tracker and deferred-ledger updates.
- Out of scope:
  - live MCP `tools/call` execution;
  - runtime schema endpoint serving;
  - server-orchestrated route replay;
  - partner source rows;
  - live Evidence/Lineage DB writes;
  - frontend.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Readiness contract records all 5 live blockers"
    - "release_transition_allowed remains false"
    - "All 16 P0 tools remain aligned across catalog/schema/MCP/golden/agent surfaces"
    - "Sprint 1.2 exit DoD remains unchecked"
    - "No frontend or live data execution is introduced"
  commands_succeed:
    - npm run check:tool-route-replay-readiness
    - npm run check:tool-route-replay-readiness-fixtures
    - npm run check:p0-tool-catalog
    - npm run check:tool-schemas
    - npm run check:mcp-tool-schema-validation
    - npm run check:mcp-protocol-release-gate
    - npm run check:evidence-service
    - npm run test:golden
    - npm run check
    - git diff --check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- Passing the readiness check means the blocked state is correctly represented.
- It does not claim live route replay, live DB writes, or partner row readiness.

## Rollback Point

- Revert the commit that adds the route replay readiness contract/checkers and
  tracker/task documentation updates.
