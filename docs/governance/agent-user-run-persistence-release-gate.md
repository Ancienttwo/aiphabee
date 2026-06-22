# Agent User-Run Persistence Release Gate

## Scope

This slice adds a no-write release gate for Sprint 1.3 production user-run
persistence readiness. It links the existing guarded Agent live-write,
state-persistence, and billing-posted ledger smoke contracts into one
machine-readable plan.

It is not production user-run persistence, a production writer, frontend Ask or
resume rendering, user-facing live model streaming, billing provider posting, or
invoice writing.

## P1: Architecture Map

| Surface | File | Role |
|---|---|---|
| Runtime contract | `packages/agent-runtime/src/index.ts` | Exposes capability and pure no-write release gate plan |
| Worker route | `apps/worker/src/index.ts` | Serves `POST /agent/release-gates/user-run-persistence/plan` in the standard envelope |
| Contract | `deploy/agent/user-run-persistence-release-gate.contract.json` | Machine-readable route, smoke links, blockers, and non-claims |
| Migration | `supabase/migrations/20260622018000_agent_user_run_persistence_release_gate.sql` | No-write gate and governance contract scaffolds |
| Checker | `scripts/check-agent-user-run-persistence-release-gate-contract.mjs` | Verifies runtime, Worker, tests, migration, package wiring, and non-claims |

## P2: Concrete Trace

1. `GET /agent/runtime` reports `agent_user_run_persistence_release_gate`.
2. `POST /agent/release-gates/user-run-persistence/plan` accepts optional
   `operator_signoff`, `retention_policy_approved`, and
   `production_cutover_requested`.
3. The runtime builds a plan from these existing smoke contracts:
   - `deploy/agent/run-live-write-smoke.contract.json`
   - `deploy/agent/state-persistence-smoke.contract.json`
   - `deploy/agent/billing-posted-ledger-smoke.contract.json`
4. The plan returns `smoke_gates`, `production_prerequisites`,
   `release_checks`, `release_gate`, and `validation`.
5. Even when signoff flags are true, the plan keeps
   `production_cutover_allowed=false` and `production_persistence_enabled=false`
   until a separate production writer and frontend resume surface exist.

## P3: Decision Rationale

The existing smokes prove individual local persistence properties: audit,
evidence, usage ledger writes, run state/checkpoint persistence, and
preview-to-posted billing idempotency. The missing boundary was a single
release gate that says whether those proofs are sufficient for production
user-run persistence. The smallest coherent change is a no-write plan and
contract rather than a production writer.

The invariant is that local smoke proof must not become a live persistence
claim. At 10x scale, the first failure would be retention policy, production
writer idempotency, frontend resume semantics, and operational cutover signoff;
all remain explicit blockers.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-user-run-persistence-release-gate`
- `npm run check:database`
- `npm run check:agent-run-live-write-smoke`
- `npm run check:agent-run-state-persistence-smoke`
- `npm run check:agent-billing-posted-ledger-smoke`

## Residual Gaps

- No production user-run audit/evidence/ledger/state writer is enabled.
- No frontend Ask, resume, or evidence-card rendering is enabled.
- No production retention policy source is activated.
- No production billing provider or invoice write is enabled.
