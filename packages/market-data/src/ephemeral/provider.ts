import { normalizeEphemeralBars } from "./normalize";
import {
  EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION,
  EPHEMERAL_PUBLIC_OHLCV_PROVIDER_MAX_RETRIES,
  EPHEMERAL_PUBLIC_OHLCV_PROVIDER_TIMEOUT_MS,
  MAX_EPHEMERAL_OHLCV_BARS,
  type EphemeralOhlcvProviderInput,
  type EphemeralOhlcvProviderRawResponse,
  type EphemeralProviderFetchOptions,
  type EphemeralProviderNormalizeResult,
  type EphemeralPublicOhlcvProvider
} from "./types";

declare const clearTimeout: (handle: unknown) => void;
declare const setTimeout: (callback: () => void, delayMs: number) => unknown;

export async function fetchNormalizedEphemeralBars(
  provider: EphemeralPublicOhlcvProvider,
  input: EphemeralOhlcvProviderInput,
  options: EphemeralProviderFetchOptions = {}
): Promise<EphemeralProviderNormalizeResult> {
  if (input.lookbackBars > MAX_EPHEMERAL_OHLCV_BARS) {
    return createInvalidProviderResult(provider, input.requestedAt, {
      code: "INVALID_PROVIDER_RESPONSE",
      message: `lookbackBars must be <= ${MAX_EPHEMERAL_OHLCV_BARS}`
    });
  }

  const providerResult = await fetchProviderWithRetry(provider, input, options);
  const providerMetadata = {
    providerId: providerResult.providerId,
    providerResponseSchemaVersion: providerResult.providerResponseSchemaVersion,
    retrievedAt: providerResult.retrievedAt
  };

  if (providerResult.status === "unavailable") {
    return {
      bars: [],
      dataQuality: {
        barsCount: 0,
        incompleteLatestBar: false
      },
      issues: [
        {
          code: "PROVIDER_UNAVAILABLE",
          message: providerResult.message
        }
      ],
      provider: providerMetadata,
      status: "unavailable",
      version: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION
    };
  }

  if (!isProviderRawResponse(providerResult.rawResponse)) {
    return {
      bars: [],
      dataQuality: {
        barsCount: 0,
        incompleteLatestBar: false
      },
      issues: [
        {
          code: "INVALID_PROVIDER_RESPONSE",
          message: "provider raw response must include a bars array"
        }
      ],
      provider: providerMetadata,
      status: "invalid",
      version: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION
    };
  }

  const normalized = normalizeEphemeralBars({
    market: input.market,
    providerId: providerResult.providerId,
    providerResponseSchemaVersion: providerResult.providerResponseSchemaVersion,
    rawBars: providerResult.rawResponse.bars,
    retrievedAt: providerResult.retrievedAt,
    symbol: input.symbol,
    timeframe: input.timeframe
  });

  if (normalized.status === "invalid") {
    return {
      bars: [],
      dataQuality: normalized.dataQuality,
      issues: normalized.issues.map((issue) => ({
        code: issue.code,
        message: issue.message
      })),
      provider: normalized.provider,
      status: "invalid",
      version: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION
    };
  }

  return {
    bars: normalized.bars,
    dataQuality: normalized.dataQuality,
    issues: [],
    provider: normalized.provider,
    status: "ok",
    version: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION
  };
}

export function getEphemeralPublicOhlcvProviderCapabilities() {
  return {
    contract_version: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION,
    max_bars: MAX_EPHEMERAL_OHLCV_BARS,
    provider_interface: "EphemeralPublicOhlcvProvider" as const,
    providerResponseSchemaVersion: true,
    raw_response_passthrough_to_llm: false,
    retry_policy_ready_for_row3: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_MAX_RETRIES,
    status: "ephemeral_public_ohlcv_provider_contract" as const,
    timeout_ms_ready_for_row3: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_TIMEOUT_MS
  };
}

async function fetchProviderWithRetry(
  provider: EphemeralPublicOhlcvProvider,
  input: EphemeralOhlcvProviderInput,
  options: EphemeralProviderFetchOptions
) {
  const maxRetries = options.maxRetries ?? EPHEMERAL_PUBLIC_OHLCV_PROVIDER_MAX_RETRIES;
  const timeoutMs = options.timeoutMs ?? EPHEMERAL_PUBLIC_OHLCV_PROVIDER_TIMEOUT_MS;
  let lastMessage = "provider unavailable";

  for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex += 1) {
    try {
      return await withTimeout(provider.fetchBars(input), timeoutMs);
    } catch (error) {
      lastMessage = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    errorCode: "PROVIDER_UNAVAILABLE",
    message: lastMessage,
    providerId: provider.providerId,
    providerResponseSchemaVersion: provider.providerResponseSchemaVersion,
    retrievedAt: input.requestedAt,
    status: "unavailable"
  } as const;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: unknown;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error("PROVIDER_UNAVAILABLE"));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
}

function createInvalidProviderResult(
  provider: EphemeralPublicOhlcvProvider,
  retrievedAt: string,
  issue: {
    code: "INVALID_PROVIDER_RESPONSE";
    message: string;
  }
): EphemeralProviderNormalizeResult {
  return {
    bars: [],
    dataQuality: {
      barsCount: 0,
      incompleteLatestBar: false
    },
    issues: [issue],
    provider: {
      providerId: provider.providerId,
      providerResponseSchemaVersion: provider.providerResponseSchemaVersion,
      retrievedAt
    },
    status: "invalid",
    version: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_CONTRACT_VERSION
  };
}

function isProviderRawResponse(value: unknown): value is EphemeralOhlcvProviderRawResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { bars?: unknown }).bars)
  );
}
