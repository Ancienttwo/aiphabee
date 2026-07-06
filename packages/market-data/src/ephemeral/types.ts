export const EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION =
  "2026-07-07.ephemeral-public-ohlcv-provider.v0";
export const EPHEMERAL_OHLCV_NORMALIZATION_VERSION =
  "2026-07-07.ephemeral-ohlcv-normalize.v0";
export const EPHEMERAL_PUBLIC_OHLCV_PROVIDER_TIMEOUT_MS = 8000;
export const EPHEMERAL_PUBLIC_OHLCV_PROVIDER_MAX_RETRIES = 1;
export const MAX_EPHEMERAL_OHLCV_BARS = 500;

export type EphemeralOhlcvMarket = "US" | "HK" | "CN";
export type EphemeralOhlcvTimeframe =
  | "15m"
  | "30m"
  | "60m"
  | "1d"
  | "1w"
  | "1mo";
export type EphemeralOhlcvAdjust = "none" | "qfq" | "hfq";

export type EphemeralOhlcvNormalizeErrorCode =
  | "DUPLICATE_TIMESTAMP"
  | "INVALID_OHLC_RELATION"
  | "INVALID_PRICE"
  | "INVALID_TIMESTAMP"
  | "NEGATIVE_VOLUME"
  | "TOO_MANY_BARS";

export type EphemeralOhlcvProviderErrorCode =
  | "INVALID_PROVIDER_RESPONSE"
  | "PROVIDER_UNAVAILABLE";

export interface EphemeralOhlcvProviderInput {
  adjust: EphemeralOhlcvAdjust;
  lookbackBars: number;
  market: EphemeralOhlcvMarket;
  requestedAt: string;
  symbol: string;
  timeframe: EphemeralOhlcvTimeframe;
}

export interface EphemeralRawOhlcvBar {
  close: unknown;
  complete?: unknown;
  high: unknown;
  low: unknown;
  open: unknown;
  timestamp: unknown;
  volume?: unknown;
}

export interface EphemeralOhlcvProviderRawResponse {
  bars: readonly EphemeralRawOhlcvBar[];
  metadata?: Readonly<Record<string, unknown>>;
}

export type EphemeralOhlcvProviderResult =
  | {
      providerId: string;
      providerResponseSchemaVersion: string;
      rawResponse: EphemeralOhlcvProviderRawResponse;
      retrievedAt: string;
      status: "ok";
    }
  | {
      errorCode: "PROVIDER_UNAVAILABLE";
      message: string;
      providerId: string;
      providerResponseSchemaVersion: string;
      retrievedAt: string;
      status: "unavailable";
    };

export interface EphemeralPublicOhlcvProvider {
  readonly providerId: string;
  readonly providerResponseSchemaVersion: string;
  fetchBars(input: EphemeralOhlcvProviderInput): Promise<EphemeralOhlcvProviderResult>;
}

export interface EphemeralProviderFetchOptions {
  maxRetries?: number;
  timeoutMs?: number;
}

export interface EphemeralOhlcvCacheKey {
  adjust: EphemeralOhlcvAdjust;
  lookback_bars: number;
  market: EphemeralOhlcvMarket;
  provider_version: string;
  session_id: string;
  symbol: string;
  tenant_id: string;
  timeframe: EphemeralOhlcvTimeframe;
  user_id: string;
}

export interface NormalizedEphemeralBar {
  close: number;
  complete: boolean;
  high: number;
  low: number;
  open: number;
  timestamp: string;
  volume: number | null;
}

export interface EphemeralOhlcvNormalizationIssue {
  code: EphemeralOhlcvNormalizeErrorCode;
  index: number;
  message: string;
  timestamp?: string;
}

export interface EphemeralOhlcvNormalizationInput {
  market: EphemeralOhlcvMarket;
  providerId: string;
  providerResponseSchemaVersion: string;
  rawBars: readonly EphemeralRawOhlcvBar[];
  retrievedAt: string;
  symbol: string;
  timeframe: EphemeralOhlcvTimeframe;
}

export type EphemeralOhlcvNormalizationResult =
  | {
      bars: NormalizedEphemeralBar[];
      dataQuality: {
        barsCount: number;
        incompleteLatestBar: boolean;
      };
      issues: [];
      provider: {
        providerId: string;
        providerResponseSchemaVersion: string;
        retrievedAt: string;
      };
      status: "ok";
      version: typeof EPHEMERAL_OHLCV_NORMALIZATION_VERSION;
    }
  | {
      bars: [];
      dataQuality: {
        barsCount: 0;
        incompleteLatestBar: false;
      };
      issues: EphemeralOhlcvNormalizationIssue[];
      provider: {
        providerId: string;
        providerResponseSchemaVersion: string;
        retrievedAt: string;
      };
      status: "invalid";
      version: typeof EPHEMERAL_OHLCV_NORMALIZATION_VERSION;
    };

export type EphemeralProviderNormalizeResult =
  | {
      bars: NormalizedEphemeralBar[];
      dataQuality: {
        barsCount: number;
        incompleteLatestBar: boolean;
      };
      issues: [];
      provider: {
        providerId: string;
        providerResponseSchemaVersion: string;
        retrievedAt: string;
      };
      status: "ok";
      version: typeof EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION;
    }
  | {
      bars: [];
      dataQuality: {
        barsCount: 0;
        incompleteLatestBar: false;
      };
      issues: Array<{
        code: EphemeralOhlcvNormalizeErrorCode | EphemeralOhlcvProviderErrorCode;
        message: string;
      }>;
      provider: {
        providerId: string;
        providerResponseSchemaVersion: string;
        retrievedAt: string;
      };
      status: "invalid" | "unavailable";
      version: typeof EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION;
    };
