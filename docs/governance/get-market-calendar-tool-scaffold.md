# Get Market Calendar Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 01:10 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-get-market-calendar-tool-scaffold.md`
> **Task Contract**:
> `tasks/contracts/get-market-calendar-tool-scaffold.contract.md`

This slice adds the third atomic Sprint 1.2 data tool scaffold. It returns
synthetic HK market calendar sessions without reading the database, executing
SQL, loading partner rows, enabling MCP endpoints, executing quote/history
tools, or touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Market calendar package | `packages/market-calendar` | Owns no-live `getMarketCalendar()` fixture lookup |
| Shared Tool Registry | `packages/tool-registry` | Marks `get_market_calendar` as scaffold-ready with live access disabled |
| Worker route | `POST /tools/get-market-calendar` | Exposes standard envelope result/error responses |
| Tool contract | `deploy/tools/get-market-calendar.contract.json` | Requires date-range inputs, HK timezone, session states, closures, and no SQL/URL |
| Live exchange calendar | Absent | Synthetic fixtures only; no Supabase/Hyperdrive reads |

## P2 Concrete Trace

Trading-day trace:

1. Client sends `POST /tools/get-market-calendar` with market `HK`, from
   `2026-01-05`, and to `2026-01-07`.
2. Worker calls `getMarketCalendar()`.
3. The tool validates the date range and finds the synthetic HK calendar.
4. The tool returns two `trading_day` sessions and one `half_day` session,
   provenance, and zero credits.
5. Worker wraps the result in the shared success envelope.

Closed-session trace:

1. Client requests `2026-01-08` to `2026-01-10`.
2. The tool returns closed sessions for synthetic weather, holiday, and weekend
   closure reasons.
3. Worker returns `200 OK` with live data disabled.

Error trace:

1. Unsupported markets return `404 NOT_FOUND`.
2. Out-of-coverage ranges return `422 OUT_OF_RANGE`.
3. Invalid date ranges return `400 SCOPE_DENIED`.
4. All paths use the shared error envelope and zero usage.

## P3 Design Decision

Selected synthetic HK calendar fixtures before live exchange calendar reads.

Reason:

- Sprint 1.2 needs calendar semantics before quote and price-history tools can
  expose point-in-time snapshots or date ranges.
- Partner-approved exchange calendar rows and live Serving reads are still
  absent.
- Synthetic fixtures are sufficient to prove trading/half-day/closed-session
  semantics and standard errors without expanding redistribution risk.

Tradeoff:

- The system now has three executable atomic tool scaffolds.
- Production calendar coverage, DB-backed holiday/weather ingestion, and
  MCP/API tool-call integration remain incomplete.

## Verification

Passed:

- `npm run test -- packages/market-calendar/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check`
- `npm run check:market-calendar`
- `npm run check:tool-registry`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `scripts/check-task-workflow.sh --strict`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `POST /tools/get-market-calendar` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`

Observed route fields:

```json
{
  "calendar": {
    "status": "found",
    "sessions": ["trading_day", "trading_day", "half_day"],
    "timezone": "Asia/Hong_Kong",
    "liveDataAccess": false
  },
  "closed": {
    "status": "found",
    "closureReasons": ["weather", "holiday", "weekend"]
  },
  "runtime": {
    "handler_ready_tool_count": 3,
    "execution_ready": false
  }
}
```

## Residual Gaps

- Live exchange calendar reads are absent.
- Partner-approved market calendar rows are absent.
- MCP endpoint and protocol tool-call integration are absent.
- Quote and price-history handlers are absent.
- Evidence/Lineage service is absent.
