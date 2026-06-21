# Financial Ratios Scaffold Notes

## Summary

Implemented the Sprint 2.1 backend `get_financial_ratios` scaffold.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getFinancialRatiosCapabilities()`
  - `getFinancialRatios()`
- `GET /analytics/runtime` reports `financial_ratios` capability.
- `POST /analytics/financial-ratios` returns a standard envelope with:
  - deterministic ratio definitions
  - formula version `financial-ratios-v0`
  - source input values and source record IDs
  - blocked reasons for missing/held denominator cases
  - synthetic percentile metadata
- Supported ratios:
  - `net_margin`
  - `return_on_assets`
  - `return_on_equity`
  - `asset_turnover`
  - `equity_multiplier`

## Non-Goals

- No frontend ratios UI.
- No valuation multiples.
- No live peer constituents.
- No MCP registration.
- Return/risk/Beta calculations are covered by
  `docs/governance/returns-risk-scaffold.md`.

## Verification

Passed:

- `npm run check:financial-ratios`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- `POST /analytics/financial-ratios` smoke for `00700.HK`
