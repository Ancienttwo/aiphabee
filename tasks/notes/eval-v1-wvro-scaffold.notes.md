# Eval v1 WVRO Scaffold Notes

> **Date**: 2026-06-21
> **Owner**: Codex
> **Sprint**: 1.4
> **Tracker Item**: Eval v1 + WVRO instrumentation

## Summary

Added a no-write eval v1 scaffold to observability. It captures the four PRD
§16.3 quality metrics, unsourced numeric claim sampling target, and WVRO
eligibility criteria from PRD §4.3.

## Implementation Notes

- `@aiphabee/observability` now exports eval v1 capability and record helpers.
- Existing `run.eval` events include an `eval_v1` payload.
- `GET /observability/runtime` reports `eval_v1.status=eval_v1_wvro_scaffold`.
- `POST /observability/eval-v1/plan` returns a no-write eval record.
- Metrics are `fact_accuracy`, `calculation_accuracy`, `citation_accuracy`, and
  `correct_refusal_rate`.
- WVRO requires successful financial tool use, openable evidence, a high-intent
  action, and no data error / severe hallucination / compliance block.
- Persistent writes and live OTLP export remain disabled.

## Verification

- `npm run check:eval-v1`
- `npm run check:observability`
- `npm run test -- packages/observability/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/observability`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/observability`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `GET /observability/runtime` smoke returned
  `eval_v1.status=eval_v1_wvro_scaffold`.
- `POST /observability/eval-v1/plan` smoke returned `ok=true`,
  `status=planned_no_write`, `live_persistent_writes=false`,
  `wvro.eligible=true`, four passing quality metrics, and
  `unsourced_numeric_claims.target_rate=0.001`.

## Residual Gaps

- No persistent eval-store writes.
- No live OTLP export.
- No frontend analytics dashboard.
- No production partner-approved eval corpus.
- No automatic post-generation answer grading.
