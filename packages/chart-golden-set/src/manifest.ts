import {
  CHART_TYPE_VALUES,
  DRAWN_LINE_KIND_VALUES,
  safeParseChartParseResult,
  type ChartPatternName
} from "@aiphabee/agent-runtime/chart-parse";
import { createHash } from "node:crypto";
import {
  VARIANT_DIMENSIONS,
  type Exchange,
  type IndicatorName,
  type SampleSpec,
  type Timeframe,
  type VariantDims
} from "./variant-matrix";

export type ChartType = (typeof CHART_TYPE_VALUES)[number];
export type DrawnLineKind = (typeof DRAWN_LINE_KIND_VALUES)[number];

/**
 * Manifest assembly: the rendered parameters ARE the ground truth.
 *
 * Truth rows are the value-projection of ChartParseResult (same field names
 * and enums, confidence stripped). `truthAsChartParseResult` re-attaches a
 * dummy confidence so every truth row can be validated against the actual
 * chart-parse zod contract — the mechanism that keeps this package from
 * drifting away from Module 1.
 */

export const SET_VERSION = "20260702.chart-golden-set.v1";
export const GENERATOR_VERSION = "20260702.chart-golden-set-generator.v1";

/** Pinned render-engine versions; bumping any of these requires a set_version bump. */
export const RENDER_ENGINE = Object.freeze({
  echarts: "6.1.0",
  resvg: "2.6.2",
  napi_canvas: "1.0.2"
});

export interface TruthAnchor {
  readonly x: number;
  readonly y: number;
}

export interface TruthIndicator {
  readonly name: IndicatorName;
  readonly params: readonly number[];
}

export interface TruthDrawnLine {
  readonly kind: DrawnLineKind;
  readonly anchors: readonly TruthAnchor[];
}

export interface SampleTruth {
  readonly chart_type: ChartType | null;
  readonly symbol: string | null;
  readonly exchange: Exchange | null;
  readonly timeframe: Timeframe | null;
  readonly end_time: string | null;
  readonly indicators: readonly TruthIndicator[];
  readonly drawn_lines: readonly TruthDrawnLine[];
  readonly patterns: readonly ChartPatternName[];
}

export interface GoldenSample {
  readonly id: string;
  readonly image_path: string;
  readonly image_sha256: string;
  readonly variant_dims: VariantDims;
  readonly truth: SampleTruth;
}

