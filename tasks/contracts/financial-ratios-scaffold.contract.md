# Financial Ratios Scaffold Contract

## Objective

Complete the backend-only Sprint 2.1 `get_financial_ratios` scaffold:

- deterministic derived financial ratios
- formula version and methodology
- source-record traceability
- synthetic percentile scaffold

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Ratios route: `POST /analytics/financial-ratios`
- Contract: `deploy/analytics/financial-ratios.contract.json`
- Checker: `npm run check:financial-ratios`

## Required Guarantees

- Use standard response envelopes.
- Reuse `resolve_security` and `get_financial_facts`.
- Keep live market-data access disabled.
- Keep frontend rendering disabled.
- Keep SQL emission disabled.
- Return ratio definitions, formula version, required inputs, anomaly policy, source record IDs, and blocked reasons.
- Return percentile metadata while marking live peer constituents disabled.
- Do not silently pick ambiguous securities.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves computed ratios and percentile metadata.
- Sprint tracker row is checked only for deterministic ratios; return/risk/Beta
  is covered by `tasks/contracts/returns-risk-scaffold.contract.md`.
