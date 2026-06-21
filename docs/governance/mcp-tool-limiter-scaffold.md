# MCP Tool Limiter Scaffold

> **Plan**: `plans/plan-mcp-tool-limiter-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-tool-limiter-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/tool-limiter.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns MCP tool-level limiter planning for `tools/call` |
| `GET /mcp/runtime` | Reports limiter readiness, no-live posture, standard error codes, and pool definitions |
| `POST /mcp` | Produces `tool_call.tool_limits` in planned `tools/call` responses |
| `@aiphabee/usage-ledger` | Supplies quota display and estimated remaining credits used by limiter planning |
| `deploy/mcp/tool-limiter.contract.json` | Guards MCP-11 rate/concurrency/budget no-live contract |

Out of scope:

- `apps/web`
- live limiter window reads
- durable queue writes
- live usage-ledger debit/refund
- live MCP tool execution
- external SDK/Inspector smoke

## P2: Concrete Trace

1. A MCP client calls `tools/call` with confirmed MCP redistribution rights and
   the required tool scope.
2. Runtime validates input schema, bounded retrieval, row limits, and time
   window.
3. Runtime creates `usage_envelope.estimated_credits` from effective row count.
4. Runtime creates `tool_limits` from the same estimate:
   - standard requests use `mcp_standard`, `max_parallel=8`, no queue;
   - high-cost requests use `mcp_high_cost`, `max_parallel=2`, planned
     `mcp-high-cost` queue metadata.
5. Response stays no-live: no limiter reads, no queue writes, no usage debit,
   and no live tool execution.

## P3: Decision Rationale

MCP-11 is a limiter contract slice, not a live enforcement slice. The stable
boundary is the MCP response plan shape plus runtime capability flags. Using the
existing usage estimate avoids a second cost model and keeps future live debit
aligned with what clients already see.

Tradeoff:

- High-cost detection currently uses effective row estimate as credit weight.
- This is sufficient for current registered MCP read tools.
- Future analytics MCP tools can replace the estimator with tool-specific
  weights while preserving the same `tool_limits` contract.

## Verification

Passed:

- `npm run check:mcp-tool-limiter`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- Live rate/concurrency/budget enforcement remains disabled.
- Durable queue writes remain disabled.
- Developer Console rendering is not implemented.
- External SDK/Inspector compatibility smoke remains pending.
