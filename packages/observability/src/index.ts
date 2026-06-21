export const OBSERVABILITY_EVENT_VERSION = "2026-06-20.phase0.observability.v0";
export const EVAL_STORE_SCHEMA_VERSION = "2026-06-20.phase0.eval-store.v0";
export const EVAL_V1_VERSION = "2026-06-21.phase1.eval-v1-wvro-scaffold.v0";
export const PERFORMANCE_AVAILABILITY_RELEASE_GATE_VERSION =
  "2026-06-22.phase3.performance-availability-release-gate-scaffold.v0";
export const LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_VERSION =
  "2026-06-22.phase3.load-dr-incident-drill-release-gate-scaffold.v0";
export const WVRO_HIGH_INTENT_ACTIONS = [
  "save_research",
  "add_to_watchlist",
  "compare",
  "allowed_export",
  "create_alert",
  "continue_follow_up",
  "mcp_follow_up"
] as const;

export type TelemetryEventType = "run.audit" | "run.eval";
export type TelemetryOutcome = "success" | "rejected" | "error";
export type EvalV1QualityMetricId =
  | "calculation_accuracy"
  | "citation_accuracy"
  | "correct_refusal_rate"
  | "fact_accuracy";
export type EvalV1MetricStatus = "fail" | "not_applicable" | "pass" | "planned";
export type EvalV1CriterionId =
  | "financial_tool_success"
  | "openable_evidence"
  | "high_intent_action"
  | "no_data_error_or_severe_hallucination_or_compliance_block";
export type EvalV1CriterionStatus = "fail" | "pass";
export type WvroHighIntentAction = (typeof WVRO_HIGH_INTENT_ACTIONS)[number];
export type PerformanceAvailabilityMetricId =
  | "core_api_availability_bps"
  | "mcp_tool_hot_p95_ms"
  | "mcp_tool_cold_p95_ms"
  | "web_first_token_p95_ms"
  | "simple_research_completion_p95_ms"
  | "mcp_tool_success_rate_bps";
export type LoadDrIncidentScenarioId =
  | "load_test_peak_traffic"
  | "database_restore"
  | "worker_failover"
  | "rollback"
  | "incident_response"
  | "status_comms";

export const PERFORMANCE_AVAILABILITY_RELEASE_GATE_CHECKS = [
  "core_api_availability_target_met",
  "mcp_tool_p95_targets_met",
  "web_first_token_p95_target_met",
  "simple_research_completion_p95_target_met",
  "tool_success_rate_target_met",
  "slo_report_request_id_and_route_coverage_present",
  "live_apm_and_probe_writes_blocked"
] as const;
export const PERFORMANCE_AVAILABILITY_RELEASE_GATE_TABLES = [
  "core.performance_availability_release_gate",
  "audit.performance_slo_drill_event",
  "governance.performance_availability_release_gate_contract"
] as const;
export const LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_CHECKS = [
  "load_test_artifact_present",
  "load_test_targets_met",
  "dr_restore_rto_target_met",
  "dr_restore_rpo_target_met",
  "incident_drill_completed",
  "failover_rollback_plan_present",
  "communications_and_status_page_drill_present",
  "live_execution_and_persistent_writes_blocked"
] as const;
export const LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_TABLES = [
  "core.load_dr_incident_drill_release_gate",
  "audit.load_dr_incident_drill_event",
  "governance.load_dr_incident_drill_release_gate_contract"
] as const;

export interface EvalV1MetricInput {
  passed?: number;
  total?: number;
}

export interface EvalV1RunInput {
  calculationAccuracy?: EvalV1MetricInput;
  citationAccuracy?: EvalV1MetricInput;
  complianceBlocked?: boolean;
  correctRefusalRate?: EvalV1MetricInput;
  dataError?: boolean;
  environment: string;
  factAccuracy?: EvalV1MetricInput;
  highIntentActions?: WvroHighIntentAction[];
  openableEvidenceItems?: number;
  requestId: string;
  route: string;
  runId: string;
  severeHallucination?: boolean;
  successfulFinancialToolCalls?: number;
  unsourcedNumericClaims?: {
    sampledAnswers?: number;
    unsourcedClaims?: number;
  };
  weekStart?: string;
}

export interface PerformanceAvailabilityObservationInput {
  core_api_availability_bps?: number;
  mcp_tool_hot_p95_ms?: number;
  mcp_tool_cold_p95_ms?: number;
  mcp_tool_success_rate_bps?: number;
  simple_research_completion_p95_ms?: number;
  web_first_token_p95_ms?: number;
}

export interface LoadDrIncidentDrillEvidenceInput {
  communications_drill_completed?: boolean;
  dr_rpo_minutes?: number;
  dr_rto_minutes?: number;
  failover_plan_id?: string;
  incident_drill_completed?: boolean;
  load_test_artifact_id?: string;
  load_test_completed?: boolean;
  load_test_error_rate_bps?: number;
  load_test_peak_rps?: number;
  restore_drill_completed?: boolean;
  rollback_plan_id?: string;
  status_page_drill_id?: string;
}

export interface EvalV1MetricResult {
  metric_id: EvalV1QualityMetricId;
  passed: number;
  rate: number | null;
  source: "eval_set_v1";
  status: EvalV1MetricStatus;
  total: number;
}

export interface EvalV1RunRecord {
  environment: string;
  live_persistent_writes: false;
  quality_metrics: EvalV1MetricResult[];
  request_id: string;
  route: string;
  run_id: string;
  status: "planned_no_write";
  unsourced_numeric_claims: {
    observed_rate: number | null;
    sampled_answers: number;
    status: EvalV1MetricStatus;
    target_rate: 0.001;
    unsourced_claim_count: number;
  };
  version: typeof EVAL_V1_VERSION;
  wvro: {
    criteria: Array<{
      criterion_id: EvalV1CriterionId;
      evidence: boolean | number | string | string[];
      status: EvalV1CriterionStatus;
    }>;
    definition_source: "prd_4_3";
    eligible: boolean;
    high_intent_actions: WvroHighIntentAction[];
    week_start: string;
  };
}

