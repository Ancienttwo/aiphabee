# Notes: MCP Tool Limiter Scaffold

Date: 2026-06-21

## Completed

- Added `MCP_TOOL_LIMITER_VERSION`.
- Added deterministic MCP limiter constants for high-cost threshold, standard
  pool parallelism, high-cost pool parallelism, and rate-limit shape.
- Extended `GET /mcp/runtime` capability output with limiter readiness, pool,
  error-code, and no-live flags.
- Added `tool_call.tool_limits` to `tools/call` plans.
- Routed estimated credits `<8` to `mcp_standard`.
- Routed estimated credits `>=8` to `mcp_high_cost` with planned
  `mcp-high-cost` queue metadata.
- Added budget pre-debit/failure-refund metadata without live debit.
- Added `deploy/mcp/tool-limiter.contract.json`.
- Added `npm run check:mcp-tool-limiter`.

## Trace

1. MCP `tools/call` input is validated for rights, scope, schema, pagination,
   and time range.
2. Runtime creates a `usage_envelope` with deterministic estimated credits.
3. Runtime creates `tool_limits` from the same estimate.
4. Standard requests stay in the ordinary MCP pool.
5. High-cost requests move to the high-cost pool and planned no-live queue
   metadata.

## Verification

- `npm run check:mcp-tool-limiter`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run lint && npm run typecheck && npm run test && npm run test:golden`
- `npm run build --workspace @aiphabee/mcp-runtime && npm run build --workspace @aiphabee/worker`

`npm run check` reached the final build phase and failed only in delegated
`@aiphabee/web` with `node:module` missing `registerHooks` under local
`node v22.12.0`. Backend contract checks and non-web package builds passed.

## Residual Gaps

- Live limiter reads/writes are not implemented.
- Durable queue writes are not implemented.
- Live usage-ledger debit/refund is not implemented.
- Developer Console is not implemented.
- External SDK/Inspector compatibility smoke is not implemented.
- Root `npm run check` still needs the delegated web build/runtime alignment to
  clear.
