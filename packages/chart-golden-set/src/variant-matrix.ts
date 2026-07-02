import {
  EXCHANGE_VALUES,
  INDICATOR_NAME_VALUES,
  TIMEFRAME_VALUES,
  type ChartPatternName
} from "@aiphabee/agent-runtime/chart-parse";
import { createPrng, deriveSeed, pickOne, shuffle, type Prng } from "./prng";
import { INJECTABLE_PATTERNS } from "./synthetic-ohlcv";

/** Truth candidate types are the chart-parse enums — never local copies. */
export type Exchange = (typeof EXCHANGE_VALUES)[number];
export type Timeframe = (typeof TIMEFRAME_VALUES)[number];
export type IndicatorName = (typeof INDICATOR_NAME_VALUES)[number];

/**
 * Seven-dimension variant matrix (PRD §18.1 compressed to the sprint's seven
 * acceptance classes) plus the deterministic assignment of 100 sample specs.
 *
 * Coverage strategy: per dimension, values are laid out with an even quota
 * over the sample count and shuffled with a dimension-scoped child seed, so
 * dimensions stay statistically independent while every value is guaranteed
 * to appear. Sample 0 is then pinned to the acceptance regression spec.
 */

export const DEFAULT_SEED = 20260702;
export const DEFAULT_SAMPLE_COUNT = 100;

export const VARIANT_DIMENSIONS = Object.freeze({
  theme: ["light", "dark"],
  platform_style: ["tradingview_like", "exchange_terminal", "minimal_web"],
  timeframe_class: ["intraday_minute", "intraday_hour", "daily", "weekly"],
  degradation: ["none", "downscale", "jpeg_artifact"],
  language: ["zh", "en"],
  annotations: ["none", "trendline", "horizontal_line", "rectangle"],
  info_missing: ["none", "no_symbol", "no_timeframe", "no_axes"]
} as const);

export type VariantDimensionKey = keyof typeof VARIANT_DIMENSIONS;
export type VariantDims = {
  readonly [Key in VariantDimensionKey]: (typeof VARIANT_DIMENSIONS)[Key][number];
};

export interface IndicatorSpec {
  readonly name: IndicatorName;
  readonly params: readonly number[];
}

export interface SampleSpec {
  readonly id: string;
  readonly index: number;
  readonly seed: number;
  readonly dims: VariantDims;
  readonly symbol: string;
  readonly exchange: Exchange;
  readonly timeframe: Timeframe;
  readonly endTime: string;
  readonly barCount: number;
  readonly basePrice: number;
  readonly pattern: ChartPatternName | null;
  readonly indicators: readonly IndicatorSpec[];
}

interface InstrumentSpec {
  readonly symbol: string;
  readonly exchange: Exchange;
  readonly basePrice: number;
}

const INSTRUMENTS: readonly InstrumentSpec[] = [
  { symbol: "0700.HK", exchange: "HKEX", basePrice: 320 },
  { symbol: "9988.HK", exchange: "HKEX", basePrice: 82 },
  { symbol: "0005.HK", exchange: "HKEX", basePrice: 62 },
  { symbol: "600519.SS", exchange: "SSE", basePrice: 1450 },
  { symbol: "000001.SZ", exchange: "SZSE", basePrice: 10.5 },
  { symbol: "AAPL", exchange: "NASDAQ", basePrice: 195 },
  { symbol: "TSM", exchange: "NYSE", basePrice: 105 }
];

const TIMEFRAMES_BY_CLASS: Readonly<
  Record<VariantDims["timeframe_class"], readonly Timeframe[]>
> = {
  intraday_minute: ["1m", "5m", "15m", "30m"],
  intraday_hour: ["1h", "2h", "4h"],
  daily: ["1d"],
  weekly: ["1w"]
};

const INTRADAY_END_TIMES: readonly string[] = [
  "2026-06-30 10:30",
  "2026-06-30 11:30",
  "2026-06-30 14:30",
  "2026-06-30 15:00",
  "2026-06-30 16:00"
];

const DAILY_END_TIME = "2026-06-30";