export interface EvalV1Capabilities {
  event_type: "run.eval";
  live_persistent_writes: false;
  metrics: Array<{
    metric_id: EvalV1QualityMetricId;
    source: "eval_set_v1";
    status: "planned";
  }>;
  status: "eval_v1_wvro_scaffold";
  unsourced_numeric_claim_target_rate: 0.001;
  version: typeof EVAL_V1_VERSION;
  wvro: {
    definition_source: "prd_4_3";
    high_intent_actions: readonly WvroHighIntentAction[];
    required_criteria: readonly EvalV1CriterionId[];
  };
}

export interface PerformanceAvailabilityReleaseGateCapabilities {
  event_contract: "deploy/observability/events.contract.json";
  frontend: false;
  live_apm_provider_reads: false;
  live_probe_reads: false;
  live_slo_store_writes: false;
  package: "@aiphabee/observability";
  persistent_writes: false;
  required_checks: typeof PERFORMANCE_AVAILABILITY_RELEASE_GATE_CHECKS;
  route: "POST /observability/release-gates/performance-availability/plan";
  runtime_route: "GET /observability/runtime";
  sql_emitted: false;
  status: "performance_availability_release_gate_scaffold";
  tables: typeof PERFORMANCE_AVAILABILITY_RELEASE_GATE_TABLES;
  target_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1";
  targets: {
    core_api_availability_bps: 9990;
    mcp_tool_cold_p95_ms: 2500;
    mcp_tool_hot_p95_ms: 800;
    mcp_tool_success_rate_bps: 9950;
    simple_research_completion_p95_ms: 15000;
    web_first_token_p95_ms: 2500;
  };
  version: typeof PERFORMANCE_AVAILABILITY_RELEASE_GATE_VERSION;
}

export interface LoadDrIncidentDrillReleaseGateCapabilities {
  event_contract: "deploy/observability/events.contract.json";
  frontend: false;
  live_incident_pager: false;
  live_load_test_runner: false;
  live_restore_execution: false;
  live_status_page_writes: false;
  package: "@aiphabee/observability";
  persistent_writes: false;
  required_checks: typeof LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_CHECKS;
  route: "POST /observability/release-gates/load-dr-incident-drill/plan";
  runtime_route: "GET /observability/runtime";
  sql_emitted: false;
  status: "load_dr_incident_drill_release_gate_scaffold";
  tables: typeof LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_TABLES;
  target_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1";
  targets: {
    dr_rpo_minutes: 15;
    dr_rto_minutes: 60;
    load_test_max_error_rate_bps: 50;
    load_test_min_peak_rps: 100;
  };
  version: typeof LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_VERSION;
}

export interface TelemetryEventBase {
  attributes: Record<string, boolean | number | string>;
  emitted_at: string;
  environment: string;
  event_id: string;
  event_type: TelemetryEventType;
  event_version: typeof OBSERVABILITY_EVENT_VERSION;
  outcome: TelemetryOutcome;
  request_id: string;
  route: string;
  run_id: string;
  service: "aiphabee-worker";
}

export type AuditToolCallStatus = "planned_no_execution" | "denied_pre_execution";

export interface AuditToolVersion {
  tool_name: string;
  tool_version: string;
}

export interface AuditToolCallTelemetry extends AuditToolVersion {
  data_version: string;
  estimated_cost_usd: number;
  input_tokens: number;
  latency_ms: number;
  methodology_version: string;
  model_id: string;
  model_provider: "not_configured";
  model_version: string;
  output_hash: string;
  output_tokens: number;
  status: AuditToolCallStatus;
  total_tokens: number;
}

export interface AuditTelemetryEvent extends TelemetryEventBase {
  audit: {
    credits: number;
    data_version: string;
    denied_tools: string[];
    estimated_cost_usd: number;
    input_tokens: number;
    latency_ms: number;
    methodology_version: string;
    model_calls: boolean;
    model_id: string;
    model_provider: "not_configured";
    model_tier: string;
    model_version: string;
    output_hash: string;
    output_tokens: number;
    requested_tools: string[];
    tool_call_count: number;
    tool_calls: AuditToolCallTelemetry[];
    tool_versions: AuditToolVersion[];
    total_tokens: number;
    user_id: string;
    workspace_id: string;
  };
  event_type: "run.audit";
}

export interface EvalTelemetryEvent extends TelemetryEventBase {
  eval: {
    checks: Array<{
      name: string;
      status: "pass" | "fail" | "not_applicable";
    }>;
    evidence_binding: "not_applicable" | "pending" | "pass" | "fail";
    eval_v1: EvalV1RunRecord;
    result: "pass" | "fail" | "not_applicable";
  };
  event_type: "run.eval";
}

export type TelemetryEvent = AuditTelemetryEvent | EvalTelemetryEvent;

export interface AgentDryRunTelemetryInput {
  dataVersion?: string;
  deniedTools?: string[];
  environment: string;
  estimatedCostUsd?: number;
  inputTokens?: number;
  latencyMs?: number;
  maxSteps: number;
  methodologyVersion?: string;
  modelId?: string;
  modelTier?: string;
  modelVersion?: string;
  outcome: TelemetryOutcome;
  outputHash?: string;
  outputTokens?: number;
  requestId: string;
  requestedTools: string[];
  route: string;
  runId: string;
  toolVersions?: AuditToolVersion[];
  userId?: string;
  workspaceId?: string;
}

export interface PerformanceAvailabilityReleaseGatePlanInput {
  asOf?: string;
  observations?: PerformanceAvailabilityObservationInput;
  requestId: string;
}