export interface GoldenSetManifest {
  readonly set_version: string;
  readonly generator_version: string;
  readonly seed: number;
  readonly sample_count: number;
  readonly render_engine: typeof RENDER_ENGINE;
  readonly samples: readonly GoldenSample[];
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Canonical compact JSON: keys sorted recursively, arrays kept in order. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/** Pretty variant used for the on-disk manifest (still key-sorted). */
export function stableStringifyPretty(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function canonicalize(value: unknown): unknown {
  if (value === undefined) {
    throw new Error("stableStringify cannot encode undefined");
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("stableStringify cannot encode non-finite numbers");
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (value !== null && typeof value === "object") {
    const sorted = Object.keys(value as Record<string, unknown>).sort();
    return Object.fromEntries(
      sorted.map((key) => [key, canonicalize((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}

/** Project a sample spec (+ rendered anchors) into its truth row. */
export function buildTruth(
  spec: SampleSpec,
  anchorLines: ReadonlyArray<readonly TruthAnchor[]>
): SampleTruth {
  const infoMissing = spec.dims.info_missing;
  const annotationKind = spec.dims.annotations;
  const drawnLines: TruthDrawnLine[] =
    annotationKind === "none"
      ? []
      : anchorLines.map((anchors) => ({ kind: annotationKind, anchors }));
  return {
    chart_type: "candlestick",
    symbol: infoMissing === "no_symbol" ? null : spec.symbol,
    exchange: infoMissing === "no_symbol" ? null : spec.exchange,
    timeframe: infoMissing === "no_timeframe" ? null : spec.timeframe,
    end_time: infoMissing === "no_axes" ? null : spec.endTime,
    indicators: spec.indicators.map((indicator) => ({
      name: indicator.name,
      params: [...indicator.params]
    })),
    drawn_lines: drawnLines,
    patterns: spec.pattern ? [spec.pattern] : []
  };
}

/** Re-attach dummy confidence so truth rows validate against the real contract. */
export function truthAsChartParseResult(truth: SampleTruth): unknown {
  return {
    chart_type: { value: truth.chart_type, confidence: 1 },
    symbol: { value: truth.symbol, confidence: 1 },
    exchange: { value: truth.exchange, confidence: 1 },
    timeframe: { value: truth.timeframe, confidence: 1 },
    end_time: { value: truth.end_time, confidence: 1 },
    indicators: truth.indicators.map((indicator) => ({
      name: indicator.name,
      params: [...indicator.params],
      confidence: 1
    })),
    drawn_lines: truth.drawn_lines.map((line) => ({
      kind: line.kind,
      anchors: line.anchors.map((anchor) => ({ x: anchor.x, y: anchor.y })),
      confidence: 1
    })),
    patterns: truth.patterns.map((pattern) => ({ pattern, confidence: 1 }))
  };
}

export function buildManifest(input: {
  seed: number;
  samples: readonly GoldenSample[];
}): GoldenSetManifest {
  return {
    set_version: SET_VERSION,
    generator_version: GENERATOR_VERSION,
    seed: input.seed,
    sample_count: input.samples.length,
    render_engine: RENDER_ENGINE,
    samples: input.samples
  };
}

const SHA256_HEX = /^[0-9a-f]{64}$/u;

/**
 * Cross-field invariants for a manifest. Returns human-readable violations;
 * an empty list means the manifest is internally consistent. The CLI maps a
 * non-empty list to exit code 60 (invariantViolation).
 */
export function collectInvariantViolations(manifest: GoldenSetManifest): string[] {
  const violations: string[] = [];
  if (manifest.set_version !== SET_VERSION) {
    violations.push(`set_version mismatch: ${manifest.set_version}`);
  }
  if (manifest.generator_version !== GENERATOR_VERSION) {
    violations.push(`generator_version mismatch: ${manifest.generator_version}`);
  }
  if (stableStringify(manifest.render_engine) !== stableStringify(RENDER_ENGINE)) {
    violations.push(
      `render_engine mismatch: ${JSON.stringify(manifest.render_engine)} (pinned ${JSON.stringify(RENDER_ENGINE)})`
    );
  }
  if (manifest.sample_count !== manifest.samples.length) {
    violations.push(
      `sample_count ${manifest.sample_count} != samples.length ${manifest.samples.length}`
    );
  }
  const ids = new Set<string>();
  for (const sample of manifest.samples) {
    if (ids.has(sample.id)) {
      violations.push(`duplicate sample id ${sample.id}`);
    }
    ids.add(sample.id);
    if (!SHA256_HEX.test(sample.image_sha256)) {
      violations.push(`${sample.id}: image_sha256 is not a sha256 hex digest`);
    }
    violations.push(...sampleTruthViolations(sample));
  }
  violations.push(...dimensionCoverageViolations(manifest.samples));
  if (!manifest.samples.some(isRegressionSample)) {
    violations.push(
      "missing regression sample with end_time + RSI(14) + MACD(12,26,9) + drawn-line anchors"
    );
  }
  return violations;
}

function sampleTruthViolations(sample: GoldenSample): string[] {
  const violations: string[] = [];
  const { variant_dims: dims, truth } = sample;
  if (dims.info_missing === "none") {
    if (truth.symbol === null || truth.exchange === null) {
      violations.push(`${sample.id}: info_missing=none but symbol/exchange is null`);
    }
    if (truth.timeframe === null) {
      violations.push(`${sample.id}: info_missing=none but timeframe is null`);
    }
    if (truth.end_time === null) {
      violations.push(`${sample.id}: info_missing=none but end_time is null`);
    }
  }
  if (dims.info_missing === "no_symbol" && (truth.symbol !== null || truth.exchange !== null)) {
    violations.push(`${sample.id}: info_missing=no_symbol but symbol/exchange not null`);
  }
  if (dims.info_missing === "no_timeframe" && truth.timeframe !== null) {
    violations.push(`${sample.id}: info_missing=no_timeframe but timeframe not null`);
  }
  if (dims.info_missing === "no_axes" && truth.end_time !== null) {
    violations.push(`${sample.id}: info_missing=no_axes but end_time not null`);
  }
  if (dims.annotations === "none" && truth.drawn_lines.length > 0) {
    violations.push(`${sample.id}: annotations=none but drawn_lines present`);
  }
  if (dims.annotations !== "none") {
    if (truth.drawn_lines.length === 0) {
      violations.push(`${sample.id}: annotations=${dims.annotations} but drawn_lines empty`);
    }
    for (const line of truth.drawn_lines) {
      if (line.kind !== dims.annotations) {
        violations.push(`${sample.id}: drawn_line kind ${line.kind} != ${dims.annotations}`);
      }
      for (const anchor of line.anchors) {
        if (anchor.x < 0 || anchor.x > 1 || anchor.y < 0 || anchor.y > 1) {
          violations.push(`${sample.id}: anchor out of [0,1]: ${anchor.x},${anchor.y}`);
        }
      }
    }
  }
  const parsed = safeParseChartParseResult(truthAsChartParseResult(truth));
  if (!parsed.success) {
    violations.push(
      `${sample.id}: truth fails chart-parse contract: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`
    );
  }
  return violations;
}

function dimensionCoverageViolations(samples: readonly GoldenSample[]): string[] {
  const violations: string[] = [];
  for (const [dimension, values] of Object.entries(VARIANT_DIMENSIONS)) {
    for (const value of values) {
      const covered = samples.some(
        (sample) => sample.variant_dims[dimension as keyof VariantDims] === value
      );
      if (!covered) {
        violations.push(`dimension ${dimension} missing value ${value}`);
      }
    }
  }
  return violations;
}

export function isRegressionSample(sample: GoldenSample): boolean {
  return (
    sample.truth.end_time !== null &&
    sample.truth.indicators.some(
      (indicator) => indicator.name === "RSI" && stableStringify(indicator.params) === "[14]"
    ) &&
    sample.truth.indicators.some(
      (indicator) =>
        indicator.name === "MACD" && stableStringify(indicator.params) === "[12,26,9]"
    ) &&
    sample.truth.drawn_lines.length > 0 &&
    sample.truth.drawn_lines.every((line) => line.anchors.length >= 2)
  );
}
