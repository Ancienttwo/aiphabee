# Agent Token Cost Fallback Release Gate Contract

## Intent

Create a no-write release gate that links model execution audit, model-routing
fallback audit, run/tool audit cost fields, AI Gateway observability, billing
posted ledger, and user-run persistence evidence before any live token/cost/
fallback log write or production cost-ledger claim.

## In Scope

- Add `POST /agent/release-gates/token-cost-fallback/plan`.
- Expose `agent_token_cost_fallback_release_gate` from `GET /agent/runtime`.
- Link:
  - `deploy/agent/model-execution-audit-smoke.contract.json`
  - `deploy/agent/model-routing-audit.contract.json`
  - `deploy/governance/run-tool-audit-fields.contract.json`
  - `deploy/agent/ai-gateway-observability-release-gate.contract.json`
  - `deploy/agent/billing-posted-ledger-smoke.contract.json`
  - `deploy/agent/user-run-persistence-release-gate.contract.json`
- Return `linked_evidence`, `evidence_requirements`, `release_checks`,
  `release_gate`, and `validation`.
- Keep `live_token_cost_fallback_log_writes=false`.
- Keep `production_cost_ledger_enabled=false`.
- Keep `model_calls=false`.
- Keep `frontend_rendering=false`.
- Keep `persistent_writes=false`.
- Keep `release_transition_allowed=false`.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- Live AI Gateway token/cost/fallback log writes.
- Production cost ledger writes.
- Accepted live AI Gateway request-log/cost/cache/rate-limit/fallback evidence.
- Live model execution cutover.
- Frontend Ask or evidence-card rendering.
- Release transition.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-token-cost-fallback-release-gate`
- `npm run check:agent-model-execution-audit-smoke`
- `npm run check:model-routing-audit`
- `npm run check:run-tool-audit-fields`
- `npm run check:agent-ai-gateway-observability-release-gate`
- `npm run check:agent-billing-posted-ledger-smoke`
- `npm run check:agent-user-run-persistence-release-gate`
- `npm run check:database`