export interface LoadDrIncidentDrillReleaseGatePlanInput {
  asOf?: string;
  evidence?: LoadDrIncidentDrillEvidenceInput;
  requestId: string;
}

export interface PerformanceAvailabilityMetricObservation {
  comparator: "at_least" | "at_most";
  measured_from: "synthetic_release_gate_fixture";
  metric_id: PerformanceAvailabilityMetricId;
  observed_value: number;
  pass: boolean;
  target_value: number;
  unit: "basis_points" | "milliseconds";
}

export interface PerformanceAvailabilityReleaseGatePlan {
  as_of: string;
  capability: PerformanceAvailabilityReleaseGateCapabilities;
  frontend: false;
  live_apm_provider_reads: false;
  live_probe_reads: false;
  live_slo_store_writes: false;
  persistent_writes: false;
  release_checks: Array<{
    check: (typeof PERFORMANCE_AVAILABILITY_RELEASE_GATE_CHECKS)[number];
    evidence: string;
    status: "planned_no_write";
  }>;
  release_gate: {
    blockers: readonly [
      "live_apm_provider_missing",
      "live_probe_scheduler_missing",
      "slo_metric_store_missing",
      "load_test_run_artifact_missing",
      "frontend_first_token_live_measurement_missing",
      "ops_sre_signoff_missing"
    ];
    gate_status: "blocked_live_performance_availability_validation";
    no_live_release_claim: true;
    required_signoffs: readonly ["ops", "sre", "product"];
  };
  request_id: string;
  route: "POST /observability/release-gates/performance-availability/plan";
  slo_report: {
    excluded_failure_categories: readonly ["user_input_error", "authorization_denied"];
    observations: readonly [
      PerformanceAvailabilityMetricObservation,
      PerformanceAvailabilityMetricObservation,
      PerformanceAvailabilityMetricObservation,
      PerformanceAvailabilityMetricObservation,
      PerformanceAvailabilityMetricObservation,
      PerformanceAvailabilityMetricObservation
    ];
    prd_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1";
    route_coverage: readonly [
      "/health",
      "/mcp",
      "/agent/runs/stream",
      "/agent/runs/plan"
    ];
    status: "synthetic_slo_report_ready";
    window: "monthly_release_gate_fixture";
  };
  sql_emitted: false;
  status: "planned_no_write";
  tables: typeof PERFORMANCE_AVAILABILITY_RELEASE_GATE_TABLES;
  validation: {
    all_checks_passed: boolean;
    core_api_availability_target_met: boolean;
    live_release_claimed: false;
    live_writes_blocked: boolean;
    mcp_tool_p95_targets_met: boolean;
    request_id_and_route_coverage_present: boolean;
    simple_research_completion_p95_target_met: boolean;
    tool_success_rate_target_met: boolean;
    web_first_token_p95_target_met: boolean;
  };
  version: typeof PERFORMANCE_AVAILABILITY_RELEASE_GATE_VERSION;
}

export interface LoadDrIncidentDrillEvidence {
  communications_drill_completed: boolean;
  dr_rpo_minutes: number;
  dr_rpo_target_minutes: 15;
  dr_rto_minutes: number;
  dr_rto_target_minutes: 60;
  failover_plan_id: string;
  incident_drill_completed: boolean;
  load_test_artifact_id: string;
  load_test_completed: boolean;
  load_test_error_rate_bps: number;
  load_test_max_error_rate_bps: 50;
  load_test_min_peak_rps: 100;
  load_test_peak_rps: number;
  measured_from: "synthetic_release_gate_fixture";
  restore_drill_completed: boolean;
  rollback_plan_id: string;
  status_page_drill_id: string;
}

export interface LoadDrIncidentDrillReleaseGatePlan {
  as_of: string;
  capability: LoadDrIncidentDrillReleaseGateCapabilities;
  drill_report: {
    covered_scenarios: readonly LoadDrIncidentScenarioId[];
    evidence: LoadDrIncidentDrillEvidence;
    prd_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1";
    status: "synthetic_drill_report_ready";
    window: "release_gate_fixture";
  };
  frontend: false;
  live_incident_pager: false;
  live_load_test_runner: false;
  live_restore_execution: false;
  live_status_page_writes: false;
  persistent_writes: false;
  release_checks: Array<{
    check: (typeof LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_CHECKS)[number];
    evidence: string;
    status: "planned_no_write";
  }>;
  release_gate: {
    blockers: readonly [
      "live_load_test_artifact_missing",
      "live_dr_restore_evidence_missing",
      "live_failover_execution_missing",
      "live_incident_drill_evidence_missing",
      "live_status_page_drill_missing",
      "ops_sre_product_signoff_missing"
    ];
    gate_status: "blocked_live_load_dr_incident_validation";
    no_live_release_claim: true;
    required_signoffs: readonly ["ops", "sre", "product"];
  };
  request_id: string;
  route: "POST /observability/release-gates/load-dr-incident-drill/plan";
  sql_emitted: false;
  status: "planned_no_write";
  tables: typeof LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_TABLES;
  validation: {
    all_checks_passed: boolean;
    communications_and_status_page_drill_present: boolean;
    dr_restore_rpo_target_met: boolean;
    dr_restore_rto_target_met: boolean;
    failover_rollback_plan_present: boolean;
    incident_drill_completed: boolean;
    live_execution_and_persistent_writes_blocked: boolean;
    live_release_claimed: false;
    load_test_artifact_present: boolean;
    load_test_targets_met: boolean;
  };
  version: typeof LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_VERSION;
}

export interface TelemetrySink {
  record(event: TelemetryEvent): Promise<void> | void;
}

