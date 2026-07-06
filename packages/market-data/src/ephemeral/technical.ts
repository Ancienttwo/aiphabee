import type { NormalizedEphemeralBar } from "./types";

export const EPHEMERAL_TECHNICAL_INDICATOR_VERSION =
  "2026-07-07.ephemeral-technical-indicators.v0";
export const EPHEMERAL_TECHNICAL_SIGNAL_VERSION =
  "2026-07-07.ephemeral-technical-signals.v0";

export interface EphemeralTechnicalIndicatorPoint {
  atr14: number | null;
  boll20: {
    lower: number;
    middle: number;
    upper: number;
  } | null;
  close: number;
  ema12: number;
  ema26: number;
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  macd: {
    histogram: number;
    line: number;
    signal: number;
  };
  obv: number;
  rsi14: number | null;
  timestamp: string;
  volumeMa20: number | null;
}

export type TechnicalObservationDimension =
  | "momentum"
  | "trend"
  | "volatility"
  | "volume";

export interface EphemeralTechnicalObservation {
  dimension: TechnicalObservationDimension;
  label: string;
  strength: "high" | "low" | "medium";
  value: "elevated" | "mixed" | "negative" | "neutral" | "positive" | "unclear";
}

export interface EphemeralTechnicalSignalSummary {
  momentum: "negative" | "neutral" | "positive" | "unclear";
  observations: EphemeralTechnicalObservation[];
  trend: "downtrend" | "sideways" | "unclear" | "uptrend";
  version: typeof EPHEMERAL_TECHNICAL_SIGNAL_VERSION;
  volatility: "elevated" | "normal" | "unclear";
  volume: "confirming" | "diverging" | "mixed" | "insufficient";
}

export function computeTechnicalIndicators(
  bars: readonly NormalizedEphemeralBar[]
): EphemeralTechnicalIndicatorPoint[] {
  const closes = bars.map((bar) => bar.close);
  const highs = bars.map((bar) => bar.high);
  const lows = bars.map((bar) => bar.low);
  const volumes = bars.map((bar) => bar.volume ?? 0);
  const ema12 = computeEma(closes, 12);
  const ema26 = computeEma(closes, 26);
  const macdLine = closes.map((_, index) => ema12[index] - ema26[index]);
  const macdSignal = computeEma(macdLine, 9);
  const obv = computeObv(closes, volumes);
  const trueRanges = computeTrueRanges(highs, lows, closes);

  return bars.map((bar, index) => {
    const boll20 = computeBollinger(closes, index, 20, 2);

    return {
      atr14: computeWindowAverage(trueRanges, index, 14),
      boll20,
      close: bar.close,
      ema12: round(ema12[index]),
      ema26: round(ema26[index]),
      ma5: computeWindowAverage(closes, index, 5),
      ma20: computeWindowAverage(closes, index, 20),
      ma60: computeWindowAverage(closes, index, 60),
      macd: {
        histogram: round(macdLine[index] - macdSignal[index]),
        line: round(macdLine[index]),
        signal: round(macdSignal[index])
      },
      obv: obv[index],
      rsi14: computeRsi(closes, index, 14),
      timestamp: bar.timestamp,
      volumeMa20: computeWindowAverage(volumes, index, 20)
    };
  });
}

export function computeTechnicalSignals(
  bars: readonly NormalizedEphemeralBar[],
  indicators: readonly EphemeralTechnicalIndicatorPoint[] = computeTechnicalIndicators(bars)
): EphemeralTechnicalSignalSummary {
  const latest = indicators.at(-1);
  const latestBar = bars.at(-1);

  if (latest === undefined || latestBar === undefined) {
    return createSignalSummary({
      momentum: "unclear",
      observations: [],
      trend: "unclear",
      volatility: "unclear",
      volume: "insufficient"
    });
  }

  const trend = classifyTrend(latest);
  const momentum = classifyMomentum(latest);
  const volatility = classifyVolatility(latest);
  const volume = classifyVolume(latestBar, latest);

  return createSignalSummary({
    momentum,
    observations: [
      {
        dimension: "trend",
        label: "moving_average_trend",
        strength: trend === "unclear" ? "low" : "medium",
        value: trend === "uptrend" ? "positive" : trend === "downtrend" ? "negative" : "neutral"
      },
      {
        dimension: "momentum",
        label: "macd_rsi_momentum",
        strength: momentum === "unclear" ? "low" : "medium",
        value: momentum
      },
      {
        dimension: "volatility",
        label: "atr_relative_volatility",
        strength: volatility === "elevated" ? "medium" : "low",
        value: volatility === "elevated" ? "elevated" : volatility === "normal" ? "neutral" : "unclear"
      },
      {
        dimension: "volume",
        label: "volume_confirmation",
        strength: volume === "insufficient" ? "low" : "medium",
        value: volume === "confirming" ? "positive" : volume === "diverging" ? "negative" : "mixed"
      }
    ],
    trend,
    volatility,
    volume
  });
}

