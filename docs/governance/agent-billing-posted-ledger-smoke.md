# Agent Billing Posted Ledger Smoke

## Scope

This slice adds a guarded backend smoke for Sprint 1.3 billing-posted ledger
coverage. It proves that a synthetic usage ledger entry can start as `preview`,
transition to `posted` once, skip an idempotent retry, and clean up through
Hyperdrive.

It is not production billing posting, billing provider execution, invoice
writing, live billing reconciliation, production Agent run persistence, frontend
Ask rendering, or user-facing live model streaming.

## P1: Architecture Map

| Surface | File | Role |
|---|---|---|
| Worker route | `apps/worker/src/index.ts` | Guarded smoke route and transaction runner |
| Contract | `deploy/agent/billing-posted-ledger-smoke.contract.json` | Machine-readable route/schema/non-claim contract |
| Migration | `supabase/migrations/20260622017000_agent_billing_posted_ledger_smoke.sql` | Governance contract for the smoke boundary |
| Checker | `scripts/check-agent-billing-posted-ledger-smoke-contract.mjs` | Verifies route, package wiring, migration, tests, and non-claims |
| Tests | `apps/worker/src/agent-billing-posted-ledger-smoke.test.ts` | Guard/auth/missing-binding/success-path coverage |

## P2: Concrete Trace

1. `POST /agent/runs/billing-posted-ledger-smoke` requires
   `x-aiphabee-smoke=agent-billing-posted-ledger-v1`.
2. `AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN` must exist and match the bearer
   token.
3. The route requires `AIPHABEE_HYPERDRIVE`; missing binding returns `424`
   before opening a DB connection.
4. The smoke opens one transaction and writes synthetic rows in:
   - `core.account`
   - `core.workspace`
   - `core.usage_meter_rule`
   - `core.usage_event`
   - `core.usage_ledger_entry`
5. It reads the `preview` ledger row, updates it to `posted`, repeats the same
   update to prove the retry skips, reads the posted credit delta, deletes the
   synthetic rows, then commits.
6. The response includes only hashes, counts, table names, and explicit
   non-claims.

## P3: Decision Rationale

The smallest useful billing-posted proof is a synthetic preview-to-posted
transition inside the existing usage ledger tables. This closes the local
`billing-posted ledger entries` smoke gap without crossing the production
billing boundary.

The invariant is that a ledger row may be posted once and must not double-charge
on retry. At 10x scale, the first failure is likely production reconciliation,
provider posting, and invoice idempotency, not the guarded smoke route; those
remain separate billing work.

## Verification

- `npm run test -- apps/worker/src/agent-billing-posted-ledger-smoke.test.ts`
- `npm run check:agent-billing-posted-ledger-smoke`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run lint --workspace @aiphabee/worker`

## Residual Gaps

- No production billing provider call is enabled.
- No invoice write is enabled.
- No live billing reconciliation or settlement is enabled.
- No production user-run audit/evidence/ledger/state persistence is enabled.
- No frontend Ask/evidence-card rendering is enabled.
