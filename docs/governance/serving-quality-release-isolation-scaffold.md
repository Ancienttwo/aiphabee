# Serving Quality Release Isolation Scaffold

> **Status**: Verified release/isolation scaffold
> **Last Updated**: 2026-06-20 17:20 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-serving-quality-release-isolation-scaffold.md`
> **Task Contract**:
> `tasks/contracts/serving-quality-release-isolation-scaffold.contract.md`

This slice creates a deterministic quality release/isolation planner for Serving
Store. It does not write live `core.serving_snapshot` rows, read partner data,
or enable frontend surfaces.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Release planner | `packages/serving-store` | Converts quality states into `held`, `released`, or `withdrawn` posture |
| Serving schema | `core.serving_snapshot.release_state` | Existing schema allows `held`, `released`, and `withdrawn` |
| Gateway contract | `deploy/gateway/access.contract.json` | Adds `serving_quality_release_isolation` required guard |
| Data runtime route | `GET /data/runtime` | Reports release/isolation capability, no live writes |
| Gateway runtime route | `GET /gateway/runtime` | Reports release/isolation capability, no live reads |
| Real Serving jobs | Absent | No Hyperdrive SQL, partner row, replay job, or persistent release mutation |

## P2 Concrete Trace

Release-isolation trace:

1. Code calls `createServingQualityReleasePlan()` with dataset, data version,
   rights policy version, methodology version, row count, source record, and
   snapshot/field/record quality states.
2. Planner aggregates snapshot, field, and record quality states.
3. If any state is `REJECT_RAW`, planner returns `releaseState=withdrawn`,
   `servingEligible=false`, `gatewayErrorCode=DATA_QUALITY_HOLD`,
   `releasedRows=0`, `isolatedRows=rowCount`, and `sqlEmitted=false`.
4. Else if any state is `HOLD`, planner returns `releaseState=held` with the
   same no-serving and no-SQL posture.
5. Else `PASS` and `WARN` return `releaseState=released`; `WARN` adds
   `quality_state_warn`.

Runtime capability trace:

1. Client calls `GET /data/runtime`.
2. Worker reports
   `serving_store.quality_release.status=quality_release_isolation_scaffold`,
   `live_writes=false`, `live_reads=false`, and `sql_emitted=false`.
3. Client calls `GET /gateway/runtime`.
4. Worker reports the same quality-release capability and includes
   `serving_quality_release_isolation` in Gateway guards.

## P3 Design Decision

Selected a deterministic release/isolation scaffold instead of live Serving
snapshot mutation.

Reason:

- Partner-approved source rows and signed data contracts are absent.
- Live quality jobs and replay jobs do not exist yet.
- Hyperdrive/Supabase live write/read smoke is still absent.
- Usage ledger live writes should not meter synthetic release planning.

Tradeoff:

- Sprint 1.1 now has executable quality-to-release semantics for Serving.
- The system still cannot publish or query real released Serving rows.

## Verification

Passed:

- `npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck`
- `npm run check:data-gateway`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /data/runtime` -> `200 OK`
- `GET /gateway/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed runtime fields:

```json
{
  "quality_release": {
    "status": "quality_release_isolation_scaffold",
    "blocks_quality_states": ["HOLD", "REJECT_RAW"],
    "released_quality_states": ["PASS", "WARN"],
    "release_states": ["held", "released", "withdrawn"],
    "gateway_error_code": "DATA_QUALITY_HOLD",
    "live_reads": false,
    "live_writes": false,
    "sql_emitted": false
  }
}
```

## Residual Gaps

- Live Supabase/Hyperdrive Serving writes and reads are absent.
- Partner-approved data loading is absent.
- Live quality jobs, replay jobs, and persistent release audit rows are absent.
- Field entitlement live DB policy source is not wired.
- Usage ledger live writes and billing reconciliation are not wired.
