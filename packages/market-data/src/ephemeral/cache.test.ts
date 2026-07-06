import { describe, expect, it } from "vitest";
import {
  EPHEMERAL_OHLCV_CACHE_TTL_MS,
  InMemoryEphemeralOhlcvCache,
  getCachedOrFetchEphemeralBars,
  serializeEphemeralOhlcvCacheKey
} from "./cache";
import {
  type EphemeralOhlcvCacheKey,
  type EphemeralOhlcvProviderInput,
  type EphemeralPublicOhlcvProvider
} from "./types";

const START_MS = Date.parse("2026-07-07T03:30:00.000Z");
const PROVIDER_INPUT: EphemeralOhlcvProviderInput = {
  adjust: "none",
  lookbackBars: 3,
  market: "HK",
  requestedAt: "2026-07-07T03:30:00.000Z",
  symbol: "00700.HK",
  timeframe: "1d"
};
const CACHE_KEY: EphemeralOhlcvCacheKey = {
  adjust: "none",
  lookback_bars: 3,
  market: "HK",
  provider_version: "stock-sdk-public-bars-v0",
  session_id: "session_a",
  symbol: "00700.HK",
  tenant_id: "tenant_a",
  timeframe: "1d",
  user_id: "user_a"
};

describe("ephemeral OHLCV cache", () => {
  it("reuses normalized bars within the 24h TTL for the same user session key", async () => {
    const cache = new InMemoryEphemeralOhlcvCache();
    const provider = createCountingProvider();
    const first = await getCachedOrFetchEphemeralBars({
      cache,
      cacheKey: CACHE_KEY,
      nowMs: START_MS,
      provider,
      providerInput: PROVIDER_INPUT
    });
    const second = await getCachedOrFetchEphemeralBars({
      cache,
      cacheKey: CACHE_KEY,
      nowMs: START_MS + EPHEMERAL_OHLCV_CACHE_TTL_MS - 1,
      provider,
      providerInput: PROVIDER_INPUT
    });

    expect(first.cacheStatus).toBe("miss");
    expect(second.cacheStatus).toBe("hit");
    expect(first.result.status).toBe("ok");
    expect(second.result).toEqual(first.result);
    expect(provider.calls()).toBe(1);
  });

  it("refetches after the 24h TTL expires", async () => {
    const cache = new InMemoryEphemeralOhlcvCache();
    const provider = createCountingProvider();

    await getCachedOrFetchEphemeralBars({
      cache,
      cacheKey: CACHE_KEY,
      nowMs: START_MS,
      provider,
      providerInput: PROVIDER_INPUT
    });
    const second = await getCachedOrFetchEphemeralBars({
      cache,
      cacheKey: CACHE_KEY,
      nowMs: START_MS + EPHEMERAL_OHLCV_CACHE_TTL_MS + 1,
      provider,
      providerInput: PROVIDER_INPUT
    });

    expect(second.cacheStatus).toBe("miss");
    expect(second.result.status).toBe("ok");
    expect(provider.calls()).toBe(2);
  });

  it("isolates cache entries across tenant, user, and session dimensions", async () => {
    const cache = new InMemoryEphemeralOhlcvCache();
    const provider = createCountingProvider();
    const userBKey = {
      ...CACHE_KEY,
      user_id: "user_b"
    };

    await getCachedOrFetchEphemeralBars({
      cache,
      cacheKey: CACHE_KEY,
      nowMs: START_MS,
      provider,
      providerInput: PROVIDER_INPUT
    });
    const userBResult = await getCachedOrFetchEphemeralBars({
      cache,
      cacheKey: userBKey,
      nowMs: START_MS + 1000,
      provider,
      providerInput: PROVIDER_INPUT
    });

    expect(userBResult.cacheStatus).toBe("miss");
    expect(provider.calls()).toBe(2);
    expect(serializeEphemeralOhlcvCacheKey(CACHE_KEY)).not.toBe(
      serializeEphemeralOhlcvCacheKey(userBKey)
    );
    expect(serializeEphemeralOhlcvCacheKey(CACHE_KEY)).toContain(
      "tenant_a:user_a:session_a"
    );
  });

  it("times out provider fetch with one retry and returns no fabricated bars", async () => {
    const cache = new InMemoryEphemeralOhlcvCache();
    const provider = createTimeoutProvider();
    const result = await getCachedOrFetchEphemeralBars({
      cache,
      cacheKey: CACHE_KEY,
      fetchOptions: {
        maxRetries: 1,
        timeoutMs: 1
      },
      nowMs: START_MS,
      provider,
      providerInput: PROVIDER_INPUT
    });

    expect(result.cacheStatus).toBe("miss");
    expect(result.result.status).toBe("unavailable");
    expect(result.result.bars).toEqual([]);
    expect(result.result.issues).toEqual([
      {
        code: "PROVIDER_UNAVAILABLE",
        message: "PROVIDER_UNAVAILABLE"
      }
    ]);
    expect(provider.calls()).toBe(2);
  });
});

function createCountingProvider(): EphemeralPublicOhlcvProvider & {
  calls(): number;
} {
  let callCount = 0;

  return {
    calls: () => callCount,
    providerId: "stock_sdk_public_fixture",
    providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
    async fetchBars() {
      callCount += 1;

      return {
        providerId: "stock_sdk_public_fixture",
        providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
        rawResponse: {
          bars: [
            createRawBar("2026-07-01", 430 + callCount, 442 + callCount, 428, 440, 900),
            createRawBar("2026-07-02", 438 + callCount, 444 + callCount, 436, 441, 950),
            createRawBar("2026-07-03", 440 + callCount, 448 + callCount, 438, 446, 1000)
          ]
        },
        retrievedAt: `2026-07-07T03:30:0${callCount}.000Z`,
        status: "ok"
      };
    }
  };
}

function createTimeoutProvider(): EphemeralPublicOhlcvProvider & {
  calls(): number;
} {
  let callCount = 0;

  return {
    calls: () => callCount,
    providerId: "stock_sdk_public_fixture",
    providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
    async fetchBars() {
      callCount += 1;
      return new Promise(() => {
        // intentionally never resolves
      });
    }
  };
}

function createRawBar(
  timestamp: string,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
) {
  return {
    close,
    high,
    low,
    open,
    timestamp,
    volume
  };
}
