# Get Price History Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 01:52 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-get-price-history-tool-scaffold.md`
> **Task Contract**:
> `tasks/contracts/get-price-history-tool-scaffold.contract.md`

This slice adds the fifth atomic Sprint 1.2 data tool scaffold. It returns
synthetic price history rows without reading the database, executing SQL,
loading partner/vendor rows, enabling MCP endpoints, calculating live corporate
action factors, or touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Market data package | `packages/market-data` | Owns no-live `getPriceHistory()` fixture lookup |
| Shared Tool Registry | `packages/tool-registry` | Marks `get_price_history` as scaffold-ready with live access disabled |
| Worker route | `POST /tools/get-price-history` | Exposes standard envelope result/error responses |
| Tool contract | `deploy/tools/get-price-history.contract.json` | Requires OHLCV/return fields, adjustment metadata, cursor behavior, standard errors, and no SQL/URL |
| Live history source | Absent | Synthetic fixtures only; no Supabase/Hyperdrive/vendor reads |

## P2 Concrete Trace

Found trace:

1. Client sends `POST /tools/get-price-history` with
   `instrument_id=eq_hk_00700`, date range, adjustment, fields, and limit.
2. Worker calls `getPriceHistory()`.
3. The tool validates date range, fields, adjustment, limit, and cursor.
4. The tool filters synthetic price rows and returns OHLCV/return/drawdown
   fields, adjustment methodology, `nextCursor`, provenance, and synthetic
   credits.
5. Worker wraps the result in the shared success envelope.

Error trace:

1. Unsupported fields or adjustments return `403 DATA_NOT_LICENSED`.
2. Held fixtures return `409 DATA_QUALITY_HOLD`.
3. Unsupported date windows return `422 OUT_OF_RANGE`.
4. Over-limit requests return `422 TOO_MANY_ROWS`.
5. Unknown instruments return `404 NOT_FOUND`.
6. Invalid input returns `400 SCOPE_DENIED`.

## P3 Design Decision

Selected synthetic OHLCV/return history fixtures before live Serving reads.

Reason:

- Sprint 1.2 needs price-history tool semantics before evidence/lineage and
  downstream analysis tools can depend on market data series.
- Corporate-action factors, partner price rows, and redistribution rights are
  not approved.
- Synthetic fixtures are enough to prove adjustment metadata, field subset,
  pagination, quality hold, range, and row-limit behavior.

Tradeoff:

- The system now has five executable atomic tool scaffolds.
- Production market data, vendor entitlement enforcement, corporate-action
  factor integration, benchmark comparison, MCP/API tool-call integration, and
  Evidence/Lineage remain incomplete.

## Verification

Passed:

- `npm run test -- packages/market-data/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:market-data`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run check`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `scripts/check-task-workflow.sh --strict`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /tools/get-price-history` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`

Observed route fields:

```json
{
  "history": {
    "status": "found",
    "adjustment": "total_return_adjusted",
    "rows": 2,
    "totalRows": 4,
    "nextCursor": "offset:2",
    "liveDataAccess": false
  },
  "runtime": {
    "handler_ready_tool_count": 5,
    "get_price_history": "scaffold"
  }
}
```

## Residual Gaps

- Live price history reads are absent.
- Partner/vendor price rows and redistribution rights are absent.
- Corporate-action factor engine integration is absent.
- Benchmark comparison execution is absent.
- MCP endpoint and protocol tool-call integration are absent.
- Evidence/Lineage service is absent.
