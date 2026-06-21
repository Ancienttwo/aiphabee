# Point-in-Time Screening Safeguard Contract

## Objective

Complete the backend-only Sprint 2.1 guard for historical screening:

- historical screens must not use future classification metadata
- normal current/as-of-aligned screens expose point-in-time guard metadata
- blocked historical screens preserve parsed conditions for review

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Screen route: `POST /analytics/screen-securities`
- Contract: `deploy/analytics/screen-securities.contract.json`
- Checker: `npm run check:screen-securities`

## Required Guarantees

- Use standard response envelopes.
- Accept `classification_as_of` / `classificationAsOf` at the Worker boundary.
- Return `point_in_time_guard` for normal, unsupported, and blocked screen
  results.
- Set `uses_latest_classification` to `false`.
- Set `future_data_policy` to `block_future_classification`.
- Return `blocked_future_data` with zero universe/rows/credits when
  `classification_as_of > as_of`.
- Preserve parsed editable conditions on blocked results.
- Keep live market-data access disabled.
- Keep frontend rendering disabled.
- Keep SQL emission disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves both enforced and blocked guard states.
- Sprint tracker row is checked only for the backend guard; full live SEC-05
  historical constituents/industry/name data remains open.
