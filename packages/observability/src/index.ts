export const OBSERVABILITY_EVENT_VERSION = "2026-06-20.phase0.observability.v0";
export const EVAL_STORE_SCHEMA_VERSION = "2026-06-20.phase0.eval-store.v0";
export const EVAL_V1_VERSION = "2026-06-21.phase1.eval-v1-wvro-scaffold.v0";
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

export interface AuditTelemetryEvent extends TelemetryEventBase {
  audit: {
    credits: number;
    data_version: string;
    denied_tools: string[];
    methodology_version: string;
    model_calls: boolean;
    model_provider: "not_configured";
    requested_tools: string[];
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
  deniedTools?: string[];
  environment: string;
  maxSteps: number;
  outcome: TelemetryOutcome;
  requestId: string;
  requestedTools: string[];
  route: string;
  runId: string;
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
      "agent.tool_denied_count": deniedTools.length
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
        data_version: "agent-runtime-scaffold-v0",
        denied_tools: deniedTools,
        methodology_version: "agent-runtime-scaffold-v0",
        model_calls: false,
        model_provider: "not_configured",
        requested_tools: input.requestedTools
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
