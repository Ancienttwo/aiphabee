# Agent AI Gateway Observability Release Gate Contract

## Intent

Create a no-write release gate that links existing AI Gateway model-audit,
observability, and capture-evidence surfaces before any production model-routing
or Agent observability cutover.

## In Scope

- Add `POST /agent/release-gates/ai-gateway-observability/plan`.
- Expose `agent_ai_gateway_observability_release_gate` from
  `GET /agent/runtime`.
- Link:
  - `POST /agent/runs/model-execution-audit-smoke`
  - `npm run smoke:ai-gateway-observability-live`
  - `deploy/model-providers/live-smoke-readiness.contract.json`
  - `deploy/agent/model-routing-audit.contract.json`
  - `deploy/governance/live-smoke-capture-artifacts.contract.json`
  - `deploy/governance/live-smoke-evidence-ledger.contract.json`
- Return `linked_evidence`, `evidence_requirements`, `release_checks`,
  `release_gate`, and `validation`.
- Keep `live_ai_gateway_reads=false`.
- Keep `release_transition_allowed=false`.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- Live AI Gateway logs API or GraphQL analytics reads.
- Live cost/cache/rate-limit/fallback verification.
- Live token-cost-fallback audit/evidence writes.
- Production model-routing cutover.
- User-facing live model token streaming.
- Frontend Ask or evidence-card rendering.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-ai-gateway-observability-release-gate`
- `npm run check:agent-model-execution-audit-smoke`
- `npm run check:model-provider-live-readiness`
- `npm run check:database`
