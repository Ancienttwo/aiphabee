# Notes: account-workspace-entitlement-scaffold

> **Last Updated**: 2026-06-20 16:20 +08
> **Plan**: `plans/plan-account-workspace-entitlement-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/account-workspace-entitlement-scaffold.md`

## Decisions

- Added empty account, workspace, subscription, entitlement, and workspace
  entitlement schemas only. No real user, billing, market data, partner samples,
  URLs, or credentials are committed.
- Kept workspace entitlements default-deny and separate from subscription plan
  records so plans cannot grant fields blocked by rights policy.
- Added both `/data/runtime` and `/gateway/runtime` capability fields, not live
  account lookup or entitlement execution.

## Verification

- Passed: `npm run check:database`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /data/runtime`
- Passed: Wrangler smoke for `GET /gateway/runtime`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Identity provider and payment provider integrations are absent.
- Real account, workspace, subscription, and entitlement rows are absent.
- Usage ledger schemas now exist, but live field-level entitlement execution and
  billing reconciliation remain unwired.
- Hyperdrive and Supabase live database are not provisioned.
