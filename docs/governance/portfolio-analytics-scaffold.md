# Portfolio Analytics Scaffold

Status: local contract complete

This slice closes the Phase 4 backlog item for `get_portfolio_analytics` as a backend-only scaffold.

## Scope

- Package: `@aiphabee/analytics-tools`
- Runtime capability: `GET /analytics/runtime`
- Route: `POST /analytics/portfolio`
- Contract: `deploy/analytics/portfolio-analytics.contract.json`
- Gate: `npm run check:portfolio-analytics`

## Invariants

- Portfolio input must be explicitly scoped to user-authorized holdings.
- Unauthorized requests return `blocked_authorization`.
- The output includes allocation, concentration, and return/risk summary fields only.
- The output does not include buy/sell/hold recommendations, personalized advice, or rebalance instructions.
- The scaffold uses local synthetic quote and returns/risk helpers only; it does not read live holdings, emit SQL, write persistent state, or render frontend UI.

## Verification

Run:

```sh
npm run check:portfolio-analytics
npx vitest run packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts
```
