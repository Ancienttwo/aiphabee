import type { ChartParseResult } from "../chart-parse";
import type { ChartParseRouteDecision, ChartParseRoutingDecision } from "./routing";
import type {
  ChartEvidenceCandidate,
  ChartEvidenceDataPoints,
  ChartEvidenceDataStatus,
  ChartEvidenceHandoff,
  ChartEvidenceStrength,
  ChartParseResultRecord
} from "./types";

/**
 * Chart reading is model inference, never a verified fact: this mapping is
 * the single place that turns a routing decision into an answer-layer
 * evidence_strength. auto_match still tops out at "medium" — "strong" is
 * never reachable through this evidence source.
 */
export const CHART_EVIDENCE_STRENGTH_BY_ROUTE_DECISION: Record<
  ChartParseRouteDecision,
  ChartEvidenceStrength
> = {
  auto_match: "medium",
  user_confirm: "weak",
  visual_only: "unknown"
};

const DATA_STATUS_BY_ROUTE_DECISION: Record<ChartParseRouteDecision, ChartEvidenceDataStatus> = {
  auto_match: "parsed",
  user_confirm: "parsed_pending_confirmation",
  visual_only: "visual_reference_only"
};

const stripConfidence = <Value extends { confidence: number }>(
  item: Value
): Omit<Value, "confidence"> => {
  const { confidence: _confidence, ...rest } = item;
  return rest;
};

const buildDataPoints = (result: ChartParseResult): ChartEvidenceDataPoints => ({
  chart_type: result.chart_type.value,
  drawn_lines: result.drawn_lines.map(stripConfidence),
  end_time: result.end_time.value,
  exchange: result.exchange.value,
  indicators: result.indicators.map(stripConfidence),
  patterns: result.patterns.map(stripConfidence),
  symbol: result.symbol.value,
  timeframe: result.timeframe.value
});

const buildWarnings = (
  record: ChartParseResultRecord,
  routing: ChartParseRoutingDecision,
  repairApplied: boolean
): string[] => {
  const warnings: string[] = [];

  if (record.status === "degraded") {
    warnings.push("degraded");
  }
  if (repairApplied) {
    warnings.push("repair_applied");
  }
  if (routing.decision !== "auto_match") {
    warnings.push(routing.reason);
  }
  warnings.push("chart_time_unverified");

  return warnings;
};

export interface DeriveChartEvidenceHandoffInput {
  record: ChartParseResultRecord;
  repair_applied: boolean;
  retrieved_at: number;
  routing: ChartParseRoutingDecision | null;
}

/**
 * Pure conversion from a chart_parse_results row + routing decision into
 * the answer-layer evidence handoff (PRD Research TA evidence boundary,
 * sprint Row 4). Inputs are serializable only — record and routing never
 * carry FetchedChartImage.bytes, so pixels are unreachable by construction,
 * not by test discipline.
 *
 * Fail-closed by design: a parse_failed status, a missing routing decision,
 * or a missing result_json collapses to data_status "unavailable" with
 * evidence_candidate null. The candidate is never synthesized to fill the
 * gap.
 */
export const deriveChartEvidenceHandoff = (
  input: DeriveChartEvidenceHandoffInput
): ChartEvidenceHandoff => {
  const { record, repair_applied: repairApplied, retrieved_at: retrievedAt, routing } = input;

  if (routing === null || record.status === "parse_failed" || record.result_json === null) {
    return { data_status: "unavailable", evidence_candidate: null };
  }

  const candidate: ChartEvidenceCandidate = {
    as_of: retrievedAt,
    calibration_run_id: routing.calibration_run_id,
    calibration_status: routing.calibration_run_id === null ? "not_used" : "ready_used",
    claim_label: "inference",
    data_points: buildDataPoints(record.result_json),
    evidence_strength: CHART_EVIDENCE_STRENGTH_BY_ROUTE_DECISION[routing.decision],
    image_ref: record.image_ref,
    model_version: record.model_version,
    prompt_version: record.prompt_version,
    route_decision: routing.decision,
    route_reason: routing.reason,
    schema_version: record.schema_version,
    source_record_id: record.id,
    source_tool: "parse_chart_image",
    tenant_id: record.tenant_id,
    warnings: buildWarnings(record, routing, repairApplied)
  };

  return {
    data_status: DATA_STATUS_BY_ROUTE_DECISION[routing.decision],
    evidence_candidate: candidate
  };
};
