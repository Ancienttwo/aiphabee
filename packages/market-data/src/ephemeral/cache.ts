import { fetchNormalizedEphemeralBars } from "./provider";
import {
  type EphemeralOhlcvCacheKey,
  type EphemeralOhlcvProviderInput,
  type EphemeralProviderFetchOptions,
  type EphemeralProviderNormalizeResult,
  type EphemeralPublicOhlcvProvider
} from "./types";

export const EPHEMERAL_OHLCV_CACHE_TTL_SECONDS = 86_400;
export const EPHEMERAL_OHLCV_CACHE_TTL_MS =
  EPHEMERAL_OHLCV_CACHE_TTL_SECONDS * 1000;
export const EPHEMERAL_OHLCV_CACHE_IDENTITY_SCOPE = "tenant_id:user_id:session_id";

export type EphemeralOhlcvCacheStatus = "expired" | "hit" | "miss";

export interface EphemeralOhlcvCacheLookupResult {
  cacheStatus: EphemeralOhlcvCacheStatus;
  result: EphemeralProviderNormalizeResult;
}

interface CacheEntry {
  expiresAtMs: number;
  result: EphemeralProviderNormalizeResult;
}

export class InMemoryEphemeralOhlcvCache {
  private readonly entries = new Map<string, CacheEntry>();

  get(key: EphemeralOhlcvCacheKey, nowMs: number): CacheEntry | undefined {
    const entry = this.entries.get(serializeEphemeralOhlcvCacheKey(key));

    if (entry === undefined) {
      return undefined;
    }

    if (entry.expiresAtMs <= nowMs) {
      this.entries.delete(serializeEphemeralOhlcvCacheKey(key));
      return undefined;
    }

    return entry;
  }

  set(
    key: EphemeralOhlcvCacheKey,
    result: EphemeralProviderNormalizeResult,
    nowMs: number
  ): void {
    if (result.status !== "ok") {
      return;
    }

    this.entries.set(serializeEphemeralOhlcvCacheKey(key), {
      expiresAtMs: nowMs + EPHEMERAL_OHLCV_CACHE_TTL_MS,
      result
    });
  }
}

export async function getCachedOrFetchEphemeralBars(input: {
  cache: InMemoryEphemeralOhlcvCache;
  cacheKey: EphemeralOhlcvCacheKey;
  fetchOptions?: EphemeralProviderFetchOptions;
  nowMs: number;
  provider: EphemeralPublicOhlcvProvider;
  providerInput: EphemeralOhlcvProviderInput;
}): Promise<EphemeralOhlcvCacheLookupResult> {
  const cached = input.cache.get(input.cacheKey, input.nowMs);

  if (cached !== undefined) {
    return {
      cacheStatus: "hit",
      result: cached.result
    };
  }

  const result = await fetchNormalizedEphemeralBars(
    input.provider,
    input.providerInput,
    input.fetchOptions
  );
  input.cache.set(input.cacheKey, result, input.nowMs);

  return {
    cacheStatus: "miss",
    result
  };
}

export function serializeEphemeralOhlcvCacheKey(key: EphemeralOhlcvCacheKey): string {
  return [
    key.tenant_id,
    key.user_id,
    key.session_id,
    key.market,
    key.symbol,
    key.timeframe,
    String(key.lookback_bars),
    key.adjust,
    key.provider_version
  ].join(":");
}
