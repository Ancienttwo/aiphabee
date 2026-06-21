# Get Quote Snapshot Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 01:42 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-get-quote-snapshot-tool-scaffold.md`
> **Task Contract**:
> `tasks/contracts/get-quote-snapshot-tool-scaffold.contract.md`

This slice adds the fourth atomic Sprint 1.2 data tool scaffold. It returns
synthetic quote snapshots without reading the database, executing SQL, loading
partner/vendor rows, enabling MCP endpoints, exposing real-time bid/ask, or
touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Market data package | `packages/market-data` | Owns no-live `getQuoteSnapshot()` fixture lookup |
| Shared Tool Registry | `packages/tool-registry` | Marks `get_quote_snapshot` as scaffold-ready with live access disabled |
| Worker route | `POST /tools/get-quote-snapshot` | Exposes standard envelope result/error responses |
| Tool contract | `deploy/tools/get-quote-snapshot.contract.json` | Requires quote fields, delay metadata, standard errors, and no SQL/URL |
| Live quote source | Absent | Synthetic fixtures only; no Supabase/Hyperdrive/vendor reads |

## P2 Concrete Trace

Delayed trace:

1. Client sends `POST /tools/get-quote-snapshot` with
   `instrument_id=eq_hk_00700` and requested fields.
2. Worker calls `getQuoteSnapshot()`.
3. The tool validates fields and finds the synthetic delayed quote fixture.
4. The tool returns `status=found`, price/volume fields, delay metadata,
   provenance, and synthetic credits.
5. Worker wraps the result in the shared success envelope.

Close trace:

1. Client sends `mode=close`.
2. The tool returns the same synthetic fixture as a close snapshot with zero
   delay and closed market status.
3. Worker returns `200 OK` with live data disabled.

Error trace:

1. Unsupported fields return `403 DATA_NOT_LICENSED`.
2. Held fixtures return `409 DATA_QUALITY_HOLD`.
3. Unsupported points in time return `422 POINT_IN_TIME_UNAVAILABLE`.
4. Unknown instruments return `404 NOT_FOUND`.
5. Empty instrument IDs return `400 SCOPE_DENIED`.

## P3 Design Decision

Selected synthetic delayed/close quote fixtures before live market data reads.

Reason:

- Sprint 1.2 needs quote envelope semantics before price history and analytics
  tools can depend on market data outputs.
- Market-data rights, live quote rows, and real-time bid/ask scope are not
  approved.
- Synthetic fixtures are enough to prove delay, field subset, quality hold, and
  standard error behavior without expanding redistribution risk.

Tradeoff:

- The system now has four executable atomic tool scaffolds.
- Production market data, vendor entitlement enforcement, price history, and
  MCP/API tool-call integration remain incomplete.

## Verification

Passed:

- `npm run test -- packages/market-data/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check`
- `npm run check:market-data`
- `npm run check:tool-registry`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- Direct deploy SQL helper:
  `bash /Users/chris/Projects/agentic-dev/assets/templates/helpers/check-deploy-sql-order.sh --quiet`
- `scripts/check-task-workflow.sh --strict`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `POST /tools/get-quote-snapshot` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`

Observed route fields:

```json
{
  "quote": {
    "status": "found",
    "mode": "delayed",
    "delay": {
      "minutes": 15,
      "type": "delayed"
    },
    "liveDataAccess": false
  },
  "errors": {
    "unlicensed": "DATA_NOT_LICENSED",
    "quality": "DATA_QUALITY_HOLD",
    "unavailable": "POINT_IN_TIME_UNAVAILABLE",
    "missing": "NOT_FOUND",
    "invalid": "SCOPE_DENIED"
  },
  "runtime": {
    "handler_ready_tool_count": 4,
    "execution_ready": false
  }
}
```

## Residual Gaps

- Live quote reads are absent.
- Partner/vendor quote rows and real-time rights are absent.
- MCP endpoint and protocol tool-call integration are absent.
- Price-history handler is absent.
- Evidence/Lineage service is absent.
