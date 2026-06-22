# MCP Runtime Schema Snapshot

> **Status**: Local contract, no live tool execution
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/mcp-runtime-schema-snapshot.contract.md`

This slice makes MCP tool schema metadata serviceable from runtime surfaces
without enabling live MCP tool execution or weakening the rights gate.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Tool Registry | `packages/tool-registry` | Owns canonical tool names, schema IDs, scopes, versions, retrieval limits |
| Tool schema contract | `deploy/tools/tool-schemas.contract.json` | Owns local input/output JSON Schema bodies |
| MCP runtime | `packages/mcp-runtime` | Projects schema snapshots into runtime capability, `tools/list`, and schema snapshot route data |
| Worker route | `apps/worker/src/index.ts` | Serves `GET /mcp/runtime/tool-schemas` through the standard success envelope |
| Governance gate | `deploy/mcp/runtime-schema-snapshot.contract.json` | Guards route, source contract, no-live posture, and 16-tool coverage |
| Sprint 1.2 readiness | `deploy/governance/sprint1-tool-route-replay-readiness.contract.json` | Treats runtime schema serving as a validated surface, not a remaining blocker |

## P2 Concrete Trace

1. Tool Registry provides each P0 tool name, schema IDs, scope, lifecycle, and
   retrieval metadata.
2. `createToolDescriptors()` attaches a `schema_snapshot` derived from the
   runtime input validation rules and Tool Registry schema IDs.
3. `createMcpProtocolPlan({ method: "tools/list" })` returns only a schema
   summary while redistribution rights are unconfirmed, and returns full
   descriptors with schema snapshots after the rights gate is confirmed.
4. `getMcpRuntimeSchemaSnapshot()` returns all 16 tool descriptors with strict
   input metadata and structured output envelope metadata.
5. Worker `GET /mcp/runtime/tool-schemas` wraps that snapshot in the standard
   success envelope with `usage.rows=16`.
6. `npm run check:mcp-runtime-schema-snapshot` verifies the contract, tool
   schema source, runtime source, worker route, and package script wiring.

## P3 Design Decision

Selected a runtime snapshot projection instead of a hosted schema registry or
live JSON Schema engine.

The invariant is that Tool Registry and `deploy/tools/tool-schemas.contract.json`
remain the schema authority. MCP runtime only serves a bounded snapshot that is
useful to clients and release gates while keeping live tool execution, auth
middleware, and partner data out of scope.

At 10x scale, drift fails first when a new tool is added to registry/schema but
not exposed through `getMcpRuntimeSchemaSnapshot()` or `tools/list`. The checker
keeps that failure local and deterministic.

## Verification

- `npm run check:mcp-runtime-schema-snapshot`
- `npm run test --workspace @aiphabee/mcp-runtime`
- `npm run test --workspace @aiphabee/worker`
- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay-readiness-fixtures`
- `npm run check`

## Residual Gaps

- MCP live auth middleware is absent.
- MCP live `tools/call` execution is absent.
- Server-orchestrated route replay is absent.
- Live DB writes and partner source rows are absent.
