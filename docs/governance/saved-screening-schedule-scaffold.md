# Saved Screening Schedule Scaffold

## Scope

This scaffold closes ANA-05 for saved screening and periodic run planning without enabling live execution. It extends `@aiphabee/analytics-tools` with `createSavedScreeningPlan()` and exposes `POST /analytics/saved-screenings/plan`.

## Boundary

- Saved screening plans reuse `screen_securities` parsed conditions and point-in-time guard semantics.
- Workspace and owner context are required before a plan can return `planned_no_write`.
- Periodic runs support `manual`, `daily`, and `weekly` cadence. Daily/weekly schedules require `next_run_at`.
- Periodic runs link to the high-cost analytics queue route and Workflow binding as metadata only.
- The planner does not write `aiphabee_core.saved_screening`, `aiphabee_core.saved_screening_run_schedule`, or `aiphabee_core.saved_screening_run` rows.

## Disabled Surfaces

- Live screening execution
- Live DB writes
- Workflow execution
- Queue writes
- SQL execution
- Frontend saved-screen UI

## Verification

- `npm run check:saved-screening`
- `npm run check:database`
- `npx vitest run packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
