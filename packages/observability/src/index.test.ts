import { describe, expect, it } from "vitest";
import {
  createAgentDryRunTelemetry,
  createEvalV1RunRecord,
  createEvalStoreRecord,
  createLoadDrIncidentDrillReleaseGatePlan,
  createPerformanceAvailabilityReleaseGatePlan,
  createEvalStoreTelemetrySink,
  createInMemoryEvalStore,
  createInMemoryTelemetrySink,
  createTelemetryEventId,
  getEvalV1Capabilities,
  getLoadDrIncidentDrillReleaseGateCapabilities,
  getPerformanceAvailabilityReleaseGateCapabilities,
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

  it("describes performance and availability release gate capabilities", () => {
    const capabilities = getPerformanceAvailabilityReleaseGateCapabilities();

    expect(capabilities).toMatchObject({
      event_contract: "deploy/observability/events.contract.json",
      frontend: false,
      live_apm_provider_reads: false,
      live_probe_reads: false,
      live_slo_store_writes: false,
      package: "@aiphabee/observability",
      persistent_writes: false,
      route: "POST /observability/release-gates/performance-availability/plan",
      runtime_route: "GET /observability/runtime",
      sql_emitted: false,
      status: "performance_availability_release_gate_scaffold",
      target_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
      version: "2026-06-22.phase3.performance-availability-release-gate-scaffold.v0"
    });
    expect(capabilities.targets).toMatchObject({
      core_api_availability_bps: 9990,
      mcp_tool_cold_p95_ms: 2500,
      mcp_tool_hot_p95_ms: 800,
      mcp_tool_success_rate_bps: 9950,
      simple_research_completion_p95_ms: 15000,
      web_first_token_p95_ms: 2500
    });
  });

  it("plans performance availability release gate SLO checks without live writes", () => {
    const plan = createPerformanceAvailabilityReleaseGatePlan({
      asOf: "2026-06-22T01:30:00.000Z",
      requestId: "req-performance-availability"
    });

    expect(plan).toMatchObject({
      as_of: "2026-06-22T01:30:00.000Z",
      frontend: false,
      live_apm_provider_reads: false,
      live_probe_reads: false,
      live_slo_store_writes: false,
      persistent_writes: false,
      request_id: "req-performance-availability",
      route: "POST /observability/release-gates/performance-availability/plan",
      sql_emitted: false,
      status: "planned_no_write",
      validation: {
        all_checks_passed: true,
        core_api_availability_target_met: true,
        live_release_claimed: false,
        live_writes_blocked: true,
        mcp_tool_p95_targets_met: true,
        request_id_and_route_coverage_present: true,
        simple_research_completion_p95_target_met: true,
        tool_success_rate_target_met: true,
        web_first_token_p95_target_met: true
      },
      version: "2026-06-22.phase3.performance-availability-release-gate-scaffold.v0"
    });
    expect(plan.slo_report).toMatchObject({
      prd_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
      status: "synthetic_slo_report_ready",
      window: "monthly_release_gate_fixture"
    });
    expect(plan.slo_report.route_coverage).toEqual([
      "/health",
      "/mcp",
      "/agent/runs/stream",
      "/agent/runs/plan"
    ]);
    expect(plan.slo_report.excluded_failure_categories).toEqual([
      "user_input_error",
      "authorization_denied"
    ]);
    expect(plan.slo_report.observations).toEqual([
      expect.objectContaining({
        metric_id: "core_api_availability_bps",
        observed_value: 9995,
        pass: true,
        target_value: 9990,
        unit: "basis_points"
      }),
      expect.objectContaining({
        metric_id: "mcp_tool_hot_p95_ms",
        observed_value: 720,
        pass: true,
        target_value: 800,
        unit: "milliseconds"
      }),
      expect.objectContaining({
        metric_id: "mcp_tool_cold_p95_ms",
        observed_value: 2300,
        pass: true,
        target_value: 2500
      }),
      expect.objectContaining({
        metric_id: "web_first_token_p95_ms",
        observed_value: 2100,
        pass: true,
        target_value: 2500
      }),
      expect.objectContaining({
        metric_id: "simple_research_completion_p95_ms",
        observed_value: 13500,
        pass: true,
        target_value: 15000
      }),
      expect.objectContaining({
        metric_id: "mcp_tool_success_rate_bps",
        observed_value: 9970,
        pass: true,
        target_value: 9950,
        unit: "basis_points"
      })
    ]);
    expect(plan.release_checks).toHaveLength(7);
    expect(plan.release_gate).toMatchObject({
      gate_status: "blocked_live_performance_availability_validation",
      no_live_release_claim: true
    });
    expect(plan.release_gate.blockers).toContain("live_apm_provider_missing");
  });

  it("fails performance availability release gate when SLO observations miss targets", () => {
    const plan = createPerformanceAvailabilityReleaseGatePlan({
      observations: {
        core_api_availability_bps: 9980,
        mcp_tool_hot_p95_ms: 900,
        mcp_tool_success_rate_bps: 9900,
        web_first_token_p95_ms: 3200
      },
      requestId: "req-performance-availability-fail"
    });

    expect(plan.validation.core_api_availability_target_met).toBe(false);
    expect(plan.validation.mcp_tool_p95_targets_met).toBe(false);
    expect(plan.validation.tool_success_rate_target_met).toBe(false);
    expect(plan.validation.web_first_token_p95_target_met).toBe(false);
    expect(plan.validation.all_checks_passed).toBe(false);
  });

  it("describes load, disaster recovery, and incident drill release gate capabilities", () => {
    const capabilities = getLoadDrIncidentDrillReleaseGateCapabilities();

    expect(capabilities).toMatchObject({
      event_contract: "deploy/observability/events.contract.json",
      frontend: false,
      live_incident_pager: false,
      live_load_test_runner: false,
      live_restore_execution: false,
      live_status_page_writes: false,
      package: "@aiphabee/observability",
      persistent_writes: false,
      route: "POST /observability/release-gates/load-dr-incident-drill/plan",
      runtime_route: "GET /observability/runtime",
      sql_emitted: false,
      status: "load_dr_incident_drill_release_gate_scaffold",
      target_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
      version: "2026-06-22.phase3.load-dr-incident-drill-release-gate-scaffold.v0"
    });
    expect(capabilities.targets).toEqual({
      dr_rpo_minutes: 15,
      dr_rto_minutes: 60,
      load_test_max_error_rate_bps: 50,
      load_test_min_peak_rps: 100
    });
  });

  it("plans load, disaster recovery, and incident drills without live execution", () => {
    const plan = createLoadDrIncidentDrillReleaseGatePlan({
      asOf: "2026-06-22T02:00:00.000Z",
      requestId: "req-load-dr-incident"
    });

    expect(plan).toMatchObject({
      as_of: "2026-06-22T02:00:00.000Z",
      frontend: false,
      live_incident_pager: false,
      live_load_test_runner: false,
      live_restore_execution: false,
      live_status_page_writes: false,
      persistent_writes: false,
      request_id: "req-load-dr-incident",
      route: "POST /observability/release-gates/load-dr-incident-drill/plan",
      sql_emitted: false,
      status: "planned_no_write",
      validation: {
        all_checks_passed: true,
        communications_and_status_page_drill_present: true,
        dr_restore_rpo_target_met: true,
        dr_restore_rto_target_met: true,
        failover_rollback_plan_present: true,
        incident_drill_completed: true,
        live_execution_and_persistent_writes_blocked: true,
        live_release_claimed: false,
        load_test_artifact_present: true,
        load_test_targets_met: true
      },
      version: "2026-06-22.phase3.load-dr-incident-drill-release-gate-scaffold.v0"
    });
    expect(plan.drill_report).toMatchObject({
      prd_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
      status: "synthetic_drill_report_ready",
      window: "release_gate_fixture"
    });
    expect(plan.drill_report.covered_scenarios).toEqual([
      "load_test_peak_traffic",
      "database_restore",
      "worker_failover",
      "rollback",
      "incident_response",
      "status_comms"
    ]);
    expect(plan.drill_report.evidence).toMatchObject({
      dr_rpo_minutes: 10,
      dr_rto_minutes: 45,
      load_test_error_rate_bps: 20,
      load_test_peak_rps: 120,
      measured_from: "synthetic_release_gate_fixture"
    });
    expect(plan.release_checks).toHaveLength(8);
    expect(plan.release_gate).toMatchObject({
      gate_status: "blocked_live_load_dr_incident_validation",
      no_live_release_claim: true
    });
    expect(plan.release_gate.blockers).toContain("ops_sre_product_signoff_missing");
  });

  it("fails load, disaster recovery, and incident drill gate when evidence misses targets", () => {
    const plan = createLoadDrIncidentDrillReleaseGatePlan({
      evidence: {
        communications_drill_completed: false,
        dr_rpo_minutes: 30,
        dr_rto_minutes: 90,
        incident_drill_completed: false,
        load_test_completed: false,
        load_test_error_rate_bps: 80,
        load_test_peak_rps: 80,
        restore_drill_completed: true
      },
      requestId: "req-load-dr-incident-fail"
    });

    expect(plan.validation.load_test_artifact_present).toBe(false);
    expect(plan.validation.load_test_targets_met).toBe(false);
    expect(plan.validation.dr_restore_rpo_target_met).toBe(false);
    expect(plan.validation.dr_restore_rto_target_met).toBe(false);
    expect(plan.validation.incident_drill_completed).toBe(false);
    expect(plan.validation.communications_and_status_page_drill_present).toBe(false);
    expect(plan.validation.all_checks_passed).toBe(false);
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
