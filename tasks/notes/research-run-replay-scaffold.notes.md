# Notes: Research Run Replay Scaffold

Date: 2026-06-21

## Completed

- Extended `@aiphabee/research-runtime` with `createResearchRunReplayPlan`.
- Added `parameter_snapshot` to saved research run plans so replay can classify
  user parameter changes.
- Added Worker route `POST /research/runs/replay/plan`.
- Added `deploy/research/research-run-replay.contract.json`.
- Added `npm run check:research-run-replay`.
- Updated runtime capabilities with replay diff and old-report immutability
  readiness.

## Trace

1. Client submits `saved_run` from `POST /research/runs/save/plan`.
2. Client submits `current_run` with the rerun inputs.
3. Worker normalizes the payload and calls `createResearchRunReplayPlan`.
4. The planner creates a current no-write save plan, compares it against the
   saved snapshot, and returns:
   - `diff_summary`
   - `diffs.data`
   - `diffs.model`
   - `diffs.parameters`
   - `old_report`
   - `replay_execution`
5. The old saved snapshot is preserved through `old_report.preserved_snapshot_id`
   and cannot be silently rewritten.

## Verification

- `npm run check:research-run-save`
- `npm run check:research-run-replay`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/research-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`

## Residual Gaps

- No live DB/R2 persistence.
- No live model/tool replay execution.
- No notification workflow for changed reports.
- No frontend research-library display.
