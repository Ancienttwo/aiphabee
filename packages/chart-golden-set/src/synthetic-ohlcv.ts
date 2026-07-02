import type { ChartPatternName } from "@aiphabee/agent-runtime/chart-parse";
import { createPrng, deriveSeed, nextGaussian, type Prng } from "./prng";

/**
 * Seeded synthetic OHLCV generator.
 *
 * The acceptance line requires byte-identical output across runs, so bars are
 * a pure function of the spec: a seeded log random walk, optionally rewritten
 * over a middle-to-late window by a parametric pattern template. The injected
 * template kind IS the pattern ground truth for the manifest.
 */

export type InjectablePattern = Extract<
  ChartPatternName,
  "ascending_triangle" | "double_top" | "falling_wedge"
>;

export const INJECTABLE_PATTERNS: readonly InjectablePattern[] = [
  "ascending_triangle",
  "double_top",
  "falling_wedge"
];

export interface OhlcvBar {
  readonly time: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface SeriesSpec {
  readonly seed: number;
  readonly barCount: number;
  readonly timeframe: string;
  readonly endTime: string;
  readonly basePrice: number;
  readonly pattern: ChartPatternName | null;
}

export interface SyntheticSeries {
  readonly bars: readonly OhlcvBar[];
  readonly pattern: ChartPatternName | null;
  readonly patternRange: readonly [number, number] | null;
}

const MINUTE_STEP: Readonly<Record<string, number>> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "2h": 120,
  "4h": 240
};

export function generateSeries(spec: SeriesSpec): SyntheticSeries {
  if (spec.barCount < 20) {
    throw new Error(`barCount must be >= 20, got ${spec.barCount}`);
  }
  if (spec.basePrice <= 0) {
    throw new Error(`basePrice must be positive, got ${spec.basePrice}`);
  }
  const times = buildTimeAxis(spec.timeframe, spec.endTime, spec.barCount);
  const walkPrng = createPrng(deriveSeed(spec.seed, "walk"));
  const closes = buildClosePath(walkPrng, spec.basePrice, spec.barCount);
  const patternRange = spec.pattern ? patternWindow(spec.barCount) : null;
  const shaped =
    spec.pattern && patternRange
      ? applyPattern(closes, spec.pattern, patternRange, createPrng(deriveSeed(spec.seed, "pattern")))
      : closes;
  const barPrng = createPrng(deriveSeed(spec.seed, "bars"));
  const bars = buildBars(times, shaped, barPrng);
  return { bars, pattern: spec.pattern, patternRange };
}

/** Axis labels, newest last; format mirrors what gets painted on the chart. */
function buildTimeAxis(timeframe: string, endTime: string, barCount: number): string[] {
  const minuteStep = MINUTE_STEP[timeframe];
  if (minuteStep !== undefined) {
    return buildIntradayAxis(endTime, barCount, minuteStep);
  }
  if (timeframe === "1d") {
    return buildDailyAxis(endTime, barCount);
  }
  if (timeframe === "1w") {
    return buildWeeklyAxis(endTime, barCount);
  }
  if (timeframe === "1M") {
    return buildMonthlyAxis(endTime, barCount);
  }
  throw new Error(`unsupported timeframe: ${timeframe}`);
}

function parseDateParts(value: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    throw new Error(`endTime must start with YYYY-MM-DD, got ${value}`);
  }
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function formatDate(ms: number): string {
  const date = new Date(ms);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(ms: number): string {
  const hh = String(new Date(ms).getUTCHours()).padStart(2, "0");
  const mm = String(new Date(ms).getUTCMinutes()).padStart(2, "0");
  return `${formatDate(ms)} ${hh}:${mm}`;
}

function buildIntradayAxis(endTime: string, barCount: number, minuteStep: number): string[] {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(endTime);
  if (!match) {
    throw new Error(`intraday endTime must be "YYYY-MM-DD HH:mm", got ${endTime}`);
  }
  const endMs = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5])
  );
  const stepMs = minuteStep * 60_000;
  const labels: string[] = [];
  for (let i = barCount - 1; i >= 0; i -= 1) {
    labels.push(formatDateTime(endMs - i * stepMs));
  }
  return labels;
}

function buildDailyAxis(endTime: string, barCount: number): string[] {
  const { y, m, d } = parseDateParts(endTime);
  const dayMs = 86_400_000;
  let cursor = Date.UTC(y, m - 1, d);
  const labels: string[] = [];
  while (labels.length < barCount) {
    const weekday = new Date(cursor).getUTCDay();
    if (weekday >= 1 && weekday <= 5) {
      labels.push(formatDate(cursor));
    }
    cursor -= dayMs;
  }
  return labels.reverse();
}

