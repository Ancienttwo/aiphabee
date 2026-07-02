import { z } from "zod";
import { CHART_PATTERN_VALUES } from "./patterns";

/**
 * ChartParseResult: the closed zod contract for the screenshot parsing
 * boundary (PRD Module 1).
 *
 * zod discipline (provider compatibility, verified at source level):
 * - maybe-missing fields are `.nullable()` only; optional/nullish wrappers
 *   break OpenAI strict json_schema semantics and union nodes break the
 *   Google responseSchema converter, so neither may appear anywhere.
 * - numeric range rules (confidence, coordinates) are enforced here at the
 *   code layer; provider-side minimum/maximum support is not assumed.
 * - no free-text fields and no numeric OHLC/volume reading fields: exact
 *   numbers always come from the deterministic indicator engine.
 */

export const CHART_TYPE_VALUES = ["candlestick", "line", "bar", "area", "other"] as const;

export const EXCHANGE_VALUES = [
  "HKEX",
  "SSE",
  "SZSE",
  "NYSE",
  "NASDAQ",
  "AMEX",
  "OTHER"
] as const;

export const TIMEFRAME_VALUES = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "1d",
  "1w",
  "1M"
] as const;

export const INDICATOR_NAME_VALUES = [
  "MA",
  "EMA",
  "SMA",
  "WMA",
  "BOLL",
  "MACD",
  "RSI",
  "KDJ",
  "STOCH",
  "VOL",
  "OBV",
  "ATR",
  "CCI",
  "DMI",
  "SAR",
  "VWAP",
  "OTHER"
] as const;

export const DRAWN_LINE_KIND_VALUES = [
  "horizontal_line",
  "vertical_line",
  "trendline",
  "channel",
  "fibonacci",
  "rectangle",
  "other"
] as const;

const SYMBOL_PATTERN = /^[0-9A-Z.:-]{1,16}$/u;

const END_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/u;

const confidenceSchema = z
  .number()
  .min(0)
  .max(1)
  .describe(
    "Self-reported confidence in [0, 1]; uncalibrated until a calibration run maps it, so prefer lower values when unsure."
  );

const confidentNullable = <Value extends z.ZodType>(value: Value, description: string) =>
  z.strictObject({
    value: value.nullable().describe(description),
    confidence: confidenceSchema
  });

const normalizedCoordinate = (axisRule: string) =>
  z
    .number()
    .min(0)
    .max(1)
    .describe(
      `Normalized to [0, 1] of the full chart image; origin at the top-left corner, ${axisRule}.`
    );

const lineAnchorSchema = z.strictObject({
  x: normalizedCoordinate("x increases rightward"),
  y: normalizedCoordinate("y increases downward")
});

const indicatorReadingSchema = z.strictObject({
  name: z
    .enum(INDICATOR_NAME_VALUES)
    .describe(
      "Indicator name visibly rendered on the chart; use OTHER when a name is visible but not in this list."
    ),
  params: z
    .array(z.number())
    .nullable()
    .describe(
      "Indicator parameters exactly as labeled, e.g. RSI(14) -> [14], MACD(12,26,9) -> [12, 26, 9]; [] when the indicator visibly has no parameters; null when parameters are not readable."
    ),
  confidence: confidenceSchema
});

const drawnLineSchema = z.strictObject({
  kind: z.enum(DRAWN_LINE_KIND_VALUES).describe("Kind of user-drawn annotation."),
  anchors: z
    .array(lineAnchorSchema)
    .describe(
      "Anchor points of the drawn annotation in normalized [0, 1] image coordinates (origin top-left)."
    ),
  confidence: confidenceSchema
});

const patternCandidateSchema = z.strictObject({
  pattern: z
    .enum(CHART_PATTERN_VALUES)
    .describe(
      "Classic pattern candidate from the closed vocabulary; only report patterns plausibly visible in the chart."
    ),
  confidence: confidenceSchema
});

export const chartParseResultSchema = z.strictObject({
  chart_type: confidentNullable(
    z.enum(CHART_TYPE_VALUES),
    "Chart rendering type; null when not determinable."
  ),
  symbol: confidentNullable(
    z.string().regex(SYMBOL_PATTERN),
    "Ticker symbol exactly as labeled, e.g. 0700.HK; null when not labeled or unreadable."
  ),
  exchange: confidentNullable(
    z.enum(EXCHANGE_VALUES),
    "Exchange visible on the chart; OTHER when labeled but unknown; null when not labeled."
  ),
  timeframe: confidentNullable(
    z.enum(TIMEFRAME_VALUES),
    "Candle interval exactly as labeled; null when not labeled or unreadable."
  ),
  end_time: confidentNullable(
    z.string().regex(END_TIME_PATTERN),
    "Timestamp of the right-most candle exactly as labeled (no timezone guessing); null when not readable."
  ),
  indicators: z
    .array(indicatorReadingSchema)
    .describe("Indicators visibly rendered on the chart; empty when none are visible."),
  drawn_lines: z
    .array(drawnLineSchema)
    .describe("User-drawn annotations; empty when none are visible."),
  patterns: z
    .array(patternCandidateSchema)
    .describe("Classic pattern candidates visible in the chart; empty when none.")
});

export type ChartParseResult = z.infer<typeof chartParseResultSchema>;

export const safeParseChartParseResult = (input: unknown) =>
  chartParseResultSchema.safeParse(input);