export interface EvalStoreRecord {
  check_count: number;
  checks: EvalTelemetryEvent["eval"]["checks"];
  emitted_at: string;
  environment: string;
  event_id: string;
  event_version: typeof OBSERVABILITY_EVENT_VERSION;
  evidence_binding: EvalTelemetryEvent["eval"]["evidence_binding"];
  eval_v1_version: typeof EVAL_V1_VERSION;
  failed_check_count: number;
  high_intent_actions: WvroHighIntentAction[];
  outcome: TelemetryOutcome;
  quality_metrics: EvalV1MetricResult[];
  request_id: string;
  result: EvalTelemetryEvent["eval"]["result"];
  route: string;
  run_id: string;
  schema_version: typeof EVAL_STORE_SCHEMA_VERSION;
  service: "aiphabee-worker";
  wvro_eligible: boolean;
  wvro_week_start: string;
}

export interface EvalStore {
  write(record: EvalStoreRecord): Promise<void> | void;
}

export interface TelemetryLogger {
  info(message: string): void;
}

export function createAgentDryRunTelemetry(
  input: AgentDryRunTelemetryInput
): [AuditTelemetryEvent, EvalTelemetryEvent] {
  const now = new Date().toISOString();
  const deniedTools = input.deniedTools ?? [];
  const dataVersion = input.dataVersion ?? "agent-runtime-scaffold-v0";
  const methodologyVersion = input.methodologyVersion ?? dataVersion;
  const inputTokens = normalizeNonNegativeInteger(input.inputTokens);
  const outputTokens = normalizeNonNegativeInteger(input.outputTokens);
  const totalTokens = inputTokens + outputTokens;
  const estimatedCostUsd = normalizeNonNegativeNumber(input.estimatedCostUsd);
  const latencyMs = normalizeNonNegativeInteger(input.latencyMs);
  const modelId = input.modelId ?? "dry_run_no_model";
  const modelTier = input.modelTier ?? "dry_run";
  const modelVersion = input.modelVersion ?? "dry_run_no_model_provider";
  const userId = input.userId ?? "user_local_dry_run";
  const workspaceId = input.workspaceId ?? "workspace_local_dry_run";
  const outputHash =
    input.outputHash ??
    createStableAuditHash([
      input.route,
      input.runId,
      input.outcome,
      input.requestedTools.join(","),
      deniedTools.join(",")
    ]);
  const toolVersions = createAuditToolVersions(
    input.requestedTools,
    input.toolVersions,
    deniedTools
  );
  const toolCalls = createAuditToolCalls({
    dataVersion,
    deniedTools,
    estimatedCostUsd,
    inputTokens,
    latencyMs,
    methodologyVersion,
    modelId,
    modelVersion,
    outputTokens,
    toolVersions,
    totalTokens
  });
  const evalV1 = createEvalV1RunRecord({
    environment: input.environment,
    highIntentActions: [],
    openableEvidenceItems: 0,
    requestId: input.requestId,
    route: input.route,
    runId: input.runId,
    successfulFinancialToolCalls: 0
  });
  const base: Omit<TelemetryEventBase, "event_id" | "event_type"> = {
    attributes: {
      "ai.model_provider_configured": false,
      "agent.max_steps": input.maxSteps,
      "agent.model_calls": false,
      "agent.requested_tool_count": input.requestedTools.length,
      "agent.tool_denied_count": deniedTools.length,
      "agent.tool_version_count": toolVersions.length,
      "audit.estimated_cost_usd": estimatedCostUsd,
      "audit.input_tokens": inputTokens,
      "audit.latency_ms": latencyMs,
      "audit.output_tokens": outputTokens,
      "audit.total_tokens": totalTokens
    },
    emitted_at: now,
    environment: input.environment,
    event_version: OBSERVABILITY_EVENT_VERSION,
    outcome: input.outcome,
    request_id: input.requestId,
    route: input.route,
    run_id: input.runId,
    service: "aiphabee-worker" as const
  };

  return [
    {
      ...base,
      audit: {
        credits: 0,
        data_version: dataVersion,
        denied_tools: deniedTools,
        estimated_cost_usd: estimatedCostUsd,
        input_tokens: inputTokens,
        latency_ms: latencyMs,
        methodology_version: methodologyVersion,
        model_calls: false,
        model_id: modelId,
        model_provider: "not_configured",
        model_tier: modelTier,
        model_version: modelVersion,
        output_hash: outputHash,
        output_tokens: outputTokens,
        requested_tools: input.requestedTools,
        tool_call_count: toolCalls.length,
        tool_calls: toolCalls,
        tool_versions: toolVersions,
        total_tokens: totalTokens,
        user_id: userId,
        workspace_id: workspaceId
      },
      event_id: createTelemetryEventId(input.requestId, "run.audit"),
      event_type: "run.audit"
    },
    {
      ...base,
      eval: {
        checks: [
          {
            name: "registered_tool_allowlist",
            status: deniedTools.length === 0 ? "pass" : "fail"
          },
          {
            name: "model_call_blocked",
            status: "pass"
          },
          {
            name: "evidence_binding",
            status: "not_applicable"
          }
        ],
        evidence_binding: "not_applicable",
        eval_v1: evalV1,
        result: input.outcome === "success" ? "pass" : "fail"
      },
      event_id: createTelemetryEventId(input.requestId, "run.eval"),
      event_type: "run.eval"
    }
  ];
}

function createAuditToolVersions(
  requestedTools: string[],
  inputToolVersions: AuditToolVersion[] | undefined,
  deniedTools: string[]
): AuditToolVersion[] {
  const providedVersions = new Map(
    (inputToolVersions ?? []).map((tool) => [tool.tool_name, tool.tool_version])
  );
  const deniedToolSet = new Set(deniedTools);

  return requestedTools.map((toolName) => ({
    tool_name: toolName,
    tool_version:
      providedVersions.get(toolName) ??
      (deniedToolSet.has(toolName) ? "unregistered" : "unknown")
  }));
}

