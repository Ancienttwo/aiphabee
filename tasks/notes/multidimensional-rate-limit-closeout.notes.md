# Multidimensional Rate Limit Closeout Notes

## What Changed

- Added `tool_call.tool_limits.scope` for user, workspace, client, tool,
  dataset, and IP risk.
- Added scoped limiter key material for rate, concurrency, and budget plans.
- Bound high-cost queue idempotency to scoped limiter material.
- Added `check:multidimensional-rate-limit` and wired it into root `npm run check`.
- Updated A3 while keeping the broader MCP batch-scraping risk row incomplete.

## Verification

- `npm run check:multidimensional-rate-limit`
- `npm run check:mcp-tool-limiter`
- `npm run test -- packages/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:task-sync`
- `npm run check`

## Remaining Gaps

Live limiter storage, live debit/refund writes, live IP reputation, anomaly
detection, and enterprise bulk-plan packaging are still not claimed.
