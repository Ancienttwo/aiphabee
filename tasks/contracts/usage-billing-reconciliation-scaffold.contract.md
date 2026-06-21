# Usage Billing Reconciliation Scaffold Contract

## Objective

Complete the backend-only Sprint 2.4 ACC-04 scaffold for subscription bill to
usage-ledger reconciliation and request-level billing traceability.

## Required Surfaces

- Package: `@aiphabee/usage-ledger`
- Runtime route: `GET /usage/runtime`
- Planner route: `POST /usage/billing/reconciliation/plan`
- Contract: `deploy/usage/billing-reconciliation.contract.json`
- Checker: `npm run check:usage-billing-reconciliation`
- Invoice table scaffold: `core.subscription_invoice`
- Invoice-line table scaffold: `core.subscription_invoice_line`

## Required Guarantees

- Use standard response envelopes.
- Keep `request_id` visible.
- Keep freshness target at 5 minutes to align with ACC-04 quota/usage display.
- Require trace fields:
  - `request_id`
  - `usage_event_id`
  - `ledger_entry_id`
  - `invoice_line_id`
- Return invoice, invoice line, consistency, traceability, and billing-provider
  no-call blocks.
- Support support-team investigation by request ID.
- Do not read the live usage ledger.
- Do not write invoice rows.
- Do not reconcile a live billing provider.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes invoice and invoice-line table scaffolds.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves both runtime and planner routes return `200 OK`
  and no-live flags.
- Sprint tracker row is checked and Sprint 2.4 count is updated.
