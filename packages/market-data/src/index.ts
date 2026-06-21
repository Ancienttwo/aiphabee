import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const GET_QUOTE_SNAPSHOT_VERSION =
  "2026-06-21.phase1.get-quote-snapshot-tool-scaffold.v0";
export const GET_QUOTE_SNAPSHOT_DATA_VERSION = "quote-snapshot-synthetic-v0";
export const GET_PRICE_HISTORY_VERSION =
  "2026-06-21.phase1.get-price-history-tool-scaffold.v0";
export const GET_PRICE_HISTORY_DATA_VERSION = "price-history-synthetic-v0";

export type QuoteSnapshotInputErrorCode = "INSTRUMENT_ID_REQUIRED" | "INVALID_FIELD";
export type QuoteSnapshotStatus =
  | "data_not_licensed"
  | "data_quality_hold"
  | "found"
  | "not_found"
  | "point_in_time_unavailable";
export type QuoteSnapshotMode = "close" | "delayed";
export type QuoteField =
  | "change"
  | "changePercent"
  | "lastPrice"
  | "previousClose"
  | "turnover"
  | "volume";
export type QuoteQualityState = "HOLD" | "PASS";
export type PriceHistoryInputErrorCode =
  | "INSTRUMENT_ID_REQUIRED"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
  | "INVALID_RANGE";
export type PriceHistoryStatus =
  | "data_not_licensed"
  | "data_quality_hold"
  | "found"
  | "not_found"
  | "out_of_range"
  | "too_many_rows";
export type PriceHistoryAdjustment = "raw" | "split_adjusted" | "total_return_adjusted";
export type PriceHistoryField =
  | "close"
  | "drawdown"
  | "high"
  | "low"
  | "open"
  | "return"
  | "turnover"
  | "volume";
export type PriceHistoryQualityState = "HOLD" | "PASS";

export interface GetQuoteSnapshotInput {
  asOf?: string;
  fields?: string[];
  instrumentId: string;
  mode?: QuoteSnapshotMode;
}

export interface QuoteSnapshot {
  asOf: string;
  currency: string;
  delay: {
    minutes: number;
    type: QuoteSnapshotMode;
  };
  exchange: string;
  fields: Partial<Record<QuoteField, number>>;
  instrumentId: string;
  market: string;
  marketStatus: "closed" | "post_close";
  qualityState: QuoteQualityState;
  symbol: string;
}

export interface GetQuoteSnapshotResult {
  asOf?: string;
  dataVersion: typeof GET_QUOTE_SNAPSHOT_DATA_VERSION;
  instrumentId: string;
  liveDataAccess: false;
  methodologyVersion: typeof GET_QUOTE_SNAPSHOT_VERSION;
  mode: QuoteSnapshotMode;
  provenance: ProvenanceRef[];
  quote?: QuoteSnapshot;
  rejectedFields: string[];
  requestedFields: QuoteField[];
  status: QuoteSnapshotStatus;
  toolName: "get_quote_snapshot";
  usage: UsageSummary;
}

export interface GetPriceHistoryInput {
  adjustment?: string;
  cursor?: string;
  fields?: string[];
  from: string;
  instrumentId: string;
  limit?: number;
  to: string;
}

export interface PriceHistoryRow {
  date: string;
  fields: Partial<Record<PriceHistoryField, number>>;
}

export interface PriceHistoryAdjustmentMethodology {
  adjustment: PriceHistoryAdjustment;
  corporateActionPolicy: string;
  dividendReinvestment: boolean;
  priceBasis: string;
}

export interface PriceHistorySeries {
  adjustment: PriceHistoryAdjustment;
  adjustmentMethodology: PriceHistoryAdjustmentMethodology;
  currency: string;
  exchange: string;
  from: string;
  instrumentId: string;
  market: string;
  nextCursor?: string;
  qualityState: PriceHistoryQualityState;
  rowCount: number;
  rows: PriceHistoryRow[];
  symbol: string;
  to: string;
  totalRows: number;
}

export interface GetPriceHistoryResult {
  adjustment?: PriceHistoryAdjustment;
  cursor?: string;
  dataVersion: typeof GET_PRICE_HISTORY_DATA_VERSION;
  from: string;
  history?: PriceHistorySeries;
  instrumentId: string;
  limit: number;
  liveDataAccess: false;
  methodologyVersion: typeof GET_PRICE_HISTORY_VERSION;
  provenance: ProvenanceRef[];
  rejectedAdjustment?: string;
  rejectedFields: string[];
  requestedFields: PriceHistoryField[];
  status: PriceHistoryStatus;
  to: string;
  toolName: "get_price_history";
  usage: UsageSummary;
}

