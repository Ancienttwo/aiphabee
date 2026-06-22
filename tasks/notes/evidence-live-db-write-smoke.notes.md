# Notes: evidence-live-db-write-smoke

## Decision

Added a header-and-token guarded Evidence live DB write smoke route instead of
turning the default Evidence service planner into a production write path.

## Why

Sprint 1.2 already had no-write Evidence/Lineage planning, Worker route replay,
and guarded MCP protocol execution. The remaining local proof was that the
Worker can reach Hyperdrive and execute the Evidence table write/read/delete
shape. Keeping this as a smoke-only route preserves the no-write service
contract while letting the readiness ledger retire the `live_db_writes` blocker.

## Verification Surface

- `apps/worker/src/index.ts`
- `apps/worker/src/evidence-live-db-write-smoke.test.ts`
- `deploy/evidence/live-db-write-smoke.contract.json`
- `scripts/check-evidence-live-db-write-smoke-contract.mjs`
- `deploy/governance/sprint1-tool-route-replay-readiness.contract.json`
- `npm run test -- apps/worker/src/evidence-live-db-write-smoke.test.ts`
- `npm run check:evidence-live-db-write-smoke`
- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay-readiness-fixtures`

## Deferred

- Partner source-row sample manifest and data-owner signoff.
- Production Evidence/Lineage persistence path.
- Frontend rendering.
