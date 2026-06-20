# Data Access Gateway Default-Deny Scaffold

> **Status**: Verified guarded scaffold
> **Last Updated**: 2026-06-20 16:20 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-data-access-gateway-default-deny-scaffold.md`
> **Task Contract**:
> `tasks/contracts/data-access-gateway-default-deny-scaffold.contract.md`

This slice creates the first executable Data Access Gateway boundary. It does
not read real market data or grant any partner rights.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Gateway evaluator | `packages/data-access-gateway` | Default-deny rights, field redaction, row/time limits, quality hold, cache key |
| Gateway contract | `deploy/gateway/access.contract.json` | No-secret default-deny route/guard manifest |
| Contract checker | `scripts/check-data-access-gateway-contract.mjs` | Validates channels, guards, limits, routes, and no secret-like values |
| Worker runtime route | `GET /gateway/runtime` | Reports guard capabilities and no live data surface |
| Worker access route | `POST /gateway/access-check` | Returns `DATA_NOT_LICENSED` by default or `DATA_QUALITY_HOLD` for held data |
| Real Serving Store | Absent | Data schemas exist, but no partner rows, live entitlements, or MCP redistribution |

## P2 Concrete Trace

Default-deny trace:

1. Client sends `POST /gateway/access-check` with channel, dataset, fields, and
   requested row count.
2. Worker normalizes the request and calls `evaluateDataAccessRequest()`.
3. The default policy has every channel at `default_deny`.
4. Requested fields are denied with reason `channel_blocked`.
5. Worker returns a standard error envelope with `DATA_NOT_LICENSED`.

Quality-hold trace:

1. Client sends the same route with `quality_state=HOLD`.
2. The evaluator returns `status=quality_hold` before serving any fields.
3. Worker returns `DATA_QUALITY_HOLD` and zero usage rows/credits.

Allowed synthetic unit-test trace:

1. Tests use `createSyntheticApprovedPolicy()` for non-market synthetic fields.
2. Approved field is kept; unapproved field is redacted.
3. Cache key includes dataset, channel, plan, allowed fields, data version,
   rights policy version, methodology version, and time range.

## P3 Design Decision

Selected a guarded gateway scaffold instead of a real Serving Store integration.

Reason:

- Gate 0 rights matrix and partner field contract are not signed.
- Schema scaffolds exist, but no partner rows or Serving Store rows exist yet.
- Exposing real data before rights enforcement would violate PRD default-deny.

Tradeoff:

- Sprint 1.1 now has executable gateway behavior and runtime smoke.
- Usage ledger schemas and entitlement evaluator scaffold now exist, but it
  still does not complete real data persistence, live usage writes, billing
  reconciliation, or live database entitlement policy source.

## Verification

Passed:

- `npm run check:data-gateway`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /gateway/runtime` -> `200 OK`
- `POST /gateway/access-check` -> `403 DATA_NOT_LICENSED`
- `POST /gateway/access-check` with `quality_state=HOLD` ->
  `409 DATA_QUALITY_HOLD`
- `scripts/check-task-workflow.sh --strict`

Observed `/gateway/runtime` fields:

```json
{
  "default_rights_status": "default_deny",
  "live_data_access": false,
  "market_data_surfaces": false,
  "mcp_redistribution_surfaces": false,
  "rights_policy_version": "gate0-default-deny-v0"
}
```

## Residual Gaps

- Securities master, raw snapshot, financial fact/restatement, and
  corporate-action/adjustment schemas now exist, but real Serving Store is
  absent.
- Partner-signed rights matrix is absent.
- Account/workspace/plan and usage ledger schemas now exist, and entitlement
  enforcement has synthetic coverage, but live DB policy source, persistent
  usage writes, and billing reconciliation are absent.
- No external MCP/API redistribution surface is enabled.
