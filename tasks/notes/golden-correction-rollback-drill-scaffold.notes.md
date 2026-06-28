# Golden Correction Rollback Drill Scaffold Notes

## Summary

Implemented the Sprint 3.3 §19.1 backend scaffold for a golden fixture gated
data-correction and rollback replay drill.

## Current State

- `@aiphabee/research-runtime` exposes `golden_correction_rollback_drill`
  capability under `GET /research/runtime`.
- `POST /research/golden-correction-rollback-drill/plan` returns a
  deterministic no-write plan.
- The drill references `npm run test:golden` and the current golden manifests:
  8 quality samples, 12 quality rules, and 16 tool golden fixtures.
- The drill creates a synthetic saved research run, plans a data correction
  notification, and plans a rollback replay diff.
- The replay path preserves saved report immutability with
  `old_report_mutation_allowed=false` and `silent_rewrite_allowed=false`.
- `aiphabee_core.golden_correction_rollback_drill` and
  `aiphabee_governance.golden_correction_rollback_drill_contract` exist as empty schema
  scaffolds for future persistence.
- The local contract checker verifies sample counts, fixture manifest linkage,
  required drill steps, no-live boundaries, and database contract coverage.

## Non-Goals

- No production partner golden corpus loading.
- No live DB writes.
- No Queue notification fanout.
- No live rollback execution.
- No old report mutation.
- No frontend release checklist UI.

## Verification

Passed on 2026-06-21:

- `npm run check:golden-correction-rollback-drill`
- `npm run check:database`
- `npm run test:golden`
- `npx vitest run packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/research-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

Root check caveat:

- `npm run check` passed every backend/checker step including
  `check:golden-correction-rollback-drill`, then retained the existing
  delegated frontend build caveat in `@aiphabee/web`: current Node does not
  expose `node:module.registerHooks` required by `@cloudflare/vite-plugin`.
