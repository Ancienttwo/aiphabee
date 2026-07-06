import { describe, expect, it } from "vitest";
import { MAX_EPHEMERAL_OHLCV_BARS } from "./types";
import { normalizeEphemeralBars } from "./normalize";

const NORMALIZE_BASE_INPUT = {
  market: "US",
  providerId: "stock_sdk_public_fixture",
  providerResponseSchemaVersion: "stock-sdk-public-bars-v0",
  retrievedAt: "2026-07-07T03:20:00.000Z",
  symbol: "NVDA",
  timeframe: "1d"
} as const;

describe("normalizeEphemeralBars", () => {
  it("normalizes valid provider bars into ascending bounded OHLCV", () => {
    const result = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: [
        createRawBar("2026-07-03", 151, 154, 150, 153, 1100),
        createRawBar("2026-07-01", 148, 152, 147, 151, 1000),
        createRawBar("2026-07-02", 150, 153, 149, 152, null)
      ]
    });

    expect(result.status).toBe("ok");
    expect(result.dataQuality).toEqual({
      barsCount: 3,
      incompleteLatestBar: false
    });
    expect(result.bars.map((bar) => bar.timestamp)).toEqual([
      "2026-07-01T00:00:00.000Z",
      "2026-07-02T00:00:00.000Z",
      "2026-07-03T00:00:00.000Z"
    ]);
    expect(result.bars[1]).toMatchObject({
      close: 152,
      complete: true,
      high: 153,
      low: 149,
      open: 150,
      volume: null
    });
  });

  it("returns INVALID_OHLC_RELATION for high/low violations", () => {
    const highBelowOpen = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: [createRawBar("2026-07-01", 148, 147, 146, 147, 1000)]
    });
    const lowAboveClose = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: [createRawBar("2026-07-01", 148, 150, 149, 147, 1000)]
    });

    expect(highBelowOpen.status).toBe("invalid");
    expect(highBelowOpen.issues.map((issue) => issue.code)).toContain(
      "INVALID_OHLC_RELATION"
    );
    expect(lowAboveClose.status).toBe("invalid");
    expect(lowAboveClose.issues.map((issue) => issue.code)).toContain(
      "INVALID_OHLC_RELATION"
    );
  });

  it("returns DUPLICATE_TIMESTAMP and NEGATIVE_VOLUME without silent repair", () => {
    const duplicate = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: [
        createRawBar("2026-07-01", 148, 152, 147, 151, 1000),
        createRawBar("2026-07-01T00:00:00.000Z", 151, 154, 150, 153, 1100)
      ]
    });
    const negativeVolume = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: [createRawBar("2026-07-01", 148, 152, 147, 151, -1)]
    });

    expect(duplicate.status).toBe("invalid");
    expect(duplicate.bars).toEqual([]);
    expect(duplicate.issues.map((issue) => issue.code)).toContain(
      "DUPLICATE_TIMESTAMP"
    );
    expect(negativeVolume.status).toBe("invalid");
    expect(negativeVolume.bars).toEqual([]);
    expect(negativeVolume.issues.map((issue) => issue.code)).toContain(
      "NEGATIVE_VOLUME"
    );
  });

  it("returns INVALID_PRICE for non-finite provider prices", () => {
    const result = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: [createRawBar("2026-07-01", 148, Number.NaN, 147, 151, 1000)]
    });

    expect(result.status).toBe("invalid");
    expect(result.issues.map((issue) => issue.code)).toContain("INVALID_PRICE");
  });

  it("preserves incomplete latest bar instead of dropping it", () => {
    const result = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: [
        createRawBar("2026-07-01", 148, 152, 147, 151, 1000),
        {
          ...createRawBar("2026-07-02", 151, 154, 150, 153, 1100),
          complete: false
        }
      ]
    });

    expect(result.status).toBe("ok");
    expect(result.dataQuality.incompleteLatestBar).toBe(true);
    expect(result.bars.at(-1)).toMatchObject({
      complete: false,
      timestamp: "2026-07-02T00:00:00.000Z"
    });
  });

  it("rejects provider responses above the 500 bar bound", () => {
    const result = normalizeEphemeralBars({
      ...NORMALIZE_BASE_INPUT,
      rawBars: Array.from({ length: MAX_EPHEMERAL_OHLCV_BARS + 1 }, (_, index) =>
        createRawBar(`2026-01-${String(index + 1).padStart(2, "0")}`, 10, 12, 9, 11, 100)
      )
    });

    expect(result.status).toBe("invalid");
    expect(result.issues.map((issue) => issue.code)).toContain("TOO_MANY_BARS");
  });
});

function createRawBar(
  timestamp: string,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number | null
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
