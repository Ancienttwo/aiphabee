# Agent Live ToolLoop Smoke

> **Status**: Verified guarded backend smoke
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/agent-live-tool-loop-smoke.contract.md`

This slice adds a guarded Agent backend smoke route that binds the existing
no-model ToolLoop planner, fixed Worker tool execution, deterministic evidence
binding probe, unsourced numeric blocking probe, and live model execution audit
preview into one run-level orchestration result.

It is not a general user-facing ToolLoop executor. It does not accept arbitrary
tool calls, stream model tokens to a frontend, read AI Gateway logs, write audit
or evidence rows, write usage-ledger rows, or render Ask/evidence cards.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Worker smoke route | `POST /agent/runs/live-tool-loop-smoke` | Guarded by `x-aiphabee-smoke` plus `AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN` |
| Planner | `createToolLoopAgentPlan()` | Creates the run id, planned steps, preflight, budget, tool enforcement, and answer/evidence contracts |
| Tool execution | `executeAgentToolExecutionEvidenceSmoke()` | Executes fixed `get_quote_snapshot` through the registered Worker route map |
| Model audit | `runAiGatewayLiveSmoke()` + `createAgentModelExecutionAuditSmokeResult()` | Executes Cloudflare AI Gateway `generateText`/`streamText` and returns hash-only audit preview |
| Frontend | Out of scope | No `apps/web` changes |

## P2 Concrete Trace

1. Operator calls the smoke route with the fixed header and bearer token.
2. Worker rejects missing header, missing env, or wrong bearer token before any
   tool or model execution.
3. Worker creates a fixed Tencent `00700.HK` ToolLoop plan requesting only
   `get_quote_snapshot`.
4. Worker executes the fixed quote tool route and binds the returned provenance
   into the post-generation evidence validator.
5. Worker verifies the sourced numeric probe passes and the unsourced numeric
   probe fails with `UNSOURCED_NUMERIC_CLAIM`.
6. Worker executes AI Gateway `generateText` and `streamText`, then converts the
   result into a redacted `run.audit` preview.
7. Worker returns only status, counts, hashes, and explicit non-claims.

## P3 Design Decision

Selected a guarded run-level smoke instead of changing `createToolLoopAgentPlan()`
into a production executor.

Reason:

- The current Sprint 1.3 gap is orchestration between already-verified backend
  surfaces, not arbitrary user tool execution.
- Existing tool and model smoke helpers already carry useful guardrails; reusing
  them keeps blast radius in the Worker route layer.
- AI Gateway log/cost/cache/rate-limit/fallback evidence still depends on
  external read permissions, so this smoke keeps those fields blocked.

Tradeoff:

- The backend now proves one fixed Agent run can plan, execute one registered
  tool, validate evidence, execute the model path, and produce an audit preview.
- General user ToolLoop execution, persistent writes, and frontend streaming
  remain separate release slices.

## Verification

- `npm run test -- apps/worker/src/agent-live-tool-loop-smoke.test.ts`
- `npm run check:agent-live-tool-loop-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- No arbitrary user-requested ToolLoop execution.
- No frontend Ask or token streaming.
- No AI Gateway logs/cost/cache/rate-limit/fallback read evidence.
- No persistent audit, evidence, or usage-ledger writes.
