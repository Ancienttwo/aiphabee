# Percentile Comparison Scaffold Notes

## Summary

Implemented the Sprint 2.1 backend `compare_percentiles` scaffold for ANA-02.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getPercentileComparisonCapabilities()`
  - `comparePercentiles()`
- `GET /analytics/runtime` reports `percentile_comparison` capability.
- `POST /analytics/percentile-comparison` returns a standard envelope with:
  - subject metric value
  - peer/index/history benchmark comparisons
  - benchmark and constituent as-of metadata
  - point-in-time policy
  - percentile rank and sample count
  - source record IDs
- Supported subject metrics:
  - `net_margin`
  - `total_return`

## Non-Goals

- No frontend percentile UI.
- No live peer/index constituents.
- No broad historical industry/security-master classification.
- No MCP registration.
- No high-cost execution queue.

## Verification

Passed:

- `npm run check:percentile-comparison`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- `POST /analytics/percentile-comparison` smoke for `00700.HK`

Observed residual:

- Root `npm run check` is still expected to fail at `@aiphabee/web` `vite build`
  under Node `v22.12.0` because `@cloudflare/vite-plugin` requires
  `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.
