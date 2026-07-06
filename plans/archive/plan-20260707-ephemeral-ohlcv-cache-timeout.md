# Plan Evidence: Ephemeral OHLCV Cache + Timeout

> **Status**: Completed
> **Completed**: 2026-07-07 03:32 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **Row**: 3

## Scope

Implemented Row 3 inside `@aiphabee/market-data`:

- `packages/market-data/src/ephemeral/cache.ts`
- `packages/market-data/src/ephemeral/cache.test.ts`
- `packages/market-data/src/ephemeral/provider.ts`
- `packages/market-data/src/ephemeral/types.ts`
- `packages/market-data/src/ephemeral/index.ts`

## Decision

The first cache implementation is an in-memory deterministic contract for tests
and downstream integration. It is scoped by
`tenant_id:user_id:session_id` plus market/symbol/timeframe/lookback/adjust and
provider version. It caches only successful normalized results and never caches
provider failures or invalid responses.

Provider timeout/retry now runs in `fetchNormalizedEphemeralBars()`: default
timeout is 8000ms and max retries is 1. Timeout or thrown provider errors fail
closed as `PROVIDER_UNAVAILABLE` with no fabricated bars.

No raw OHLCV market persistence was added.

## Verification

```sh
npx vitest run packages/market-data/src/ephemeral/cache
npx vitest run packages/market-data/src/ephemeral
npx vitest run packages/market-data/src
npm run typecheck
git diff --check
rg -n "market_bars" packages/market-data/src
rg -n "86_400|tenant_id.*user_id.*session_id|PROVIDER_UNAVAILABLE|timeoutMs|maxRetries" packages/market-data/src/ephemeral
```

Observed:

- Cache vitest: 1 file passed, 4 tests passed.
- Ephemeral vitest: 3 files passed, 16 tests passed.
- Market-data vitest: 4 files passed, 29 tests passed.
- `npm run typecheck`: all workspaces passed.
- `git diff --check`: clean.
- `market_bars` grep exited 1 with no output, as expected.

## Next Dependency

Row 4 starts from normalized bars only:
`NormalizedEphemeralBar[]`, `normalizeEphemeralBars()`, and
`fetchNormalizedEphemeralBars()`. Indicator computation must not consume provider
raw response.
