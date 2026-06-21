# Plan: Shared Tool Registry Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 00:30 +08
> **Slug**: shared-tool-registry-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/shared-tool-registry-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/shared-tool-registry-scaffold.notes.md`

## Agentic Routing

- Selected route: shared Tool Registry scaffold for Sprint 1.2.
- Routing reason: agent runtime had local planned tool entries, but Sprint 1.2
  requires one shared registry for schema, version, permission, execution, and
  testing metadata.
- Due diligence:
  - P1 map: `@aiphabee/tool-registry`, `@aiphabee/agent-runtime`, Worker
    `/tools/runtime`, and `deploy/tools/registry.contract.json`.
  - P2 trace: registry definitions -> agent runtime policy -> Worker runtime
    capability -> contract checker.
  - P3 decision rationale: create metadata-only registry before tool handlers,
    MCP/API endpoints, or live data access.

## Workflow Inventory

- Active plan: `plans/plan-shared-tool-registry-scaffold.md`
- Task contract:
  `tasks/contracts/shared-tool-registry-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/shared-tool-registry-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/shared-tool-registry-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/tool-registry` workspace package.
- Register the planned read-only P0 tool set with schema IDs, versions,
  permissions, execution posture, and required golden fixture paths.
- Keep all handlers disabled: `handlerReady=false`, `liveDataAccess=false`,
  `allowArbitrarySql=false`, and `allowArbitraryUrl=false`.
- Move agent runtime registered tool policy to the shared registry.
- Expose Worker `/tools/runtime` capability.
- Add `deploy/tools/registry.contract.json` and `npm run check:tool-registry`.
- Keep individual tool handlers, MCP/API endpoints, live Serving reads, and
  frontend out of scope.

## Task Breakdown

- [x] Add shared tool registry package and tests.
- [x] Move agent runtime registered tool source to shared registry.
- [x] Expose Worker `/tools/runtime` capability and tests.
- [x] Add repo-level registry contract and checker.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
