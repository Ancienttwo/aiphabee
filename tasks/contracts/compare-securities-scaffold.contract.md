# Compare Securities Scaffold Contract

## Objective

Complete the backend-only Sprint 2.1 `compare_securities` scaffold for:

- ANA-01 2-5 security comparison
- ANA-02 explicit unit/currency comparability handling

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Compare route: `POST /analytics/compare-securities`
- Contract: `deploy/analytics/compare-securities.contract.json`
- Checker: `npm run check:compare-securities`

## Required Guarantees

- Use standard response envelopes.
- Accept 2-5 securities only.
- Reuse existing registered data surfaces:
  - `resolve_security`
  - `get_security_profile`
  - `get_quote_snapshot`
  - `get_financial_facts`
- Keep live market-data access disabled.
- Keep frontend rendering disabled.
- Keep SQL emission disabled.
- Do not silently pick ambiguous securities.
- Return base currency/unit and mark rows incomparable when metrics, quality, currency, or unit do not align.
- Do not perform FX conversion without an authoritative FX rate.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves runtime and compare behavior.
- Sprint tracker is checked only for `compare_securities`; ratios, risk, percentile, and UI items remain open.
