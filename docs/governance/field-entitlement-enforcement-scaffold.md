# Field Entitlement Enforcement Scaffold

> **Status**: Verified enforcement scaffold
> **Last Updated**: 2026-06-20 16:27 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-field-entitlement-enforcement-scaffold.md`
> **Task Contract**:
> `tasks/contracts/field-entitlement-enforcement-scaffold.contract.md`

This slice extends the Data Access Gateway evaluator so field access can be
decided by workspace, plan, channel, dataset, field, time-range, and export
context. It does not read live entitlement rows and does not enable market data.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Gateway package | `packages/data-access-gateway` | Deterministic evaluator with synthetic entitlement tests |
| Contract | `deploy/gateway/access.contract.json` | Declares entitlement guards and cache key dimensions |
| Contract checker | `scripts/check-data-access-gateway-contract.mjs` | Requires entitlement guards and cache keys |
| Runtime route | `GET /gateway/runtime` | Reports `field_entitlement_enforcement.status=scaffold` |
| Access route | `POST /gateway/access-check` | Accepts workspace/export context but remains default-deny without live policy |
| Live policy source | Absent | No partner rights matrix or database entitlement reads |

## P2 Concrete Trace

Synthetic evaluator trace:

1. Test builds `createSyntheticWorkspaceEntitlementPolicy()`.
2. Request includes `workspaceId`, `plan`, `channel`, `dataset`, fields,
   time-range, and optional export mode.
3. Evaluator first checks channel and field allowlist.
4. It then checks matching workspace entitlement rules:
   - missing workspace or plan mismatch -> `workspace_entitlement_default_deny`;
   - export request without export grant -> `export_blocked`;
   - range beyond entitlement window -> `time_range_blocked`.
5. Cache key includes workspace and export dimensions.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker returns:
   - entitlement dimensions;
   - `live_policy_source=false`;
   - `workspace_isolation=true`;
   - default-deny rights state.
3. Client calls `POST /gateway/access-check`.
4. Worker passes `workspace_id` and `export_requested` into the evaluator, but
   the default live policy still denies until a real policy source is wired.

## P3 Design Decision

Selected local deterministic enforcement scaffold instead of database-backed
entitlement reads.

Reason:

- Partner field rights matrix is not signed.
- No live database policy rows have been loaded.
- Real Serving Store remains absent, so allowing live data would be misleading.

Tradeoff:

- Sprint 1.1 now has executable DAT-05 policy logic and cache-key boundaries.
- It still cannot enforce real partner entitlements from production rows.

## Verification

Passed:

- `npm run check:data-gateway`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /gateway/runtime` -> `200 OK`
- `POST /gateway/access-check` -> `403 DATA_NOT_LICENSED`
- `scripts/check-task-workflow.sh --strict`

Observed `/gateway/runtime` fields:

```json
{
  "field_entitlement_enforcement": {
    "dimensions": [
      "workspace",
      "plan",
      "channel",
      "dataset",
      "field",
      "time_range",
      "export"
    ],
    "live_policy_source": false,
    "status": "scaffold",
    "workspace_isolation": true
  },
  "default_rights_status": "default_deny"
}
```

## Residual Gaps

- Partner-signed field rights matrix is absent.
- Live database policy source is not wired.
- Real Serving Gateway reads are absent.
- Usage ledger live writes are not wired.
