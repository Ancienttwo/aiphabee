# Stock Workbench Aggregate Scaffold Contract

## Objective

Complete the backend-only Sprint 1.4 stock workbench aggregate scaffold for:

- STK-01 company/security profile
- STK-02 quote, price history, returns, drawdown, and adjustment basis
- STK-03 financial facts trend surface
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
- Do not silently pick an ambiguous security.
- Explicitly mark unsupported sections:
  - derived valuation metrics
  - announcements/document search

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves runtime, ready snapshot, and ambiguous-resolution
  behavior.
- Sprint tracker rows are checked only for the covered backend surfaces.
