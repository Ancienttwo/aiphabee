import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const GET_QUOTE_SNAPSHOT_VERSION =
  "2026-06-21.phase1.get-quote-snapshot-tool-scaffold.v0";
export const GET_QUOTE_SNAPSHOT_DATA_VERSION = "quote-snapshot-synthetic-v0";

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

interface SyntheticQuoteRecord {
  quote: QuoteSnapshot;
  supportedModes: readonly QuoteSnapshotMode[];
}

export class QuoteSnapshotInputError extends Error {
  readonly code: QuoteSnapshotInputErrorCode;

  constructor(code: QuoteSnapshotInputErrorCode, message: string) {
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

function isQuoteField(value: string): value is QuoteField {
  return (DEFAULT_QUOTE_FIELDS as readonly string[]).includes(value);
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
