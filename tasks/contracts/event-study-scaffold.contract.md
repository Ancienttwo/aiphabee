# Task Contract: event-study-scaffold

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint31-event-study-scaffold
> **Last Updated**: 2026-06-21 18:43 +08
> **Notes File**:
> `tasks/notes/event-study-scaffold.notes.md`

## Goal

Close the Sprint 3.1 ANA-06 event-study acceptance gap by adding a no-live
`run_event_study` backend scaffold with explicit event date, event window,
benchmark, abnormal-return method, and missing-sample reporting.

## Scope

- In scope:
  - `@aiphabee/analytics-tools` `runEventStudy()` scaffold;
  - `GET /analytics/runtime` event-study capability metadata;
  - `POST /analytics/event-study` Worker route;
  - deterministic event-window abnormal-return rows;
  - missing event-window samples surfaced in `missing_observations`;
  - `run_event_study` high-cost analytics queue planning with PRD 20-50 credit
    range;
  - event-study contract checker and root `npm run check` integration;
  - tracker, governance, and deferred-ledger updates.
- Out of scope:
  - live partner data reads;
  - live queue or usage-ledger writes;
  - SQL execution;
  - production benchmark construction;
  - historical constituent membership;
  - frontend UI.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Event study output includes event_date, event_window, benchmark, abnormal_return_method, observations, missing_observations, summary, and source_record_ids"
    - "Missing event-window dates are surfaced instead of silently dropped"
    - "run_event_study is accepted by the high-cost analytics planner with 20-50 credit bounds and independent-pool metadata"
    - "Runtime capability exposes formula version and no-live posture"
    - "No frontend, SQL, live data access, live queue write, or live usage debit is introduced"
  commands_succeed:
    - npm run typecheck --workspace @aiphabee/analytics-tools
    - npm run typecheck --workspace @aiphabee/worker
    - npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:event-study
    - npm run check:high-cost-analytics
    - npm run typecheck
    - npm run test
    - git diff --check
    - git diff --name-only -- apps/web
    - scripts/check-task-workflow.sh --strict
  known_environment_blockers:
    - "npm run check reaches npm run build after passing lint/typecheck/tests/golden/contracts, then fails only at delegated @aiphabee/web Vite build because Node v22.12.0 lacks node:module.registerHooks"
```

## Acceptance Notes

- This task closes the ANA-06 backend scaffold and missing-sample acceptance
  condition only.
- It does not claim live event-study execution, live usage reservation, export,
  multilingual behavior, or frontend completion.
- Root `npm run check` is not a clean pass in the current local environment
  because of the existing delegated frontend build/runtime mismatch.

## Rollback Point

- Revert the commit that adds `runEventStudy`, `POST /analytics/event-study`,
  event-study contracts/checkers/tests, high-cost planner support, and tracker
  updates.
