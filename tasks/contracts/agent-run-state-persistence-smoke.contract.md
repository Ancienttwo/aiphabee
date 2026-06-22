# Agent Run State Persistence Smoke Contract

## Intent

Prove Sprint 1.3 durable run-state persistence with a guarded, synthetic
Hyperdrive smoke.

## In Scope

- Add guarded `POST /agent/runs/state-persistence-smoke`.
- Require `x-aiphabee-smoke=agent-run-state-persistence-v1`.
- Require `AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN`.
- Require `AIPHABEE_HYPERDRIVE`.
- Write, read, update, and delete synthetic rows in:
  - `core.agent_run_state`
  - `core.agent_run_checkpoint`
- Return only hashes, row counts, table names, and non-claim flags.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- Production Agent run persistence.
- Arbitrary user ToolLoop execution.
- User-facing live model streaming.
- Workflow task checkpoint execution.
- Queue notification fanout.
- Frontend resume, Ask, or evidence-card rendering.

## Verification

- `npm run test -- apps/worker/src/agent-run-state-persistence-smoke.test.ts`
- `npm run check:agent-run-state-persistence-smoke`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run lint --workspace @aiphabee/worker`
