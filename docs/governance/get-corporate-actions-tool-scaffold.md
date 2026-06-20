# Get Corporate Actions Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 02:03 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-get-corporate-actions-tool-scaffold.md`
> **Task Contract**:
> `tasks/contracts/get-corporate-actions-tool-scaffold.contract.md`

This slice adds the sixth atomic Sprint 1.2 data tool scaffold. It returns
synthetic corporate-action timelines without reading the database, executing
SQL, loading partner/vendor rows, enabling MCP endpoints, calculating live
adjustment factors, or touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Corporate-actions package | `packages/corporate-actions` | Owns no-live `getCorporateActions()` fixture lookup and existing adjustment engine |
| Shared Tool Registry | `packages/tool-registry` | Marks `get_corporate_actions` as scaffold-ready with live access disabled |
| Worker route | `POST /tools/get-corporate-actions` | Exposes standard envelope result/error responses |
| Tool contract | `deploy/tools/get-corporate-actions.contract.json` | Requires action fields, adjustment-impact metadata, cursor behavior, standard errors, and no SQL/URL |
| Live action source | Absent | Synthetic fixtures only; no Supabase/Hyperdrive/vendor reads |

## P2 Concrete Trace

Found trace:

1. Client sends `POST /tools/get-corporate-actions` with
   `instrument_id=eq_hk_00700`, date range, action types, and limit.
2. Worker calls `getCorporateActions()`.
3. The tool validates date range, action types, limit, and cursor.
4. The tool filters synthetic action rows and returns dividend/buyback/split
   events, adjustment-impact metadata, `nextCursor`, provenance, and synthetic
   credits.
5. Worker wraps the result in the shared success envelope.

Error trace:

1. Unsupported action types return `403 DATA_NOT_LICENSED`.
2. Held fixtures return `409 DATA_QUALITY_HOLD`.
3. Unsupported date windows return `422 OUT_OF_RANGE`.
4. Over-limit requests return `422 TOO_MANY_ROWS`.
5. Unknown instruments return `404 NOT_FOUND`.
6. Invalid input returns `400 SCOPE_DENIED`.

## P3 Design Decision

Selected a synthetic action timeline query beside the existing adjustment
engine.

Reason:

- Sprint 1.2 needs a company-action tool surface before Evidence/Lineage and
  stock-workbench timelines can depend on event data.
- Existing adjustment engine proves factor semantics, but it is not a user/tool
  query surface.
- Synthetic fixtures are enough to prove action types, date filtering, cursor
  pagination, adjustment impact metadata, quality hold, range, and row-limit
  behavior without expanding partner-data risk.

Tradeoff:

- The system now has six executable atomic tool scaffolds.
- Production corporate-action rows, public benchmark parity, live adjustment
  factor generation, MCP protocol tool-call integration, and Evidence/Lineage
  remain incomplete.

## Verification

Passed:

- `npm run test -- packages/corporate-actions/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:corporate-actions`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run check`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `scripts/check-task-workflow.sh --strict`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /tools/get-corporate-actions` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`

Observed route fields:

```json
{
  "corporate_actions": {
    "status": "found",
    "actions": 2,
    "totalRows": 4,
    "nextCursor": "offset:2",
    "firstType": "dividend",
    "liveDataAccess": false
  },
  "runtime": {
    "handler_ready_tool_count": 6,
    "get_corporate_actions": "scaffold"
  }
}
```

## Residual Gaps

- Live corporate-action reads are absent.
- Partner/vendor corporate-action rows and redistribution rights are absent.
- Public benchmark parity is absent.
- Live adjustment factor generation remains absent.
- MCP endpoint and protocol tool-call integration are absent.
- Evidence/Lineage service is absent.
