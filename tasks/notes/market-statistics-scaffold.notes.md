# Market Statistics Scaffold Notes

## Summary

Implemented the Phase 4 backend scaffold for market breadth, ownership and
short-selling, and buybacks/placements without enabling live data access.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getMarketBreadth()`
  - `getOwnershipAndShortSelling()`
  - `getBuybacksAndPlacements()`
- `GET /analytics/runtime` includes the three market-statistics capabilities.
- Worker exposes three standard-envelope routes:
  - `POST /analytics/market-breadth`
  - `POST /analytics/ownership-short-selling`
  - `POST /analytics/buybacks-placements`
- The local contract checker verifies authorization, blocked statuses,
  no-live/no-SQL invariants, source record IDs, tests, package scripts, and
  tracker sync.

## Non-Goals

- No live market-statistics provider reads.
- No DB writes.
- No SQL emission.
- No frontend market-statistics UI.
- No redistribution-rights claim beyond the local authorization gate.

## Verification

Run:

- `npm run check:market-statistics`
- `npx vitest run packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
