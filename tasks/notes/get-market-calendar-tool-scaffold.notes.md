# Notes: get-market-calendar-tool-scaffold

> **Last Updated**: 2026-06-21 01:10 +08
> **Plan**: `plans/plan-get-market-calendar-tool-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/get-market-calendar-tool-scaffold.md`

## Decisions

- Added `@aiphabee/market-calendar` as the no-live home for market calendar
  tool scaffolds.
- Implemented `getMarketCalendar()` with synthetic HK market calendar fixtures
  only.
- Covered full trading day, half-day, severe-weather closure, holiday closure,
  and weekend closure sessions.
- Added `POST /tools/get-market-calendar` with standard success/error
  envelopes.
- Marked `get_market_calendar` as scaffold-ready in the shared registry.
- Kept live DB reads, arbitrary SQL/URL, partner rows, quote/history execution,
  MCP endpoints, and frontend out of scope.

## Verification

- Passed: `npm run test -- packages/market-calendar/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check`
- Passed: `npm run check:market-calendar`
- Passed: `npm run check:tool-registry`
- Passed: `git diff --check`
- Passed: secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`.
- Passed: `scripts/check-task-workflow.sh --strict`.
- Passed: Wrangler smoke for `/tools/get-market-calendar` and `/tools/runtime`.

## Residual Blockers

- Live exchange calendar reads are absent.
- Partner-approved market calendar rows are absent.
- MCP endpoint and protocol tool call integration are absent.
- Quote and price-history handlers are absent.
- Evidence/Lineage service is absent.
