# Notes: tool-route-replay-readiness

## Decision

Upgraded the Sprint 1.2 route replay readiness ledger to consume guarded MCP
protocol tool execution smoke evidence and guarded Evidence live DB write smoke
evidence.

## Why

The existing P0 catalog proves local consistency across registry, schemas, MCP
contract metadata, Agent enforcement, Evidence/Lineage descriptors, and golden
fixtures. Runtime schema serving is covered by the MCP runtime schema snapshot
contract, route replay is covered by the Worker route replay contract, and MCP
protocol `tools/call` execution is now covered by a smoke-token guarded
contract. Evidence table insert/read/delete is covered by a separate
header-and-token guarded smoke contract. The readiness ledger still does not
prove partner source rows or production Evidence persistence.

## Verification Surface

- `deploy/governance/sprint1-tool-route-replay-readiness.contract.json`
- `scripts/check-tool-route-replay-readiness-contract.mjs`
- `scripts/check-tool-route-replay-readiness-fixtures.mjs`
- `deploy/mcp/protocol-tool-execution-smoke.contract.json`
- `apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts`
- `deploy/evidence/live-db-write-smoke.contract.json`
- `apps/worker/src/evidence-live-db-write-smoke.test.ts`
- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay-readiness-fixtures`
- `npm run check:evidence-live-db-write-smoke`
- `npm run check:mcp-protocol-tool-execution-smoke`
- `npm run check:mcp-runtime-schema-snapshot`

## Deferred

- Partner source-row sample manifest and data-owner signoff.
- Production Evidence/Lineage persistence path.
