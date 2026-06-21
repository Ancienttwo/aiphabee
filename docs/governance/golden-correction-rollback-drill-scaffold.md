# Golden Correction Rollback Drill Scaffold

> **Status**: Backend scaffold
> **Last Updated**: 2026-06-21 22:35 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/golden-correction-rollback-drill-scaffold.contract.md`

This slice completes the backend-only Sprint 3.3 §19.1 scaffold for proving the
golden fixture gate, data-correction marking path, and rollback replay drill can
be exercised together without mutating old reports or enabling live writes.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/research-runtime` | Owns saved research run, replay diff, correction notification, and drill planning |
| Runtime route | `GET /research/runtime` | Reports nested `golden_correction_rollback_drill` readiness |
| Drill route | `POST /research/golden-correction-rollback-drill/plan` | Returns synthetic fixture gate, correction notification plan, and rollback replay plan |
| Golden fixture gate | `npm run test:golden` | Verifies 8 synthetic quality samples and 16 tool golden fixtures |
| Contract | `deploy/research/golden-correction-rollback-drill.contract.json` | Guards sample counts, required steps, no-live boundaries, and linked manifests |
| Schema scaffold | `core.golden_correction_rollback_drill`, `governance.golden_correction_rollback_drill_contract` | Empty future persistence tables |
| Reused schema scaffolds | `core.data_correction_event`, `core.research_run_correction_impact` | Owned by the data-correction notification slice |
| Explicitly absent | Production partner corpus, live correction writes, queue fanout, live rollback execution, frontend release UI | Remain blocked or delegated |

## P2 Concrete Trace

1. Caller requests `POST /research/golden-correction-rollback-drill/plan`.
2. Worker normalizes optional manifest counts, correction input, notification
   channels, and rollback reason.
3. `@aiphabee/research-runtime` creates a synthetic saved run using
   `src_hk_financial_restatement_pass_001`.
4. The drill calls `createDataCorrectionNotificationPlan()` to mark the saved
   run as affected and plan `in_app` or `email` user notifications.
5. The drill calls `createResearchRunReplayPlan()` with corrected data version
   inputs, producing a diff while preserving the old report snapshot.
6. Response returns standard envelope metadata with no SQL, no queue writes, no
   live tool/model execution, and `old_report_mutation_allowed=false`.

## P3 Design Decision

Selected a no-write drill planner inside `@aiphabee/research-runtime` instead
of adding another runtime package.

Reason:

- The pressure point is the handoff between existing research saved-run,
  correction notification, and replay plan contracts.
- The release requirement asks for a rollback exercise, not a production
  rollback executor.
- The golden fixture command and manifests are already repo-level gates, so the
  drill should reference and validate them rather than fork fixture logic.

Tradeoff:

- The repo can now prove the release drill path and old-report immutability.
- Production partner corpus signoff, live correction persistence, and frontend
  operator UI remain future work.

## Verification

Run the focused gate:

- `npm run check:golden-correction-rollback-drill`
- `npm run check:database`
- `npm run test:golden`
- `npx vitest run packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/research-runtime`
- `npm run build --workspace @aiphabee/worker`
