# Notes: field-entitlement-policy-source-scaffold

> **Last Updated**: 2026-06-20 17:38 +08
> **Plan**: `plans/plan-field-entitlement-policy-source-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/field-entitlement-policy-source-scaffold.md`

## Decisions

- Added a deterministic compiler from entitlement row snapshots into
  `DataAccessPolicy` instead of reading a live database.
- Compiled only active workspace-bound entitlement rows so bare
  `data_entitlement` rows cannot open a channel by themselves.
- Preserved default-deny for expired workspace entitlements.
- Added wildcard field pattern support and blocked-over-approved precedence.
- Exposed Worker `/gateway/runtime` capability only; no partner rights matrix or
  live DB policy read is enabled.

## Verification

- Passed: `npm run test -- packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run typecheck`
- Passed: `npm run check:data-gateway`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/gateway/runtime` policy source capability.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Partner-signed field rights matrix is absent.
- Live database policy reads are absent.
- Live Serving Store reads are absent.
- Persistent usage writes and billing reconciliation are absent.
