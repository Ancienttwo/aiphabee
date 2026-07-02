import { describe, expect, it } from "vitest";
import { generateSeries, type SeriesSpec } from "./synthetic-ohlcv";

const BASE_SPEC: SeriesSpec = {
  seed: 20260702,
  barCount: 80,
  timeframe: "1d",
  endTime: "2026-06-30",
  basePrice: 320,
  pattern: null
};

describe("generateSeries determinism", () => {
  it("returns deep-equal output for the same spec, twice", () => {
    expect(generateSeries(BASE_SPEC)).toEqual(generateSeries(BASE_SPEC));
  });

  it("returns different price paths for different seeds", () => {
    const a = generateSeries(BASE_SPEC);
    const b = generateSeries({ ...BASE_SPEC, seed: 999 });
    expect(a.bars.map((bar) => bar.close)).not.toEqual(b.bars.map((bar) => bar.close));
  });
});

describe("generateSeries bar invariants", () => {
  it("keeps OHLC ordering and positive volume on every bar", () => {
    const { bars } = generateSeries({ ...BASE_SPEC, seed: 7, barCount: 120 });
    expect(bars).toHaveLength(120);
    for (const bar of bars) {
      expect(bar.high).toBeGreaterThanOrEqual(Math.max(bar.open, bar.close));
      expect(bar.low).toBeLessThanOrEqual(Math.min(bar.open, bar.close));
      expect(bar.low).toBeGreaterThan(0);
      expect(bar.volume).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(bar.volume)).toBe(true);
    }
  });

  it("ends the axis exactly at endTime and skips weekends on daily bars", () => {
    const { bars } = generateSeries(BASE_SPEC);
    expect(bars[bars.length - 1]?.time).toBe("2026-06-30");
    for (const bar of bars) {
      const day = new Date(`${bar.time}T00:00:00Z`).getUTCDay();
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(5);
    }
  });

  it("renders intraday labels with a time component", () => {
    const { bars } = generateSeries({
      ...BASE_SPEC,
      timeframe: "1h",
      endTime: "2026-06-30 15:00"
    });
    expect(bars[bars.length - 1]?.time).toBe("2026-06-30 15:00");
    expect(bars[0]?.time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});

describe("pattern injection", () => {
  it("reports the injected pattern and a valid bar range", () => {
    const series = generateSeries({ ...BASE_SPEC, pattern: "ascending_triangle" });
    expect(series.pattern).toBe("ascending_triangle");
    expect(series.patternRange).not.toBeNull();
    const [start, end] = series.patternRange as readonly [number, number];
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeLessThan(series.bars.length);
    expect(end - start).toBeGreaterThanOrEqual(10);
  });

  it("supports every injectable pattern deterministically", () => {
    for (const pattern of ["ascending_triangle", "double_top", "falling_wedge"] as const) {
      const first = generateSeries({ ...BASE_SPEC, pattern });
      const second = generateSeries({ ...BASE_SPEC, pattern });
      expect(first).toEqual(second);
      expect(first.pattern).toBe(pattern);
    }
  });

  it("keeps pattern null when no pattern is requested", () => {
    const series = generateSeries(BASE_SPEC);
    expect(series.pattern).toBeNull();
    expect(series.patternRange).toBeNull();
  });
});
