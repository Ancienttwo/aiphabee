# Billing Rules Release Gate Scaffold Notes

## Implemented

- Added `billing_rules_release_gate` capability to `@aiphabee/usage-ledger`.
- Added `createBillingRulesReleaseGatePlan()` to compose:
  - package pricing catalog;
  - subscription lifecycle no-provider planner;
  - usage quota display planner;
  - billing reconciliation planner;
  - high-cost reservation and failure-refund planner.
- Added Worker route `POST /usage/release-gates/billing-rules/plan`.
- Extended `GET /usage/runtime` with `billing_rules_release_gate`.
- Added contract checker `npm run check:billing-rules-release-gate`.
- Added empty DB scaffold tables:
  - `core.billing_rules_release_gate`
  - `audit.billing_rules_drill_event`
  - `governance.billing_rules_release_gate_contract`

## Evidence

The release gate verifies:

- Pro `5000` credits and Developer `10000` credits are represented in package rules;
- Developer overage remains planned no-write and references billing reconciliation;
- weighted credits are present in usage-ledger event writer capability;
- refund and proration previews remain disabled until a live provider exists;
- invoice credits match usage-ledger credits in the local drill;
- invoice lines trace request_id to usage event and ledger entry;
- high-cost pre-debit and failure refund are planned against one reservation.

## Non-Claims

Final commercial quote, live billing provider, invoice writes, live ledger reads or writes, actual refund or overage execution, frontend billing UI, public billing launch, and GA signoff remain absent.

## Commands

- `npm run check:billing-rules-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
