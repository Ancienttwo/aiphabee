# Notes: get-price-history-tool-scaffold

> **Last Updated**: 2026-06-21 01:52 +08
> **Plan**: `plans/plan-get-price-history-tool-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/get-price-history-tool-scaffold.md`

## Decisions

- Added `get_price_history` as a no-live synthetic scaffold in
  `@aiphabee/market-data`.
- Implemented synthetic OHLCV, turnover, return, and drawdown history rows.
- Supported `raw`, `split_adjusted`, and `total_return_adjusted` adjustment
  methodology metadata.
- Supported field subsets and deterministic limit/cursor pagination.
- Returned standard error states for unlicensed fields/adjustments, quality
  hold, out of range, too many rows, not found, and invalid input.
- Added `POST /tools/get-price-history` with standard success/error envelopes.
- Marked `get_price_history` as scaffold-ready in the shared registry.
- Kept partner/vendor rows, live DB reads, corporate-action factor generation,
  MCP endpoints, benchmark comparison, and frontend out of scope.

## Verification

- Passed: `npm run test -- packages/market-data/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check:market-data`
- Passed: `npm run check:tool-registry`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: `git diff --check`
- Passed: secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`.
- Passed: `scripts/check-task-workflow.sh --strict`
- Passed: Wrangler smoke for `/tools/get-price-history` and `/tools/runtime`.

## Residual Blockers

- Live price history reads are absent.
- Partner/vendor price rows and redistribution rights are absent.
- Corporate-action factor engine integration is absent.
- MCP endpoint and protocol tool-call integration are absent.
- Evidence/Lineage service is absent.
