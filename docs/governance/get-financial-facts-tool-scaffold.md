# Get Financial Facts Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 02:15 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-get-financial-facts-tool-scaffold.md`
> **Task Contract**:
> `tasks/contracts/get-financial-facts-tool-scaffold.contract.md`

This slice adds the seventh atomic Sprint 1.2 data tool scaffold. It returns
synthetic standardized financial fact rows without reading the database,
executing SQL, loading partner/vendor rows, enabling MCP endpoints, ingesting
filings, calculating derived ratios, or touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Financial-facts package | `packages/financial-facts` | Owns no-live `getFinancialFacts()` fixture lookup and existing restatement engine |
| Shared Tool Registry | `packages/tool-registry` | Marks `get_financial_facts` as scaffold-ready with live access disabled |
| Worker route | `POST /tools/get-financial-facts` | Exposes standard envelope result/error responses |
| Tool contract | `deploy/tools/get-financial-facts.contract.json` | Requires period, currency, unit, accounting standard, scale, restatement version, point-in-time behavior, cursor behavior, standard errors, and no SQL/URL |
| Live fact source | Absent | Synthetic fixtures only; no Supabase/Hyperdrive/vendor reads |

## P2 Concrete Trace

Found trace:

1. Client sends `POST /tools/get-financial-facts` with
   `instrument_id=eq_hk_00700`, period range, metrics, statement types, `as_of`,
   and limit.
2. Worker calls `getFinancialFacts()`.
3. The tool validates period range, metrics, statement types, `as_of`, limit,
   and cursor.
4. The tool filters synthetic fact rows and returns income statement, balance
   sheet, and cash flow facts with period, currency, unit, accounting standard,
   scale, restatement version, provenance, and synthetic credits.
5. Worker wraps the result in the shared success envelope.

Error trace:

1. Unsupported metrics or statement types return `403 DATA_NOT_LICENSED`.
2. Held fixtures return `409 DATA_QUALITY_HOLD`.
3. Unavailable point-in-time requests return `422 POINT_IN_TIME_UNAVAILABLE`.
4. Unsupported period windows return `422 OUT_OF_RANGE`.
5. Over-limit requests return `422 TOO_MANY_ROWS`.
6. Unknown instruments return `404 NOT_FOUND`.
7. Invalid input returns `400 SCOPE_DENIED`.

## P3 Design Decision

Selected a synthetic standardized financial fact query beside the existing
restatement engine.

Reason:

- Sprint 1.2 needs a financial fact tool surface before Evidence/Lineage and
  stock-workbench fundamental views can depend on standardized statements.
- Existing restatement logic proves version semantics, but it is not a
  user/tool query surface.
- Synthetic fixtures are enough to prove statement types, metric filtering,
  point-in-time visibility, cursor pagination, quality hold, range, and
  row-limit behavior without expanding partner-data risk.

Tradeoff:

- The system now has seven executable atomic tool scaffolds.
- Production financial fact rows, partner/vendor redistribution rights, filing
  ingestion, derived ratios, MCP protocol tool-call integration, and
  Evidence/Lineage remain incomplete.

## Verification

Passed:

- `npm run test -- packages/financial-facts/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:financial-facts`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run test`
- `npm run check`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /tools/get-financial-facts` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`

Observed route fields:

```json
{
  "financial_facts": {
    "status": "found",
    "facts": 4,
    "totalRows": 4,
    "firstMetric": "assets",
    "liveDataAccess": false
  },
  "runtime": {
    "handler_ready_tool_count": 7,
    "get_financial_facts": "scaffold"
  }
}
```

## Residual Gaps

- Live financial fact reads are absent.
- Partner/vendor financial fact rows and redistribution rights are absent.
- Filing ingestion and document extraction are absent.
- Derived ratio/metric tooling is absent.
- MCP endpoint and protocol tool-call integration are absent.
- Evidence/Lineage service is absent.
