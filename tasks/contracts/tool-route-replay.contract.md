# Task Contract: tool-route-replay

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-tool-route-replay
> **Last Updated**: 2026-06-22 00:00 +08
> **Notes File**:
> `tasks/notes/tool-route-replay.notes.md`

## Goal

Replay all 16 PRD §9.2 P0 tool golden fixtures through the real Worker route
surface and feed that evidence into the Sprint 1.2 readiness ledger.

## Scope

- In scope:
  - Worker-level `app.request()` replay test for all 16 golden tool fixtures;
  - route map contract for `/tools`, `/analytics`, and `/documents` P0 routes;
  - canonical golden projection comparison for status, provenance,
    data/methodology version, usage rows, and no-live posture;
  - contract checker and root `npm run check` wiring;
  - readiness contract update that removes route replay from remaining blockers;
  - tracker, todo, governance, and notes updates.
- Out of scope:
  - MCP live `tools/call` execution;
  - partner-approved production corpus;
  - live Evidence/Lineage DB writes;
  - partner source rows or data-owner signoff;
  - frontend.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "16 manifest tools map to 16 Worker routes"
    - "Every golden fixture request is replayed through app.request"
    - "Canonical route response projection equals fixture expected_response"
    - "Route replay contract keeps MCP live protocol, DB writes, partner rows, and frontend false"
    - "Readiness ledger removes live_route_replay from remaining blockers"
    - "Sprint 1.2 exit DoD remains unchecked"
  commands_succeed:
    - npm run test -- apps/worker/src/tool-route-replay.test.ts
    - npm run check:tool-route-replay
    - npm run check:tool-route-replay-readiness
    - npm run check:tool-route-replay-readiness-fixtures
    - npm run test:golden
    - npm run check
    - git diff --check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- Passing the route replay check means synthetic golden fixtures are exercised
  through Worker routes.
- It does not claim partner-live data, MCP live execution, DB writes, or
  production corpus readiness.

## Rollback Point

- Revert the commit that adds the tool route replay harness/contract/checker and
  readiness/tracker/task documentation updates.
