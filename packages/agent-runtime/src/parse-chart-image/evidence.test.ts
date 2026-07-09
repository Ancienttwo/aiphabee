import { describe, expect, it } from "vitest";
import { CHART_PARSE_CONTRACT } from "../chart-parse";
import { deriveChartEvidenceHandoff } from "./evidence";
import type { ChartParseRouteDecision, ChartParseRoutingDecision } from "./routing";
import type { ChartParseResultRecord } from "./types";
import { CLEAR_SAMPLE_RESULT } from "./test-util";

const MODEL_VERSION = "google-ai-studio/gemini-2.5-flash";
const RETRIEVED_AT = 1_700_000_000_000;

const BASE_RECORD: ChartParseResultRecord = {
  analysis_run_id: "run-1",
  calibration_run_id: null,
  error_code: null,
  id: "row-1",
  image_ref: "charts/tenant-a/img-0001",
  latency_ms: 500,
  model_version: MODEL_VERSION,
  prompt_version: CHART_PARSE_CONTRACT.promptVersion,
  result_json: CLEAR_SAMPLE_RESULT,
  schema_version: CHART_PARSE_CONTRACT.schemaVersion,
  status: "ready",
  tenant_id: "tenant-a",
  token_cost: 150
};

const routingFixture = (
  overrides: Partial<ChartParseRoutingDecision> = {}
): ChartParseRoutingDecision => ({
  calibration_run_id: null,
  confidence: 0.95,
  decision: "user_confirm",
  reason: "no_calibration_lookup",
  ...overrides
});

/** Deep-collects every leaf value so byte types can't hide inside nested objects/arrays. */
const collectLeafValues = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap(collectLeafValues);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap(collectLeafValues);
  }
  return [value];
};

