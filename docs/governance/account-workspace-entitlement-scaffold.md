# Account Workspace Entitlement Scaffold

> **Status**: Verified schema scaffold
> **Last Updated**: 2026-06-20 16:20 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-account-workspace-entitlement-scaffold.md`
> **Task Contract**:
> `tasks/contracts/account-workspace-entitlement-scaffold.contract.md`

This slice creates the empty schema foundation for Sprint 1.1 account,
Workspace, subscription, and data-entitlement separation. It does not apply to a
live database and does not enable live auth, billing, or entitlement execution.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Migration | `supabase/migrations/20260620085000_account_workspace_entitlement_scaffold.sql` | Creates empty `core` account/entitlement tables and governance contract |
| Contract | `deploy/database/migrations.contract.json` | Lists all local migrations and keeps `market_data=false` |
| Data runtime route | `GET /data/runtime` | Reports schema capability, no live query |
| Gateway runtime route | `GET /gateway/runtime` | Reports entitlement model capability, no live enforcement |
| Account/workspace | `platform.account`, `platform.workspace`, `platform.workspace_membership` | Multiple workspaces per account with role and validity windows |
| Subscription | `platform.subscription_plan`, `platform.workspace_subscription` | Plan is separated from workspace subscription state |
| Entitlement | `aiphabee_governance.data_entitlement`, `aiphabee_governance.workspace_entitlement` | Data rights default-deny and bind to workspace, not just user |
| Live enforcement | Absent | No identity provider, payment provider, account rows, or entitlement execution |

## P2 Concrete Trace

Migration validation trace:

1. `npm run check:database` reads `deploy/database/migrations.contract.json`.
2. The checker verifies every listed SQL file exists in `supabase/migrations`.
3. It rejects destructive SQL, provider secrets, database URLs, and missing table
   coverage.
4. It validates the new scaffold migration creates:
   - account/workspace/membership tables;
   - subscription plan and workspace subscription tables;
   - data entitlement and workspace entitlement tables;
   - governance contract row.

Runtime capability trace:

1. Client calls `GET /data/runtime` or `GET /gateway/runtime`.
2. Worker returns standard success envelopes with:
   - `status=schema_scaffold`;
   - `workspace_isolation=true`;
   - `live_enforcement=false`;
   - default entitlement status `default_deny`;
   - no market data and no live queries.

## P3 Design Decision

Selected empty schema scaffold instead of live auth, billing, or entitlement
execution.

Reason:

- Gate 0 rights matrix and partner data contract are not signed.
- Identity provider, payment provider, and Hyperdrive live resources are not
  provisioned.
- ACC-02 is the account/workspace/subscription separation model; DAT-05 live
  field execution and ACC-04 usage ledger are separate Sprint 1.1 rows.

Tradeoff:

- Sprint 1.1 now has concrete ACC-02 storage structures.
- It still cannot enforce real field entitlements or reconcile usage to billing.

## Verification

Passed:

- `npm run check:database`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /data/runtime` -> `200 OK`
- `GET /gateway/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed runtime fields:

```json
{
  "account_workspace": {
    "default_entitlement_status": "default_deny",
    "live_enforcement": false,
    "status": "schema_scaffold",
    "workspace_isolation": true
  },
  "account_workspace_entitlements": {
    "live_enforcement": false,
    "status": "schema_scaffold",
    "workspace_isolation": true
  }
}
```

## Residual Gaps

- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Identity provider and payment provider integrations are absent.
- Real account, workspace, subscription, and entitlement rows are absent.
- Usage ledger schemas and field-entitlement evaluator scaffold now exist in
  `docs/governance/usage-ledger-scaffold.md` and
  `docs/governance/field-entitlement-enforcement-scaffold.md`, but live DB
  policy source and billing reconciliation remain unwired.
