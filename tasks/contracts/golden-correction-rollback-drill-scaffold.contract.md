# Golden Correction Rollback Drill Scaffold Contract

## Scope

Complete the Sprint 3.3 §19.1 backend scaffold for a golden-sample gated data
correction and rollback replay drill.

## Required Surfaces

- `@aiphabee/research-runtime` exposes
  `golden_correction_rollback_drill` capabilities.
- `GET /research/runtime` includes nested drill readiness.
- `POST /research/golden-correction-rollback-drill/plan` returns the drill
  plan.
- Local contract checker:
  `npm run check:golden-correction-rollback-drill`.
- Golden fixture gate remains `npm run test:golden`.
- Empty schema scaffold:
  - `aiphabee_core.golden_correction_rollback_drill`
  - `aiphabee_governance.golden_correction_rollback_drill_contract`

## Behavioral Contract

- Golden fixture counts must remain 8 quality samples and 16 tool fixtures.
- Quality rule count must remain 12 for the current scaffold gate.
- Required drill steps:
  - `golden_fixture_gate`
  - `correction_event_plan`
  - `affected_report_mark`
  - `user_notification_plan`
  - `rollback_replay_plan`
- Drill must route through saved-run, data-correction notification, and replay
  planner semantics.
- Old reports must remain immutable:
  `old_report_mutation_allowed=false` and `silent_rewrite_allowed=false`.
- No live DB writes, queue writes, SQL, live rollback execution, or frontend UI.

## Non-Goals

- No production partner golden corpus loading.
- No live correction discovery or persistence.
- No Queue notification fanout.
- No live rollback executor.
- No frontend release checklist UI.
