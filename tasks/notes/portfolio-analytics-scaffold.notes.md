# Portfolio Analytics Scaffold Notes

## Completed

- Added `PORTFOLIO_ANALYTICS_VERSION`.
- Added `getPortfolioAnalyticsCapabilities()`.
- Added `getPortfolioAnalytics()` with explicit `authorizedHoldings` gating.
- Added Worker `POST /analytics/portfolio` and `GET /analytics/runtime` capability exposure.
- Added package and Worker tests for capability, blocked authorization, and authorized holdings planning.
- Added contract/checker and wired `check:portfolio-analytics` into root `npm run check`.

## Verification

- `npm run check:portfolio-analytics`
- Targeted Vitest for analytics package and Worker route

## Limits

- No live portfolio provider, no SQL, no persistent writes.
- Position values use caller-provided market value or synthetic quote-derived value.
- Output is descriptive analytics only; trading advice flags are hard false.
