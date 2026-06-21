# Usage Quota Display Scaffold Notes

## Summary

Implemented the Sprint 1.4 ACC-04 backend scaffold for Web Agent and MCP quota
display.

## Current State

- `@aiphabee/usage-ledger` now exposes usage quota display capabilities.
- `GET /usage/runtime` reports quota display fields, supported channels,
  supported plan codes, and no-live-read/no-write posture.
- `POST /usage/quota/plan` returns a deterministic quota display snapshot plan
  with request id, plan code, channel, credit limit, used credits, pending
  credits, remaining credits, and 5-minute freshness target.

## Non-Goals

- No frontend quota UI.
- No live usage ledger reads.
- No persistent usage writes.
- No billing provider reconciliation.
- No SQL emission.

## Verification

Passed:

- `npm run check:usage-quota-display`
- `npm run test -- packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/usage-ledger`
- `npm run build --workspace @aiphabee/worker`
- `npm run dev:worker`
- `GET /usage/runtime` smoke:
  - `ok=true`
  - `status=usage_quota_display_scaffold`
  - `live_ledger_reads=false`
  - `persistent_writes=false`
  - `request_id_visible=true`
  - channels: `web_agent`, `mcp`
- `POST /usage/quota/plan` smoke:
  - `ok=true`
  - `status=planned_no_write`
  - `channel=mcp`
  - `credit_limit=10000`
  - `credits_used=240`
  - `credits_pending=10`
  - `credits_remaining=9750`
  - `live_ledger_reads=false`
  - `persistent_writes=false`
  - `sql_emitted=false`