describe("deriveChartEvidenceHandoff", () => {
  it("maps auto_match to parsed with medium strength and a complete candidate", () => {
    const routing = routingFixture({
      calibration_run_id: "cal-ready",
      decision: "auto_match",
      reason: "auto_match_threshold_met"
    });

    const handoff = deriveChartEvidenceHandoff({
      record: BASE_RECORD,
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing
    });

    expect(handoff.data_status).toBe("parsed");
    expect(handoff.evidence_candidate).toMatchObject({
      as_of: RETRIEVED_AT,
      calibration_run_id: "cal-ready",
      calibration_status: "ready_used",
      claim_label: "inference",
      evidence_strength: "medium",
      image_ref: BASE_RECORD.image_ref,
      model_version: BASE_RECORD.model_version,
      prompt_version: BASE_RECORD.prompt_version,
      route_decision: "auto_match",
      route_reason: "auto_match_threshold_met",
      schema_version: BASE_RECORD.schema_version,
      source_record_id: BASE_RECORD.id,
      source_tool: "parse_chart_image",
      tenant_id: BASE_RECORD.tenant_id,
      warnings: ["chart_time_unverified"]
    });
    expect(handoff.evidence_candidate?.data_points).toEqual({
      chart_type: "candlestick",
      drawn_lines: [
        {
          kind: "trendline",
          anchors: [
            { x: 0.12, y: 0.82 },
            { x: 0.91, y: 0.23 }
          ]
        }
      ],
      end_time: "2026-06-30",
      exchange: "HKEX",
      indicators: [
        { name: "RSI", params: [14] },
        { name: "MACD", params: [12, 26, 9] }
      ],
      patterns: [],
      symbol: "0700.HK",
      timeframe: "1d"
    });
  });

  it("never puts strength strong on the candidate, even for auto_match", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: BASE_RECORD,
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({ decision: "auto_match", reason: "auto_match_threshold_met" })
    });

    expect(handoff.evidence_candidate?.evidence_strength).not.toBe("strong");
  });

  it("maps user_confirm to parsed_pending_confirmation with weak strength", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: BASE_RECORD,
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({ decision: "user_confirm", reason: "threshold_user_confirm" })
    });

    expect(handoff.data_status).toBe("parsed_pending_confirmation");
    expect(handoff.evidence_candidate?.evidence_strength).toBe("weak");
    expect(handoff.evidence_candidate?.calibration_status).toBe("not_used");
  });

  it("maps visual_only to visual_reference_only with unknown strength", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: BASE_RECORD,
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({ decision: "visual_only", reason: "threshold_visual_only" })
    });

    expect(handoff.data_status).toBe("visual_reference_only");
    expect(handoff.evidence_candidate?.evidence_strength).toBe("unknown");
  });

  const NON_AUTO_REASONS: Array<{
    decision: ChartParseRouteDecision;
    reason: ChartParseRoutingDecision["reason"];
  }> = [
    { decision: "user_confirm", reason: "no_ready_calibration" },
    { decision: "user_confirm", reason: "version_mismatch" },
    { decision: "user_confirm", reason: "sample_count_below_minimum" },
    { decision: "visual_only", reason: "missing_p0_field" },
    { decision: "user_confirm", reason: "no_calibration_lookup" }
  ];

  it.each(NON_AUTO_REASONS)(
    "keeps $reason non-parsed with weak or unknown strength and surfaces the reason as a warning",
    ({ decision, reason }) => {
      const handoff = deriveChartEvidenceHandoff({
        record: BASE_RECORD,
        repair_applied: false,
        retrieved_at: RETRIEVED_AT,
        routing: routingFixture({
          confidence: reason === "missing_p0_field" ? null : 0.7,
          decision,
          reason
        })
      });

      expect(handoff.data_status).not.toBe("parsed");
      expect(["weak", "unknown"]).toContain(handoff.evidence_candidate?.evidence_strength);
      expect(handoff.evidence_candidate?.warnings).toContain(reason);
    }
  );

  it("returns unavailable with a null candidate when there is no routing decision", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: {
        ...BASE_RECORD,
        error_code: "image_not_found",
        result_json: null,
        status: "parse_failed"
      },
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: null
    });

    expect(handoff.data_status).toBe("unavailable");
    expect(handoff.evidence_candidate).toBeNull();
  });

  it("fails closed to unavailable when record.status is parse_failed even if a routing decision is present", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: { ...BASE_RECORD, result_json: null, status: "parse_failed" },
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({ decision: "auto_match", reason: "auto_match_threshold_met" })
    });

    expect(handoff.data_status).toBe("unavailable");
    expect(handoff.evidence_candidate).toBeNull();
  });

  it("fails closed to unavailable when result_json is missing even if routing is present", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: { ...BASE_RECORD, result_json: null },
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({ decision: "auto_match", reason: "auto_match_threshold_met" })
    });

    expect(handoff.data_status).toBe("unavailable");
    expect(handoff.evidence_candidate).toBeNull();
  });

  it("flags degraded status and repair_applied as warnings alongside chart_time_unverified", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: { ...BASE_RECORD, status: "degraded" },
      repair_applied: true,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({ decision: "auto_match", reason: "auto_match_threshold_met" })
    });

    expect(handoff.evidence_candidate?.warnings).toEqual([
      "degraded",
      "repair_applied",
      "chart_time_unverified"
    ]);
  });

  it("always carries chart_time_unverified since as_of is the retrieval time, not a verified chart timestamp", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: BASE_RECORD,
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({ decision: "auto_match", reason: "auto_match_threshold_met" })
    });

    expect(handoff.evidence_candidate?.warnings).toContain("chart_time_unverified");
    expect(handoff.evidence_candidate?.as_of).toBe(RETRIEVED_AT);
  });

  it("serializes the candidate without bytes, confidence, or data URIs", () => {
    const handoff = deriveChartEvidenceHandoff({
      record: BASE_RECORD,
      repair_applied: false,
      retrieved_at: RETRIEVED_AT,
      routing: routingFixture({
        calibration_run_id: "cal-ready",
        decision: "auto_match",
        reason: "auto_match_threshold_met"
      })
    });

    const serialized = JSON.stringify(handoff.evidence_candidate);
    expect(serialized).not.toContain("confidence");
    expect(serialized).not.toContain("data:image");

    const leafValues = collectLeafValues(handoff.evidence_candidate);
    expect(leafValues.some((value) => value instanceof Uint8Array || value instanceof ArrayBuffer)).toBe(
      false
    );
  });
});
