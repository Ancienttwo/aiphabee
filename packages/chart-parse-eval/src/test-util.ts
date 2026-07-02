import {
  GENERATOR_VERSION,
  RENDER_ENGINE,
  SET_VERSION,
  truthAsChartParseResult,
  type GoldenSample,
  type GoldenSetManifest,
  type SampleTruth
} from "@aiphabee/chart-golden-set";
import type { VariantDims } from "@aiphabee/chart-golden-set";
import { CHART_PARSE_CONTRACT } from "@aiphabee/agent-runtime/chart-parse";
import { FIXTURE_VERSION, type EvalFixture, type FixtureOutput } from "./fixture";

/** Shared deterministic builders for tests; no clock, no randomness. */

export const CLEAR_DIMS: VariantDims = {
  theme: "light",
  platform_style: "tradingview_like",
  timeframe_class: "daily",
  degradation: "none",
  language: "en",
  annotations: "trendline",
  info_missing: "none"
};

export const NEGATIVE_DIMS: VariantDims = {
  ...CLEAR_DIMS,
  annotations: "none",
  info_missing: "no_symbol"
};

export const DEGRADED_DIMS: VariantDims = {
  ...CLEAR_DIMS,
  degradation: "jpeg_artifact"
};

export const FULL_TRUTH: SampleTruth = {
  chart_type: "candlestick",
  symbol: "0700.HK",
  exchange: "HKEX",
  timeframe: "1d",
  end_time: "2026-06-30",
  indicators: [
    { name: "RSI", params: [14] },
    { name: "MACD", params: [12, 26, 9] }
  ],
  drawn_lines: [
    {
      kind: "trendline",
      anchors: [
        { x: 0.2, y: 0.8 },
        { x: 0.9, y: 0.1 }
      ]
    }
  ],
  patterns: ["ascending_triangle"]
};

export const NEGATIVE_TRUTH: SampleTruth = {
  ...FULL_TRUTH,
  symbol: null,
  exchange: null,
  drawn_lines: [],
  patterns: []
};

export function makeSample(
  id: string,
  dims: VariantDims,
  truth: SampleTruth
): GoldenSample {
  return {
    id,
    image_path: `runtime/chart-golden-set/${id}.png`,
    image_sha256: "0".repeat(64),
    variant_dims: dims,
    truth
  };
}

export function makeManifest(samples: readonly GoldenSample[]): GoldenSetManifest {
  return {
    set_version: SET_VERSION,
    generator_version: GENERATOR_VERSION,
    seed: 1,
    sample_count: samples.length,
    render_engine: RENDER_ENGINE,
    samples
  };
}

/** Truth projected to a schema-valid parse output (all confidences 1). */
export function perfectParse(truth: SampleTruth): unknown {
  return truthAsChartParseResult(truth);
}

export function makeFixture(
  outputs: Record<string, FixtureOutput>,
  overrides: Partial<Omit<EvalFixture, "outputs">> = {}
): EvalFixture {
  return {
    fixture_version: FIXTURE_VERSION,
    schema_version: CHART_PARSE_CONTRACT.schemaVersion,
    prompt_version: CHART_PARSE_CONTRACT.promptVersion,
    model_version: "fixture-test.v1",
    ...overrides,
    outputs
  };
}
