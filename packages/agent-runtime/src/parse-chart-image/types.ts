import type { LanguageModel } from "ai";
import type { ChartParseResult } from "../chart-parse";

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

export interface ParseChartImageOutcome {
  error_code: string | null;
  latency_ms: number;
  model_call_count: number;
  record_id: string;
  repair_applied: boolean;
  result: ChartParseResult | null;
  status: ChartParseStatus;
  usage: ChartParseUsageTotals;
}

export interface FetchedChartImage {
  bytes: Uint8Array;
  /** Content type as known by the storage layer, e.g. image/png. */
  mediaType: string;
}

export interface ParseChartImageDeps {
  /** Resolve an imageRef to image bytes + media type; null when unavailable. */
  fetchImage: (imageRef: string) => Promise<FetchedChartImage | null>;
  generateId: () => string;
  model: LanguageModel;
  /** Vision model identifier recorded as chart_parse_results.model_version. */
  modelVersion: string;
  now?: () => number;
  sink: ChartParseResultSink;
}

export type ParseChartImageExecutor = (
  request: ParseChartImageRequest
) => Promise<ParseChartImageOutcome>;
