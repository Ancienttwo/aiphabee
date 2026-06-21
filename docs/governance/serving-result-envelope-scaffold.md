# Serving Result Envelope Scaffold

> **Status**: Verified result envelope scaffold
> **Last Updated**: 2026-06-20 18:25 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-serving-result-envelope-scaffold.md`
> **Task Contract**:
> `tasks/contracts/serving-result-envelope-scaffold.contract.md`

This slice adds a no-live result payload after the Serving execution adapter.
It binds Gateway decisions to empty rows, provenance, usage, and market-status
metadata without executing SQL, reading Hyperdrive/Supabase, loading partner
rows, or enabling frontend access.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Shared envelope contract | `packages/data-contracts` | Owns `as_of`, `market_status`, `provenance`, `usage`, and request metadata |
| Gateway evaluator | `packages/data-access-gateway` | Attaches `servingResult` after `servingExecution` |
| Worker runtime route | `GET /gateway/runtime` | Reports `serving_result_envelope_scaffold`, no returned rows |
| Access contract | `deploy/gateway/access.contract.json` | Requires result-envelope guard |
| Live Serving response body | Absent | Result payload exists, but API/MCP routes, SQL execution, partner rows, and billing writes remain absent |

## P2 Concrete Trace

Deferred result trace:

1. `evaluateDataAccessRequest()` completes rights, field, quality, read, query,
   descriptor, SQL text, and execution-adapter planning.
2. Planned SQL text produces `servingExecution.status=execution_deferred`.
3. Gateway creates `servingResult.status=result_deferred`.
4. `servingResult` declares envelope fields
   `as_of`, `market_status`, `provenance`, and `usage`.
5. `servingResult` returns `rows=[]`, `rowCount=0`, `servedRows=0`,
   `liveDataAccess=false`, `liveRead=false`, and `sqlExecuted=false`.

Blocked result trace:

1. Default-deny, quality-held, or blocked SQL text decisions produce
   `servingExecution.status=execution_blocked`.
2. Gateway creates `servingResult.status=result_blocked` with the upstream
   blocked reason.
3. Rows remain empty and no live read or SQL execution surface is enabled.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports `guards` containing `serving_result_envelope_scaffold`.
3. Worker reports `serving_result_envelope.shared_envelope=true`,
   `rows_returned=false`, and `live_data_access=false`.

## P3 Design Decision

Selected a result-envelope scaffold instead of a live Serving response route.

Reason:

- The shared envelope contract already exists, but Gateway decisions needed a
  result payload that future API/MCP tools can reuse.
- Hyperdrive execution, partner rows, and live usage writes are still absent.
- Returning empty rows preserves the no-live and default-deny boundary while
  closing the next response-shape gap.

Tradeoff:

- Sprint 1.1 now has a stable no-live result payload after execution planning.
- This does not prove all future tools have adopted the envelope, and it still
  cannot return licensed market data.

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
  "guards": ["serving_result_envelope_scaffold"],
  "serving_result_envelope": {
    "status": "serving_result_envelope_scaffold",
    "envelope_fields": ["as_of", "market_status", "provenance", "usage"],
    "shared_envelope": true,
    "rows_returned": false,
    "live_data_access": false,
    "market_status": "not_applicable"
  }
}
```

## Residual Gaps

- API/MCP tool routes do not yet consume `servingResult`.
- SQL execution is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- Persistent usage writes and billing reconciliation are absent.
