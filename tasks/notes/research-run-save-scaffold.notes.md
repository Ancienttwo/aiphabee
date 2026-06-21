# Research Run Save Scaffold Notes

## Summary

Implemented the Sprint 2.2 backend RES-01 `save_research_run` scaffold for
complete research run snapshots.

## Current State

- `@aiphabee/research-runtime` exposes:
  - `getResearchRuntimeCapabilities()`
  - `createResearchRunSavePlan()`
- `GET /research/runtime` reports research run save capability.
- `POST /research/runs/save/plan` returns a standard envelope with:
  - `question_snapshot`
  - `tool_input_snapshot`
  - `evidence_snapshot`
  - `model_snapshot`
  - `schema_validation`
  - `replay_seed`
  - `persistence_plan`
- Missing required RES-01 fields return a standard `SCOPE_DENIED` error.
- `live_db_writes=false`, `sql_emitted=false`, and
  `immutable_report_snapshot=true` remain explicit.

## Non-Goals

- No live DB/R2 writes.
- No replay execution.
- No data/model/parameter diffing.
- No old-report mutation workflow.
- No frontend research-library UI.

## Verification

Passed:

- `npm run check:research-run-save`
- `npm run test -- packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/research-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

Observed residual:

- Root `npm run check` passed all lint/typecheck/test/golden/contract checks,
  including `check:research-run-save`, before it failed at `@aiphabee/web`
  `vite build` under the current Node runtime because
  `node:module.registerHooks` is unavailable.
- No `apps/web` files were changed in this backend slice.