function createAuditToolCalls(input: {
  dataVersion: string;
  deniedTools: string[];
  estimatedCostUsd: number;
  inputTokens: number;
  latencyMs: number;
  methodologyVersion: string;
  modelId: string;
  modelVersion: string;
  outputTokens: number;
  toolVersions: AuditToolVersion[];
  totalTokens: number;
}): AuditToolCallTelemetry[] {
  const deniedToolSet = new Set(input.deniedTools);

  return input.toolVersions.map((tool) => {
    const status: AuditToolCallStatus = deniedToolSet.has(tool.tool_name)
      ? "denied_pre_execution"
      : "planned_no_execution";

    return {
      ...tool,
      data_version: input.dataVersion,
      estimated_cost_usd: status === "denied_pre_execution" ? 0 : input.estimatedCostUsd,
      input_tokens: status === "denied_pre_execution" ? 0 : input.inputTokens,
      latency_ms: status === "denied_pre_execution" ? 0 : input.latencyMs,
      methodology_version: input.methodologyVersion,
      model_id: input.modelId,
      model_provider: "not_configured",
      model_version: input.modelVersion,
      output_hash: createStableAuditHash([
        tool.tool_name,
        tool.tool_version,
        input.dataVersion,
        status
      ]),
      output_tokens: status === "denied_pre_execution" ? 0 : input.outputTokens,
      status,
      total_tokens: status === "denied_pre_execution" ? 0 : input.totalTokens
    };
  });
}

function createStableAuditHash(parts: readonly string[]): string {
  let hash = 0x811c9dc5;
  const value = parts.join("|");

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}

