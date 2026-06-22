# Saved Screening Schedule Scaffold Contract

## Source

- PRD: `docs/researches/AiphaBee_PRD_v1.0.md`
- Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Contract: `deploy/analytics/saved-screening-schedule.contract.json`

## Acceptance

- `@aiphabee/analytics-tools` exposes `SAVED_SCREENING_VERSION`, `getSavedScreeningCapabilities()`, and `createSavedScreeningPlan()`.
- Worker exposes `POST /analytics/saved-screenings/plan`.
- `GET /analytics/runtime` exposes `saved_screening`.
- The planner requires workspace, owner, and non-empty `screen_securities` parsed conditions before returning `planned_no_write`.
- Daily and weekly schedules require `next_run_at`; manual saved screens may remain unscheduled.
- Live DB writes, Workflow execution, Queue writes, SQL execution, live screening execution, and frontend rendering remain disabled.

## Verification

- `npm run check:saved-screening`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
