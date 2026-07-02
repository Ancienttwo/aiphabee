# Agent Live Model Streaming Release Gate

## Scope

This slice adds a no-write release gate for Sprint 1.3 user-facing live model
streaming readiness. It links the existing backend SSE progress contract,
guarded `streamText` smoke contracts, generated-answer evidence binding, and AI
Gateway observability gate into one machine-readable plan.

It is not user-facing token streaming, arbitrary user ToolLoop execution,
frontend Ask rendering, persistent stream state, production model-routing
cutover, live AI Gateway log reading, or raw model output return.

## P1: Architecture Map

| Surface | File | Role |
|---|---|---|
| Runtime contract | `packages/agent-runtime/src/index.ts` | Exposes capability and pure no-write release gate plan |
| Worker route | `apps/worker/src/index.ts` | Serves `POST /agent/release-gates/live-model-streaming/plan` in the standard envelope |
| Contract | `deploy/agent/live-model-streaming-release-gate.contract.json` | Machine-readable linked evidence, blockers, flags, tables, and non-claims |
| Migration | `deploy/database/migrations/20260622020000_agent_live_model_streaming_release_gate.sql` | No-write gate and governance contract scaffolds |
| Checker | `scripts/check-agent-live-model-streaming-release-gate-contract.mjs` | Verifies runtime, Worker, tests, migration, package wiring, linked contracts, and non-claims |

## P2: Concrete Trace

1. `GET /agent/runtime` reports
   `agent_live_model_streaming_release_gate`.
2. `POST /agent/release-gates/live-model-streaming/plan` accepts optional
   request-local evidence flags for backend progress streaming, guarded model
   audit `streamText`, guarded live ToolLoop `streamText`, generated-answer
   evidence binding, AI Gateway observability, stream auth/redaction, and
   frontend streaming UI acceptance.
3. The runtime links these existing proof surfaces:
   - `deploy/agent/tool-loop-planner.contract.json`
   - `deploy/agent/model-execution-audit-smoke.contract.json`
   - `deploy/agent/live-tool-loop-smoke.contract.json`
   - `deploy/agent/generated-answer-evidence-smoke.contract.json`
   - `deploy/agent/ai-gateway-observability-release-gate.contract.json`
4. The plan returns `linked_evidence`, `evidence_requirements`,
   `release_checks`, `release_gate`, and `validation`.
5. Even when every request-local evidence flag is true, the plan keeps
   `release_transition_allowed=false` and reports
   `route_does_not_execute_user_model_stream` because this route does not run a
   user prompt through a live model stream.

## P3: Decision Rationale

Sprint 1.3 already has separate pieces: no-model backend progress SSE, guarded
model audit `streamText`, fixed live ToolLoop smoke, generated-answer evidence
binding, and AI Gateway observability readiness. The missing boundary is the
product release decision for user-facing token streaming. The smallest coherent
change is a no-write gate that links those proofs and makes the remaining
cutover blockers explicit.

The invariant is that guarded smoke evidence and request-local acceptance flags
must not become a production live streaming claim. At 10x scale, the first
failure would be mixing public progress events, model tokens, persistence,
redaction, frontend rendering, and AI Gateway cost/fallback evidence without a
single release boundary; this gate keeps that boundary blocked until each
surface has accepted evidence.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-live-model-streaming-release-gate`
- `npm run check:tool-loop-agent`
- `npm run check:agent-model-execution-audit-smoke`
- `npm run check:agent-live-tool-loop-smoke`
- `npm run check:agent-generated-answer-evidence-smoke`
- `npm run check:agent-ai-gateway-observability-release-gate`
- `npm run check:database`

## Residual Gaps

- No user-facing live model token streaming route is enabled.
- No arbitrary user ToolLoop execution is enabled.
- No frontend Ask streaming or evidence-card rendering is enabled.
- No persistent user-run stream state is enabled.
- No live AI Gateway logs/cost/cache/rate-limit/fallback evidence is accepted.
- No production model-routing cutover is enabled.
