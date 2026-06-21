# Compare Securities Scaffold Notes

## Summary

Implemented the Sprint 2.1 backend `compare_securities` scaffold for ANA-01 and
the first ANA-02 comparability surface.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getCompareSecuritiesCapabilities()`
  - `compareSecurities()`
- `GET /analytics/runtime` reports the analytics tool surface.
- `POST /analytics/compare-securities` returns a standard envelope with:
  - requested securities
  - per-row security/quote/financial facts
  - missing metric list
  - quality flags
  - source record IDs
  - base currency/unit
  - explicit incomparable reasons
- Ambiguous security resolution returns a blocked row and does not choose a candidate.
- FX conversion remains blocked without an authoritative FX rate.

## Non-Goals

- No frontend comparison UI.
- `screen_securities` is covered by `docs/governance/screen-securities-scaffold.md`.
- Financial ratios are covered by `docs/governance/financial-ratios-scaffold.md`.
- Return/risk/Beta is covered by `docs/governance/returns-risk-scaffold.md`.
- No MCP registration.
- No live data access or SQL execution.

## Verification

Passed:

- `npm run check:compare-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- `GET /analytics/runtime` smoke
- `POST /analytics/compare-securities` smoke for `00700.HK` and `08001.HK`
