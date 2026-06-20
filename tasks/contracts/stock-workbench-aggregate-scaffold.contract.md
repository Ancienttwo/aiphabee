# Stock Workbench Aggregate Scaffold Contract

## Objective

Complete the backend-only Sprint 1.4 stock workbench aggregate scaffold for:

- STK-01 company/security profile
- STK-02 quote, price history, returns, drawdown, and adjustment basis
- STK-03 financial facts trend surface
- STK-04 valuation/profitability derived metric definitions and anomaly
  handling
- STK-05 corporate action timeline

## Required Surfaces

- Package: `@aiphabee/workbench`
- Runtime route: `GET /workbench/runtime`
- Snapshot route: `POST /workbench/stock/snapshot`
- Contract: `deploy/workbench/stock-workbench.contract.json`
- Checker: `npm run check:stock-workbench`

## Required Guarantees

- Use standard response envelopes.
- Reuse existing registered tool package outputs rather than inventing new
  data facts.
- Keep live market-data access disabled.
- Keep frontend rendering disabled.
- Keep SQL emission disabled.
- Return data-quality section statuses.
- Return evidence/source record summary.
- Return `derived_metrics` with formula version, metric definitions, source
  inputs, anomaly flags, and blocked reasons.
- Compute deterministic profitability ratios from `get_financial_facts`:
  - `net_margin`
  - `return_on_assets`
  - `return_on_equity`
  - `asset_turnover`
  - `equity_multiplier`
- Block valuation multiples when market cap/share-count authority is missing:
  - `price_to_earnings`
  - `price_to_sales`
  - `price_to_book`
- Do not silently pick an ambiguous security.
- Explicitly mark unsupported sections:
  - announcements/document search

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves runtime, ready snapshot, and ambiguous-resolution
  behavior.
- Ready snapshot proves profitability metrics are computed and valuation metrics
  return `market_cap_unavailable` instead of fabricated values.
- Sprint tracker rows are checked only for the covered backend surfaces.