function classifyTrend(
  latest: EphemeralTechnicalIndicatorPoint
): EphemeralTechnicalSignalSummary["trend"] {
  if (latest.ma5 === null || latest.ma20 === null) {
    return "unclear";
  }

  if (latest.close > latest.ma20 && latest.ma5 > latest.ma20) {
    return "uptrend";
  }

  if (latest.close < latest.ma20 && latest.ma5 < latest.ma20) {
    return "downtrend";
  }

  return "sideways";
}

function classifyMomentum(
  latest: EphemeralTechnicalIndicatorPoint
): EphemeralTechnicalSignalSummary["momentum"] {
  if (latest.rsi14 === null) {
    return "unclear";
  }

  if (latest.macd.histogram > 0 && latest.rsi14 >= 55) {
    return "positive";
  }

  if (latest.macd.histogram < 0 && latest.rsi14 <= 45) {
    return "negative";
  }

  return "neutral";
}

function classifyVolatility(
  latest: EphemeralTechnicalIndicatorPoint
): EphemeralTechnicalSignalSummary["volatility"] {
  if (latest.atr14 === null || latest.close === 0) {
    return "unclear";
  }

  return latest.atr14 / latest.close > 0.04 ? "elevated" : "normal";
}

function classifyVolume(
  latestBar: NormalizedEphemeralBar,
  latest: EphemeralTechnicalIndicatorPoint
): EphemeralTechnicalSignalSummary["volume"] {
  if (latest.volumeMa20 === null || latestBar.volume === null) {
    return "insufficient";
  }

  if (latestBar.volume > latest.volumeMa20 && latest.close > (latest.ma20 ?? latest.close)) {
    return "confirming";
  }

  if (latestBar.volume < latest.volumeMa20 && latest.close > (latest.ma20 ?? latest.close)) {
    return "diverging";
  }

  return "mixed";
}

function createSignalSummary(input: {
  momentum: EphemeralTechnicalSignalSummary["momentum"];
  observations: EphemeralTechnicalObservation[];
  trend: EphemeralTechnicalSignalSummary["trend"];
  volatility: EphemeralTechnicalSignalSummary["volatility"];
  volume: EphemeralTechnicalSignalSummary["volume"];
}): EphemeralTechnicalSignalSummary {
  return {
    momentum: input.momentum,
    observations: input.observations,
    trend: input.trend,
    version: EPHEMERAL_TECHNICAL_SIGNAL_VERSION,
    volatility: input.volatility,
    volume: input.volume
  };
}

function computeEma(values: readonly number[], period: number): number[] {
  const alpha = 2 / (period + 1);
  const ema: number[] = [];

  for (const value of values) {
    const previous = ema.at(-1);
    ema.push(previous === undefined ? value : value * alpha + previous * (1 - alpha));
  }

  return ema;
}

function computeWindowAverage(
  values: readonly number[],
  index: number,
  period: number
): number | null {
  if (index + 1 < period) {
    return null;
  }

  return round(average(values.slice(index + 1 - period, index + 1)));
}

function computeBollinger(
  closes: readonly number[],
  index: number,
  period: number,
  deviations: number
): EphemeralTechnicalIndicatorPoint["boll20"] {
  if (index + 1 < period) {
    return null;
  }

  const window = closes.slice(index + 1 - period, index + 1);
  const middle = average(window);
  const variance = average(window.map((value) => (value - middle) ** 2));
  const spread = Math.sqrt(variance) * deviations;

  return {
    lower: round(middle - spread),
    middle: round(middle),
    upper: round(middle + spread)
  };
}

function computeRsi(
  closes: readonly number[],
  index: number,
  period: number
): number | null {
  if (index < period) {
    return null;
  }

  const changes = closes
    .slice(index + 1 - period, index + 1)
    .map((value, offset, window) => {
      const previous = offset === 0 ? closes[index - period] : window[offset - 1];
      return value - previous;
    });
  const gains = changes.map((change) => Math.max(change, 0));
  const losses = changes.map((change) => Math.max(-change, 0));
  const averageGain = average(gains);
  const averageLoss = average(losses);

  if (averageLoss === 0) {
    return 100;
  }

  return round(100 - 100 / (1 + averageGain / averageLoss));
}

function computeTrueRanges(
  highs: readonly number[],
  lows: readonly number[],
  closes: readonly number[]
): number[] {
  return highs.map((high, index) => {
    const low = lows[index];
    const previousClose = closes[index - 1];

    if (previousClose === undefined) {
      return high - low;
    }

    return Math.max(high - low, Math.abs(high - previousClose), Math.abs(low - previousClose));
  });
}

function computeObv(closes: readonly number[], volumes: readonly number[]): number[] {
  const values: number[] = [];

  for (let index = 0; index < closes.length; index += 1) {
    if (index === 0) {
      values.push(0);
      continue;
    }

    const previous = values[index - 1] ?? 0;
    const close = closes[index];
    const previousClose = closes[index - 1];
    const volume = volumes[index] ?? 0;

    if (close > previousClose) {
      values.push(previous + volume);
    } else if (close < previousClose) {
      values.push(previous - volume);
    } else {
      values.push(previous);
    }
  }

  return values;
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
