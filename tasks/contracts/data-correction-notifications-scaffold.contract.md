# Data Correction Notifications Scaffold Contract

## Objective

Complete the backend-only Sprint 2.4 DAT-08 / US-O05 scaffold for marking
saved reports affected by data corrections and planning user notifications.

## Required Surfaces

- Package: `@aiphabee/research-runtime`
- Runtime route: `GET /research/runtime`
- Planner route: `POST /research/data-corrections/plan`
- Contract: `deploy/research/data-correction-notifications.contract.json`
- Checker: `npm run check:data-correction-notifications`
- Data correction table scaffold: `aiphabee_core.data_correction_event`
- Saved report impact table scaffold: `aiphabee_core.research_run_correction_impact`
- User notification table scaffold: `aiphabee_core.user_notification`

## Required Guarantees

- Use standard response envelopes.
- Require source record IDs for corrections.
- Match correction source records against saved-run evidence snapshots.
- Mark affected saved reports without mutating old snapshots.
- Preserve `old_report_mutation_allowed=false` and `silent_rewrite_allowed=false`.
- Plan in-app/email user notifications through `AIPHABEE_EVENTS_QUEUE` without
  writing queue messages.
- Do not execute tools.
- Do not write DB rows.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes correction, impact, and notification
  table scaffolds.
- Package and Worker targeted tests pass.
- Worker and Research Runtime typecheck/build pass.
- Sprint tracker row is checked and Sprint 2.4 count is updated.
