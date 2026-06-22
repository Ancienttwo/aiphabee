# Agent Live Model Streaming Release Gate Contract

## Intent

Create a no-write release gate that links the backend progress stream, guarded
model streaming smokes, generated-answer evidence binding, and AI Gateway
observability gate before any user-facing Agent live model streaming cutover.

## In Scope

- Add `POST /agent/release-gates/live-model-streaming/plan`.
- Expose `agent_live_model_streaming_release_gate` from `GET /agent/runtime`.
- Link:
  - `POST /agent/runs/stream`
  - `POST /agent/runs/model-execution-audit-smoke`
  - `POST /agent/runs/live-tool-loop-smoke`
  - `POST /agent/runs/generated-answer-evidence-smoke`
  - `POST /agent/release-gates/ai-gateway-observability/plan`
- Return `linked_evidence`, `evidence_requirements`, `release_checks`,
  `release_gate`, and `validation`.
- Keep `live_model_streaming=false`.
- Keep `live_model_execution=false`.
- Keep `model_calls=false`.
- Keep `frontend_rendering=false`.
- Keep `persistent_writes=false`.
- Keep `release_transition_allowed=false`.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- User-facing live model token streaming.
- Arbitrary user ToolLoop execution.
- Frontend Ask streaming or evidence-card rendering.
- Persistent user-run stream state.
- Raw model output return.
- Live AI Gateway logs/cost/cache/rate-limit/fallback evidence acceptance.
- Production model-routing cutover.

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
