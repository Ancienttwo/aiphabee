# Field Entitlement Policy Source Scaffold

> **Status**: Verified policy-source scaffold
> **Last Updated**: 2026-06-20 17:38 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-field-entitlement-policy-source-scaffold.md`
> **Task Contract**:
> `tasks/contracts/field-entitlement-policy-source-scaffold.contract.md`

This slice creates a deterministic compiler from account/workspace entitlement
rows into Data Access Gateway policy. It does not read live database rows, ingest
partner rights matrices, or enable live Serving reads.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Policy source compiler | `packages/data-access-gateway` | Converts entitlement row snapshots into `DataAccessPolicy` |
| Data entitlement rows | `aiphabee_governance.data_entitlement` | Dataset/channel/field/time/export/right policy contract |
| Workspace entitlement rows | `aiphabee_governance.workspace_entitlement` | Workspace binding and active validity interval |
| Subscription rows | `platform.workspace_subscription` | Plan code and billing-state filter |
| Worker runtime route | `GET /gateway/runtime` | Reports policy-source capability, no live DB reads |
| Real policy source | Absent | No Hyperdrive query, partner matrix ingestion, or signed external rights |

## P2 Concrete Trace

Policy-source trace:

1. Code calls `createPolicyFromEntitlementRows()` with an `asOf` timestamp and
   row snapshots from `data_entitlement`, `workspace_entitlement`, and optional
   `workspace_subscription`.
2. Compiler filters inactive workspace entitlements and inactive subscriptions.
3. Compiler joins workspace entitlements to data entitlements.
4. Only active workspace-bound entitlement rows become field and entitlement
   policies.
5. Wildcard field patterns such as `synthetic_profile.*` are supported.
6. `blocked` rows take precedence over wildcard approvals.
7. The resulting `DataAccessPolicy` still defaults every unrelated channel and
   field to `default_deny`.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports
   `field_entitlement_enforcement.policy_source.status=policy_source_scaffold`,
   `live_db_reads=false`, `partner_rights_matrix_loaded=false`, and
   `sql_emitted=false`.

## P3 Design Decision

Selected a row-snapshot compiler instead of live database policy reads.

Reason:

- Partner field rights matrix is not signed.
- No live entitlement rows have been approved or loaded.
- Hyperdrive/Supabase live read smoke is absent.
- Gateway must remain default-deny until policy rows are trusted.

Tradeoff:

- Sprint 1.1 now has executable DB policy-source semantics.
- The system still cannot enforce live partner entitlements from production
  rows.

## Verification

Passed:

- `npm run test -- packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck`
- `npm run check:data-gateway`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /gateway/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/gateway/runtime` fields:

```json
{
  "field_entitlement_enforcement": {
    "policy_source": {
      "status": "policy_source_scaffold",
      "compiles_to_gateway_policy": true,
      "default_rights_status": "default_deny",
      "live_db_reads": false,
      "partner_rights_matrix_loaded": false,
      "sql_emitted": false
    },
    "live_policy_source": false
  }
}
```

## Residual Gaps

- Partner-signed field rights matrix is absent.
- Live database policy reads are absent.
- Live Serving Store reads are absent.
- Persistent usage writes and billing reconciliation are absent.
