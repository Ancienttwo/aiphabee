# Plan Evidence: Ephemeral OHLCV Indicators + Signal Engine

> **Status**: Completed
> **Completed**: 2026-07-07 03:35 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **Row**: 4

## Scope

Implemented Row 4 inside `@aiphabee/market-data`:

- `packages/market-data/src/ephemeral/technical.ts`
- `packages/market-data/src/ephemeral/technical.test.ts`
- `packages/market-data/src/ephemeral/index.ts`

## Decision

The indicator engine consumes only `NormalizedEphemeralBar[]`. It does not read
or expose provider raw response.

Implemented deterministic indicators:

- MA 5/20/60
- EMA 12/26
- MACD 12/26/9
- RSI 14
- BOLL 20/2
- ATR 14
- Volume MA 20
- OBV

Warmup positions return `null` for period-bound indicators. Signal output is
observation-only across trend, momentum, volatility, and volume dimensions.

## Verification

```sh
npx vitest run packages/market-data/src/ephemeral/technical
npx vitest run packages/market-data/src/ephemeral
npx vitest run packages/market-data/src
npm run typecheck
git diff --check
rg -n "buy_signal|sell_signal|stop_loss|target_price|position_size" packages/market-data/src/ephemeral
rg -n "computeTechnicalIndicators|computeTechnicalSignals|macd|rsi14|boll20|atr14" packages/market-data/src/ephemeral
```

Observed:

- Technical vitest: 1 file passed, 3 tests passed.
- Ephemeral vitest: 4 files passed, 19 tests passed.
- Market-data vitest: 5 files passed, 32 tests passed.
- `npm run typecheck`: all workspaces passed.
- `git diff --check`: clean.
- Forbidden trading-term grep exited 1 with no output, as expected.

## Next Dependency

Row 5 can gate `analyze_public_technical_signal` before agent integration using
the existing policy constants from Row 1 and bounded/cache/provider contracts
from Rows 2-4.
