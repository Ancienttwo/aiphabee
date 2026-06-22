# Agent Billing Posted Ledger Smoke Contract

## Intent

Prove Sprint 1.3 billing-posted ledger idempotency with a guarded, synthetic
Hyperdrive smoke.

## In Scope

- Add guarded `POST /agent/runs/billing-posted-ledger-smoke`.
- Require `x-aiphabee-smoke=agent-billing-posted-ledger-v1`.
- Require `AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN`.
- Require `AIPHABEE_HYPERDRIVE`.
- Write, read, update, retry, and delete synthetic rows in:
  - `core.account`
  - `core.workspace`
  - `core.usage_meter_rule`
  - `core.usage_event`
  - `core.usage_ledger_entry`
- Verify one `preview` ledger row transitions to `posted`.
- Verify the second posted update skips to prevent double charge.
- Return only hashes, row counts, table names, and non-claim flags.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- Production billing posting.
- Billing provider calls.
- Invoice writes.
- Live billing reconciliation or settlement.
- Production Agent run persistence.
- User-facing live model streaming.
- Frontend Ask or evidence-card rendering.

## Verification

- `npm run test -- apps/worker/src/agent-billing-posted-ledger-smoke.test.ts`
- `npm run check:agent-billing-posted-ledger-smoke`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run lint --workspace @aiphabee/worker`
