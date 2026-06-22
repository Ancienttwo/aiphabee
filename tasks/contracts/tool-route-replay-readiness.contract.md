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
replay by making the remaining blocker explicit and machine-checkable.

## Scope

- In scope:
  - route replay readiness contract;
  - P0 catalog, registry, schema, MCP, Agent, Evidence/Lineage, and golden
    manifest cross-checks;
  - MCP runtime schema snapshot serving cross-check;
  - guarded MCP protocol tool execution smoke cross-check;
  - guarded Evidence live DB write smoke cross-check;
  - partner source row evidence packet gate cross-check;
  - partner-source posture validation through hash-only/redacted packet policy;
  - fixture scenarios for early release, missing blockers, catalog drift, and
    checked DoD regressions;
  - tracker and deferred-ledger updates.
- Out of scope:
  - partner source rows;
  - production Evidence/Lineage persistence;
  - frontend.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Readiness contract records partner source rows as the remaining live blocker"
    - "Runtime schema serving is validated through mcp runtime schema snapshot"
    - "MCP protocol tool execution smoke is validated through the guarded smoke contract"
    - "Evidence live DB write smoke is validated through the guarded smoke contract"
    - "Partner source row blocker points to partner_serving_rows_loaded evidence packet gate"
    - "release_transition_allowed remains false"
    - "All 16 P0 tools remain aligned across catalog/schema/MCP/golden/agent surfaces"
    - "Sprint 1.2 exit DoD remains unchecked"
    - "No frontend or live data execution is introduced"
  commands_succeed:
    - npm run check:tool-route-replay-readiness
    - npm run check:tool-route-replay-readiness-fixtures
    - npm run check:evidence-live-db-write-smoke
    - npm run check:mcp-protocol-tool-execution-smoke
    - npm run check:sprint1-live-data-evidence-manifest
    - npm run check:sprint1-live-data-evidence-packets
    - npm run check:p0-tool-catalog
    - npm run check:tool-schemas
    - npm run check:mcp-tool-schema-validation
    - npm run check:mcp-runtime-schema-snapshot
    - npm run check:mcp-protocol-release-gate
    - npm run check:evidence-service
    - npm run test:golden
    - npm run check
    - git diff --check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- Passing the readiness check means the blocked state is correctly represented.
- It claims only guarded smoke DB writes, not partner row readiness or production
  Evidence persistence.
- Partner rows remain blocked until an accepted `partner_serving_rows_loaded`
  packet and data-platform signoff exist.

## Rollback Point

- Revert the commit that adds the route replay readiness contract/checkers and
  tracker/task documentation updates.
