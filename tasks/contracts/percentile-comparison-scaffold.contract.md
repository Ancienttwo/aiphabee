# Percentile Comparison Scaffold Contract

## Objective

Complete the backend-only Sprint 2.1 ANA-02 percentile comparison scaffold:

- peer percentile comparison
- index percentile comparison
- own-history percentile comparison
- explicit benchmark and constituent as-of metadata

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Percentile route: `POST /analytics/percentile-comparison`
- Contract: `deploy/analytics/percentile-comparison.contract.json`
- Checker: `npm run check:percentile-comparison`

## Required Guarantees

- Use standard response envelopes.
- Reuse `resolve_security`, `get_financial_ratios`, and
  `calculate_returns_risk`.
- Keep live market-data access disabled.
- Keep frontend rendering disabled.
- Keep SQL emission disabled.
- Return subject metric, benchmark type, benchmark ID, benchmark as-of,
  constituent as-of, constituents/history observations, percentile rank, and
  point-in-time policy.
- Mark live constituents disabled.
- Do not silently pick ambiguous securities.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves peer/index/history percentiles and as-of metadata.
- Sprint tracker row is checked only for percentile comparison; historical
  screening future-data safeguards and UI rows remain open.
