# Screen Securities Scaffold Contract

## Objective

Complete the backend-only Sprint 2.1 `screen_securities` scaffold for:

- ANA-03 natural language to editable structured filters
- ANA-04 explainable hit reasons and ranking
- US-W05 transparent screening results

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Screen route: `POST /analytics/screen-securities`
- Contract: `deploy/analytics/screen-securities.contract.json`
- Checker: `npm run check:screen-securities`

## Required Guarantees

- Use standard response envelopes.
- Parse deterministic supported natural-language conditions into editable fields.
- Expose field, operator, time basis, and missing-value rule before live execution.
- Require confirmation before any future live execution.
- Return preview hits against the synthetic universe.
- Return `why` explanations for hits and rejection reasons for non-hits.
- Keep live data access, frontend rendering, SQL, broad NLP, and model calls disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves `screen_securities` condition parsing and hit explanations.
- Sprint tracker rows are checked only for screening plan and hit-reason backend surfaces.
