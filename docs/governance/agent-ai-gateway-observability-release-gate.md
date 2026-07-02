# Agent AI Gateway Observability Release Gate

## Scope

This slice adds a no-write release gate for Sprint 1.3 AI Gateway observability
readiness. It links existing model execution audit, model-provider readiness,
model-routing audit, live-smoke capture packet, and live-smoke evidence ledger
contracts into one machine-readable plan.

It is not live AI Gateway log reading, cost/cache/rate-limit/fallback
verification, production model-routing cutover, live token-cost-fallback writes,
frontend Ask rendering, or user-facing live model streaming.

## P1: Architecture Map

| Surface | File | Role |
|---|---|---|
| Runtime contract | `packages/agent-runtime/src/index.ts` | Exposes capability and pure no-write release gate plan |
| Worker route | `apps/worker/src/index.ts` | Serves `POST /agent/release-gates/ai-gateway-observability/plan` in the standard envelope |
| Contract | `deploy/agent/ai-gateway-observability-release-gate.contract.json` | Machine-readable linked evidence, blockers, permissions, and non-claims |
| Migration | `deploy/database/migrations/20260622019000_agent_ai_gateway_observability_release_gate.sql` | No-write gate and governance contract scaffolds |
| Checker | `scripts/check-agent-ai-gateway-observability-release-gate-contract.mjs` | Verifies runtime, Worker, tests, migration, package wiring, and non-claims |

## P2: Concrete Trace

1. `GET /agent/runtime` reports
   `agent_ai_gateway_observability_release_gate`.
2. `POST /agent/release-gates/ai-gateway-observability/plan` accepts optional
   request-local evidence flags for Cloudflare permissions, request-log
   capture, cost/cache fields, rate-limit/fallback evidence, and capture-packet
   acceptance.
3. The runtime links these existing proof surfaces:
   - `deploy/agent/model-execution-audit-smoke.contract.json`
   - `deploy/model-providers/live-smoke-readiness.contract.json`
   - `deploy/agent/model-routing-audit.contract.json`
   - `scripts/smoke-ai-gateway-observability-live.mjs`
   - `deploy/governance/live-smoke-capture-artifacts.contract.json`
   - `deploy/governance/live-smoke-evidence-ledger.contract.json`
4. The plan returns `linked_evidence`, `evidence_requirements`,
   `release_checks`, `release_gate`, and `validation`.
5. Even when all request-local evidence flags are true, the plan keeps
   `release_transition_allowed=false` because the route does not itself read
   Cloudflare logs or verify a submitted capture packet.

## P3: Decision Rationale

The repo already has individual model execution and live-smoke observability
contracts, but the release boundary was scattered across model audit, provider
readiness, capture packets, and the evidence ledger. The smallest coherent
change is a no-write release gate that makes those dependencies visible and
keeps the missing external evidence as explicit blockers.

The invariant is that request-local evidence flags must not become a live
observability claim. At 10x scale, the first failure would be unverified
Cloudflare permissions, incomplete cost/cache/rate-limit/fallback fields, and
uncaptured hash-only evidence packets; all remain explicit blockers.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-ai-gateway-observability-release-gate`
- `npm run check:agent-model-execution-audit-smoke`
- `npm run check:model-provider-live-readiness`
- `npm run check:database`

## Residual Gaps

- No live AI Gateway logs API or GraphQL analytics read is enabled.
- No accepted cost/cache/rate-limit/fallback capture packet exists.
- No live token-cost-fallback log write path is enabled.
- No production model-routing cutover is enabled.
- No frontend Ask or evidence-card rendering is enabled.
