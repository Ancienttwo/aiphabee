# Data Correction Notifications Scaffold Notes

## Summary

Implemented the Sprint 2.4 backend scaffold for data-correction impact marking
and saved-report user notification planning.

## Current State

- `@aiphabee/research-runtime` exposes `data_correction_notifications`
  capability under `GET /research/runtime`.
- `POST /research/data-corrections/plan` returns a deterministic no-write plan.
- The plan matches correction `source_record_id` values against saved-run
  evidence snapshots and only marks matching saved reports as affected.
- The plan preserves saved report immutability through
  `old_report_mutation_allowed=false` and `silent_rewrite_allowed=false`.
- The plan creates no-write user notification items for `in_app` and `email`
  channels through `AIPHABEE_EVENTS_QUEUE`.
- `aiphabee_core.data_correction_event`, `aiphabee_core.research_run_correction_impact`, and
  `aiphabee_core.user_notification` exist as empty schema scaffolds for future
  persistence.
- The local contract checker verifies no live tool execution, no notification
  fanout, no persistent writes, source-record requirement, affected-report
  marking, saved-report notification requirement, and database contract linkage.

## Non-Goals

- No live DB writes.
- No Queue notification fanout.
- No live correction discovery query.
- No live replay execution.
- No old report mutation.
- No frontend notification or report invalidation UI.

## Verification

Passed:

- `npm run check:data-correction-notifications`
- `npm run check:database`
- `npm run check:research-run-save`
- `npm run check:research-run-replay`
- `npm run check:deep-report-workflow`
- `npm run test -- packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
