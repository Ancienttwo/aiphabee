# MCP Pagination Limits Scaffold

> **Plan**: `plans/plan-mcp-pagination-limits-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-pagination-limits-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/pagination-limits.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/tool-registry` | Owns registered tool retrieval limits, cursor pagination metadata, and time-window bounds |
| `@aiphabee/mcp-runtime` | Validates `tools/call` row limits, cursor shape, and time range before no-live execution planning |
| `GET /tools/runtime` | Reports registry-side pagination limit readiness |
| `GET /mcp/runtime` | Reports MCP pagination/time-range limit readiness |
| `POST /mcp` `tools/list` | Returns retrieval limit descriptors when rights are confirmed |
| `POST /mcp` `tools/call` | Adds `bounded_retrieval` plan and rejects over-limit requests before execution |
| `deploy/mcp/pagination-limits.contract.json` | Guards MCP-06 pagination, max-row, and time-range posture |

Out of scope:

- `apps/web`
- live MCP authentication middleware
- live tool execution
- live usage-ledger debits
- external MCP Inspector or SDK smoke
- Developer Console quota/log UI

## P2: Concrete Trace

1. Tool Registry attaches retrieval metadata to each registered tool:
   cursor support, row limit, time-range limit, and bypass guard.
2. MCP runtime capabilities expose `pagination_limits_ready=true`,
   `cursor_pagination_ready=true`, `max_row_limit_enforced=true`, and
   `time_range_limits_ready=true`.
3. When rights are confirmed for `tools/list`, each descriptor includes
   `retrieval_limits`.
4. For `tools/call`, schema validation first rejects unsupported arguments.
5. `bounded_retrieval` then validates:
   - `limit` / `requested_rows` is a positive integer and does not exceed max;
   - `cursor` is an opaque non-empty string when provided;
   - `from/to` or `time_range.from/to` are ISO dates and do not exceed the max window.
6. Over-row requests map to `TOO_MANY_ROWS`; invalid or over-window requests map
   to `OUT_OF_RANGE`.

## P3: Decision Rationale

Why the guard is in MCP runtime:

- Current MCP is still default-deny and no-live execution.
- The enforceable surface is the protocol plan, not a database read.
- Tool Registry remains the authority for per-tool bounds, while MCP runtime
  applies those bounds to concrete request arguments.

Tradeoff:

- This proves pagination and time-window bypasses are blocked before execution.
- It does not claim live entitlement reconciliation, usage-ledger accounting, or
  external client smoke.

## Verification

Passed:

- `npm run check:tool-registry`
- `npm run check:mcp-pagination-limits`
- `npm run test -- packages/tool-registry/src/index.test.ts packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/tool-registry`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- No live OAuth/API key auth middleware.
- No live tool execution or persistent pagination cursor store.
- No usage-ledger reconciliation for paginated calls.
- No external SDK/Inspector smoke.
