# Budget Stop Policy Scaffold

> **Status**: Verified no-live budget stop scaffold
> **Last Updated**: 2026-06-21 03:50 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-budget-stop-policy-scaffold.md`
> **Task Contract**: `tasks/contracts/budget-stop-policy-scaffold.contract.md`

This slice adds deterministic budget and stop-policy behavior to the no-model
Agent planner. It estimates planned usage, reports budget limit status, and
turns valid budget exhaustion into a graceful `stopped_budget` plan. It does not
execute tools, call models, write usage ledgers, or touch frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime package | `packages/agent-runtime` | Owns budget estimation and stop decision shape |
| Worker planner | `POST /agent/runs/plan` | Returns `budget_stop_policy` in the standard envelope |
| Runtime capability | `GET /agent/runtime` | Advertises budget stop policy scaffold readiness |
| Budget contract | `deploy/agent/budget-stop-policy.contract.json` | Requires dimensions, decisions, graceful stop fields, and retry stop policy |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends a plan request with prompt, tools, and optional budgets.
2. Worker normalizes the request through `createAgentRunInput()`.
3. Runtime validates registered tools and creates run budget.
4. Runtime creates natural no-model tool-loop steps.
5. Runtime estimates natural usage across steps, credits, rows, tokens, tool
   calls, and wall-clock ms.
6. Runtime compares estimates to supplied limits.
7. If within budget, planner returns `planned_no_model`.
8. If a valid budget would be exceeded, planner returns `stopped_budget`, keeps
   the prefix that fits, appends a budget-stop answer contract step, and returns
   unfinished step IDs plus a continuation-cost message.

## P3 Design Decision

Selected deterministic planner-level stop policy instead of live execution
metering.

Reason:

- AGT-03 needs a verifiable contract before real tool execution exists.
- Existing planner already owns step ordering and requested budgets.
- Throwing for valid exhausted budgets prevented graceful stop behavior.

Tradeoff:

- The runtime now proves budget stop semantics locally.
- Usage numbers are deterministic planning estimates, not real metered costs.

What fails first at 10x scale:

- Static per-tool estimates must be replaced by measured usage ledger events and
  model-cost accounting once live execution is enabled.

## Verification

Passed:

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:budget-stop-policy`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `npm run check:agent-run-context && npm run check:tool-loop-agent && npm run check:pre-tool-call-resolution && npm run check:budget-stop-policy`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /agent/runs/plan` default budget -> `planned_no_model`
- `POST /agent/runs/plan` `max_steps=3` -> `stopped_budget`
- `git diff --name-only -- apps/web` returned no changed files

Observed route fields:

```json
{
  "continue": {
    "status": "planned_no_model",
    "budgetDecision": "continue",
    "plannedSteps": 6,
    "partialResponse": false
  },
  "stopped": {
    "status": "stopped_budget",
    "budgetDecision": "stop_before_execution",
    "reason": "steps",
    "plannedSteps": 3,
    "completed": ["step_1", "step_2"],
    "partialResponseReady": true
  }
}
```

## Residual Gaps

- Actual tool execution and live retry loops are absent.
- Usage ledger writes and billing reconciliation are absent.
- AI Gateway/model-cost accounting is absent.
- Frontend Ask budget confirmation remains out of scope.
