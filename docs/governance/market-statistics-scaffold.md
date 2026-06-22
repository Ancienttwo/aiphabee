# Market Statistics Scaffold

Status: local contract complete

This slice closes the Phase 4 backlog item for market breadth, ownership and
short-selling, and buybacks/placements as backend-only analytics tools.

## Scope

- Package: `@aiphabee/analytics-tools`
- Runtime capability: `GET /analytics/runtime`
- Routes:
  - `POST /analytics/market-breadth`
  - `POST /analytics/ownership-short-selling`
  - `POST /analytics/buybacks-placements`
- Contract: `deploy/analytics/market-statistics.contract.json`
- Gate: `npm run check:market-statistics`

## Invariants

- Market statistics require explicit authorized data access before returning rows.
- Unauthorized calls return `blocked_authorization`.
- Security-specific calls return `blocked_resolution` when the security cannot
  be resolved after authorization.
- Outputs include `source_record_ids`.
- The scaffold uses deterministic synthetic samples only; it does not read live
  market statistics, emit SQL, write persistent state, or render frontend UI.

## Verification

Run:

```sh
npm run check:market-statistics
npx vitest run packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts
```
