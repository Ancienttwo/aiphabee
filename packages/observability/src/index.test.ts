import { describe, expect, it } from "vitest";
import {
  createAgentDryRunTelemetry,
  createEvalV1RunRecord,
  createEvalStoreRecord,
  createEvalStoreTelemetrySink,
  createInMemoryEvalStore,
  createInMemoryTelemetrySink,
  createTelemetryEventId,
  getEvalV1Capabilities,
  recordTelemetryEvents
} from "./index";

describe("observability scaffold", () => {
  it("creates audit and eval events without prompt content", () => {
    const events = createAgentDryRunTelemetry({
      environment: "test",
      maxSteps: 4,
      outcome: "success",
      requestId: "req-obs-1",
      requestedTools: ["resolve_security"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-1"
    });

    expect(events).toHaveLength(2);
    expect(events[0]?.event_type).toBe("run.audit");
    expect(events[1]?.event_type).toBe("run.eval");
    expect(JSON.stringify(events)).not.toContain("Explain 00700.HK");
    expect(events[0]?.attributes["agent.max_steps"]).toBe(4);
    expect(events[1]?.eval.eval_v1).toMatchObject({
      live_persistent_writes: false,
      status: "planned_no_write",
      version: "2026-06-21.phase1.eval-v1-wvro-scaffold.v0",
      wvro: {
        eligible: false
      }
    });
  });

  it("marks eval failure when a tool is denied", () => {
    const [, evalEvent] = createAgentDryRunTelemetry({
      deniedTools: ["sql.query"],
      environment: "test",
      maxSteps: 6,
      outcome: "rejected",
      requestId: "req-obs-2",
      requestedTools: ["sql.query"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-2"
    });

    expect(evalEvent.eval.result).toBe("fail");
    expect(evalEvent.eval.checks[0]).toMatchObject({
      name: "registered_tool_allowlist",
      status: "fail"
    });
  });

  it("records events into an in-memory sink", async () => {
    const { events, sink } = createInMemoryTelemetrySink();
    const telemetry = createAgentDryRunTelemetry({
      environment: "test",
      maxSteps: 6,
      outcome: "success",
      requestId: "req-obs-3",
      requestedTools: ["resolve_security"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-3"
    });

    await recordTelemetryEvents(sink, telemetry);

    expect(events).toHaveLength(2);
    expect(events[0]?.event_id).toBe("req-obs-3:run.audit");
  });

  it("projects run.eval events into eval store records", () => {
    const [, evalEvent] = createAgentDryRunTelemetry({
      environment: "test",
      maxSteps: 6,
      outcome: "success",
      requestId: "req-obs-4",
      requestedTools: ["resolve_security"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-4"
    });
    const record = createEvalStoreRecord(evalEvent);

    expect(record.schema_version).toBe("2026-06-20.phase0.eval-store.v0");
    expect(record.eval_v1_version).toBe("2026-06-21.phase1.eval-v1-wvro-scaffold.v0");
    expect(record.event_id).toBe("req-obs-4:run.eval");
    expect(record.check_count).toBe(3);
    expect(record.failed_check_count).toBe(0);
    expect(record.quality_metrics.map((metric) => metric.metric_id)).toEqual([
      "fact_accuracy",
      "calculation_accuracy",
      "citation_accuracy",
      "correct_refusal_rate"
    ]);
    expect(record.wvro_eligible).toBe(false);
    expect(JSON.stringify(record)).not.toContain("Explain 00700.HK");
  });

  it("writes only run.eval events to the eval store sink", async () => {
    const { records, store } = createInMemoryEvalStore();
    const telemetry = createAgentDryRunTelemetry({
      deniedTools: ["sql.query"],
      environment: "test",
      maxSteps: 6,
      outcome: "rejected",
      requestId: "req-obs-5",
      requestedTools: ["sql.query"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-5"
    });

    await recordTelemetryEvents(createEvalStoreTelemetrySink(store), telemetry);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      event_id: "req-obs-5:run.eval",
      failed_check_count: 1,
      result: "fail"
    });
  });

  it("creates stable event ids", () => {
    expect(createTelemetryEventId("req-obs-6", "run.eval")).toBe(
      "req-obs-6:run.eval"
    );
  });

  it("describes eval v1 and WVRO instrumentation capabilities", () => {
    const capabilities = getEvalV1Capabilities();

    expect(capabilities).toMatchObject({
      event_type: "run.eval",
      live_persistent_writes: false,
      status: "eval_v1_wvro_scaffold",
      unsourced_numeric_claim_target_rate: 0.001,
      version: "2026-06-21.phase1.eval-v1-wvro-scaffold.v0",
      wvro: {
        definition_source: "prd_4_3"
      }
    });
    expect(capabilities.metrics.map((metric) => metric.metric_id)).toEqual([
      "fact_accuracy",
      "calculation_accuracy",
      "citation_accuracy",
      "correct_refusal_rate"
    ]);
    expect(capabilities.wvro.high_intent_actions).toContain("save_research");
    expect(capabilities.wvro.required_criteria).toEqual([
      "financial_tool_success",
      "openable_evidence",
      "high_intent_action",
      "no_data_error_or_severe_hallucination_or_compliance_block"
    ]);
  });

  it("creates eval v1 records with quality metrics and WVRO eligibility", () => {
    const record = createEvalV1RunRecord({
      calculationAccuracy: {
        passed: 2,
        total: 2
      },
      citationAccuracy: {
        passed: 3,
        total: 3
      },
      correctRefusalRate: {
        passed: 1,
        total: 1
      },
      environment: "test",
      factAccuracy: {
        passed: 4,
        total: 4
      },
      highIntentActions: ["save_research", "continue_follow_up"],
      openableEvidenceItems: 2,
      requestId: "req-eval-v1",
      route: "/observability/eval-v1/plan",
      runId: "dry_req-eval-v1",
      successfulFinancialToolCalls: 1,
      unsourcedNumericClaims: {
        sampledAnswers: 1000,
        unsourcedClaims: 0
      },
      weekStart: "2026-06-15"
    });

    expect(record.status).toBe("planned_no_write");
    expect(record.live_persistent_writes).toBe(false);
    expect(record.quality_metrics.every((metric) => metric.status === "pass")).toBe(true);
    expect(record.unsourced_numeric_claims).toMatchObject({
      observed_rate: 0,
      status: "pass",
      target_rate: 0.001
    });
    expect(record.wvro).toMatchObject({
      definition_source: "prd_4_3",
      eligible: true,
      high_intent_actions: ["save_research", "continue_follow_up"],
      week_start: "2026-06-15"
    });
    expect(record.wvro.criteria.every((criterion) => criterion.status === "pass")).toBe(true);
  });
});
