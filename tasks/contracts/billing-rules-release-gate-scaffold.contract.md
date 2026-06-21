# Billing Rules Release Gate Scaffold Contract

## Task

Complete Sprint 3.3 §19.5 item: `套餐/credits/退款/超额规则清楚；账单与 usage ledger 一致`.

## Authoritative Artifacts

- `packages/usage-ledger/src/index.ts`
- `apps/worker/src/index.ts`
- `deploy/usage/billing-rules-release-gate.contract.json`
- `scripts/check-billing-rules-release-gate-contract.mjs`
- `supabase/migrations/20260622002000_billing_rules_release_gate_scaffold.sql`
- `docs/governance/billing-rules-release-gate-scaffold.md`

## Contract

The release gate must prove, locally and without live side effects:

- Pro and Developer package credit limits are documented from the local pricing catalog.
- Developer overage is explicit and tied to usage billing reconciliation.
- Weighted credits are referenced through the usage-ledger event writer.
- Refund and proration behavior stays blocked without live billing-provider preview.
- Invoice credits match usage-ledger credits in the synthetic reconciliation drill.
- Every invoice line traces through request_id, usage_event_id, ledger_entry_id, and invoice_line_id.
- High-cost tasks require confirmed pre-debit and plan a failure refund against the same reservation.

## Non-Claims

The task does not claim final commercial quote approval, live billing provider integration, live invoice writes, live usage-ledger reads or writes, actual refund/overage execution, frontend billing UI, or GA billing signoff.

## Verification

- `npm run check:billing-rules-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