function normalizeNonNegativeInteger(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizeNonNegativeNumber(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

export async function recordTelemetryEvents(
  sink: TelemetrySink,
  events: TelemetryEvent[]
): Promise<void> {
  for (const event of events) {
    await sink.record(event);
  }
}

export function createConsoleTelemetrySink(logger: TelemetryLogger): TelemetrySink {
  return {
    record(event) {
      logger.info(JSON.stringify(event));
    }
  };
}

export function createInMemoryTelemetrySink() {
  const events: TelemetryEvent[] = [];

  return {
    events,
    sink: {
      record(event: TelemetryEvent) {
        events.push(event);
      }
    } satisfies TelemetrySink
  };
}

export function createEvalStoreRecord(event: EvalTelemetryEvent): EvalStoreRecord {
  const failedChecks = event.eval.checks.filter((check) => check.status === "fail");

  return {
    check_count: event.eval.checks.length,
    checks: event.eval.checks,
    emitted_at: event.emitted_at,
    environment: event.environment,
    event_id: event.event_id,
    event_version: event.event_version,
    evidence_binding: event.eval.evidence_binding,
    eval_v1_version: event.eval.eval_v1.version,
    failed_check_count: failedChecks.length,
    high_intent_actions: event.eval.eval_v1.wvro.high_intent_actions,
    outcome: event.outcome,
    quality_metrics: event.eval.eval_v1.quality_metrics,
    request_id: event.request_id,
    result: event.eval.result,
    route: event.route,
    run_id: event.run_id,
    schema_version: EVAL_STORE_SCHEMA_VERSION,
    service: event.service,
    wvro_eligible: event.eval.eval_v1.wvro.eligible,
    wvro_week_start: event.eval.eval_v1.wvro.week_start
  };
}

export function createEvalStoreTelemetrySink(store: EvalStore): TelemetrySink {
  return {
    async record(event) {
      if (event.event_type !== "run.eval") {
        return;
      }

      await store.write(createEvalStoreRecord(event));
    }
  };
}

export function createInMemoryEvalStore() {
  const records: EvalStoreRecord[] = [];

  return {
    records,
    store: {
      write(record: EvalStoreRecord) {
        records.push(record);
      }
    } satisfies EvalStore
  };
}

export function createTelemetryEventId(
  requestId: string,
  eventType: TelemetryEventType
): string {
  return `${requestId}:${eventType}`;
}

export function getPerformanceAvailabilityReleaseGateCapabilities(): PerformanceAvailabilityReleaseGateCapabilities {
  return {
    event_contract: "deploy/observability/events.contract.json",
    frontend: false,
    live_apm_provider_reads: false,
    live_probe_reads: false,
    live_slo_store_writes: false,
    package: "@aiphabee/observability",
    persistent_writes: false,
    required_checks: PERFORMANCE_AVAILABILITY_RELEASE_GATE_CHECKS,
    route: "POST /observability/release-gates/performance-availability/plan",
    runtime_route: "GET /observability/runtime",
    sql_emitted: false,
    status: "performance_availability_release_gate_scaffold",
    tables: PERFORMANCE_AVAILABILITY_RELEASE_GATE_TABLES,
    target_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
    targets: {
      core_api_availability_bps: 9990,
      mcp_tool_cold_p95_ms: 2500,
      mcp_tool_hot_p95_ms: 800,
      mcp_tool_success_rate_bps: 9950,
      simple_research_completion_p95_ms: 15000,
      web_first_token_p95_ms: 2500
    },
    version: PERFORMANCE_AVAILABILITY_RELEASE_GATE_VERSION
  };
}

export function getLoadDrIncidentDrillReleaseGateCapabilities(): LoadDrIncidentDrillReleaseGateCapabilities {
  return {
    event_contract: "deploy/observability/events.contract.json",
    frontend: false,
    live_incident_pager: false,
    live_load_test_runner: false,
    live_restore_execution: false,
    live_status_page_writes: false,
    package: "@aiphabee/observability",
    persistent_writes: false,
    required_checks: LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_CHECKS,
    route: "POST /observability/release-gates/load-dr-incident-drill/plan",
    runtime_route: "GET /observability/runtime",
    sql_emitted: false,
    status: "load_dr_incident_drill_release_gate_scaffold",
    tables: LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_TABLES,
    target_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
    targets: {
      dr_rpo_minutes: 15,
      dr_rto_minutes: 60,
      load_test_max_error_rate_bps: 50,
      load_test_min_peak_rps: 100
    },
    version: LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_VERSION
  };
}

export function getEvalV1Capabilities(): EvalV1Capabilities {
  return {
    event_type: "run.eval",
    live_persistent_writes: false,
    metrics: [
      {
        metric_id: "fact_accuracy",
        source: "eval_set_v1",
        status: "planned"
      },
      {
        metric_id: "calculation_accuracy",
        source: "eval_set_v1",
        status: "planned"
      },
      {
        metric_id: "citation_accuracy",
        source: "eval_set_v1",
        status: "planned"
      },
      {
        metric_id: "correct_refusal_rate",
        source: "eval_set_v1",
        status: "planned"
      }
    ],
    status: "eval_v1_wvro_scaffold",
    unsourced_numeric_claim_target_rate: 0.001,
    version: EVAL_V1_VERSION,
    wvro: {
      definition_source: "prd_4_3",
      high_intent_actions: WVRO_HIGH_INTENT_ACTIONS,
      required_criteria: [
        "financial_tool_success",
        "openable_evidence",
        "high_intent_action",
        "no_data_error_or_severe_hallucination_or_compliance_block"
      ]
    }
  };
}

export function createPerformanceAvailabilityReleaseGatePlan(
  input: PerformanceAvailabilityReleaseGatePlanInput
): PerformanceAvailabilityReleaseGatePlan {
  const requestId = normalizeIdentifier(input.requestId, "request_unattributed");
  const asOf = input.asOf ?? "runtime_as_of_unresolved";
  const capability = getPerformanceAvailabilityReleaseGateCapabilities();
  const observations = createPerformanceAvailabilityObservations(input.observations);
  const byMetric = new Map(observations.map((observation) => [observation.metric_id, observation]));
  const validation = {
    core_api_availability_target_met:
      byMetric.get("core_api_availability_bps")?.pass === true,
    live_writes_blocked: true,
    mcp_tool_p95_targets_met:
      byMetric.get("mcp_tool_hot_p95_ms")?.pass === true &&
      byMetric.get("mcp_tool_cold_p95_ms")?.pass === true,
    request_id_and_route_coverage_present:
      requestId.length > 0 &&
      observations.every((observation) => observation.metric_id.length > 0) &&
      ["/health", "/mcp", "/agent/runs/stream", "/agent/runs/plan"].length === 4,
    simple_research_completion_p95_target_met:
      byMetric.get("simple_research_completion_p95_ms")?.pass === true,
    tool_success_rate_target_met:
      byMetric.get("mcp_tool_success_rate_bps")?.pass === true,
    web_first_token_p95_target_met:
      byMetric.get("web_first_token_p95_ms")?.pass === true
  };
  const allChecksPassed = Object.values(validation).every(Boolean);
  const releaseChecks = PERFORMANCE_AVAILABILITY_RELEASE_GATE_CHECKS.map((check) => ({
    check,
    evidence:
      check === "core_api_availability_target_met"
        ? "synthetic /health monthly availability observation is at least 99.9%"
        : check === "mcp_tool_p95_targets_met"
          ? "synthetic MCP hot-path and cold/complex tool P95 observations are within PRD §12.1 thresholds"
          : check === "web_first_token_p95_target_met"
            ? "synthetic Web first-token P95 observation is below 2.5 seconds"
            : check === "simple_research_completion_p95_target_met"
              ? "synthetic simple research completion P95 observation is below 15 seconds"
              : check === "tool_success_rate_target_met"
                ? "synthetic MCP tool success-rate observation excludes user-input and authorization errors and stays above 99.5%"
                : check === "slo_report_request_id_and_route_coverage_present"
                  ? "SLO report carries request_id and covers /health, /mcp, /agent/runs/stream, and /agent/runs/plan"
                  : "live APM/provider reads, probes, SLO store writes, SQL, and persistent writes remain disabled",
    status: "planned_no_write" as const
  }));

  return {
    as_of: asOf,
    capability,
    frontend: false,
    live_apm_provider_reads: false,
    live_probe_reads: false,
    live_slo_store_writes: false,
    persistent_writes: false,
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_apm_provider_missing",
        "live_probe_scheduler_missing",
        "slo_metric_store_missing",
        "load_test_run_artifact_missing",
        "frontend_first_token_live_measurement_missing",
        "ops_sre_signoff_missing"
      ],
      gate_status: "blocked_live_performance_availability_validation",
      no_live_release_claim: true,
      required_signoffs: ["ops", "sre", "product"]
    },
    request_id: requestId,
    route: "POST /observability/release-gates/performance-availability/plan",
    slo_report: {
      excluded_failure_categories: ["user_input_error", "authorization_denied"],
      observations,
      prd_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
      route_coverage: ["/health", "/mcp", "/agent/runs/stream", "/agent/runs/plan"],
      status: "synthetic_slo_report_ready",
      window: "monthly_release_gate_fixture"
    },
    sql_emitted: false,
    status: "planned_no_write",
    tables: PERFORMANCE_AVAILABILITY_RELEASE_GATE_TABLES,
    validation: {
      ...validation,
      all_checks_passed: allChecksPassed,
      live_release_claimed: false
    },
    version: PERFORMANCE_AVAILABILITY_RELEASE_GATE_VERSION
  };
}

