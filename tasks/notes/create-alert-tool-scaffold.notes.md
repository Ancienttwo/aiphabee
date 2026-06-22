# Create Alert Tool Scaffold Notes

## Summary

Implemented the Phase 4 backend scaffold for `create_alert` without enabling
live writes.

## Current State

- `@aiphabee/watchlist-runtime` exposes `getCreateAlertToolCapabilities()`.
- `createAlertToolPlan()` wraps the existing watchlist alert planner and returns
  `toolName: "create_alert"` plus a planner linkage to `plan_watchlist_alerts`.
- `POST /tools/create-alert` returns a standard success envelope.
- The route shares the same request normalization path as
  `POST /watchlist/alerts/plan`.
- The contract checker verifies explicit confirmation, independent
  `alerts.write` scope, idempotency key, no-live/no-write invariants, package
  scripts, tests, and tracker sync.

## Non-Goals

- No live DB writes.
- No Queue notification fanout.
- No live tool execution.
- No external notification provider calls.
- No frontend alert UI.

## Verification

Run:

- `npm run check:create-alert`
- `npx vitest run packages/watchlist-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/watchlist-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
