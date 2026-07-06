import { describe, expect, it } from "vitest";
import {
  computeTechnicalIndicators,
  computeTechnicalSignals
} from "./technical";
import type { NormalizedEphemeralBar } from "./types";

describe("ephemeral technical indicators", () => {
  it("aligns MA/EMA/MACD/RSI/BOLL/ATR/OBV against the golden monotonic series", () => {
    const indicators = computeTechnicalIndicators(createGoldenBars(70));
    const latest = indicators.at(-1);

    expect(latest).toMatchObject({
      atr14: 2,
      boll20: {
        lower: 48.967437,
        middle: 60.5,
        upper: 72.032563
      },
      close: 70,
      ema12: 64.500054,
      ema26: 57.561755,
      ma5: 68,
      ma20: 60.5,
      ma60: 40.5,
      macd: {
        histogram: 0.028918,
        line: 6.938299,
        signal: 6.909381
      },
      obv: 71484,
      rsi14: 100,
      volumeMa20: 1060.5
    });
  });

  it("keeps warmup positions null for period-bound indicators", () => {
    const indicators = computeTechnicalIndicators(createGoldenBars(10));
    const latest = indicators.at(-1);

    expect(latest).toMatchObject({
      atr14: null,
      boll20: null,
      ma20: null,
      ma60: null,
      rsi14: null,
      volumeMa20: null
    });
    expect(latest?.ma5).toBe(8);
  });

  it("computes observation-only signal summaries from normalized bars", () => {
    const bars = createGoldenBars(70);
    const summary = computeTechnicalSignals(bars);

    expect(summary).toMatchObject({
      momentum: "positive",
      trend: "uptrend",
      volatility: "normal",
      volume: "confirming"
    });
    expect(summary.observations.map((observation) => observation.dimension)).toEqual([
      "trend",
      "momentum",
      "volatility",
      "volume"
    ]);
    expect(summary.observations.every((observation) => observation.label.length > 0)).toBe(
      true
    );
  });
});

function createGoldenBars(count: number): NormalizedEphemeralBar[] {
  return Array.from({ length: count }, (_, index) => {
    const close = index + 1;

    return {
      close,
      complete: true,
      high: close + 1,
      low: close - 1,
      open: close - 0.5,
      timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      volume: 1000 + close
    };
  });
}