export function createLoadDrIncidentDrillReleaseGatePlan(
  input: LoadDrIncidentDrillReleaseGatePlanInput
): LoadDrIncidentDrillReleaseGatePlan {
  const requestId = normalizeIdentifier(input.requestId, "request_unattributed");
  const asOf = input.asOf ?? "runtime_as_of_unresolved";
  const capability = getLoadDrIncidentDrillReleaseGateCapabilities();
  const evidence = createLoadDrIncidentDrillEvidence(input.evidence);
  const validation = {
    communications_and_status_page_drill_present:
      evidence.communications_drill_completed && evidence.status_page_drill_id.length > 0,
    dr_restore_rpo_target_met:
      evidence.restore_drill_completed &&
      evidence.dr_rpo_minutes <= evidence.dr_rpo_target_minutes,
    dr_restore_rto_target_met:
      evidence.restore_drill_completed &&
      evidence.dr_rto_minutes <= evidence.dr_rto_target_minutes,
    failover_rollback_plan_present:
      evidence.failover_plan_id.length > 0 && evidence.rollback_plan_id.length > 0,
    incident_drill_completed: evidence.incident_drill_completed,
    live_execution_and_persistent_writes_blocked: true,
    load_test_artifact_present:
      evidence.load_test_completed && evidence.load_test_artifact_id.length > 0,
    load_test_targets_met:
      evidence.load_test_completed &&
      evidence.load_test_peak_rps >= evidence.load_test_min_peak_rps &&
      evidence.load_test_error_rate_bps <= evidence.load_test_max_error_rate_bps
  };
  const allChecksPassed = Object.values(validation).every(Boolean);
  const releaseChecks = LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_CHECKS.map((check) => ({
    check,
    evidence:
      check === "load_test_artifact_present"
        ? "synthetic load-test artifact id and completion flag are present"
        : check === "load_test_targets_met"
          ? "synthetic peak traffic RPS and error-rate observations meet PRD §12.1 release thresholds"
          : check === "dr_restore_rto_target_met"
            ? "synthetic database restore drill RTO is within the 60 minute release target"
            : check === "dr_restore_rpo_target_met"
              ? "synthetic database restore drill RPO is within the 15 minute release target"
              : check === "incident_drill_completed"
                ? "synthetic incident response tabletop drill is marked completed"
                : check === "failover_rollback_plan_present"
                  ? "synthetic worker failover and release rollback plan ids are present"
                  : check === "communications_and_status_page_drill_present"
                    ? "synthetic status-page and stakeholder communication drill evidence is present"
                    : "live load runner, restore execution, incident pager, status-page writes, SQL, and persistent writes remain disabled",
    status: "planned_no_write" as const
  }));

  return {
    as_of: asOf,
    capability,
    drill_report: {
      covered_scenarios: [
        "load_test_peak_traffic",
        "database_restore",
        "worker_failover",
        "rollback",
        "incident_response",
        "status_comms"
      ],
      evidence,
      prd_source: "docs/researches/AiphaBee_PRD_v1.0.md#12.1",
      status: "synthetic_drill_report_ready",
      window: "release_gate_fixture"
    },
    frontend: false,
    live_incident_pager: false,
    live_load_test_runner: false,
    live_restore_execution: false,
    live_status_page_writes: false,
    persistent_writes: false,
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_load_test_artifact_missing",
        "live_dr_restore_evidence_missing",
        "live_failover_execution_missing",
        "live_incident_drill_evidence_missing",
        "live_status_page_drill_missing",
        "ops_sre_product_signoff_missing"
      ],
      gate_status: "blocked_live_load_dr_incident_validation",
      no_live_release_claim: true,
      required_signoffs: ["ops", "sre", "product"]
    },
    request_id: requestId,
    route: "POST /observability/release-gates/load-dr-incident-drill/plan",
    sql_emitted: false,
    status: "planned_no_write",
    tables: LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_TABLES,
    validation: {
      ...validation,
      all_checks_passed: allChecksPassed,
      live_release_claimed: false
    },
    version: LOAD_DR_INCIDENT_DRILL_RELEASE_GATE_VERSION
  };
}

export function createEvalV1RunRecord(input: EvalV1RunInput): EvalV1RunRecord {
  const highIntentActions = normalizeHighIntentActions(input.highIntentActions);
  const successfulFinancialToolCalls = normalizeCount(input.successfulFinancialToolCalls);
  const openableEvidenceItems = normalizeCount(input.openableEvidenceItems);
  const dataError = input.dataError ?? false;
  const severeHallucination = input.severeHallucination ?? false;
  const complianceBlocked = input.complianceBlocked ?? false;
  const qualityBlockClear = !dataError && !severeHallucination && !complianceBlocked;
  const criteria: EvalV1RunRecord["wvro"]["criteria"] = [
    {
      criterion_id: "financial_tool_success",
      evidence: successfulFinancialToolCalls,
      status: successfulFinancialToolCalls > 0 ? "pass" : "fail"
    },
    {
      criterion_id: "openable_evidence",
      evidence: openableEvidenceItems,
      status: openableEvidenceItems > 0 ? "pass" : "fail"
    },
    {
      criterion_id: "high_intent_action",
      evidence: highIntentActions,
      status: highIntentActions.length > 0 ? "pass" : "fail"
    },
    {
      criterion_id: "no_data_error_or_severe_hallucination_or_compliance_block",
      evidence: qualityBlockClear,
      status: qualityBlockClear ? "pass" : "fail"
    }
  ];

  return {
    environment: input.environment,
    live_persistent_writes: false,
    quality_metrics: [
      createQualityMetric("fact_accuracy", input.factAccuracy),
      createQualityMetric("calculation_accuracy", input.calculationAccuracy),
      createQualityMetric("citation_accuracy", input.citationAccuracy),
      createQualityMetric("correct_refusal_rate", input.correctRefusalRate)
    ],
    request_id: input.requestId,
    route: input.route,
    run_id: input.runId,
    status: "planned_no_write",
    unsourced_numeric_claims: createUnsourcedNumericClaimMetric(input.unsourcedNumericClaims),
    version: EVAL_V1_VERSION,
    wvro: {
      criteria,
      definition_source: "prd_4_3",
      eligible: criteria.every((criterion) => criterion.status === "pass"),
      high_intent_actions: highIntentActions,
      week_start: input.weekStart ?? createUtcWeekStart()
    }
  };
}

