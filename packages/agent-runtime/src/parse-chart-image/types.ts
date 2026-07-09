import type { LanguageModel } from "ai";
import type { ChartParseResult } from "../chart-parse";
import type {
  CalibrationLookup,
  ChartParseRouteDecision,
  ChartParseRoutingDecision
} from "./routing";

export type ChartParseStatus = "ready" | "degraded" | "parse_failed";

export interface ChartParseUsageTotals {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

/**
 * One chart_parse_results row (PRD parse-chart-image Data Model v2).
 * image_ref is an R2 key string; image bytes must never appear here.
 * calibration_run_id stays null until a matching ready calibration exists,
 * which forces human-confirmation routing downstream.
 */
export interface ChartParseResultRecord {
  analysis_run_id: string | null;
  calibration_run_id: string | null;
  error_code: string | null;
  id: string;
  image_ref: string;
  latency_ms: number;
  model_version: string;
  prompt_version: string;
  result_json: ChartParseResult | null;
  schema_version: string;
  status: ChartParseStatus;
  tenant_id: string;
  token_cost: number;
}

export interface ChartParseResultSink {
  record(row: ChartParseResultRecord): Promise<void>;
}

export interface ParseChartImageRequest {
  analysis_run_id?: string | null;
  image_ref: string;
  tenant_id: string;
}

/**
 * Answer-layer data status derived from the routing decision (PRD Research
 * TA evidence boundary). Closed set: parse_failed or a missing image/routing
 * decision always collapses to "unavailable" — never synthesized.
 */
export type ChartEvidenceDataStatus =
  | "parsed"
  | "parsed_pending_confirmation"
  | "visual_reference_only"
  | "unavailable";

/**
 * Chart reading is model inference, never a verified fact: "strong" is not
 * a reachable value for this evidence source (see evidence.ts strength
 * mapping const).
 */
export type ChartEvidenceStrength = "weak" | "medium" | "unknown";

export type ChartEvidenceClaimLabel = "inference";

export type ChartEvidenceCalibrationStatus = "not_used" | "ready_used";

type StripConfidence<Value extends { confidence: number }> = Omit<Value, "confidence">;

/**
 * Field values only, per-field self-reported confidence stripped (contract
 * evidence_strength.confidence_score_display: false). Raw confidence stays
 * in ChartParseResultRecord.result_json for internal/eval use only.
 */
export interface ChartEvidenceDataPoints {
  chart_type: ChartParseResult["chart_type"]["value"];
  drawn_lines: Array<StripConfidence<ChartParseResult["drawn_lines"][number]>>;
  end_time: ChartParseResult["end_time"]["value"];
  exchange: ChartParseResult["exchange"]["value"];
  indicators: Array<StripConfidence<ChartParseResult["indicators"][number]>>;
  patterns: Array<StripConfidence<ChartParseResult["patterns"][number]>>;
  symbol: ChartParseResult["symbol"]["value"];
  timeframe: ChartParseResult["timeframe"]["value"];
}

/**
 * Answer-layer evidence candidate for one chart parse. image_ref is an R2
 * key locator, never bytes; null only when data_status is "unavailable".
 */
export interface ChartEvidenceCandidate {
  as_of: number;
  calibration_run_id: string | null;
  calibration_status: ChartEvidenceCalibrationStatus;
  claim_label: ChartEvidenceClaimLabel;
  data_points: ChartEvidenceDataPoints;
  evidence_strength: ChartEvidenceStrength;
  image_ref: string;
  model_version: string;
  prompt_version: string;
  route_decision: ChartParseRouteDecision;
  route_reason: ChartParseRoutingDecision["reason"];
  schema_version: string;
  source_record_id: string;
  source_tool: "parse_chart_image";
  tenant_id: string;
  warnings: string[];
}

export interface ChartEvidenceHandoff {
  data_status: ChartEvidenceDataStatus;
  evidence_candidate: ChartEvidenceCandidate | null;
}

export interface ParseChartImageOutcome {
  calibration_run_id: string | null;
  data_status: ChartEvidenceDataStatus;
  error_code: string | null;
  evidence_candidate: ChartEvidenceCandidate | null;
  latency_ms: number;
  model_call_count: number;
  record_id: string;
  repair_applied: boolean;
  result: ChartParseResult | null;
  route_decision: ChartParseRouteDecision | null;
  status: ChartParseStatus;
  usage: ChartParseUsageTotals;
}

export interface FetchedChartImage {
  bytes: Uint8Array;
  /** Content type as known by the storage layer, e.g. image/png. */
  mediaType: string;
}

export interface ParseChartImageDeps {
  calibrationLookup?: CalibrationLookup;
  /** Resolve an imageRef to image bytes + media type; null when unavailable. */
  fetchImage: (
    imageRef: string,
    context: { tenant_id: string }
  ) => Promise<FetchedChartImage | null>;
  generateId: () => string;
  minCalibrationSamples?: number;
  model: LanguageModel;
  /** Vision model identifier recorded as chart_parse_results.model_version. */
  modelVersion: string;
  now?: () => number;
  sink: ChartParseResultSink;
}

export type ParseChartImageExecutor = (
  request: ParseChartImageRequest
) => Promise<ParseChartImageOutcome>;
