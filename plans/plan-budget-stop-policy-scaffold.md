# Plan: Budget Stop Policy Scaffold

> **Status**: Implemented
> **Owner**: Codex
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/budget-stop-policy-scaffold.contract.md`
> **Notes**: `tasks/notes/budget-stop-policy-scaffold.notes.md`

## Goal

Complete the Sprint 1.3 AGT-03 scaffold for single-run budget and stop
behavior without enabling model calls, actual tool execution, live billing, or
frontend UI.

## Task Breakdown

- [x] Add deterministic budget usage estimation to `@aiphabee/agent-runtime`.
- [x] Return a structured `budget_stop_policy` from `createToolLoopAgentPlan()`.
- [x] Convert valid budget exhaustion from a thrown input error into a
      `stopped_budget` plan with partial steps and a graceful stop response.
- [x] Preserve hard input rejection for invalid step limits and unregistered
      tools.
- [x] Include consecutive same-class tool error stop policy in the planner
      contract.
- [x] Add `deploy/agent/budget-stop-policy.contract.json` and
      `npm run check:budget-stop-policy`.
- [x] Update runtime and Worker tests for continue and stopped-budget paths.
- [x] Update Sprint tracker, governance notes, task contract, and deferred
      ledger.

## Out of Scope

- Actual tool execution or live retry loops.
- Real usage ledger writes or billing reconciliation.
- Model calls, AI Gateway cost accounting, or live streaming transport.
- Frontend budget confirmation UI.

## Verification Surface

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:budget-stop-policy`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- Local Wrangler smoke for default `planned_no_model` and budget-exhausted
  `stopped_budget` paths.
