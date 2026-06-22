# Notes: tool-route-replay

## Decision

Added a Worker-level route replay harness for all 16 P0 golden tool fixtures and
fed the result into the Sprint 1.2 readiness ledger.

## Why

The previous readiness gate correctly refused to claim route replay because it
only knew about static fixture validation. The Worker already exposes route
handlers for all 16 P0 tool names across `/tools`, `/analytics`, and
`/documents`, so the smallest coherent step was to replay the committed
fixtures through `app.request()` and compare the canonical response projection.

## Verification Surface

- `apps/worker/src/tool-route-replay.test.ts`
- `deploy/governance/sprint1-tool-route-replay.contract.json`
- `scripts/check-tool-route-replay-contract.mjs`
- `npm run test -- apps/worker/src/tool-route-replay.test.ts`
- `npm run check:tool-route-replay`
- `npm run check:tool-route-replay-readiness`

## Deferred

- Live MCP tools/call smoke.
- Evidence record/source-ref insert smoke.
- Partner source-row sample manifest and data-owner signoff.
- Partner-approved production corpus.
