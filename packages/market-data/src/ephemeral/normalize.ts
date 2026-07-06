import {
  EPHEMERAL_OHLCV_NORMALIZATION_VERSION,
  MAX_EPHEMERAL_OHLCV_BARS,
  type EphemeralOhlcvNormalizationInput,
  type EphemeralOhlcvNormalizationIssue,
  type EphemeralOhlcvNormalizationResult,
  type EphemeralRawOhlcvBar,
  type NormalizedEphemeralBar
} from "./types";

export function normalizeEphemeralBars(
  input: EphemeralOhlcvNormalizationInput
): EphemeralOhlcvNormalizationResult {
  const provider = {
    providerId: input.providerId,
    providerResponseSchemaVersion: input.providerResponseSchemaVersion,
    retrievedAt: input.retrievedAt
  };
  const issues: EphemeralOhlcvNormalizationIssue[] = [];

  if (input.rawBars.length > MAX_EPHEMERAL_OHLCV_BARS) {
    return {
      bars: [],
      dataQuality: {
        barsCount: 0,
        incompleteLatestBar: false
      },
      issues: [
        {
          code: "TOO_MANY_BARS",
          index: MAX_EPHEMERAL_OHLCV_BARS,
          message: `bars_count must be <= ${MAX_EPHEMERAL_OHLCV_BARS}`
        }
      ],
      provider,
      status: "invalid",
      version: EPHEMERAL_OHLCV_NORMALIZATION_VERSION
    };
  }

  const normalizedCandidates = input.rawBars.map((bar, index) =>
    normalizeSingleBar(bar, index, issues)
  );
  const normalizedBars = normalizedCandidates.filter(
    (bar): bar is NormalizedEphemeralBar => bar !== undefined
  );
  const seenTimestamps = new Set<string>();

  for (const bar of normalizedBars) {
    if (seenTimestamps.has(bar.timestamp)) {
      issues.push({
        code: "DUPLICATE_TIMESTAMP",
        index: input.rawBars.findIndex((candidate) =>
          normalizesToTimestamp(candidate.timestamp, bar.timestamp)
        ),
        message: "timestamp must be unique",
        timestamp: bar.timestamp
      });
      continue;
    }

    seenTimestamps.add(bar.timestamp);
  }

  if (issues.length > 0) {
    return {
      bars: [],
      dataQuality: {
        barsCount: 0,
        incompleteLatestBar: false
      },
      issues,
      provider,
      status: "invalid",
      version: EPHEMERAL_OHLCV_NORMALIZATION_VERSION
    };
  }

  const bars = [...normalizedBars].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp)
  );
  const latestBar = bars[bars.length - 1];

  return {
    bars,
    dataQuality: {
      barsCount: bars.length,
      incompleteLatestBar: latestBar?.complete === false
    },
    issues: [],
    provider,
    status: "ok",
    version: EPHEMERAL_OHLCV_NORMALIZATION_VERSION
  };
}

function normalizeSingleBar(
  bar: EphemeralRawOhlcvBar,
  index: number,
  issues: EphemeralOhlcvNormalizationIssue[]
): NormalizedEphemeralBar | undefined {
  const timestamp = normalizeTimestamp(bar.timestamp);
  const open = normalizeFiniteNumber(bar.open);
  const high = normalizeFiniteNumber(bar.high);
  const low = normalizeFiniteNumber(bar.low);
  const close = normalizeFiniteNumber(bar.close);
  const volume = normalizeVolume(bar.volume);
  const complete = bar.complete === undefined ? true : bar.complete === true;

  if (timestamp === undefined) {
    issues.push({
      code: "INVALID_TIMESTAMP",
      index,
      message: "timestamp must be parseable"
    });
  }

  if (open === undefined || high === undefined || low === undefined || close === undefined) {
    issues.push({
      code: "INVALID_PRICE",
      index,
      message: "open, high, low, and close must be finite numbers",
      timestamp
    });
  }

  if (volume === undefined) {
    issues.push({
      code: "NEGATIVE_VOLUME",
      index,
      message: "volume must be null or >= 0",
      timestamp
    });
  }

  if (
    open !== undefined &&
    high !== undefined &&
    low !== undefined &&
    close !== undefined &&
    (high < Math.max(open, close, low) || low > Math.min(open, close, high))
  ) {
    issues.push({
      code: "INVALID_OHLC_RELATION",
      index,
      message: "high/low must bound open and close",
      timestamp
    });
  }

  if (
    timestamp === undefined ||
    open === undefined ||
    high === undefined ||
    low === undefined ||
    close === undefined ||
    volume === undefined
  ) {
    return undefined;
  }

  return {
    close,
    complete,
    high,
    low,
    open,
    timestamp,
    volume
  };
}

function normalizeTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const epochMs = Date.parse(value);

  if (!Number.isFinite(epochMs)) {
    return undefined;
  }

  return new Date(epochMs).toISOString();
}

function normalizesToTimestamp(value: unknown, timestamp: string): boolean {
  return normalizeTimestamp(value) === timestamp;
}

function normalizeFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeVolume(value: unknown): number | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}
