import type { ChartParseResult } from "../chart-parse";
import { CHART_PARSE_CONTRACT } from "../chart-parse";

export type ChartParseRouteDecision = "auto_match" | "user_confirm" | "visual_only";

export type CalibrationStatus = "draft" | "ready" | "superseded";

export interface CalibrationTierThreshold {
  auto_match_min_confidence: number | null;
  confirm_min_confidence: number | null;
}

export interface CalibrationThresholds {
  tiers: {
    p0: CalibrationTierThreshold;
    p1: CalibrationTierThreshold;
    p2: CalibrationTierThreshold;
  };
}

export interface CalibrationRunForRouting {
  id: string;
  model_version: string;
  prompt_version: string;
  sample_count: number;
  schema_version: string;
  status: CalibrationStatus;
  thresholds: CalibrationThresholds | null;
}

export interface CalibrationLookupInput {
  model_version: string;
  prompt_version: string;
  schema_version: string;
}

export interface CalibrationLookup {
  findCalibration(input: CalibrationLookupInput): Promise<CalibrationRunForRouting | null>;
}

export interface ChartParseRoutingInput {
  calibrationLookup?: CalibrationLookup;
  minCalibrationSamples?: number;
  modelVersion: string;
  result: ChartParseResult;
}

export interface ChartParseRoutingDecision {
  calibration_run_id: string | null;
  confidence: number | null;
  decision: ChartParseRouteDecision;
  reason:
    | "auto_match_threshold_met"
    | "calibration_lookup_failed"
    | "missing_p0_field"
    | "no_calibration_lookup"
    | "no_ready_calibration"
    | "ready_calibration_without_thresholds"
    | "sample_count_below_minimum"
    | "threshold_user_confirm"
    | "threshold_visual_only"
    | "version_mismatch";
}

export const DEFAULT_CHART_PARSE_ROUTING_MIN_CALIBRATION_SAMPLES = 50;

const p0MinimumConfidence = (result: ChartParseResult): number | null => {
  const p0 = [result.symbol, result.exchange, result.timeframe];
  if (p0.some((field) => field.value === null)) {
    return null;
  }

  return Math.min(...p0.map((field) => field.confidence));
};

const routeWithoutCalibration = (
  confidence: number | null,
  reason: ChartParseRoutingDecision["reason"]
): ChartParseRoutingDecision => ({
  calibration_run_id: null,
  confidence,
  decision: confidence === null ? "visual_only" : "user_confirm",
  reason
});

export async function routeChartParseResult(
  input: ChartParseRoutingInput
): Promise<ChartParseRoutingDecision> {
  const confidence = p0MinimumConfidence(input.result);

  if (confidence === null) {
    return routeWithoutCalibration(null, "missing_p0_field");
  }

  if (!input.calibrationLookup) {
    return routeWithoutCalibration(confidence, "no_calibration_lookup");
  }

  let calibration: CalibrationRunForRouting | null = null;
  try {
    calibration = await input.calibrationLookup.findCalibration({
      model_version: input.modelVersion,
      prompt_version: CHART_PARSE_CONTRACT.promptVersion,
      schema_version: CHART_PARSE_CONTRACT.schemaVersion
    });
  } catch {
    return routeWithoutCalibration(confidence, "calibration_lookup_failed");
  }

  if (calibration === null || calibration.status !== "ready") {
    return routeWithoutCalibration(confidence, "no_ready_calibration");
  }

  if (
    calibration.schema_version !== CHART_PARSE_CONTRACT.schemaVersion ||
    calibration.prompt_version !== CHART_PARSE_CONTRACT.promptVersion ||
    calibration.model_version !== input.modelVersion
  ) {
    return routeWithoutCalibration(confidence, "version_mismatch");
  }

  const minSamples =
    input.minCalibrationSamples ?? DEFAULT_CHART_PARSE_ROUTING_MIN_CALIBRATION_SAMPLES;
  if (calibration.sample_count < minSamples) {
    return routeWithoutCalibration(confidence, "sample_count_below_minimum");
  }

  const p0Thresholds = calibration.thresholds?.tiers.p0;
  if (!p0Thresholds) {
    return routeWithoutCalibration(confidence, "ready_calibration_without_thresholds");
  }

  if (
    p0Thresholds.auto_match_min_confidence !== null &&
    confidence >= p0Thresholds.auto_match_min_confidence
  ) {
    return {
      calibration_run_id: calibration.id,
      confidence,
      decision: "auto_match",
      reason: "auto_match_threshold_met"
    };
  }

  if (
    p0Thresholds.confirm_min_confidence !== null &&
    confidence >= p0Thresholds.confirm_min_confidence
  ) {
    return {
      calibration_run_id: calibration.id,
      confidence,
      decision: "user_confirm",
      reason: "threshold_user_confirm"
    };
  }

  return {
    calibration_run_id: calibration.id,
    confidence,
    decision: "visual_only",
    reason: "threshold_visual_only"
  };
}
