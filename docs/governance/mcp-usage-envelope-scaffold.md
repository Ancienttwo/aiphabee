# MCP Usage Envelope Scaffold

> **Plan**: `plans/plan-mcp-usage-envelope-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-usage-envelope-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/usage-envelope.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns MCP `tools/call` protocol plan and response usage summary |
| `@aiphabee/usage-ledger` | Provides no-live usage event and quota display planners |
| `GET /mcp/runtime` | Reports usage envelope, remaining quota, and reconciliation readiness |
| `POST /mcp` `tools/call` | Adds request-scoped `usage_envelope` after schema and bounded retrieval validation |
| `deploy/mcp/usage-envelope.contract.json` | Guards MCP-07 usage/request_id/remaining quota posture |

Out of scope:

- `apps/web`
- live OAuth/API key workspace context
- live ledger reads or writes
- billing provider reconciliation
- real debit/refund accounting
- external SDK/Inspector smoke

## P2: Concrete Trace

1. `tools/call` validates origin, rights, scope, schema, and bounded retrieval.
2. MCP runtime computes an estimated credit count from the bounded row limit.
3. `@aiphabee/usage-ledger` creates a quota display snapshot with
   `request_id`, used credits, pending estimate, remaining credits, and a
   5-minute freshness target.
4. `@aiphabee/usage-ledger` creates a no-live usage event plan at
   `operation=tool_call`, `channel=mcp`, and the tool dataset.
5. MCP response `usage` exposes request id and remaining credits, while
   `tool_call.usage_envelope` exposes the ledger event and reconciliation plan.

## P3: Decision Rationale

Why this is no-live:

- `/mcp` still lacks live auth middleware and workspace binding.
- Usage ledger writes are intentionally disabled in the existing usage-ledger
  scaffold.
- The useful contract now is a stable, request-scoped accounting envelope that
  can later be wired to live auth and ledger writes.

Tradeoff:

- `estimated_credits` is visible for planning and remaining quota previews.
- `billable_credits` stays `0` until live ledger writes and reconciliation are
  enabled.

## Verification

Passed:

- `npm run check:mcp-usage-envelope`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts packages/usage-ledger/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/usage-ledger`

## Residual Gaps

- No live OAuth/API key workspace context.
- No live usage-ledger write/read.
- No billing reconciliation.
- No external client smoke.
