import { describe, expect, it } from "vitest";
import {
  EPHEMERAL_PUBLIC_OHLCV_PROVIDER_MAX_RETRIES,
  EPHEMERAL_PUBLIC_OHLCV_PROVIDER_TIMEOUT_MS,
  type EphemeralOhlcvProviderInput,
  type EphemeralOhlcvProviderResult,
  type EphemeralPublicOhlcvProvider
} from "./types";
import {
  fetchNormalizedEphemeralBars,
  getEphemeralPublicOhlcvProviderCapabilities
} from "./provider";

const PROVIDER_INPUT: EphemeralOhlcvProviderInput = {
  adjust: "none",
  lookbackBars: 3,
  market: "HK",
  requestedAt: "2026-07-07T03:20:00.000Z",
  symbol: "00700.HK",
  timeframe: "1d"
};

describe("EphemeralPublicOhlcvProvider", () => {
  it("fetches a single symbol and returns normalized bars only", async () => {
    const provider = createFixtureProvider([
      createRawBar("2026-07-03", 440, 448, 438, 446, 1000),
      createRawBar("2026-07-01", 430, 442, 428, 440, 900),
      createRawBar("2026-07-02", 438, 444, 436, 441, 950)
    ]);
    const result = await fetchNormalizedEphemeralBars(provider, PROVIDER_INPUT);

    expect(result.status).toBe("ok");
    expect(result.provider).toMatchObject({
      providerId: "stock_sdk_public_fixture",
      providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
      retrievedAt: "2026-07-07T03:20:01.000Z"
    });
    expect(result.bars).toHaveLength(3);
    expect(result.bars.map((bar) => bar.timestamp)).toEqual([
      "2026-07-01T00:00:00.000Z",
      "2026-07-02T00:00:00.000Z",
      "2026-07-03T00:00:00.000Z"
    ]);
    expect("rawResponse" in result).toBe(false);
    expect(JSON.stringify(result)).not.toContain("vendor_private_payload");
  });

  it("accepts a single-symbol provider response at the 500-bar bound", async () => {
    const provider = createFixtureProvider(
      Array.from({ length: 500 }, (_, index) =>
        createRawBar(
          createUtcDate(index),
          100 + index,
          101 + index,
          99 + index,
          100.5 + index,
          1000
        )
      )
    );
    const result = await fetchNormalizedEphemeralBars(provider, {
      ...PROVIDER_INPUT,
      lookbackBars: 500
    });

    expect(result.status).toBe("ok");
    expect(result.dataQuality.barsCount).toBe(500);
    expect(result.bars).toHaveLength(500);
    expect(result.bars[0]?.timestamp).toBe("2026-01-01T00:00:00.000Z");
    expect(result.bars.at(-1)?.timestamp).toBe("2027-05-15T00:00:00.000Z");
  });

  it("fails closed on malformed provider response", async () => {
    const provider = {
      providerId: "stock_sdk_public_fixture",
      providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
      async fetchBars() {
        return {
          providerId: "stock_sdk_public_fixture",
          providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
          rawResponse: {
            rows: []
          },
          retrievedAt: "2026-07-07T03:20:01.000Z",
          status: "ok"
        } as unknown as EphemeralOhlcvProviderResult;
      }
    } satisfies EphemeralPublicOhlcvProvider;

    const result = await fetchNormalizedEphemeralBars(provider, PROVIDER_INPUT);

    expect(result.status).toBe("invalid");
    expect(result.bars).toEqual([]);
    expect(result.issues).toEqual([
      {
        code: "INVALID_PROVIDER_RESPONSE",
        message: "provider raw response must include a bars array"
      }
    ]);
  });

  it("maps provider unavailable without fabricated bars", async () => {
    const provider = {
      providerId: "stock_sdk_public_fixture",
      providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
      async fetchBars() {
        return {
          errorCode: "PROVIDER_UNAVAILABLE",
          message: "fixture provider unavailable",
          providerId: "stock_sdk_public_fixture",
          providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
          retrievedAt: "2026-07-07T03:20:01.000Z",
          status: "unavailable"
        };
      }
    } satisfies EphemeralPublicOhlcvProvider;

    const result = await fetchNormalizedEphemeralBars(provider, PROVIDER_INPUT);

    expect(result.status).toBe("unavailable");
    expect(result.bars).toEqual([]);
    expect(result.issues).toEqual([
      {
        code: "PROVIDER_UNAVAILABLE",
        message: "fixture provider unavailable"
      }
    ]);
  });

  it("rejects requests above the Row 2 500-bar bound before provider data is used", async () => {
    const provider = createFixtureProvider([createRawBar("2026-07-01", 1, 2, 1, 2, 10)]);
    const result = await fetchNormalizedEphemeralBars(provider, {
      ...PROVIDER_INPUT,
      lookbackBars: 501
    });

    expect(result.status).toBe("invalid");
    expect(result.bars).toEqual([]);
    expect(result.issues).toEqual([
      {
        code: "INVALID_PROVIDER_RESPONSE",
        message: "lookbackBars must be <= 500"
      }
    ]);
  });

  it("exposes provider contract capabilities without enabling Row 3 timeout execution", () => {
    expect(getEphemeralPublicOhlcvProviderCapabilities()).toMatchObject({
      max_bars: 500,
      provider_interface: "EphemeralPublicOhlcvProvider",
      providerResponseSchemaVersion: true,
      raw_response_passthrough_to_llm: false,
      retry_policy_ready_for_row3: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_MAX_RETRIES,
      status: "ephemeral_public_ohlcv_provider_contract",
      timeout_ms_ready_for_row3: EPHEMERAL_PUBLIC_OHLCV_PROVIDER_TIMEOUT_MS
    });
  });
});

function createFixtureProvider(
  bars: Array<{
    close: number;
    high: number;
    low: number;
    open: number;
    timestamp: string;
    volume: number;
  }>
): EphemeralPublicOhlcvProvider {
  return {
    providerId: "stock_sdk_public_fixture",
    providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
    async fetchBars() {
      return {
        providerId: "stock_sdk_public_fixture",
        providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
        rawResponse: {
          bars,
          metadata: {
            vendor_private_payload: "must_not_escape_normalized_result"
          }
        },
        retrievedAt: "2026-07-07T03:20:01.000Z",
        status: "ok"
      };
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

function createUtcDate(dayOffset: number): string {
  return new Date(Date.UTC(2026, 0, dayOffset + 1)).toISOString();
}
