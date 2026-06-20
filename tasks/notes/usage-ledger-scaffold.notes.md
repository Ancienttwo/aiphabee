# Notes: usage-ledger-scaffold

> **Last Updated**: 2026-06-20 16:27 +08
> **Plan**: `plans/plan-usage-ledger-scaffold.md`
> **Runtime Evidence**: `docs/governance/usage-ledger-scaffold.md`

## Decisions

- Added empty usage meter, event, reconciliation batch, and ledger entry schemas
  only. No real usage rows, billing rows, market data, URLs, or credentials are
  committed.
- Kept usage events tied to workspace/account context so later billing cannot
  cross workspace boundaries.
- Kept reconciliation target delay encoded as `<= 5` minutes while leaving live
  writes disabled in runtime capability.
- Added `/gateway/runtime` capability fields, not live ledger writes.

## Verification

- Passed: `npm run check:database`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /gateway/runtime`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Serving Store schema exists, but live Gateway reads and account identity
  context are absent.
- Billing provider integration and invoice reconciliation are absent.
- Persistent usage writes are not wired to `/gateway/access-check`.
- Field-entitlement evaluator scaffold exists, but live DB policy source is not
  wired.
- Hyperdrive and Supabase live database are not provisioned.
