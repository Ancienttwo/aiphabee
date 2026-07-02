/**
 * Deterministic indicator math for rendered overlays.
 *
 * The numeric outputs are drawn on the chart but are NOT truth fields: truth
 * only records which indicators are visible and with which parameters
 * (chart-parse contract forbids numeric OHLC/indicator readings). Warmup
 * positions are null so ECharts leaves gaps instead of fabricating values.
 */

export function sma(values: readonly number[], period: number): Array<number | null> {
  if (period < 1) {
    throw new Error(`sma period must be >= 1, got ${period}`);
  }
  const result: Array<number | null> = [];
  let windowSum = 0;
  for (let i = 0; i < values.length; i += 1) {
    windowSum += values[i] as number;
    if (i >= period) {
      windowSum -= values[i - period] as number;
    }
    result.push(i >= period - 1 ? windowSum / period : null);
  }
  return result;
}

export function ema(values: readonly number[], period: number): Array<number | null> {
  if (period < 1) {
    throw new Error(`ema period must be >= 1, got ${period}`);
  }
  const smoothing = 2 / (period + 1);
  const result: Array<number | null> = [];
  let previous: number | null = null;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i] as number;
    if (previous === null) {
      if (i === period - 1) {
        const seed = values.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
        previous = seed;
        result.push(seed);
      } else {
        result.push(null);
      }
      continue;
    }
    previous = value * smoothing + previous * (1 - smoothing);
    result.push(previous);
  }
  return result;
}

/** RSI with Wilder smoothing; null during the warmup window. */
export function rsi(closes: readonly number[], period: number): Array<number | null> {
  if (period < 1) {
    throw new Error(`rsi period must be >= 1, got ${period}`);
  }
  const result: Array<number | null> = new Array(closes.length).fill(null);
  if (closes.length <= period) {
    return result;
  }
  let gainAvg = 0;
  let lossAvg = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = (closes[i] as number) - (closes[i - 1] as number);
    gainAvg += Math.max(0, change);
    lossAvg += Math.max(0, -change);
  }
  gainAvg /= period;
  lossAvg /= period;
  result[period] = toRsiValue(gainAvg, lossAvg);
  for (let i = period + 1; i < closes.length; i += 1) {
    const change = (closes[i] as number) - (closes[i - 1] as number);
    gainAvg = (gainAvg * (period - 1) + Math.max(0, change)) / period;
    lossAvg = (lossAvg * (period - 1) + Math.max(0, -change)) / period;
    result[i] = toRsiValue(gainAvg, lossAvg);
  }
  return result;
}

function toRsiValue(gainAvg: number, lossAvg: number): number {
  if (lossAvg === 0) {
    return gainAvg === 0 ? 50 : 100;
  }
  return 100 - 100 / (1 + gainAvg / lossAvg);
}

export interface MacdSeries {
  readonly macd: Array<number | null>;
  readonly signal: Array<number | null>;
  readonly histogram: Array<number | null>;
}

export function macd(
  closes: readonly number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdSeries {
  const fast = ema(closes, fastPeriod);
  const slow = ema(closes, slowPeriod);
  const macdLine: Array<number | null> = closes.map((_, i) => {
    const f = fast[i];
    const s = slow[i];
    return f === null || s === null || f === undefined || s === undefined ? null : f - s;
  });
  const firstIndex = macdLine.findIndex((v) => v !== null);
  const signalLine: Array<number | null> = new Array(closes.length).fill(null);
  if (firstIndex >= 0) {
    const compact = macdLine.slice(firstIndex) as number[];
    const compactSignal = ema(compact, signalPeriod);
    for (let i = 0; i < compactSignal.length; i += 1) {
      signalLine[firstIndex + i] = compactSignal[i] ?? null;
    }
  }
  const histogram: Array<number | null> = macdLine.map((value, i) => {
    const signalValue = signalLine[i];
    return value === null || signalValue === null || signalValue === undefined
      ? null
      : value - signalValue;
  });
  return { macd: macdLine, signal: signalLine, histogram };
}