function createPerformanceAvailabilityObservations(
  input: PerformanceAvailabilityObservationInput | undefined
): PerformanceAvailabilityReleaseGatePlan["slo_report"]["observations"] {
  return [
    createPerformanceObservation(
      "core_api_availability_bps",
      input?.core_api_availability_bps,
      9995,
      9990,
      "at_least",
      "basis_points"
    ),
    createPerformanceObservation(
      "mcp_tool_hot_p95_ms",
      input?.mcp_tool_hot_p95_ms,
      720,
      800,
      "at_most",
      "milliseconds"
    ),
    createPerformanceObservation(
      "mcp_tool_cold_p95_ms",
      input?.mcp_tool_cold_p95_ms,
      2300,
      2500,
      "at_most",
      "milliseconds"
    ),
    createPerformanceObservation(
      "web_first_token_p95_ms",
      input?.web_first_token_p95_ms,
      2100,
      2500,
      "at_most",
      "milliseconds"
    ),
    createPerformanceObservation(
      "simple_research_completion_p95_ms",
      input?.simple_research_completion_p95_ms,
      13500,
      15000,
      "at_most",
      "milliseconds"
    ),
    createPerformanceObservation(
      "mcp_tool_success_rate_bps",
      input?.mcp_tool_success_rate_bps,
      9970,
      9950,
      "at_least",
      "basis_points"
    )
  ];
}

function createPerformanceObservation(
  metricId: PerformanceAvailabilityMetricId,
  inputValue: number | undefined,
  defaultValue: number,
  targetValue: number,
  comparator: PerformanceAvailabilityMetricObservation["comparator"],
  unit: PerformanceAvailabilityMetricObservation["unit"]
): PerformanceAvailabilityMetricObservation {
  const observedValue = normalizeNumericObservation(inputValue, defaultValue);

  return {
    comparator,
    measured_from: "synthetic_release_gate_fixture",
    metric_id: metricId,
    observed_value: observedValue,
    pass: comparator === "at_least" ? observedValue >= targetValue : observedValue <= targetValue,
    target_value: targetValue,
    unit
  };
}

function createLoadDrIncidentDrillEvidence(
  input: LoadDrIncidentDrillEvidenceInput | undefined
): LoadDrIncidentDrillEvidence {
  return {
    communications_drill_completed: input?.communications_drill_completed ?? true,
    dr_rpo_minutes: normalizeNumericObservation(input?.dr_rpo_minutes, 10),
    dr_rpo_target_minutes: 15,
    dr_rto_minutes: normalizeNumericObservation(input?.dr_rto_minutes, 45),
    dr_rto_target_minutes: 60,
    failover_plan_id: normalizeIdentifier(
      input?.failover_plan_id,
      "synthetic-worker-failover-plan"
    ),
    incident_drill_completed: input?.incident_drill_completed ?? true,
    load_test_artifact_id: normalizeIdentifier(
      input?.load_test_artifact_id,
      "synthetic-load-test-artifact"
    ),
    load_test_completed: input?.load_test_completed ?? true,
    load_test_error_rate_bps: normalizeNumericObservation(input?.load_test_error_rate_bps, 20),
    load_test_max_error_rate_bps: 50,
    load_test_min_peak_rps: 100,
    load_test_peak_rps: normalizeNumericObservation(input?.load_test_peak_rps, 120),
    measured_from: "synthetic_release_gate_fixture",
    restore_drill_completed: input?.restore_drill_completed ?? true,
    rollback_plan_id: normalizeIdentifier(
      input?.rollback_plan_id,
      "synthetic-release-rollback-plan"
    ),
    status_page_drill_id: normalizeIdentifier(
      input?.status_page_drill_id,
      "synthetic-status-page-drill"
    )
  };
}

function createQualityMetric(
  metricId: EvalV1QualityMetricId,
  input?: EvalV1MetricInput
): EvalV1MetricResult {
  const total = normalizeCount(input?.total);
  const passed = Math.min(normalizeCount(input?.passed), total);

  return {
    metric_id: metricId,
    passed,
    rate: total > 0 ? passed / total : null,
    source: "eval_set_v1",
    status: total > 0 ? (passed === total ? "pass" : "fail") : "not_applicable",
    total
  };
}

function createUnsourcedNumericClaimMetric(
  input?: EvalV1RunInput["unsourcedNumericClaims"]
): EvalV1RunRecord["unsourced_numeric_claims"] {
  const sampledAnswers = normalizeCount(input?.sampledAnswers);
  const unsourcedClaimCount = Math.min(normalizeCount(input?.unsourcedClaims), sampledAnswers);
  const observedRate = sampledAnswers > 0 ? unsourcedClaimCount / sampledAnswers : null;

  return {
    observed_rate: observedRate,
    sampled_answers: sampledAnswers,
    status:
      observedRate === null ? "not_applicable" : observedRate < 0.001 ? "pass" : "fail",
    target_rate: 0.001,
    unsourced_claim_count: unsourcedClaimCount
  };
}

function normalizeHighIntentActions(
  actions: WvroHighIntentAction[] | undefined
): WvroHighIntentAction[] {
  if (actions === undefined) {
    return [];
  }

  const allowedActions = new Set<WvroHighIntentAction>(WVRO_HIGH_INTENT_ACTIONS);
  return [...new Set(actions.filter((action) => allowedActions.has(action)))];
}

function normalizeCount(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function normalizeNumericObservation(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(value));
}

function createUtcWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);

  return weekStart.toISOString().slice(0, 10);
}