interface SyntheticQuoteRecord {
  quote: QuoteSnapshot;
  supportedModes: readonly QuoteSnapshotMode[];
}

interface SyntheticPriceHistoryRecord {
  currency: string;
  exchange: string;
  instrumentId: string;
  market: string;
  qualityState: PriceHistoryQualityState;
  rows: readonly PriceHistorySourceRow[];
  supportedAdjustments: readonly PriceHistoryAdjustment[];
  symbol: string;
}

interface PriceHistorySourceRow {
  date: string;
  fields: Record<PriceHistoryField, number>;
}

export class QuoteSnapshotInputError extends Error {
  readonly code: QuoteSnapshotInputErrorCode;

  constructor(code: QuoteSnapshotInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class PriceHistoryInputError extends Error {
  readonly code: PriceHistoryInputErrorCode;

  constructor(code: PriceHistoryInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const DEFAULT_QUOTE_FIELDS: readonly QuoteField[] = [
  "lastPrice",
  "previousClose",
  "change",
  "changePercent",
  "volume",
  "turnover"
];
const DEFAULT_PRICE_HISTORY_FIELDS: readonly PriceHistoryField[] = [
  "open",
  "high",
  "low",
  "close",
  "volume",
  "turnover",
  "return",
  "drawdown"
];
const DEFAULT_PRICE_HISTORY_ADJUSTMENT: PriceHistoryAdjustment = "raw";
const DEFAULT_PRICE_HISTORY_LIMIT = 3;
const MAX_PRICE_HISTORY_LIMIT = 3;
const SUPPORTED_PRICE_HISTORY_ADJUSTMENTS: readonly PriceHistoryAdjustment[] = [
  "raw",
  "split_adjusted",
  "total_return_adjusted"
];

const SYNTHETIC_QUOTE_SNAPSHOTS: readonly SyntheticQuoteRecord[] = [
  {
    quote: {
      asOf: "2026-01-07T16:15:00+08:00",
      currency: "HKD",
      delay: {
        minutes: 15,
        type: "delayed"
      },
      exchange: "HKEX",
      fields: {
        change: 3.2,
        changePercent: 0.72,
        lastPrice: 448.2,
        previousClose: 445,
        turnover: 1280000000,
        volume: 28600000
      },
      instrumentId: "eq_hk_00700",
      market: "HK",
      marketStatus: "post_close",
      qualityState: "PASS",
      symbol: "00700.HK"
    },
    supportedModes: ["delayed", "close"]
  },
  {
    quote: {
      asOf: "2026-01-07T16:15:00+08:00",
      currency: "HKD",
      delay: {
        minutes: 0,
        type: "close"
      },
      exchange: "HKEX",
      fields: {
        change: -0.1,
        changePercent: -0.5,
        lastPrice: 19.9,
        previousClose: 20,
        turnover: 4200000,
        volume: 210000
      },
      instrumentId: "eq_hk_00001",
      market: "HK",
      marketStatus: "closed",
      qualityState: "PASS",
      symbol: "00001.HK"
    },
    supportedModes: ["close"]
  },
  {
    quote: {
      asOf: "2026-01-07T16:15:00+08:00",
      currency: "HKD",
      delay: {
        minutes: 15,
        type: "delayed"
      },
      exchange: "HKEX",
      fields: {
        change: 0,
        changePercent: 0,
        lastPrice: 0.42,
        previousClose: 0.42,
        turnover: 0,
        volume: 0
      },
      instrumentId: "eq_hk_08001",
      market: "HK",
      marketStatus: "post_close",
      qualityState: "HOLD",
      symbol: "08001.HK"
    },
    supportedModes: ["delayed"]
  }
] as const;

const SYNTHETIC_PRICE_HISTORY: readonly SyntheticPriceHistoryRecord[] = [
  {
    currency: "HKD",
    exchange: "HKEX",
    instrumentId: "eq_hk_00700",
    market: "HK",
    qualityState: "PASS",
    rows: [
      {
        date: "2026-01-02",
        fields: {
          close: 438.6,
          drawdown: 0,
          high: 440.2,
          low: 435.8,
          open: 436.4,
          return: 0,
          turnover: 1020000000,
          volume: 23200000
        }
      },
      {
        date: "2026-01-05",
        fields: {
          close: 442.8,
          drawdown: 0,
          high: 444.4,
          low: 439.6,
          open: 440.1,
          return: 0.0096,
          turnover: 1160000000,
          volume: 26100000
        }
      },
      {
        date: "2026-01-06",
        fields: {
          close: 445,
          drawdown: 0,
          high: 448,
          low: 441.8,
          open: 443.2,
          return: 0.005,
          turnover: 1210000000,
          volume: 27400000
        }
      },
      {
        date: "2026-01-07",
        fields: {
          close: 448.2,
          drawdown: 0,
          high: 450.6,
          low: 444.8,
          open: 446,
          return: 0.0072,
          turnover: 1280000000,
          volume: 28600000
        }
      }
    ],
    supportedAdjustments: ["raw", "split_adjusted", "total_return_adjusted"],
    symbol: "00700.HK"
  },
  {
    currency: "HKD",
    exchange: "HKEX",
    instrumentId: "eq_hk_08001",
    market: "HK",
    qualityState: "HOLD",
    rows: [
      {
        date: "2026-01-07",
        fields: {
          close: 0.42,
          drawdown: -0.75,
          high: 0.42,
          low: 0.42,
          open: 0.42,
          return: 0,
          turnover: 0,
          volume: 0
        }
      }
    ],
    supportedAdjustments: ["raw"],
    symbol: "08001.HK"
  }
] as const;

export function getQuoteSnapshot(input: GetQuoteSnapshotInput): GetQuoteSnapshotResult {
  const instrumentId = input.instrumentId.trim();
  const mode = input.mode ?? "delayed";

  if (instrumentId.length === 0) {
    throw new QuoteSnapshotInputError(
      "INSTRUMENT_ID_REQUIRED",
      "instrument_id is required"
    );
  }

  const normalizedFields = normalizeFields(input.fields);

  if (normalizedFields.rejectedFields.length > 0) {
    return createResult({
      instrumentId,
      mode,
      quote: undefined,
      rejectedFields: normalizedFields.rejectedFields,
      requestedFields: normalizedFields.requestedFields,
      status: "data_not_licensed"
    });
  }

  const record = SYNTHETIC_QUOTE_SNAPSHOTS.find(
    (candidate) =>
      normalizeInstrumentId(candidate.quote.instrumentId) ===
      normalizeInstrumentId(instrumentId)
  );

  if (record === undefined) {
    return createResult({
      instrumentId,
      mode,
      quote: undefined,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "not_found"
    });
  }

  if (!record.supportedModes.includes(mode)) {
    return createResult({
      instrumentId,
      mode,
      quote: undefined,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "point_in_time_unavailable"
    });
  }

  if (input.asOf !== undefined && input.asOf !== record.quote.asOf) {
    return createResult({
      instrumentId,
      mode,
      quote: undefined,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "point_in_time_unavailable"
    });
  }

  if (record.quote.qualityState === "HOLD") {
    return createResult({
      instrumentId,
      mode,
      quote: undefined,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "data_quality_hold"
    });
  }

  const quote = filterQuoteFields(record.quote, normalizedFields.requestedFields, mode);

  return createResult({
    instrumentId,
    mode,
    quote,
    rejectedFields: [],
    requestedFields: normalizedFields.requestedFields,
    status: "found"
  });
}

export function getPriceHistory(input: GetPriceHistoryInput): GetPriceHistoryResult {
  const instrumentId = input.instrumentId.trim();
  const from = input.from.trim();
  const to = input.to.trim();
  const limit = input.limit ?? DEFAULT_PRICE_HISTORY_LIMIT;

  if (instrumentId.length === 0) {
    throw new PriceHistoryInputError(
      "INSTRUMENT_ID_REQUIRED",
      "instrument_id is required"
    );
  }

  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    throw new PriceHistoryInputError(
      "INVALID_RANGE",
      "from and to must be YYYY-MM-DD dates with from <= to"
    );
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new PriceHistoryInputError("INVALID_LIMIT", "limit must be a positive integer");
  }

  const normalizedFields = normalizeHistoryFields(input.fields);
  const normalizedAdjustment = normalizeAdjustment(input.adjustment);
  const offset = parseCursor(input.cursor);

  if (normalizedFields.rejectedFields.length > 0 || normalizedAdjustment.rejectedAdjustment) {
    return createPriceHistoryResult({
      adjustment: normalizedAdjustment.adjustment,
      cursor: input.cursor,
      from,
      history: undefined,
      instrumentId,
      limit,
      rejectedAdjustment: normalizedAdjustment.rejectedAdjustment,
      rejectedFields: normalizedFields.rejectedFields,
      requestedFields: normalizedFields.requestedFields,
      status: "data_not_licensed",
      to
    });
  }

  if (limit > MAX_PRICE_HISTORY_LIMIT) {
    return createPriceHistoryResult({
      adjustment: normalizedAdjustment.adjustment,
      cursor: input.cursor,
      from,
      history: undefined,
      instrumentId,
      limit,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "too_many_rows",
      to
    });
  }

  const record = SYNTHETIC_PRICE_HISTORY.find(
    (candidate) =>
      normalizeInstrumentId(candidate.instrumentId) === normalizeInstrumentId(instrumentId)
  );

  if (record === undefined) {
    return createPriceHistoryResult({
      adjustment: normalizedAdjustment.adjustment,
      cursor: input.cursor,
      from,
      history: undefined,
      instrumentId,
      limit,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "not_found",
      to
    });
  }

  if (!record.supportedAdjustments.includes(normalizedAdjustment.adjustment)) {
    return createPriceHistoryResult({
      adjustment: normalizedAdjustment.adjustment,
      cursor: input.cursor,
      from,
      history: undefined,
      instrumentId,
      limit,
      rejectedAdjustment: normalizedAdjustment.adjustment,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "data_not_licensed",
      to
    });
  }

  if (record.qualityState === "HOLD") {
    return createPriceHistoryResult({
      adjustment: normalizedAdjustment.adjustment,
      cursor: input.cursor,
      from,
      history: undefined,
      instrumentId,
      limit,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "data_quality_hold",
      to
    });
  }

  const firstAvailableDate = record.rows[0]?.date;
  const lastAvailableDate = record.rows[record.rows.length - 1]?.date;
  if (
    firstAvailableDate === undefined ||
    lastAvailableDate === undefined ||
    from < firstAvailableDate ||
    to > lastAvailableDate
  ) {
    return createPriceHistoryResult({
      adjustment: normalizedAdjustment.adjustment,
      cursor: input.cursor,
      from,
      history: undefined,
      instrumentId,
      limit,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "out_of_range",
      to
    });
  }

  const matchingRows = record.rows.filter((row) => row.date >= from && row.date <= to);

  if (matchingRows.length === 0) {
    return createPriceHistoryResult({
      adjustment: normalizedAdjustment.adjustment,
      cursor: input.cursor,
      from,
      history: undefined,
      instrumentId,
      limit,
      rejectedFields: [],
      requestedFields: normalizedFields.requestedFields,
      status: "out_of_range",
      to
    });
  }

  const history = createHistorySeries({
    adjustment: normalizedAdjustment.adjustment,
    fields: normalizedFields.requestedFields,
    from,
    limit,
    offset,
    record,
    rows: matchingRows,
    to
  });

  return createPriceHistoryResult({
    adjustment: normalizedAdjustment.adjustment,
    cursor: input.cursor,
    from,
    history,
    instrumentId,
    limit,
    rejectedFields: [],
    requestedFields: normalizedFields.requestedFields,
    status: "found",
    to
  });
}

export function getQuoteSnapshotCapabilities() {
  return {
    data_version: GET_QUOTE_SNAPSHOT_DATA_VERSION,
    delay_metadata: true,
    handler_ready: true,
    input_schema: "tool.get_quote_snapshot.input.v0",
    live_data_access: false,
    output_schema: "tool.get_quote_snapshot.output.v0",
    status: "get_quote_snapshot_scaffold" as const,
    supported_fields: DEFAULT_QUOTE_FIELDS,
    supported_modes: ["delayed", "close"] as const,
    supported_quality_states: ["PASS", "HOLD"] as const,
    synthetic_snapshot_rows: SYNTHETIC_QUOTE_SNAPSHOTS.length,
    version: GET_QUOTE_SNAPSHOT_VERSION
  };
}

export function getPriceHistoryCapabilities() {
  return {
    adjustment_methodology: true,
    cursor_pagination: true,
    data_version: GET_PRICE_HISTORY_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.get_price_history.input.v0",
    live_data_access: false,
    max_rows_per_request: MAX_PRICE_HISTORY_LIMIT,
    output_schema: "tool.get_price_history.output.v0",
    status: "get_price_history_scaffold" as const,
    supported_adjustments: SUPPORTED_PRICE_HISTORY_ADJUSTMENTS,
    supported_fields: DEFAULT_PRICE_HISTORY_FIELDS,
    synthetic_history_rows: SYNTHETIC_PRICE_HISTORY.reduce(
      (count, record) => count + record.rows.length,
      0
    ),
    version: GET_PRICE_HISTORY_VERSION
  };
}

function createResult(params: {
  instrumentId: string;
  mode: QuoteSnapshotMode;
  quote: QuoteSnapshot | undefined;
  rejectedFields: string[];
  requestedFields: QuoteField[];
  status: QuoteSnapshotStatus;
}): GetQuoteSnapshotResult {
  return {
    asOf: params.quote?.asOf,
    dataVersion: GET_QUOTE_SNAPSHOT_DATA_VERSION,
    instrumentId: params.instrumentId,
    liveDataAccess: false,
    methodologyVersion: GET_QUOTE_SNAPSHOT_VERSION,
    mode: params.mode,
    provenance: createProvenance(),
    quote: params.quote,
    rejectedFields: params.rejectedFields,
    requestedFields: params.requestedFields,
    status: params.status,
    toolName: "get_quote_snapshot",
    usage: {
      cached: false,
      credits: params.status === "found" ? (params.mode === "delayed" ? 2 : 1) : 0,
      rows: params.status === "found" ? 1 : 0
    }
  };
}

function createPriceHistoryResult(params: {
  adjustment?: PriceHistoryAdjustment;
  cursor?: string;
  from: string;
  history: PriceHistorySeries | undefined;
  instrumentId: string;
  limit: number;
  rejectedAdjustment?: string;
  rejectedFields: string[];
  requestedFields: PriceHistoryField[];
  status: PriceHistoryStatus;
  to: string;
}): GetPriceHistoryResult {
  return {
    adjustment: params.adjustment,
    cursor: params.cursor,
    dataVersion: GET_PRICE_HISTORY_DATA_VERSION,
    from: params.from,
    history: params.history,
    instrumentId: params.instrumentId,
    limit: params.limit,
    liveDataAccess: false,
    methodologyVersion: GET_PRICE_HISTORY_VERSION,
    provenance: createHistoryProvenance(),
    rejectedAdjustment: params.rejectedAdjustment,
    rejectedFields: params.rejectedFields,
    requestedFields: params.requestedFields,
    status: params.status,
    to: params.to,
    toolName: "get_price_history",
    usage: {
      cached: false,
      credits: params.history === undefined ? 0 : params.history.rows.length * 2,
      rows: params.history?.rows.length ?? 0
    }
  };
}

function filterQuoteFields(
  quote: QuoteSnapshot,
  fields: QuoteField[],
  mode: QuoteSnapshotMode
): QuoteSnapshot {
  return {
    ...quote,
    delay: {
      minutes: mode === "close" ? 0 : quote.delay.minutes,
      type: mode
    },
    fields: Object.fromEntries(
      fields.map((field) => [field, quote.fields[field]])
    ) as Partial<Record<QuoteField, number>>,
    marketStatus: mode === "close" ? "closed" : quote.marketStatus
  };
}

function normalizeFields(fields: string[] | undefined): {
  rejectedFields: string[];
  requestedFields: QuoteField[];
} {
  if (fields === undefined || fields.length === 0) {
    return {
      rejectedFields: [],
      requestedFields: [...DEFAULT_QUOTE_FIELDS]
    };
  }

  const requestedFields: QuoteField[] = [];
  const rejectedFields: string[] = [];

  for (const field of fields) {
    if (isQuoteField(field)) {
      requestedFields.push(field);
    } else {
      rejectedFields.push(field);
    }
  }

  return {
    rejectedFields,
    requestedFields
  };
}

function normalizeHistoryFields(fields: string[] | undefined): {
  rejectedFields: string[];
  requestedFields: PriceHistoryField[];
} {
  if (fields === undefined || fields.length === 0) {
    return {
      rejectedFields: [],
      requestedFields: [...DEFAULT_PRICE_HISTORY_FIELDS]
    };
  }

  const requestedFields: PriceHistoryField[] = [];
  const rejectedFields: string[] = [];

  for (const field of fields) {
    if (isPriceHistoryField(field)) {
      requestedFields.push(field);
    } else {
      rejectedFields.push(field);
    }
  }

  return {
    rejectedFields,
    requestedFields
  };
}

function isQuoteField(value: string): value is QuoteField {
  return (DEFAULT_QUOTE_FIELDS as readonly string[]).includes(value);
}

function isPriceHistoryField(value: string): value is PriceHistoryField {
  return (DEFAULT_PRICE_HISTORY_FIELDS as readonly string[]).includes(value);
}

function normalizeAdjustment(value: string | undefined): {
  adjustment: PriceHistoryAdjustment;
  rejectedAdjustment?: string;
} {
  if (value === undefined || value.length === 0) {
    return {
      adjustment: DEFAULT_PRICE_HISTORY_ADJUSTMENT
    };
  }

  if (isPriceHistoryAdjustment(value)) {
    return {
      adjustment: value
    };
  }

  return {
    adjustment: DEFAULT_PRICE_HISTORY_ADJUSTMENT,
    rejectedAdjustment: value
  };
}

function isPriceHistoryAdjustment(value: string): value is PriceHistoryAdjustment {
  return (SUPPORTED_PRICE_HISTORY_ADJUSTMENTS as readonly string[]).includes(value);
}

function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined || cursor.length === 0) {
    return 0;
  }

  const match = /^offset:(\d+)$/u.exec(cursor);
  if (match === null) {
    throw new PriceHistoryInputError(
      "INVALID_CURSOR",
      "cursor must be empty or match offset:<number>"
    );
  }

  return Number(match[1]);
}

function createHistorySeries(params: {
  adjustment: PriceHistoryAdjustment;
  fields: PriceHistoryField[];
  from: string;
  limit: number;
  offset: number;
  record: SyntheticPriceHistoryRecord;
  rows: readonly PriceHistorySourceRow[];
  to: string;
}): PriceHistorySeries {
  const pageRows = params.rows.slice(params.offset, params.offset + params.limit);
  const nextOffset = params.offset + pageRows.length;
  const nextCursor = nextOffset < params.rows.length ? `offset:${nextOffset}` : undefined;

  return {
    adjustment: params.adjustment,
    adjustmentMethodology: createAdjustmentMethodology(params.adjustment),
    currency: params.record.currency,
    exchange: params.record.exchange,
    from: params.from,
    instrumentId: params.record.instrumentId,
    market: params.record.market,
    nextCursor,
    qualityState: params.record.qualityState,
    rowCount: pageRows.length,
    rows: pageRows.map((row) => ({
      date: row.date,
      fields: Object.fromEntries(
        params.fields.map((field) => [field, row.fields[field]])
      ) as Partial<Record<PriceHistoryField, number>>
    })),
    symbol: params.record.symbol,
    to: params.to,
    totalRows: params.rows.length
  };
}

function createAdjustmentMethodology(
  adjustment: PriceHistoryAdjustment
): PriceHistoryAdjustmentMethodology {
  if (adjustment === "total_return_adjusted") {
    return {
      adjustment,
      corporateActionPolicy: "synthetic-total-return-v0",
      dividendReinvestment: true,
      priceBasis: "close_to_close"
    };
  }

  if (adjustment === "split_adjusted") {
    return {
      adjustment,
      corporateActionPolicy: "synthetic-split-factor-v0",
      dividendReinvestment: false,
      priceBasis: "split_adjusted_close"
    };
  }

  return {
    adjustment,
    corporateActionPolicy: "raw-unadjusted-v0",
    dividendReinvestment: false,
    priceBasis: "raw_trade_price"
  };
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value);
}

function normalizeInstrumentId(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function createProvenance(): ProvenanceRef[] {
  return [
    {
      data_version: GET_QUOTE_SNAPSHOT_DATA_VERSION,
      methodology_version: GET_QUOTE_SNAPSHOT_VERSION,
      source: "synthetic-quote-snapshot",
      source_record_id: "get-quote-snapshot-fixture-v0"
    }
  ];
}

function createHistoryProvenance(): ProvenanceRef[] {
  return [
    {
      data_version: GET_PRICE_HISTORY_DATA_VERSION,
      methodology_version: GET_PRICE_HISTORY_VERSION,
      source: "synthetic-price-history",
      source_record_id: "get-price-history-fixture-v0"
    }
  ];
}