const MA_5_10_20: IndicatorSpec = { name: "MA", params: [5, 10, 20] };
const VOL: IndicatorSpec = { name: "VOL", params: [] };
const RSI_14: IndicatorSpec = { name: "RSI", params: [14] };
const MACD_12_26_9: IndicatorSpec = { name: "MACD", params: [12, 26, 9] };

const INDICATOR_POOLS: ReadonlyArray<readonly IndicatorSpec[]> = [
  [],
  [MA_5_10_20],
  [MA_5_10_20, VOL],
  [VOL, RSI_14],
  [VOL, MACD_12_26_9],
  [MA_5_10_20, VOL, RSI_14],
  [MA_5_10_20, VOL, MACD_12_26_9]
];

const REGRESSION_INDICATORS: readonly IndicatorSpec[] = [
  MA_5_10_20,
  VOL,
  RSI_14,
  MACD_12_26_9
];

const REGRESSION_DIMS: VariantDims = {
  theme: "light",
  platform_style: "tradingview_like",
  timeframe_class: "daily",
  degradation: "none",
  language: "zh",
  annotations: "trendline",
  info_missing: "none"
};

export function buildSampleSpecs(rootSeed: number, count: number): SampleSpec[] {
  if (count < 20) {
    throw new Error(`sample count must be >= 20 to cover the matrix, got ${count}`);
  }
  const dimensionSequences = Object.fromEntries(
    Object.entries(VARIANT_DIMENSIONS).map(([dimension, values]) => [
      dimension,
      dimensionSequence(rootSeed, dimension, values, count)
    ])
  ) as Record<VariantDimensionKey, readonly string[]>;

  const specs: SampleSpec[] = [];
  for (let index = 0; index < count; index += 1) {
    const samplePrng = createPrng(deriveSeed(rootSeed, "sample", index));
    const dims =
      index === 0
        ? REGRESSION_DIMS
        : (Object.fromEntries(
            (Object.keys(VARIANT_DIMENSIONS) as VariantDimensionKey[]).map((dimension) => [
              dimension,
              dimensionSequences[dimension][index]
            ])
          ) as VariantDims);
    const instrument =
      index === 0 ? (INSTRUMENTS[0] as InstrumentSpec) : pickOne(samplePrng, INSTRUMENTS);
    const timeframe = pickOne(samplePrng, TIMEFRAMES_BY_CLASS[dims.timeframe_class]);
    const endTime = isIntraday(dims.timeframe_class)
      ? pickOne(samplePrng, INTRADAY_END_TIMES)
      : DAILY_END_TIME;
    const pattern =
      index === 0
        ? "ascending_triangle"
        : samplePrng() < 0.55
          ? pickOne(samplePrng, INJECTABLE_PATTERNS)
          : null;
    const indicators =
      index === 0 ? REGRESSION_INDICATORS : pickOne(samplePrng, INDICATOR_POOLS);
    specs.push({
      id: `cgs-${String(index).padStart(3, "0")}`,
      index,
      seed: deriveSeed(rootSeed, "series", index),
      dims,
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      timeframe,
      endTime,
      barCount: 60 + Math.floor(samplePrng() * 61),
      basePrice: instrument.basePrice,
      pattern,
      indicators
    });
  }
  return specs;
}

function isIntraday(timeframeClass: VariantDims["timeframe_class"]): boolean {
  return timeframeClass === "intraday_minute" || timeframeClass === "intraday_hour";
}

/** Even-quota value sequence, shuffled with a dimension-scoped child stream. */
function dimensionSequence(
  rootSeed: number,
  dimension: string,
  values: readonly string[],
  count: number
): readonly string[] {
  const quota = Math.floor(count / values.length);
  const remainder = count % values.length;
  const laidOut = values.flatMap((value, valueIndex) =>
    new Array<string>(quota + (valueIndex < remainder ? 1 : 0)).fill(value)
  );
  const prng: Prng = createPrng(deriveSeed(rootSeed, "dimension", dimension));
  return shuffle(prng, laidOut);
}
