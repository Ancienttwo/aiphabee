import { describe, expect, it } from "vitest";
import { ema, macd, rsi, sma } from "./indicators";

describe("sma", () => {
  it("computes the arithmetic mean with null warmup", () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });
});

describe("ema", () => {
  it("seeds with the SMA and applies standard smoothing", () => {
    const result = ema([2, 4, 6, 8], 2);
    // seed = mean(2,4) = 3; k = 2/3
    // next = 6*(2/3) + 3*(1/3) = 5; then 8*(2/3) + 5*(1/3) = 7
    expect(result[0]).toBeNull();
    expect(result[1]).toBeCloseTo(3, 10);
    expect(result[2]).toBeCloseTo(5, 10);
    expect(result[3]).toBeCloseTo(7, 10);
  });
});

describe("rsi", () => {
  it("is 100 for a monotonic rise and 0 for a monotonic fall after warmup", () => {
    const rising = rsi([1, 2, 3, 4, 5, 6, 7, 8], 3);
    expect(rising.slice(0, 3)).toEqual([null, null, null]);
    expect(rising[3]).toBeCloseTo(100, 6);
    const falling = rsi([8, 7, 6, 5, 4, 3, 2, 1], 3);
    expect(falling[7]).toBeCloseTo(0, 6);
  });

  it("stays inside [0, 100] on mixed input", () => {
    const closes = [10, 10.5, 10.2, 10.8, 10.4, 11, 10.9, 11.3, 11.1, 11.6];
    for (const value of rsi(closes, 4)) {
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("macd", () => {
  it("equals fast EMA minus slow EMA with a signal EMA over the macd line", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 5) * 4 + i * 0.1);
    const { macd: macdLine, signal, histogram } = macd(closes, 12, 26, 9);
    const fast = ema(closes, 12);
    const slow = ema(closes, 26);
    for (let i = 0; i < closes.length; i += 1) {
      const f = fast[i];
      const s = slow[i];
      if (f === null || s === null) {
        expect(macdLine[i]).toBeNull();
      } else {
        expect(macdLine[i]).toBeCloseTo(f - s, 10);
      }
      const m = macdLine[i];
      const sig = signal[i];
      if (m !== null && sig !== null) {
        expect(histogram[i]).toBeCloseTo(m - sig, 10);
      }
    }
    expect(signal.filter((v) => v !== null).length).toBeGreaterThan(0);
  });
});
