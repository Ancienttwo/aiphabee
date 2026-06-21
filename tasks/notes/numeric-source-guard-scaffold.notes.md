# Numeric Source Guard Scaffold Notes

> **Date**: 2026-06-21
> **Owner**: Codex
> **Sprint**: 1.3
> **Tracker Item**: AGT-05

## Summary

Added a no-live numeric source guard to the Agent planner. In the current
no-execution state, concrete financial numbers are not allowed in the answer
contract unless future execution can bind them to tool results or deterministic
calculation references.

## Implementation Notes

- `GET /agent/runtime` now advertises `numeric_source_guard`.
- `POST /agent/runs/plan` now returns `numeric_source_guard`.
- The guard allows only `tool_result` and `deterministic_calculation` sources.
- The guard blocks `model_memory`, `training_data`, `unverified_prompt`, and
  `unstated_source`.
- The no-live answer contract returns `UNSOURCED_NUMERIC_CLAIM` for unsupported
  numeric claims.

## Verification

- `npm run test`
- `npm run test:golden`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:agent-run-context`
- `npm run check:tool-loop-agent`
- `npm run check:pre-tool-call-resolution`
- `npm run check:budget-stop-policy`
- `npm run check:tool-enforcement`
- `npm run check:numeric-source-guard`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `POST /agent/runs/plan` smoke through local `wrangler dev` returned
  `ok=true`, `status=planned_no_model`,
  `numeric_source_guard.status=guarded_no_actual_results`,
  `failure_code=UNSOURCED_NUMERIC_CLAIM`, and `modelCalls=false`.
- `git diff --name-only -- apps/web` returned no frontend diff.

## Residual Gaps

- No live tool results exist yet.
- No post-generation numeric extraction exists yet.
- No live evidence binding exists yet.
- Frontend evidence cards and UI labels remain out of scope.
