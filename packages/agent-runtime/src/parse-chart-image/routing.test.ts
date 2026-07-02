import { describe, expect, it } from "vitest";
import { CHART_PARSE_CONTRACT } from "../chart-parse";
import { routeChartParseResult, type CalibrationRunForRouting } from "./routing";
import { CLEAR_SAMPLE_RESULT } from "./test-util";

const MODEL_VERSION = "google-ai-studio/gemini-2.5-flash";

const readyCalibration = (
  overrides: Partial<CalibrationRunForRouting> = {}
): CalibrationRunForRouting => ({
  id: "cal-ready",
  model_version: MODEL_VERSION,
  prompt_version: CHART_PARSE_CONTRACT.promptVersion,
  sample_count: 50,
  schema_version: CHART_PARSE_CONTRACT.schemaVersion,
  status: "ready",
  thresholds: {
    tiers: {
      p0: {
        auto_match_min_confidence: 0.9,
        confirm_min_confidence: 0.6
      },
      p1: {
        auto_match_min_confidence: 0.8,
        confirm_min_confidence: 0.55
      },
      p2: {
        auto_match_min_confidence: 0.7,
        confirm_min_confidence: 0.5
      }
    }
  },
  ...overrides
});

describe("routeChartParseResult", () => {
  it("keeps empty calibration non-auto_match", async () => {
    const decision = await routeChartParseResult({
      calibrationLookup: { findCalibration: async () => null },
      modelVersion: MODEL_VERSION,
      result: CLEAR_SAMPLE_RESULT
    });

    expect(decision.decision).not.toBe("auto_match");
    expect(decision.calibration_run_id).toBeNull();
    expect(decision.reason).toBe("no_ready_calibration");
  });

  it("keeps superseded calibration non-auto_match", async () => {
    const decision = await routeChartParseResult({
      calibrationLookup: {
        findCalibration: async () => readyCalibration({ id: "cal-superseded", status: "superseded" })
      },
      modelVersion: MODEL_VERSION,
      result: CLEAR_SAMPLE_RESULT
    });

    expect(decision.decision).not.toBe("auto_match");
    expect(decision.calibration_run_id).toBeNull();
    expect(decision.reason).toBe("no_ready_calibration");
  });

  it("keeps schema/prompt/model version mismatches non-auto_match", async () => {
    const decision = await routeChartParseResult({
      calibrationLookup: {
        findCalibration: async () =>
          readyCalibration({
            id: "cal-wrong-version",
            model_version: "google-ai-studio/older-model"
          })
      },
      modelVersion: MODEL_VERSION,
      result: CLEAR_SAMPLE_RESULT
    });

    expect(decision.decision).not.toBe("auto_match");
    expect(decision.calibration_run_id).toBeNull();
    expect(decision.reason).toBe("version_mismatch");
  });

  it("auto-matches only when ready matching calibration thresholds are met", async () => {
    const decision = await routeChartParseResult({
      calibrationLookup: { findCalibration: async () => readyCalibration() },
      modelVersion: MODEL_VERSION,
      result: CLEAR_SAMPLE_RESULT
    });

    expect(decision).toMatchObject({
      calibration_run_id: "cal-ready",
      decision: "auto_match",
      reason: "auto_match_threshold_met"
    });
  });

  it("routes missing P0 fields to visual_only without consuming calibration", async () => {
    const decision = await routeChartParseResult({
      calibrationLookup: { findCalibration: async () => readyCalibration() },
      modelVersion: MODEL_VERSION,
      result: {
        ...CLEAR_SAMPLE_RESULT,
        symbol: { confidence: 0.2, value: null }
      }
    });

    expect(decision).toMatchObject({
      calibration_run_id: null,
      decision: "visual_only",
      reason: "missing_p0_field"
    });
  });
});
