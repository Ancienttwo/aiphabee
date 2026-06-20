# Failure Recovery Policy Scaffold

> **Status**: Verified no-live failure recovery policy scaffold
> **Last Updated**: 2026-06-21 04:27 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-failure-recovery-policy-scaffold.md`
> **Task Contract**: `tasks/contracts/failure-recovery-policy-scaffold.contract.md`

This slice adds an Agent planner policy for AGT-08 failure recovery, partial
retry, and no-double-charge behavior. It does not execute live retries, persist
durable run state, write a live usage ledger, or touch frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `packages/agent-runtime` | Owns `failure_recovery_policy` capability and plan output |
| Worker planner | `POST /agent/runs/plan` | Returns failure recovery policy in the standard response envelope |
| Runtime capability | `GET /agent/runtime` | Advertises failure recovery policy scaffold |
| Guard contract | `deploy/agent/failure-recovery-policy.contract.json` | Requires retry classes, no-double-charge fields, step recovery actions, and validation rules |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends a plan request to `POST /agent/runs/plan`.
2. Worker normalizes the request into `AgentRunSkeletonInput`.
3. Runtime plans preflight, budget stop, tool enforcement, numeric source guard,
   and answer/evidence contracts.
4. Runtime derives `failure_recovery_policy` from the final planned steps and
   retry policy.
5. Planner returns retryable/non-retryable classes, failed-tool-call-only retry
   scope, per-step recovery actions, completed evidence reuse, partial answer
   behavior, and no-double-charge billing requirements.
6. Because no tools are executed, the policy proves recovery semantics and
   billing invariants without actually retrying a tool or writing usage rows.

## P3 Design Decision

Selected planner-level recovery policy instead of a live retry runner.

Reason:

- AGT-08 requires the run contract to preserve partial work and avoid duplicate
  charges before actual tool execution is enabled.
- Current runtime is no-tool-execution and no-live-ledger.
- Existing budget stop policy already defines retry attempt limits and
  same-error stopping; this slice attaches those limits to per-step recovery and
  billing semantics.

Tradeoff:

- The policy is deterministic and testable now.
- Live retry execution still needs durable state and usage-ledger writes.

What fails first at 10x scale:

- Recovery state needs compact per-tool-call indexes so resumed runs can skip
  completed evidence without replaying large result payloads.

## Verification

Passed:

- `npm run test`
- `npm run test:golden`
- `npm run check:failure-recovery-policy`
- `npm run check:agent-run-context`
- `npm run check:tool-loop-agent`
- `npm run check:pre-tool-call-resolution`
- `npm run check:budget-stop-policy`
- `npm run check:tool-enforcement`
- `npm run check:numeric-source-guard`
- `npm run check:answer-evidence-contract`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`

Local worker smoke:

- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /agent/runs/plan` with quote snapshot, price history, financial facts,
  and lineage tools returned `ok=true`, `status=planned_no_model`,
  `modelCalls=false`, `failure_recovery_policy.status=failure_recovery_policy_scaffold`,
  `retry_scope=failed_tool_call_only`, and `no_double_charge=true`.

Observed policy fields:

```json
{
  "status": "failure_recovery_policy_scaffold",
  "partialRetry": true,
  "retryScope": "failed_tool_call_only",
  "noDoubleCharge": true,
  "retryBillable": false,
  "chargeGrain": "tool_call_success",
  "retryable": ["RATE_LIMITED", "TOOL_TIMEOUT", "UPSTREAM_5XX", "NETWORK_RESET"]
}
```

## Residual Gaps

- Actual live tool retry execution is absent.
- Durable run-state persistence is absent.
- Live usage ledger idempotency writes are absent.
- Frontend retry controls remain out of scope.
