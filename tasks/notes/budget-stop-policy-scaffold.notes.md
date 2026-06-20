# Budget Stop Policy Scaffold Notes

> **Date**: 2026-06-21
> **Owner**: Codex
> **Sprint**: 1.3
> **Tracker Item**: AGT-03

## Summary

Added a no-live budget stop policy scaffold to the Agent runtime planner. The
planner now estimates steps, credits, rows, tokens, tool calls, and wall-clock
ms for the planned no-model tool loop. If a supplied valid budget would be
exceeded, it returns `stopped_budget` with partial steps, an answer-contract stop
response, unfinished step IDs, and a continuation-cost message instead of
throwing an input error.

## Implementation Notes

- `createToolLoopAgentPlan()` now returns `budget_stop_policy`.
- Default plans remain `planned_no_model`.
- Valid budget exhaustion returns `stopped_budget`.
- Invalid budget values still fail input validation.
- Stop policy covers `max_steps`, budget exhaustion, tool scope denial, all
  tools completed, and two consecutive same-class errors.
- Retry stop policy is deterministic and non-billable.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:budget-stop-policy`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `POST /agent/runs/plan` default budget smoke: `planned_no_model`, budget decision `continue`
- `POST /agent/runs/plan` `max_steps=3` smoke: `stopped_budget`, partial response ready, unfinished steps listed

## Residual Gaps

- No real tool execution or retry loop exists yet.
- No live usage ledger writes or billing reconciliation exists yet.
- No model-cost accounting exists yet.
- Frontend budget confirmation UI is out of scope.
