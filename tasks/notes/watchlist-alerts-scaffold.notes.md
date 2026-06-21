# Watchlist Alerts Scaffold Notes

## Summary

Implemented the Sprint 2.4 backend scaffold for watchlist price, announcement,
and metric alert planning.

## Current State

- `@aiphabee/watchlist-runtime` exposes watchlist alert capabilities.
- `GET /watchlist/runtime` reports no-live/no-write alert readiness.
- `POST /watchlist/alerts/plan` returns a deterministic no-write alert plan.
- The plan covers explicit confirmation, `alerts.write` scope, idempotency,
  dedupe, frequency, quiet period, evidence-required notification fanout, and
  price/announcement/metric evaluation sources.
- `core.watchlist`, `core.watchlist_item`, `core.watchlist_alert_rule`, and
  `core.watchlist_alert_event` exist as empty schema scaffolds for future
  persistence.
- The local contract checker verifies no live tool execution, no notification
  fanout, no persistent writes, `alerts.write` scope, dedupe/frequency/quiet
  controls, source evidence requirement, and database contract linkage.

## Non-Goals

- No live DB writes.
- No Queue notification fanout.
- No live tool execution.
- No external notification provider calls.
- No frontend watchlist or alert UI.

## Verification

Passed:

- `npm run check:watchlist-alerts`
- `npm run check:database`
- `npm run check:mcp-oauth-pkce`
- `npm run check:mcp-api-key`
- `npm run test -- packages/watchlist-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `npm run typecheck --workspace @aiphabee/watchlist-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/watchlist-runtime`
- `npm run build --workspace @aiphabee/worker`
