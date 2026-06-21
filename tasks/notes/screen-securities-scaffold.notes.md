# Screen Securities Scaffold Notes

## Summary

Implemented the Sprint 2.1 backend `screen_securities` scaffold for ANA-03,
ANA-04, and US-W05.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getScreenSecuritiesCapabilities()`
  - `screenSecurities()`
- `GET /analytics/runtime` reports `screen_securities` capability.
- `POST /analytics/screen-securities` returns a standard envelope with:
  - deterministic parsed conditions
  - editable field/operator/value/time-basis/missing-value metadata
  - `requires_confirmation_before_live_execution=true`
  - synthetic preview hits
  - `why` explanations for hits
  - rejected rows with reasons
  - explainable ranking method
- Current parser supports deterministic threshold phrases such as
  `revenue above 100000` and `profitable`.

## Non-Goals

- No frontend screening UI.
- No broad NLP or model calls.
- No live universe execution.
- No MCP registration.
- No high-cost queueing.
- Financial ratios are covered by `docs/governance/financial-ratios-scaffold.md`.
- Return/risk/Beta is covered by `docs/governance/returns-risk-scaffold.md`.

## Verification

Passed:

- `npm run check:screen-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- `POST /analytics/screen-securities` smoke for `revenue above 100000 and profitable`
