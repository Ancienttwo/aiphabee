# Failure Recovery Policy Scaffold Notes

> **Date**: 2026-06-21
> **Owner**: Codex
> **Sprint**: 1.3
> **Tracker Item**: AGT-08

## Summary

Added a no-live `failure_recovery_policy` to the Agent planner. It defines
partial retry, failed-tool-call-only recovery, no-double-charge billing behavior,
and partial answer fallback while keeping actual tool execution and durable
state persistence out of scope.

## Implementation Notes

- `GET /agent/runtime` now advertises `failure_recovery_policy`.
- `POST /agent/runs/plan` now returns `failure_recovery_policy`.
- Retryable errors are `RATE_LIMITED`, `TOOL_TIMEOUT`, `UPSTREAM_5XX`, and
  `NETWORK_RESET`.
- Non-retryable errors are `DATA_NOT_LICENSED`, `DATA_QUALITY_HOLD`,
  `INVALID_INPUT`, `OUT_OF_RANGE`, `SCOPE_DENIED`, and `TOO_MANY_ROWS`.
- Retry scope is `failed_tool_call_only`.
- Failed attempts and retry attempts are not billable; charge grain is
  `tool_call_success`.
- The policy requires planned usage-ledger idempotency and preserves completed
  steps/evidence.

## Verification

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
- `POST /agent/runs/plan` smoke through local `wrangler dev` returned
  `ok=true`, `status=planned_no_model`,
  `failure_recovery_policy.status=failure_recovery_policy_scaffold`,
  `retry_scope=failed_tool_call_only`, `no_double_charge=true`, and
  `modelCalls=false`.

## Residual Gaps

- No live tool retries exist yet.
- No durable run-state persistence exists yet.
- No live usage ledger writes exist yet.
- Frontend retry controls remain out of scope.
