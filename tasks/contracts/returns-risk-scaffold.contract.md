# Returns/Risk Scaffold Contract

## Objective

Complete the backend-only Sprint 2.1 `calculate_returns_risk` scaffold:

- deterministic return metrics
- volatility and drawdown metrics
- Beta when an explicit benchmark is available
- formula version and golden tolerance metadata

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Returns/risk route: `POST /analytics/returns-risk`
- Contract: `deploy/analytics/returns-risk.contract.json`
- Checker: `npm run check:returns-risk`

## Required Guarantees

- Use standard response envelopes.
- Reuse `resolve_security` and `get_price_history`.
- Keep live market-data access disabled.
- Keep frontend rendering disabled.
- Keep SQL emission disabled.
- Return metric definitions, formula version, tolerance, source record IDs, and
  blocked reasons.
- Require an explicit benchmark for Beta.
- Do not silently pick ambiguous securities.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves return/risk metrics and benchmark Beta.
- Sprint tracker row is checked only for deterministic return/risk; percentile
  comparison and point-in-time screening safeguards remain open.
