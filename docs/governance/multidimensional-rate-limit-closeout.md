# Multidimensional Rate Limit Closeout

> **Status**: Verified local runtime closeout
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/multidimensional-rate-limit-closeout.contract.md`

This slice closes the local A3 requirement for multidimensional rate limiting.
Every MCP `tools/call` limiter plan now exposes a scope over user, workspace,
client, tool, dataset, and IP risk. The scope feeds rate-limit, concurrency, and
budget key material plus the high-cost queue idempotency key.

It does not enable live limiter windows, live concurrency reads, usage-ledger
debit/refund, raw IP storage, IP reputation lookups, anomaly detection, or an
enterprise bulk plan.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| MCP runtime | `packages/mcp-runtime` | Builds `tool_call.tool_limits.scope` before any live execution |
| Worker route | `POST /mcp` | Forwards client identity, workspace, IP presence, and IP risk header into planner |
| Runtime capability | `GET /mcp/runtime` | Reports limiter dimensions and no raw IP storage |
| MCP limiter contract | `deploy/mcp/tool-limiter.contract.json` | Requires scope dimensions on existing MCP-11 gate |
| A3 governance gate | `deploy/governance/multidimensional-rate-limit.contract.json` | Cross-checks source, tests, contracts, worker route, and tracker |
| Risk burn-down | Still partial | Batch-scrape risk also needs anomaly detection and enterprise bulk packaging |

## P2 Concrete Trace

1. `POST /mcp` parses JSON-RPC method and params.
2. Worker passes account, workspace, client name/version, tool name, arguments,
   IP presence, and `x-aiphabee-ip-risk` into `createMcpProtocolPlan()`.
3. `tools/call` validates rights, scopes, input schema, bounded retrieval, and
   usage envelope.
4. `createMcpToolLimitsPlan()` computes weight, budget, concurrency pool, queue
   status, and rate-limit metadata.
5. `createMcpToolLimiterScope()` binds user, workspace, client, tool, dataset,
   and IP risk into `scope.key_material`.
6. The durable queue idempotency key includes scoped limiter key material, while
   raw IP is never returned or stored.

## P3 Design Decision

Selected a deterministic no-live scope planner instead of live limiter storage.

Reason:

- Existing MCP limiter already models rate, concurrency, budget, queue, and
  error-code behavior.
- A3 lacked explicit multidimensional key material tying those controls to user,
  workspace, client, tool, dataset, and IP risk.
- Live limiter state would require an external store and operational policy that
  is not present in this repo slice.

Tradeoff:

- A3 can now be checked for runtime scope correctness.
- The broader batch-scraping risk remains open until live window reads,
  anomaly detection, and enterprise bulk-plan policy exist.

## Verification

Required:

- `npm run check:multidimensional-rate-limit`
- `npm run check:mcp-tool-limiter`
- `npm run test -- packages/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check`

## Residual Gaps

- Live limiter window reads are disabled.
- Live concurrency state reads are disabled.
- Usage-ledger debit/refund writes are disabled.
- Live IP reputation is disabled and raw IP is not stored.
- Anomaly detection and enterprise bulk plan remain incomplete.
