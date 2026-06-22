# Serving Quality Live Readiness Contract

## Acceptance

- `GET /gateway/serving-quality/live-readiness` returns the standard success envelope.
- `GET /gateway/runtime` exposes `serving_store.serving_quality_live_readiness`.
- The report covers `PASS`, `WARN`, `HOLD`, and `REJECT_RAW`.
- `HOLD` and `REJECT_RAW` are isolated before Serving query/sql/execution and return `DATA_QUALITY_HOLD`.
- `PASS` and `WARN` may plan SQL text, but execution stays deferred and rows stay empty until live Serving activation.
- Tracker §M `DAT-06` is checked only with this contract and checker present.

## Command

`npm run check:serving-quality-live-readiness`
