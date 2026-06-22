# Create Alert Tool Scaffold

Status: local contract complete

This slice closes the Phase 4 backlog item for `create_alert` as a backend-only
tool scaffold.

## Scope

- Package: `@aiphabee/watchlist-runtime`
- Runtime capability: `GET /watchlist/runtime`
- Tool route: `POST /tools/create-alert`
- Planner route: `POST /watchlist/alerts/plan`
- Contract: `deploy/watchlist/create-alert.contract.json`
- Gate: `npm run check:create-alert`

## Invariants

- `create_alert` requires explicit user confirmation.
- The tool requires independent `alerts.write` scope.
- The tool requires an idempotency key before it can reach `planned_no_write`.
- The response links back to the existing watchlist alert planner contract.
- The scaffold does not write database rows, enqueue notifications, emit SQL,
  execute live source tools, or render frontend UI.

## Verification

Run:

```sh
npm run check:create-alert
npx vitest run packages/watchlist-runtime/src/index.test.ts apps/worker/src/index.test.ts
```