function buildWeeklyAxis(endTime: string, barCount: number): string[] {
  const { y, m, d } = parseDateParts(endTime);
  const weekMs = 7 * 86_400_000;
  const endMs = Date.UTC(y, m - 1, d);
  const labels: string[] = [];
  for (let i = barCount - 1; i >= 0; i -= 1) {
    labels.push(formatDate(endMs - i * weekMs));
  }
  return labels;
}

function buildMonthlyAxis(endTime: string, barCount: number): string[] {
  const { y, m } = parseDateParts(endTime);
  const labels: string[] = [];
  for (let i = barCount - 1; i >= 0; i -= 1) {
    const monthIndex = y * 12 + (m - 1) - i;
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    labels.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return labels;
}

function buildClosePath(prng: Prng, basePrice: number, barCount: number): number[] {
  const drift = -0.0008 + prng() * 0.0024;
  const volatility = 0.008 + prng() * 0.016;
  const closes: number[] = [];
  let logPrice = Math.log(basePrice);
  for (let i = 0; i < barCount; i += 1) {
    logPrice += drift + volatility * nextGaussian(prng);
    closes.push(Math.exp(logPrice));
  }
  return closes;
}

function patternWindow(barCount: number): readonly [number, number] {
  const start = Math.floor(barCount * 0.4);
  const end = barCount - 1 - Math.floor(barCount * 0.05);
  return [start, end];
}

/** Rewrite the window with a parametric template; returns a new array. */
function applyPattern(
  closes: readonly number[],
  pattern: ChartPatternName,
  range: readonly [number, number],
  prng: Prng
): number[] {
  const [start, end] = range;
  const length = end - start + 1;
  const anchorPrice = closes[Math.max(0, start - 1)] as number;
  const template = patternTemplate(pattern);
  const result = [...closes];
  for (let i = 0; i < length; i += 1) {
    const t = length === 1 ? 0 : i / (length - 1);
    const { value, band } = template(anchorPrice, t);
    const noise = (prng() - 0.5) * 2 * band * 0.12;
    result[start + i] = value + noise;
  }
  return result;
}

type PatternTemplate = (anchorPrice: number, t: number) => { value: number; band: number };

function patternTemplate(pattern: ChartPatternName): PatternTemplate {
  if (pattern === "ascending_triangle") {
    return (p0, t) => {
      const amplitude = 0.06;
      const resistance = p0 * (1 + amplitude);
      const floor = p0 * (1 - amplitude) + (resistance - p0 * (1 - amplitude)) * t * 0.8;
      const touch = Math.abs(Math.sin(t * Math.PI * 4)) ** 0.7;
      return { value: floor + (resistance - floor) * touch, band: resistance - floor };
    };
  }
  if (pattern === "double_top") {
    return (p0, t) => {
      const amplitude = 0.07;
      const bump = (center: number, width: number) =>
        Math.exp(-(((t - center) / width) ** 2));
      const lift = bump(0.28, 0.12) + bump(0.72, 0.12);
      const value = p0 * (1 - 0.25 * amplitude + amplitude * lift);
      return { value, band: p0 * amplitude };
    };
  }
  if (pattern === "falling_wedge") {
    return (p0, t) => {
      const amplitude = 0.08;
      const upper = p0 * (1 - 0.15 * amplitude - 0.55 * amplitude * t);
      const lower = p0 * (1 - amplitude - 0.25 * amplitude * t);
      const osc = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 3.5);
      return { value: lower + (upper - lower) * osc, band: upper - lower };
    };
  }
  throw new Error(`pattern ${pattern} has no injection template`);
}

function buildBars(times: readonly string[], closes: readonly number[], prng: Prng): OhlcvBar[] {
  const baseVolume = 1_000_000;
  const bars: OhlcvBar[] = [];
  for (let i = 0; i < closes.length; i += 1) {
    const close = closes[i] as number;
    const previousClose = i === 0 ? close : (closes[i - 1] as number);
    const open = previousClose * (1 + nextGaussian(prng) * 0.0015);
    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);
    const high = bodyHigh * (1 + Math.abs(nextGaussian(prng)) * 0.004);
    const low = bodyLow * (1 - Math.abs(nextGaussian(prng)) * 0.004);
    const returnMagnitude = Math.abs(close - previousClose) / previousClose;
    const volume = Math.max(
      1,
      Math.round(baseVolume * (1 + 4 * returnMagnitude) * Math.exp(0.35 * nextGaussian(prng)))
    );
    const open4 = round4(open);
    const close4 = round4(close);
    bars.push({
      time: times[i] as string,
      open: open4,
      high: Math.max(round4(high), open4, close4),
      low: Math.min(round4(low), open4, close4),
      close: close4,
      volume
    });
  }
  return bars;
}

/** Fixed decimal quantization keeps manifests readable and hash-stable. */
function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
