import { safeParseChartParseResult } from "@aiphabee/agent-runtime/chart-parse";
import { describe, expect, it } from "vitest";
import {
  GENERATOR_VERSION,
  RENDER_ENGINE,
  SET_VERSION,
  buildManifest,
  buildTruth,
  collectInvariantViolations,
  sha256Hex,
  stableStringify,
  truthAsChartParseResult,
  type GoldenSample
} from "./manifest";
import { DEFAULT_SAMPLE_COUNT, DEFAULT_SEED, buildSampleSpecs } from "./variant-matrix";

describe("stableStringify", () => {
  it("sorts object keys recursively and keeps array order", () => {
    const a = stableStringify({ b: 1, a: { d: [3, 1, 2], c: null } });
    const b = stableStringify({ a: { c: null, d: [3, 1, 2] }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":null,"d":[3,1,2]},"b":1}');
  });

  it("rejects values JSON cannot round-trip", () => {
    expect(() => stableStringify({ bad: undefined })).toThrow();
    expect(() => stableStringify({ bad: Number.NaN })).toThrow();
  });
});

describe("sha256Hex", () => {
  it("matches the well-known empty-string digest", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });
});

describe("buildTruth", () => {
  const specs = buildSampleSpecs(DEFAULT_SEED, DEFAULT_SAMPLE_COUNT);

  it("projects the full spec into truth when nothing is missing", () => {
    const spec = specs.find(
      (candidate) =>
        candidate.dims.info_missing === "none" && candidate.dims.annotations !== "none"
    );
    expect(spec).toBeDefined();
    if (!spec) {
      return;
    }
    const truth = buildTruth(spec, [
      [
        { x: 0.1, y: 0.8 },
        { x: 0.7, y: 0.4 }
      ]
    ]);
    expect(truth.chart_type).toBe("candlestick");
    expect(truth.symbol).toBe(spec.symbol);
    expect(truth.exchange).toBe(spec.exchange);
    expect(truth.timeframe).toBe(spec.timeframe);
    expect(truth.end_time).toBe(spec.endTime);
    expect(truth.drawn_lines).toHaveLength(1);
  });

  it("nulls the matching truth field for every info_missing variant", () => {
    const bySymbol = specs.find((candidate) => candidate.dims.info_missing === "no_symbol");
    const byTimeframe = specs.find(
      (candidate) => candidate.dims.info_missing === "no_timeframe"
    );
    const byAxes = specs.find((candidate) => candidate.dims.info_missing === "no_axes");
    expect(bySymbol && byTimeframe && byAxes).toBeTruthy();
    if (!bySymbol || !byTimeframe || !byAxes) {
      return;
    }
    const symbolTruth = buildTruth(bySymbol, []);
    expect(symbolTruth.symbol).toBeNull();
    expect(symbolTruth.exchange).toBeNull();
    const timeframeTruth = buildTruth(byTimeframe, []);
    expect(timeframeTruth.timeframe).toBeNull();
    const axesTruth = buildTruth(byAxes, []);
    expect(axesTruth.end_time).toBeNull();
  });

  it("stays inside the chart-parse contract once confidence is attached", () => {
    for (const spec of specs.slice(0, 25)) {
      const anchors =
        spec.dims.annotations === "none"
          ? []
          : [
              [
                { x: 0.25, y: 0.5 },
                { x: 0.75, y: 0.3 }
              ]
            ];
      const truth = buildTruth(spec, anchors);
      const parsed = safeParseChartParseResult(truthAsChartParseResult(truth));
      expect(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.issues)).toBe(
        true
      );
    }
  });
});

describe("buildManifest + collectInvariantViolations", () => {
  const specs = buildSampleSpecs(DEFAULT_SEED, 100);
  const samples: GoldenSample[] = specs.map((spec) => {
    const anchors =
      spec.dims.annotations === "none"
        ? []
        : [
            [
              { x: 0.2, y: 0.6 },
              { x: 0.8, y: 0.35 }
            ]
          ];
    return {
      id: spec.id,
      image_path: `runtime/chart-golden-set/${spec.id}.png`,
      image_sha256: sha256Hex(spec.id),
      variant_dims: spec.dims,
      truth: buildTruth(spec, anchors)
    };
  });
  const manifest = buildManifest({ seed: DEFAULT_SEED, samples });

  it("records versions, engine pins, seed, and count", () => {
    expect(manifest.set_version).toBe(SET_VERSION);
    expect(manifest.generator_version).toBe(GENERATOR_VERSION);
    expect(manifest.render_engine).toEqual(RENDER_ENGINE);
    expect(manifest.seed).toBe(DEFAULT_SEED);
    expect(manifest.sample_count).toBe(100);
  });

  it("passes its own invariant check", () => {
    expect(collectInvariantViolations(manifest)).toEqual([]);
  });

  it("flags count drift, dimension gaps, and truth inconsistencies", () => {
    const truncated = { ...manifest, samples: manifest.samples.slice(0, 99) };
    expect(collectInvariantViolations(truncated)).not.toEqual([]);

    const corrupted = {
      ...manifest,
      samples: manifest.samples.map((sample) =>
        sample.variant_dims.info_missing === "no_symbol"
          ? { ...sample, truth: { ...sample.truth, symbol: "LEAKED" } }
          : sample
      )
    };
    expect(collectInvariantViolations(corrupted)).not.toEqual([]);

    const monoTheme = {
      ...manifest,
      samples: manifest.samples.map((sample) => ({
        ...sample,
        variant_dims: { ...sample.variant_dims, theme: "light" as const }
      }))
    };
    expect(collectInvariantViolations(monoTheme)).not.toEqual([]);
  });

  it("flags tampered engine pins and generator version", () => {
    // untrusted on-disk manifests are not bound by the pinned literal types
    const wrongEngine = {
      ...manifest,
      render_engine: { ...manifest.render_engine, echarts: "9.9.9" }
    } as unknown as typeof manifest;
    expect(
      collectInvariantViolations(wrongEngine).some((violation) =>
        violation.includes("render_engine")
      )
    ).toBe(true);

    const wrongGenerator = { ...manifest, generator_version: "tampered.v0" };
    expect(
      collectInvariantViolations(wrongGenerator).some((violation) =>
        violation.includes("generator_version")
      )
    ).toBe(true);
  });

  it("contains the acceptance regression sample", () => {
    const regression = manifest.samples.find(
      (sample) =>
        sample.truth.end_time !== null &&
        sample.truth.indicators.some(
          (indicator) =>
            indicator.name === "RSI" && JSON.stringify(indicator.params) === "[14]"
        ) &&
        sample.truth.indicators.some(
          (indicator) =>
            indicator.name === "MACD" && JSON.stringify(indicator.params) === "[12,26,9]"
        ) &&
        sample.truth.drawn_lines.length > 0
    );
    expect(regression).toBeDefined();
  });
});
