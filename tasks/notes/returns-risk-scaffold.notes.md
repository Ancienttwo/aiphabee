# Returns/Risk Scaffold Notes

## Summary

Implemented the Sprint 2.1 backend `calculate_returns_risk` scaffold.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getReturnsRiskCapabilities()`
  - `calculateReturnsRisk()`
- `GET /analytics/runtime` reports `returns_risk` capability.
- `POST /analytics/returns-risk` returns a standard envelope with:
  - deterministic metric definitions
  - formula version `returns-risk-v0`
  - golden tolerance `0.000001`
  - price-history window metadata
  - source record IDs
  - blocked reasons for missing benchmark/history cases
- Supported metrics:
  - `total_return`
  - `average_daily_return`
  - `volatility_daily`
  - `volatility_annualized`
  - `max_drawdown`
  - `beta`

## Non-Goals

- No frontend returns/risk UI.
- No peer/index/history percentile comparison.
- No default live benchmark constituents.
- No MCP registration.
- No high-cost execution queue.

## Verification

Passed:

- `npm run check:returns-risk`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- `POST /analytics/returns-risk` smoke for `00700.HK` with benchmark `00700.HK`

Observed residual:

- Root `npm run check` passed through lint, typecheck, tests, golden checks, and
  all contract checks including `check:returns-risk`, then failed at
  `@aiphabee/web` `vite build` because current Node `v22.12.0` does not expose
  `node:module.registerHooks` required by `@cloudflare/vite-plugin`.
- No `apps/web` files were changed in this backend slice.
