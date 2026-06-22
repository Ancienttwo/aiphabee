# Notes: mcp-runtime-schema-snapshot

## Decision

Added a local MCP runtime schema snapshot route and descriptor projection instead
of introducing a hosted schema registry or live tool execution path.

## Why

Sprint 1.2 already has local Tool Registry metadata and strict schema contracts,
but readiness still listed runtime schema serving as absent. The smallest
coherent closure is to project the existing schema IDs and validation metadata
through MCP runtime and Worker surfaces while preserving default-deny rights and
no-live execution.

## Verification Surface

- `packages/mcp-runtime/src/index.ts`
- `apps/worker/src/index.ts`
- `deploy/mcp/runtime-schema-snapshot.contract.json`
- `scripts/check-mcp-runtime-schema-snapshot-contract.mjs`
- `npm run check:mcp-runtime-schema-snapshot`
- `npm run check:tool-route-replay-readiness`

## Deferred

- Live MCP auth middleware.
- Live MCP `tools/call` execution.
- Server-orchestrated live route replay.
- Partner rows and live Evidence/Lineage writes.
