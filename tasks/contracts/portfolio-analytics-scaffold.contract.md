# Task Contract: Portfolio Analytics Scaffold

## Objective

Implement the Phase 4 `get_portfolio_analytics` backend scaffold without enabling trading advice, live holdings reads, persistent writes, SQL, or frontend work.

## Acceptance

- `@aiphabee/analytics-tools` exposes `getPortfolioAnalytics()` and `getPortfolioAnalyticsCapabilities()`.
- `GET /analytics/runtime` reports `portfolio_analytics`.
- `POST /analytics/portfolio` returns standard envelopes for authorized holdings and blocks missing authorization.
- `deploy/analytics/portfolio-analytics.contract.json` records no-live/no-advice invariants.
- `npm run check:portfolio-analytics` validates source, tests, package scripts, and tracker sync.
- The Phase 4 tracker item is checked with the contract/check evidence named inline.

## Out Of Scope

- Live brokerage/portfolio provider integration.
- User file upload holdings import.
- Buy/sell/hold recommendations.
- Rebalancing instructions.
- Frontend portfolio UI.
