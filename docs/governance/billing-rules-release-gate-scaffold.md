# Billing Rules Release Gate Scaffold

## Scope

This scaffold covers Sprint 3.3 §19.5 for package credits, refund/proration boundaries, overage rules, and invoice-to-usage-ledger consistency.

It composes existing local planners instead of enabling live billing:

- `@aiphabee/account-runtime` package pricing catalog for Pro/Developer credit limits and Developer overage posture.
- `@aiphabee/account-runtime` subscription lifecycle planner for auditable renewals and refund/proration provider blocks.
- `@aiphabee/usage-ledger` quota display planner for visible plan credits.
- `@aiphabee/usage-ledger` billing reconciliation planner for invoice credits versus ledger credits.
- `@aiphabee/usage-ledger` high-cost reservation planner for pre-debit and failure-refund semantics.

## Runtime Surface

- Runtime: `GET /usage/runtime`
- Release gate route: `POST /usage/release-gates/billing-rules/plan`
- Linked routes:
  - `GET /account/package-pricing`
  - `POST /account/subscription/lifecycle/plan`
  - `POST /usage/quota/plan`
  - `POST /usage/billing/reconciliation/plan`
  - `POST /usage/high-cost/reservation/plan`

The release gate response uses the standard response envelope and returns:

- `package_rules`
- `subscription_rules`
- `quota_gate`
- `billing_reconciliation_gate`
- `high_cost_gate`
- `release_checks`
- `release_gate`
- `validation`

## Release Checks

- `package_credit_overage_rules_documented`
- `weighted_credit_model_referenced`
- `refund_and_proration_rules_blocked_without_provider_preview`
- `invoice_credits_match_usage_ledger_credits`
- `request_id_trace_links_invoice_ledger_usage_event`
- `high_cost_pre_debit_and_failure_refund_planned`

## Non-Claims

This scaffold does not enable final commercial quotes, live billing provider calls, live invoice writes, live usage-ledger reads or writes, refund execution, overage charging, frontend billing UI, or GA billing signoff.

`release_gate.status` remains `blocked_live_billing_rules_validation` until commercial quote approval, live billing provider integration, live ledger reads, invoice writes, frontend billing UI, and billing/finance/data-rights/support/ops signoff evidence exist.

## Verification

- `npm run check:billing-rules-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
