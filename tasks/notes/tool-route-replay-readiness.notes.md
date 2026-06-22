# Notes: tool-route-replay-readiness

## Decision

Added a Sprint 1.2 route replay readiness ledger instead of changing tool
handlers or enabling live execution.

## Why

The existing P0 catalog proves local consistency across registry, schemas, MCP
contract metadata, Agent enforcement, Evidence/Lineage descriptors, and golden
fixtures. It does not prove MCP live protocol execution, runtime schema serving,
server-orchestrated route replay, live DB writes, or partner source rows.

## Verification Surface

- `deploy/governance/sprint1-tool-route-replay-readiness.contract.json`
- `scripts/check-tool-route-replay-readiness-contract.mjs`
- `scripts/check-tool-route-replay-readiness-fixtures.mjs`
- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay-readiness-fixtures`

## Deferred

- Live MCP tools/call smoke.
- Runtime schema endpoint smoke.
- Golden fixture versus live route response diff.
- Evidence record/source-ref insert smoke.
- Partner source-row sample manifest and data-owner signoff.
