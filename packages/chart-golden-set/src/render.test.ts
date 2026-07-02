import { describe, expect, it } from "vitest";
import { RENDER_ENGINE, sha256Hex } from "./manifest";
import { renderSample } from "./render";
import { generateSeries } from "./synthetic-ohlcv";
import { DEFAULT_SAMPLE_COUNT, DEFAULT_SEED, buildSampleSpecs } from "./variant-matrix";
import type { SampleSpec } from "./variant-matrix";

const specs = buildSampleSpecs(DEFAULT_SEED, DEFAULT_SAMPLE_COUNT);
const regressionSpec = specs[0] as SampleSpec;

function seriesFor(spec: SampleSpec) {
  return generateSeries({
    seed: spec.seed,
    barCount: spec.barCount,
    timeframe: spec.timeframe,
    endTime: spec.endTime,
    basePrice: spec.basePrice,
    pattern: spec.pattern
  });
}

describe("renderSample", () => {
  it("pins the echarts version recorded in the manifest engine block", async () => {
    const echarts = await import("echarts");
    expect(echarts.version).toBe(RENDER_ENGINE.echarts);
  });

  it("renders a PNG deterministically within one process", async () => {
    const series = seriesFor(regressionSpec);
    const first = await renderSample(regressionSpec, series);
    const second = await renderSample(regressionSpec, series);
    expect(first.png.length).toBeGreaterThan(1000);
    expect(sha256Hex(first.png)).toBe(sha256Hex(second.png));
  }, 30000);

  it("returns normalized trendline anchors inside [0, 1]", async () => {
    const series = seriesFor(regressionSpec);
    const result = await renderSample(regressionSpec, series);
    expect(regressionSpec.dims.annotations).toBe("trendline");
    expect(result.anchors).toHaveLength(1);
    const line = result.anchors[0] ?? [];
    expect(line.length).toBeGreaterThanOrEqual(2);
    for (const point of line) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    }
  }, 30000);

  it("produces different images for light vs dark on the same series", async () => {
    const light: SampleSpec = {
      ...regressionSpec,
      dims: { ...regressionSpec.dims, theme: "light", degradation: "none" }
    };
    const dark: SampleSpec = {
      ...regressionSpec,
      dims: { ...regressionSpec.dims, theme: "dark", degradation: "none" }
    };
    const series = seriesFor(regressionSpec);
    const lightPng = await renderSample(light, series);
    const darkPng = await renderSample(dark, series);
    expect(sha256Hex(lightPng.png)).not.toBe(sha256Hex(darkPng.png));
  }, 30000);

  it("renders degraded variants and axis-free variants without failing", async () => {
    const downscale: SampleSpec = {
      ...regressionSpec,
      dims: { ...regressionSpec.dims, degradation: "downscale" }
    };
    const noAxes: SampleSpec = {
      ...regressionSpec,
      dims: { ...regressionSpec.dims, info_missing: "no_axes", degradation: "none" }
    };
    const series = seriesFor(regressionSpec);
    const base = await renderSample(regressionSpec, series);
    const small = await renderSample(downscale, series);
    const bare = await renderSample(noAxes, series);
    expect(small.png.length).toBeGreaterThan(0);
    expect(sha256Hex(small.png)).not.toBe(sha256Hex(base.png));
    expect(bare.png.length).toBeGreaterThan(0);
  }, 30000);
});
