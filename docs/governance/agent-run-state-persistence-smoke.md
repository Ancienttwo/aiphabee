# Agent Run State Persistence Smoke

## Scope

This slice adds a guarded backend smoke for Sprint 1.3 durable Agent run-state
persistence. It proves that a synthetic run state and checkpoint can be written,
read, updated, and cleaned up through Hyperdrive.

It is not production Agent run persistence, arbitrary user ToolLoop execution,
workflow checkpoint execution, queue notification fanout, frontend resume UI, or
user-facing live model streaming.

## P1: Architecture Map

| Surface | File | Role |
|---|---|---|
| Worker route | `apps/worker/src/index.ts` | Guarded smoke route and transaction runner |
| Contract | `deploy/agent/state-persistence-smoke.contract.json` | Machine-readable route/schema/non-claim contract |
| Migration | `deploy/database/migrations/20260622016000_agent_run_state_persistence_smoke.sql` | `aiphabee_core.agent_run_state`, `aiphabee_core.agent_run_checkpoint`, governance contract |
| Checker | `scripts/check-agent-run-state-persistence-smoke-contract.mjs` | Verifies route, package wiring, migration, tests, and non-claims |
| Tests | `apps/worker/src/agent-run-state-persistence-smoke.test.ts` | Guard/auth/missing-binding/success-path coverage |

## P2: Concrete Trace

1. `POST /agent/runs/state-persistence-smoke` requires
   `x-aiphabee-smoke=agent-run-state-persistence-v1`.
2. `AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN` must exist and match the bearer token.
3. The route requires `AIPHABEE_HYPERDRIVE`; missing binding returns `424` before
   opening a DB connection.
4. The smoke opens one transaction and writes:
   - `aiphabee_core.agent_run_state` with a synthetic `running` state.
   - `aiphabee_core.agent_run_checkpoint` with one completed checkpoint.
5. It reads both rows, updates the state to `partial`, reads the updated state,
   deletes checkpoint and state rows, then commits.
6. The response includes only hashes, counts, table names, and explicit
   non-claims.

## P3: Decision Rationale

The smallest useful durable-state proof is a synthetic insert/select/update/delete
smoke against the intended state tables. This upgrades the existing
`planned_run_state` policy from a paper contract to a DB-backed smoke without
turning on production persistence.

The invariant is that durable state must be recoverable without exposing raw
run/user/workspace/token material. At 10x scale, the first failure is likely
state/checkpoint retention and indexing, not the guarded smoke shape; production
retention, resumability, and cleanup policy remain separate product work.

## Verification

- `npm run test -- apps/worker/src/agent-run-state-persistence-smoke.test.ts`
- `npm run check:agent-run-state-persistence-smoke`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run lint --workspace @aiphabee/worker`

## Residual Gaps

- No production user-run persistence is enabled.
- No arbitrary user ToolLoop execution is enabled.
- No workflow checkpoint writes or queue notification fanout are enabled.
- No frontend resume/Ask/evidence-card rendering is enabled.
