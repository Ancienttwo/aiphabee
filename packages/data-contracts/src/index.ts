export const ERROR_CODES = [
  "AUTH_REQUIRED",
  "DATA_NOT_LICENSED",
  "SCOPE_DENIED",
  "DATA_QUALITY_HOLD",
  "AMBIGUOUS_SECURITY",
  "SYMBOL_AMBIGUOUS",
  "OUT_OF_RANGE",
  "TOO_MANY_ROWS",
  "POINT_IN_TIME_UNAVAILABLE",
  "NOT_FOUND",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "MODEL_PROVIDER_NOT_CONFIGURED",
  "UPSTREAM_STALE",
  "INTERNAL_ERROR"
] as const;

export type AiphaBeeErrorCode = (typeof ERROR_CODES)[number];

export type MarketStatus =
  | "open"
  | "closed"
  | "pre_open"
  | "post_close"
  | "halted"
  | "unknown"
  | "not_applicable";

export interface ProvenanceRef {
  source: string;
  source_record_id: string;
  data_version: string;
  methodology_version?: string;
}

export interface UsageSummary {
  cached: boolean;
  credits: number;
  rows: number;
}

export interface EnvelopeMeta {
  asOf: string;
  dataVersion?: string;
  marketStatus?: MarketStatus;
  methodologyVersion?: string;
  provenance?: ProvenanceRef[];
  requestId: string;
  usage?: UsageSummary;
}

interface NormalizedEnvelopeMeta {
  as_of: string;
  data_version?: string;
  market_status: MarketStatus;
  methodology_version?: string;
  provenance: ProvenanceRef[];
  request_id: string;
  usage: UsageSummary;
}

export interface SuccessEnvelope<TData> extends NormalizedEnvelopeMeta {
  data: TData;
  ok: true;
}

export interface ErrorEnvelope extends NormalizedEnvelopeMeta {
  error: {
    code: AiphaBeeErrorCode;
    message: string;
  };
  ok: false;
}

export type ResponseEnvelope<TData> = SuccessEnvelope<TData> | ErrorEnvelope;

const DEFAULT_USAGE: UsageSummary = {
  cached: false,
  credits: 0,
  rows: 0
};

export function createSuccessEnvelope<TData>(
  data: TData,
  meta: EnvelopeMeta
): SuccessEnvelope<TData> {
  return {
    ...normalizeMeta(meta),
    data,
    ok: true
  };
}

export function createErrorEnvelope(
  code: AiphaBeeErrorCode,
  message: string,
  meta: EnvelopeMeta
): ErrorEnvelope {
  return {
    ...normalizeMeta(meta),
    error: {
      code,
      message
    },
    ok: false
  };
}

function normalizeMeta(meta: EnvelopeMeta): NormalizedEnvelopeMeta {
  return {
    as_of: meta.asOf,
    data_version: meta.dataVersion,
    market_status: meta.marketStatus ?? "not_applicable",
    methodology_version: meta.methodologyVersion,
    provenance: meta.provenance ?? [],
    request_id: meta.requestId,
    usage: meta.usage ?? DEFAULT_USAGE
  };
}
