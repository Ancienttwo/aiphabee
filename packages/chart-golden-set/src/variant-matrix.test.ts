import {
  EXCHANGE_VALUES,
  TIMEFRAME_VALUES
} from "@aiphabee/agent-runtime/chart-parse";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_SAMPLE_COUNT,
  DEFAULT_SEED,
  VARIANT_DIMENSIONS,
  buildSampleSpecs
} from "./variant-matrix";

describe("VARIANT_DIMENSIONS", () => {
  it("declares exactly the seven acceptance dimensions", () => {
    expect(Object.keys(VARIANT_DIMENSIONS).sort()).toEqual([
      "annotations",
      "degradation",
      "info_missing",
      "language",
      "platform_style",
      "theme",
      "timeframe_class"
    ]);
  });
});

describe("buildSampleSpecs", () => {
  const specs = buildSampleSpecs(DEFAULT_SEED, DEFAULT_SAMPLE_COUNT);

  it("is deterministic for the same seed and count", () => {
    expect(buildSampleSpecs(DEFAULT_SEED, DEFAULT_SAMPLE_COUNT)).toEqual(specs);
  });

  it("produces 100 unique zero-padded ids", () => {
    expect(specs).toHaveLength(100);
    expect(new Set(specs.map((spec) => spec.id)).size).toBe(100);
    for (const spec of specs) {
      expect(spec.id).toMatch(/^cgs-\d{3}$/);
    }
  });

  it("covers every value of every dimension at least once", () => {
    for (const [dimension, values] of Object.entries(VARIANT_DIMENSIONS)) {
      for (const value of values) {
        const hits = specs.filter(
          (spec) => spec.dims[dimension as keyof typeof spec.dims] === value
        );
        expect(hits.length, `${dimension}=${value}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("uses only chart-parse enum values for timeframe and exchange", () => {
    for (const spec of specs) {
      expect(TIMEFRAME_VALUES).toContain(spec.timeframe);
      expect(EXCHANGE_VALUES).toContain(spec.exchange);
      expect(spec.symbol).toMatch(/^[0-9A-Z.:-]{1,16}$/);
    }
  });

  it("pins the regression sample at index 0 with the acceptance hard points", () => {
    const regression = specs[0];
    expect(regression).toBeDefined();
    if (!regression) {
      return;
    }
    expect(regression.dims.info_missing).toBe("none");
    expect(regression.dims.annotations).toBe("trendline");
    expect(regression.endTime).toBeTruthy();
    const names = regression.indicators.map((indicator) => indicator.name);
    expect(names).toContain("RSI");
    expect(names).toContain("MACD");
    const rsiSpec = regression.indicators.find((indicator) => indicator.name === "RSI");
    const macdSpec = regression.indicators.find((indicator) => indicator.name === "MACD");
    expect(rsiSpec?.params).toEqual([14]);
    expect(macdSpec?.params).toEqual([12, 26, 9]);
  });

  it("derives per-sample seeds that do not collide", () => {
    expect(new Set(specs.map((spec) => spec.seed)).size).toBe(specs.length);
  });

  it("maps timeframe_class onto consistent timeframe values", () => {
    for (const spec of specs) {
      const timeframeClass = spec.dims.timeframe_class;
      if (timeframeClass === "intraday_minute") {
        expect(["1m", "5m", "15m", "30m"]).toContain(spec.timeframe);
        expect(spec.endTime).toMatch(/ \d{2}:\d{2}$/);
      } else if (timeframeClass === "intraday_hour") {
        expect(["1h", "2h", "4h"]).toContain(spec.timeframe);
        expect(spec.endTime).toMatch(/ \d{2}:\d{2}$/);
      } else if (timeframeClass === "daily") {
        expect(spec.timeframe).toBe("1d");
        expect(spec.endTime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } else {
        expect(spec.timeframe).toBe("1w");
        expect(spec.endTime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
