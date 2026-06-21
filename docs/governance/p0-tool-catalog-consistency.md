# P0 Tool Catalog Consistency

> **Status**: Verified no-live catalog consistency
> **Last Updated**: 2026-06-21 18:45 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/p0-tool-catalog-consistency.contract.md`

This slice closes the PRD §9.2 P0 tool catalog consistency surface for all 16
tools. It does not add live tool execution, partner data reads, MCP live calls,
or frontend UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Shared Tool Registry | `packages/tool-registry` | Owns the 16-tool canonical name/order, scope, data classes, schema IDs, row/time limits, and no-live execution posture |
| Tool schemas | `deploy/tools/tool-schemas.contract.json` | Owns strict input/output schema IDs and standard envelope contracts |
| MCP runtime | `packages/mcp-runtime` | Owns argument validation, versioning, pagination/row/time limits, and usage-envelope consistency |
| Agent runtime | `packages/agent-runtime` | Owns registered-tool enforcement, evidence-card eligibility, numeric-source guards, deterministic calculation planning, and budget estimates |
| Evidence/Lineage | `packages/evidence-lineage` | Maps the 16 tools to no-write lineage dataset descriptors |
| Golden fixtures | `tests/golden/tools` | Provides one static no-live fixture per P0 tool |
| Catalog gate | `deploy/tools/p0-tool-catalog.contract.json` | Cross-checks registry/schema/MCP/golden/agent surfaces for all 16 names |

## P2 Concrete Trace

1. `npm run check:p0-tool-catalog` reads the P0 catalog contract.
2. The checker loads registry, schema, MCP schema validation, MCP versioning,
   MCP usage envelope, MCP pagination limits, golden manifest, and agent
   enforcement contracts.
3. It verifies the same 16 PRD §9.2 tool names are present on every required
   surface.
4. It verifies 16 schema pairs, 16 golden samples, and
   `registered_tool_count=16`.
5. It rejects secret-like values and keeps `frontend=false` and
   `live_tool_execution=false`.

## P3 Design Decision

Selected a consistency gate instead of adding duplicate route handlers. The six
previously missing PRD §9.2 tools already had backend no-live route contracts;
the gap was the unified catalog/MCP/schema/golden/agent enforcement surface.

This keeps the change small, preserves no-live posture, and makes future live
execution work fail first at the catalog gate if a tool is added to one surface
but not the others.

## Verification

Expected checks for this slice:

- `npm run check:p0-tool-catalog`
- `npm run check:tool-registry`
- `npm run check:tool-schemas`
- `npm run check:mcp-tool-schema-validation`
- `npm run check:mcp-tool-versioning`
- `npm run check:mcp-pagination-limits`
- `npm run check:mcp-usage-envelope`
- `npm run check:tool-enforcement`
- `npm run test:golden`
- `npm run typecheck`
- `npm run test`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Live MCP `tools/call` execution remains disabled.
- Partner/vendor live rows remain absent.
- `run_event_study`, multilingual/newbie-professional behavior, and frontend UI
  remain separate Sprint 3.1 items.
