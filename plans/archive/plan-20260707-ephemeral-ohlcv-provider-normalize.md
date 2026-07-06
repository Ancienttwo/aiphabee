# Plan Evidence: Ephemeral OHLCV Provider + Normalize

> **Status**: Completed
> **Completed**: 2026-07-07 03:26 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **Row**: 2

## Scope

Implemented Row 2 inside `@aiphabee/market-data`:

- `packages/market-data/src/ephemeral/types.ts`
- `packages/market-data/src/ephemeral/normalize.ts`
- `packages/market-data/src/ephemeral/provider.ts`
- `packages/market-data/src/ephemeral/index.ts`
- `packages/market-data/src/ephemeral/normalize.test.ts`
- `packages/market-data/src/ephemeral/provider.test.ts`
- `packages/market-data/src/index.ts`

## Decision

`EphemeralPublicOhlcvProvider` is an internal adapter boundary. It can return a
provider raw response plus metadata, but `fetchNormalizedEphemeralBars()` is the
only Row 2 exported provider consumption path and returns normalized bars only.
The normalized result does not expose `rawResponse` or provider-private metadata.

`normalizeEphemeralBars()` is fail-closed. Invalid OHLC relations, duplicate
timestamps, negative volume, invalid prices, invalid timestamps, and more than
500 bars produce structured issues instead of silent repair or partial output.

Timeout and retry constants are declared for the provider contract, but actual
timeout/retry execution remains Row 3.

## Verification

```sh
npx vitest run packages/market-data/src/ephemeral/normalize
npx vitest run packages/market-data/src/ephemeral/provider
npx vitest run packages/market-data/src
npm --workspace @aiphabee/market-data run typecheck
npm run typecheck
git diff --check
rg -n "EphemeralPublicOhlcvProvider" packages/market-data/src
rg -n "normalizeEphemeralBars" packages/market-data/src
rg -n "providerResponseSchemaVersion" packages/market-data/src
rg -n "INVALID_PROVIDER_RESPONSE|INVALID_OHLC_RELATION|DUPLICATE_TIMESTAMP|NEGATIVE_VOLUME" packages/market-data/src
```

Observed:

- Normalize vitest: 1 file passed, 6 tests passed.
- Provider vitest: 1 file passed, 6 tests passed.
- Market-data vitest: 3 files passed, 25 tests passed.
- `npm run typecheck`: all workspaces passed.
- `git diff --check`: clean.

## Next Dependency

Row 3 starts from `EphemeralPublicOhlcvProvider`,
`fetchNormalizedEphemeralBars()`, `MAX_EPHEMERAL_OHLCV_BARS`, and the provider
timeout/retry constants. It should add user-private TTL cache isolation and
actual timeout/retry behavior without changing the Row 2 normalized output
contract.
