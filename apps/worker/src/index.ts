import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { Hono, type Context } from "hono";
import {
  ACCOUNT_LOGIN_METHODS,
  ACCOUNT_PLAN_CODES,
  ACCOUNT_DATA_REQUEST_ACTIONS,
  AUTHORIZED_SESSION_MEMORY_ACTIONS,
  createAccountDataRequestPlan,
  createAccountSessionPlan,
  createAuthorizedSessionMemoryPlan,
  createSubscriptionLifecyclePlan,
  getAccountDataRequestCapabilities,
  getAccountRuntimeCapabilities,
  getPackagePricingCatalog,
  getPackagePricingCapabilities,
  getSubscriptionLifecycleCapabilities,
  type AccountLoginMethod,
  type AccountPlanCode,
  type AccountRole,
  type AccountDataRequestAction,
  type AccountSessionAction,
  type AuthorizedSessionMemoryAction,
  type SubscriptionBillingState,
  type SubscriptionLifecycleAction
} from "@aiphabee/account-runtime";
import {
  AgentRuntimeInputError,
  AGENT_RUNTIME_LIMITS,
  AGENT_WORKFLOW_NOTIFICATION_CHANNELS,
  AGENT_WORKFLOW_TASK_KINDS,
  createAgentKillSwitchPlan,
  createAgentRunSkeleton,
  createPreToolCallResolution,
  createPromptInjectionToolDenialReleaseGatePlan,
  createProductAgentReleaseGatePlan,
  createToolLoopAgentPlan,
  createWorkflowTaskPlan,
  getAgentLabelBudgetReleaseGateCapabilities,
  getAgentWorkflowTaskCapabilities,
  getAgentRuntimeCapabilities,
  getProductAgentReleaseGateCapabilities,
  getTaskReplayModeReleaseGateCapabilities,
  validatePostGenerationEvidenceBinding,
  type AgentWorkflowNotificationChannel,
  type AgentWorkflowTaskKind,
  type AgentRunSkeletonInput,
  type ValidatePostGenerationEvidenceBindingInput
} from "@aiphabee/agent-runtime";
import {
  calculateReturnsRisk,
  comparePercentiles,
  compareSecurities,
  getCompareSecuritiesCapabilities,
  getEventStudyCapabilities,
  getFinancialRatios,
  getFinancialRatiosCapabilities,
  getHighCostAnalyticsQueueCapabilities,
  getPercentileComparisonCapabilities,
  getReturnsRiskCapabilities,
  getScreenSecuritiesCapabilities,
  runEventStudy,
  screenSecurities,
  planHighCostAnalyticsQueue,
  type PercentileBenchmarkType,
  type PercentileMetricId,
  type ScreenSecuritiesCondition
} from "@aiphabee/analytics-tools";
import {
  CorporateActionsInputError,
  getCorporateActions,
  getCorporateActionAdjustmentCapabilities,
  getCorporateActionsCapabilities
} from "@aiphabee/corporate-actions";
import {
  DATA_ACCESS_GATEWAY_VERSION,
  DEFAULT_DATA_ACCESS_POLICY,
  createDataCoverageReleaseGateReport,
  createFieldAuthorizationConfigChangePlan,
  createP0RightsMatrixCoverageReport,
  createRestrictedExportPlan,
  getRestrictedExportCapabilities,
  evaluateDataAccessRequest,
  getDataCoverageReleaseGateCapabilities,
  getFieldAuthorizationConfigCapabilities,
  getEntitlementPolicySourceCapabilities,
  getP0RightsMatrixCoverageCapabilities,
  getServingResultEnvelopeCapabilities,
  type DataAccessChannel,
  type DataAccessFieldStatus,
  type FieldAuthorizationApprovalStatus
} from "@aiphabee/data-access-gateway";
import { createErrorEnvelope, createSuccessEnvelope } from "@aiphabee/data-contracts";
import {
  DataLineageInputError,
  EntitlementsInputError,
  EvidenceServiceInputError,
  createEvidenceRecordPlan,
  getDataLineage,
  getDataLineageCapabilities,
  getEntitlements,
  getEntitlementsCapabilities,
  getEvidenceServiceCapabilities
} from "@aiphabee/evidence-lineage";
import {
  diffAnnouncements,
  getAnnouncement,
  getAnnouncementCapabilities,
  getDiffAnnouncementsCapabilities,
  getDocumentToolsCapabilities,
  getSearchAnnouncementsCapabilities,
  getSearchDocumentsCapabilities,
  searchDocuments,
  searchAnnouncements
} from "@aiphabee/document-tools";
import {
  EventTimelineInputError,
  getEventTimeline,
  getEventTimelineCapabilities
} from "@aiphabee/event-timeline";
import {
  FinancialFactsInputError,
  getFinancialFacts,
  getFinancialFactsCapabilities,
  getFinancialRestatementCapabilities
} from "@aiphabee/financial-facts";
import {
  MarketCalendarInputError,
  getMarketCalendar,
  getMarketCalendarCapabilities
} from "@aiphabee/market-calendar";
import {
  PriceHistoryInputError,
  QuoteSnapshotInputError,
  getPriceHistory,
  getPriceHistoryCapabilities,
  getQuoteSnapshot,
  getQuoteSnapshotCapabilities,
  type PriceHistoryAdjustment,
  type QuoteSnapshotMode
} from "@aiphabee/market-data";
import {
  McpRuntimeInputError,
  createMcpAuthLimitsReleaseGatePlan,
  createMcpCompatibilityStatusPlan,
  createMcpApiKeyCreatePlan,
  createMcpApiKeyRevokePlan,
  createMcpApiKeyRotatePlan,
  createMcpOAuthAuthorizePlan,
  createMcpOAuthRevokePlan,
  createMcpOAuthTokenPlan,
  createMcpProtocolPlan,
  createMcpProtocolReleaseGatePlan,
  createMcpRevocationEnforcementPlan,
  createMcpTargetClientsConsoleReleaseGatePlan,
  getMcpAuthLimitsReleaseGateCapabilities,
  getMcpApiKeyCapabilities,
  getMcpCompatibilityStatusCapabilities,
  getMcpOAuthCapabilities,
  getMcpProtocolReleaseGateCapabilities,
  getMcpRevocationEnforcementCapabilities,
  getMcpRuntimeCapabilities,
  getMcpRuntimeStandardError,
  getMcpStandardErrorDefinition,
  getMcpTargetClientsConsoleReleaseGateCapabilities,
  MCP_STANDARD_ERROR_CODES_VERSION,
  type McpStandardErrorCode
} from "@aiphabee/mcp-runtime";
import {
  EVAL_STORE_SCHEMA_VERSION,
  OBSERVABILITY_EVENT_VERSION,
  WVRO_HIGH_INTENT_ACTIONS,
  createAgentDryRunTelemetry,
  createConsoleTelemetrySink,
  createEvalV1RunRecord,
  createLoadDrIncidentDrillReleaseGatePlan,
  createPerformanceAvailabilityReleaseGatePlan,
  getEvalV1Capabilities,
  getLoadDrIncidentDrillReleaseGateCapabilities,
  getPerformanceAvailabilityReleaseGateCapabilities,
  type AgentDryRunTelemetryInput,
  type EvalV1MetricInput,
  type LoadDrIncidentDrillEvidenceInput,
  type PerformanceAvailabilityObservationInput,
  type WvroHighIntentAction,
  recordTelemetryEvents
} from "@aiphabee/observability";
import {
  createComplianceOpsReleaseGatePlan,
  createPublicationEconomicsReleaseGatePlan,
  getPublicDocsManifest,
  getPublicOperationsCapabilities,
  getPublicStatusPage
} from "@aiphabee/public-ops";
import {
  createDeepReportWorkflowPlan,
  ResearchRunInputError,
  createDataCorrectionNotificationPlan,
  createGoldenCorrectionRollbackDrillPlan,
  createResearchRunReplayPlan,
  createResearchRunSavePlan,
  createStaticReportPlan,
  getDataCorrectionNotificationCapabilities,
  getDeepReportWorkflowCapabilities,
  getGoldenCorrectionRollbackDrillCapabilities,
  getResearchRuntimeCapabilities,
  getStaticReportCapabilities,
  type CreateResearchRunReplayCurrentRunInput,
  type DataCorrectionNotificationChannel,
  type DataCorrectionSeverity,
  type DataCorrectionSourceInput,
  type ResearchRunEvidenceInput,
  type ResearchRunJsonValue,
  type ResearchRunSavePlan,
  type ResearchRunToolCallInput
} from "@aiphabee/research-runtime";
import {
  getServingStoreExecutionAdapterCapabilities,
  getServingStoreQueryPlannerCapabilities,
  getServingStoreQualityReleaseCapabilities,
  getServingStoreReadCapabilities,
  getServingStoreSqlDescriptorCapabilities,
  getServingStoreSqlTextCompilerCapabilities
} from "@aiphabee/serving-store";
import {
  createPrivacyShareReleaseGatePlan,
  createPrivateShareLinkPlan,
  getPrivacyShareReleaseGateCapabilities,
  getPrivateSharingCapabilities
} from "@aiphabee/sharing-runtime";
import {
  createSupportRequestIdInvestigationPlan,
  getSupportHelpCenter,
  getSupportOperationsCapabilities
} from "@aiphabee/support-ops";
import {
  GET_SECURITY_HISTORY_VERSION,
  GetSecurityProfileInputError,
  GetSecurityHistoryInputError,
  ResolveSecurityInputError,
  getSecurityHistory,
  getSecurityHistoryCapabilities,
  getSecurityProfile,
  getSecurityProfileCapabilities,
  getResolveSecurityCapabilities,
  resolveSecurity
} from "@aiphabee/security-tools";
import { REGISTERED_TOOLS, getToolRegistryCapabilities } from "@aiphabee/tool-registry";
import {
  USAGE_QUOTA_CHANNELS,
  USAGE_QUOTA_PLAN_CODES,
  createBillingRulesReleaseGatePlan,
  createHighCostUsageReservationPlan,
  createPartnerReconciliationReportPlan,
  createPartnerSupportReleaseGatePlan,
  createUsageBillingReconciliationPlan,
  createUsageQuotaDisplayPlan,
  getBillingRulesReleaseGateCapabilities,
  getHighCostUsageReservationCapabilities,
  getPartnerReconciliationReportCapabilities,
  getPartnerSupportReleaseGateCapabilities,
  getUsageBillingReconciliationCapabilities,
  getUsageLedgerEventWriterCapabilities,
  getUsageQuotaDisplayCapabilities,
  type HighCostUsageExecutionStatus,
  type PartnerReconciliationReportCadence,
  type PartnerReconciliationReportFormat,
  type PartnerReconciliationUsageRowInput,
  type UsageBillingLedgerEntryInput,
  type UsageLedgerChannel,
  type UsageQuotaChannel,
  type UsageQuotaPlanCode
} from "@aiphabee/usage-ledger";
import {
  WATCHLIST_ALERT_CHANNELS,
  WATCHLIST_ALERT_FREQUENCIES,
  WATCHLIST_ALERT_KINDS,
  createWatchlistAlertsPlan,
  createWatchlistBriefingPlan,
  getWatchlistBriefingCapabilities,
  getWatchlistRuntimeCapabilities,
  type WatchlistAlertChannel,
  type WatchlistAlertConditionInput,
  type WatchlistAlertFrequency,
  type WatchlistAlertKind,
  type WatchlistBriefingCadence
} from "@aiphabee/watchlist-runtime";
import {
  createStockWorkbenchAnnouncementSearch,
  createStockWorkbenchSnapshot,
  getStockWorkbenchCapabilities
} from "@aiphabee/workbench";

interface WorkerBindings {
  AIPHABEE_ARTIFACTS?: RuntimeR2Bucket;
  AIPHABEE_CONFIG?: RuntimeKvNamespace;
  AIPHABEE_EVAL_STORE?: RuntimeD1Database;
  AIPHABEE_EVENTS_QUEUE?: RuntimeQueue;
  AIPHABEE_HYPERDRIVE?: unknown;
  AIPHABEE_RUN_COORDINATOR?: RuntimeDurableObjectNamespace;
  AIPHABEE_RESEARCH_WORKFLOW?: RuntimeWorkflow<CloudflareWorkflowSmokePayload>;
  APP_ENV?: string;
  APP_VERSION?: string;
  OTLP_EXPORTER_OTLP_ENDPOINT?: string;
  OTLP_EXPORTER_OTLP_HEADERS?: string;
}

interface RuntimeKvNamespace {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface RuntimeR2Bucket {
  delete(key: string): Promise<void>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  put(key: string, value: string): Promise<unknown>;
}

interface RuntimeD1PreparedStatement {
  bind(...values: unknown[]): RuntimeD1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface RuntimeD1Database {
  prepare(query: string): RuntimeD1PreparedStatement;
}

interface RuntimeQueue {
  send(body: unknown): Promise<void>;
}

interface RuntimeQueueBatch {
  messages: RuntimeQueueMessage[];
  queue: string;
}

interface RuntimeQueueMessage {
  ack?(): void;
  body: unknown;
}

interface RuntimeDurableObjectNamespace {
  get(id: unknown): RuntimeDurableObjectStub;
  idFromName(name: string): unknown;
}

interface RuntimeDurableObjectStub {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

interface RuntimeDurableObjectState {
  storage: {
    delete(key: string): Promise<void>;
    get(key: string): Promise<unknown | undefined>;
    put<T = unknown>(key: string, value: T): Promise<void>;
  };
}

interface RuntimeWorkflow<T = unknown> {
  create(options: { id?: string; params?: T }): Promise<RuntimeWorkflowInstance>;
}

interface RuntimeWorkflowInstance {
  id: string;
  status(): Promise<unknown>;
}

interface RuntimeScheduledController {
  cron: string;
  scheduledTime: number;
  type?: string;
}

interface RuntimeExecutionContext {
  waitUntil?(promise: Promise<unknown>): void;
}

type CloudflareBindingSmokeStatus = "failed" | "missing_binding" | "passed";

interface CloudflareBindingSmokeResult {
  binding_name: "AIPHABEE_ARTIFACTS" | "AIPHABEE_CONFIG" | "AIPHABEE_EVAL_STORE";
  detail_hash?: string;
  failure_code?: string;
  key_hash?: string;
  object_key_hash?: string;
  operation_count?: number;
  status: CloudflareBindingSmokeStatus;
  surface:
    | "d1_runtime_write_read_delete"
    | "kv_runtime_put_get_delete"
    | "r2_runtime_put_get_delete";
  table_hash?: string;
  value_hash?: string;
}

interface CloudflareQueueSmokePayload {
  evidence_key: string;
  issued_at: string;
  kind: typeof CLOUDFLARE_QUEUE_SMOKE_KIND;
  message_hash: string;
  smoke_id: string;
}

interface CloudflareQueueSmokeResult {
  binding_name: "AIPHABEE_EVENTS_QUEUE";
  detail_hash?: string;
  evidence_key_hash?: string;
  failure_code?: string;
  message_hash?: string;
  operation_count?: number;
  status: CloudflareBindingSmokeStatus;
  surface: "queue_publish_consume_smoke";
}

interface CloudflareDurableObjectSmokePayload {
  kind: typeof CLOUDFLARE_DURABLE_OBJECT_SMOKE_KIND;
  smoke_id: string;
  state_key: string;
  value_hash: string;
}

interface CloudflareDurableObjectSmokeResult {
  binding_name: "AIPHABEE_RUN_COORDINATOR";
  detail_hash?: string;
  failure_code?: string;
  object_name_hash?: string;
  operation_count?: number;
  response_hash?: string;
  state_key_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "durable_object_state_smoke";
  value_hash?: string;
}

interface CloudflareWorkflowSmokePayload {
  evidence_key: string;
  issued_at: string;
  kind: typeof CLOUDFLARE_WORKFLOW_SMOKE_KIND;
  smoke_id: string;
  value_hash: string;
}

interface CloudflareWorkflowSmokeResult {
  binding_name: "AIPHABEE_RESEARCH_WORKFLOW";
  detail_hash?: string;
  evidence_key_hash?: string;
  failure_code?: string;
  instance_id_hash?: string;
  operation_count?: number;
  response_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "workflow_instance_execution";
  value_hash?: string;
}

interface CloudflareCronSmokeResult {
  binding_name: "AIPHABEE_MAINTENANCE_CRON";
  cron_hash?: string;
  detail_hash?: string;
  evidence_key_hash?: string;
  failure_code?: string;
  operation_count?: number;
  scheduled_time_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "cron_handler_smoke";
  value_hash?: string;
}

interface AgentRunRequestBody {
  ambiguous_security_query?: unknown;
  ambiguousSecurityQuery?: unknown;
  as_of?: unknown;
  asOf?: unknown;
  answer_text?: unknown;
  answerText?: unknown;
  channel?: unknown;
  calculations?: unknown;
  claims?: unknown;
  currency?: unknown;
  entitlement_policy_version?: unknown;
  entitlementPolicyVersion?: unknown;
  max_credits?: unknown;
  max_rows?: unknown;
  max_steps?: unknown;
  max_tokens?: unknown;
  max_wall_clock_ms?: unknown;
  methodology?: unknown;
  locale?: unknown;
  kill_switch_reason?: unknown;
  killSwitchReason?: unknown;
  language?: unknown;
  model_kill_switch?: unknown;
  modelKillSwitch?: unknown;
  model_tier?: unknown;
  modelTier?: unknown;
  plan?: unknown;
  prompt?: unknown;
  response_depth?: unknown;
  responseDepth?: unknown;
  response_locale?: unknown;
  responseLocale?: unknown;
  securities?: unknown;
  security_query?: unknown;
  securityQuery?: unknown;
  time_range?: unknown;
  timeRange?: unknown;
  tools?: unknown;
  tool_kill_switch?: unknown;
  toolKillSwitch?: unknown;
  user_id?: unknown;
  userId?: unknown;
  notification_channels?: unknown;
  notificationChannels?: unknown;
  question?: unknown;
  report_id?: unknown;
  reportId?: unknown;
  data_version?: unknown;
  dataVersion?: unknown;
  disclaimer?: unknown;
  evidence_cards?: unknown;
  evidenceCards?: unknown;
  format?: unknown;
  generated_at?: unknown;
  generatedAt?: unknown;
  methodology_version?: unknown;
  methodologyVersion?: unknown;
  rights_policy_version?: unknown;
  rightsPolicyVersion?: unknown;
  scopes?: unknown;
  sections?: unknown;
  data_delay_minutes?: unknown;
  dataDelayMinutes?: unknown;
  model_version?: unknown;
  modelVersion?: unknown;
  numeric_prompt?: unknown;
  numericPrompt?: unknown;
  prompt_version?: unknown;
  promptVersion?: unknown;
  source_run_id?: unknown;
  sourceRunId?: unknown;
  title?: unknown;
  workflow_kind?: unknown;
  workflowKind?: unknown;
  workspace_id?: unknown;
  workspaceId?: unknown;
}

interface WatchlistAlertsRequestBody {
  alert_kinds?: unknown;
  alertKinds?: unknown;
  channels?: unknown;
  condition?: unknown;
  explicit_confirmation?: unknown;
  explicitConfirmation?: unknown;
  frequency?: unknown;
  idempotency_key?: unknown;
  idempotencyKey?: unknown;
  instrument_id?: unknown;
  instrumentId?: unknown;
  metric_ids?: unknown;
  metricIds?: unknown;
  quiet_hours_end?: unknown;
  quiet_hours_start?: unknown;
  quietHoursEnd?: unknown;
  quietHoursStart?: unknown;
  security_query?: unknown;
  securityQuery?: unknown;
  timezone?: unknown;
  user_id?: unknown;
  userId?: unknown;
  watchlist_id?: unknown;
  watchlistId?: unknown;
  workspace_id?: unknown;
  workspaceId?: unknown;
}

interface WatchlistBriefingRequestBody {
  as_of?: unknown;
  asOf?: unknown;
  cadence?: unknown;
  channels?: unknown;
  max_items?: unknown;
  maxItems?: unknown;
  min_materiality_score?: unknown;
  minMaterialityScore?: unknown;
  timezone?: unknown;
  user_id?: unknown;
  userId?: unknown;
  watchlist_id?: unknown;
  watchlistId?: unknown;
  workspace_id?: unknown;
  workspaceId?: unknown;
}

interface DataCorrectionNotificationRequestBody {
  affected_runs?: unknown;
  affectedRuns?: unknown;
  as_of?: unknown;
  asOf?: unknown;
  corrections?: unknown;
  notification_channels?: unknown;
  notificationChannels?: unknown;
  user_id?: unknown;
  userId?: unknown;
  workspace_id?: unknown;
  workspaceId?: unknown;
}

interface GoldenCorrectionRollbackDrillRequestBody {
  as_of?: unknown;
  asOf?: unknown;
  correction?: unknown;
  golden_manifest_version?: unknown;
  goldenManifestVersion?: unknown;
  golden_sample_count?: unknown;
  goldenSampleCount?: unknown;
  notification_channels?: unknown;
  notificationChannels?: unknown;
  quality_rule_count?: unknown;
  qualityRuleCount?: unknown;
  rollback_reason?: unknown;
  rollbackReason?: unknown;
  tool_golden_sample_count?: unknown;
  toolGoldenSampleCount?: unknown;
  user_id?: unknown;
  userId?: unknown;
  workspace_id?: unknown;
  workspaceId?: unknown;
}

interface McpRevocationEnforcementRequestBody {
  connection_id?: unknown;
  connectionId?: unknown;
  credential_kind?: unknown;
  credential_status?: unknown;
  credentialKind?: unknown;
  credentialStatus?: unknown;
  key_id?: unknown;
  keyId?: unknown;
  method?: unknown;
  reason?: unknown;
  revoked_at?: unknown;
  revokedAt?: unknown;
  rotated_at?: unknown;
  rotatedAt?: unknown;
  tool_name?: unknown;
  toolName?: unknown;
}

const app = new Hono<{ Bindings: WorkerBindings }>();
const DEFAULT_DEEP_REPORT_WORKFLOW_TOOLS = [
  "resolve_security",
  "get_security_profile",
  "get_data_lineage",
  "get_entitlements",
  "get_quote_snapshot",
  "get_price_history",
  "get_financial_facts"
] as const;
const CLOUDFLARE_BINDING_SMOKE_HEADER = "x-aiphabee-smoke";
const CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE = "cloudflare-bindings-runtime-v1";
const CLOUDFLARE_BINDING_SMOKE_ROUTE = "/cloudflare/bindings/smoke";
const CLOUDFLARE_DURABLE_OBJECT_SMOKE_ROUTE = "/cloudflare/durable-objects/smoke";
const CLOUDFLARE_DURABLE_OBJECT_SMOKE_KIND = "aiphabee.durable-object.smoke.v1";
const CLOUDFLARE_WORKFLOW_SMOKE_ROUTE = "/cloudflare/workflows/smoke";
const CLOUDFLARE_WORKFLOW_SMOKE_KIND = "aiphabee.workflow.smoke.v1";
const CLOUDFLARE_CRON_SMOKE_ROUTE = "/cloudflare/cron/smoke";
const CLOUDFLARE_CRON_SMOKE_KIND = "aiphabee.cron.smoke.v1";
const CLOUDFLARE_MAINTENANCE_CRON = "*/30 * * * *";
const CLOUDFLARE_QUEUE_SMOKE_ROUTE = "/cloudflare/queues/smoke";
const CLOUDFLARE_QUEUE_SMOKE_KIND = "aiphabee.queue.smoke.v1";
const CLOUDFLARE_BINDING_SMOKE_PREFIX = "aiphabee-smoke";
const CLOUDFLARE_QUEUE_SMOKE_MAX_ATTEMPTS = 20;
const CLOUDFLARE_QUEUE_SMOKE_POLL_MS = 500;
const CLOUDFLARE_WORKFLOW_SMOKE_MAX_ATTEMPTS = 20;
const CLOUDFLARE_WORKFLOW_SMOKE_POLL_MS = 500;

app.get("/health", (c) => {
  c.header("Cache-Control", "no-store");

  return c.json({
    environment: c.env?.APP_ENV ?? "local",
    market_data_surfaces: false,
    mcp_redistribution_surfaces: false,
    service: "aiphabee-worker",
    status: "ok",
    version: c.env?.APP_VERSION ?? "0.0.0"
  });
});

app.get("/", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  return c.json(
    createSuccessEnvelope(
      {
        health_route: "/health",
        market_data_surfaces: false,
        mcp_redistribution_surfaces: false,
        service: "aiphabee-worker"
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "runtime-scaffold-v0",
        provenance: [
          {
            data_version: "runtime-scaffold-v0",
            methodology_version: "runtime-scaffold-v0",
            source: "worker-runtime",
            source_record_id: "root-route"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.post(CLOUDFLARE_BINDING_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_BINDING_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const runtimeResults = await runCloudflareBindingRuntimeSmoke(c.env ?? {});
  const failedResults = runtimeResults.filter((result) => result.status !== "passed");
  const missingBindings = runtimeResults
    .filter((result) => result.status === "missing_binding")
    .map((result) => result.binding_name);
  const bodyWithoutHash = {
    missing_bindings: missingBindings,
    request_id: requestId,
    route: `POST ${CLOUDFLARE_BINDING_SMOKE_ROUTE}`,
    runtime_results: runtimeResults,
    status: failedResults.length === 0 ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    failedResults.length === 0 ? 200 : 424
  );
});

app.post(CLOUDFLARE_QUEUE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_QUEUE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const queueResult = await runCloudflareQueueSmoke(c.env ?? {});
  const bodyWithoutHash = {
    missing_bindings: missingQueueSmokeBindings(queueResult),
    queue_result: queueResult,
    request_id: requestId,
    route: `POST ${CLOUDFLARE_QUEUE_SMOKE_ROUTE}`,
    status: queueResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    queueResult.status === "passed" ? 200 : 424
  );
});

app.post(CLOUDFLARE_DURABLE_OBJECT_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_DURABLE_OBJECT_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const durableObjectResult = await runCloudflareDurableObjectSmoke(c.env ?? {});
  const bodyWithoutHash = {
    durable_object_result: durableObjectResult,
    missing_bindings:
      durableObjectResult.status === "missing_binding" ? ["AIPHABEE_RUN_COORDINATOR"] : [],
    request_id: requestId,
    route: `POST ${CLOUDFLARE_DURABLE_OBJECT_SMOKE_ROUTE}`,
    status: durableObjectResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    durableObjectResult.status === "passed" ? 200 : 424
  );
});

app.post(CLOUDFLARE_WORKFLOW_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_WORKFLOW_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const workflowResult = await runCloudflareWorkflowSmoke(c.env ?? {});
  const bodyWithoutHash = {
    missing_bindings: missingWorkflowSmokeBindings(workflowResult),
    request_id: requestId,
    route: `POST ${CLOUDFLARE_WORKFLOW_SMOKE_ROUTE}`,
    status: workflowResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX,
    workflow_result: workflowResult
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    workflowResult.status === "passed" ? 200 : 424
  );
});

app.post(CLOUDFLARE_CRON_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_CRON_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const cronResult = await runCloudflareCronSmoke(c.env ?? {}, {
    cron: CLOUDFLARE_MAINTENANCE_CRON,
    scheduledTime: Date.now(),
    type: "scheduled"
  });
  const bodyWithoutHash = {
    cron_result: cronResult,
    missing_bindings: cronResult.status === "missing_binding" ? ["AIPHABEE_CONFIG"] : [],
    request_id: requestId,
    route: `POST ${CLOUDFLARE_CRON_SMOKE_ROUTE}`,
    status: cronResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    cronResult.status === "passed" ? 200 : 424
  );
});

app.get("/public/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const capability = getPublicOperationsCapabilities();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(capability, {
      asOf: new Date().toISOString(),
      dataVersion: capability.version,
      methodologyVersion: capability.version,
      provenance: [
        {
          data_version: capability.version,
          methodology_version: capability.version,
          source: "public-ops",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.get("/public/status", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const statusPage = getPublicStatusPage({
    asOf: new Date().toISOString(),
    requestId
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...statusPage,
        capability: getPublicOperationsCapabilities()
      },
      {
        asOf: statusPage.as_of,
        dataVersion: statusPage.version,
        methodologyVersion: statusPage.version,
        provenance: [
          {
            data_version: statusPage.version,
            methodology_version: statusPage.version,
            source: "public-ops",
            source_record_id: "public-status-page"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: statusPage.components.length
        }
      }
    )
  );
});

app.get("/public/docs", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const docsManifest = getPublicDocsManifest({ requestId });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...docsManifest,
        capability: getPublicOperationsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: docsManifest.version,
        methodologyVersion: docsManifest.version,
        provenance: [
          {
            data_version: docsManifest.version,
            methodology_version: docsManifest.version,
            source: "public-ops",
            source_record_id: "public-docs-manifest"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: docsManifest.documents.length
        }
      }
    )
  );
});

app.post("/public/release-gates/compliance-ops/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const body = (await c.req.json<Record<string, unknown>>().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const plan = createComplianceOpsReleaseGatePlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    marketingCopySnippets: normalizeStringArray(
      body.marketing_copy_snippets ?? body.marketingCopySnippets ?? body.copy
    ),
    requestId,
    supportAgentId: normalizeString(body.support_agent_id ?? body.supportAgentId),
    targetRequestId: normalizeString(
      body.target_request_id ?? body.targetRequestId ?? body.request_id ?? body.requestId
    ),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(plan, {
      asOf: plan.docs_gate.public_status_page.as_of,
      dataVersion: plan.version,
      methodologyVersion: plan.version,
      provenance: [
        {
          data_version: plan.version,
          methodology_version: plan.version,
          source: "public-ops",
          source_record_id: "compliance-ops-release-gate-plan"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: plan.release_checks.length
      }
    })
  );
});

app.post("/public/release-gates/publication-economics/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const body = (await c.req.json<Record<string, unknown>>().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const plan = createPublicationEconomicsReleaseGatePlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    expectedUsageProfile: normalizeExpectedUsageProfile(
      body.expected_usage_profile ?? body.expectedUsageProfile
    ),
    requestId
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(plan, {
      asOf: plan.docs_publication.public_status_page.as_of,
      dataVersion: plan.version,
      methodologyVersion: plan.version,
      provenance: [
        {
          data_version: plan.version,
          methodology_version: plan.version,
          source: "public-ops",
          source_record_id: "publication-economics-release-gate-plan"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: plan.release_checks.length
      }
    })
  );
});

app.get("/support/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const capability = getSupportOperationsCapabilities();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(capability, {
      asOf: new Date().toISOString(),
      dataVersion: capability.version,
      methodologyVersion: capability.version,
      provenance: [
        {
          data_version: capability.version,
          methodology_version: capability.version,
          source: "support-ops",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.get("/support/help-center", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const helpCenter = getSupportHelpCenter();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...helpCenter,
        capability: getSupportOperationsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: helpCenter.version,
        methodologyVersion: helpCenter.version,
        provenance: [
          {
            data_version: helpCenter.version,
            methodology_version: helpCenter.version,
            source: "support-ops",
            source_record_id: "help-center"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: helpCenter.help_topics.length
        }
      }
    )
  );
});

app.post("/support/request-id-investigation/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createSupportRequestIdInvestigationPlan({
    category: normalizeString(body.category ?? body.topic_code ?? body.topicCode),
    includeSensitiveContent: body.include_sensitive_content === true || body.includeSensitiveContent === true,
    reason: normalizeString(body.reason),
    requestId,
    supportAgentId: normalizeString(body.support_agent_id ?? body.supportAgentId),
    targetRequestId: normalizeString(body.target_request_id ?? body.targetRequestId ?? body.request_id ?? body.requestId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getSupportOperationsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "support-ops",
            source_record_id: "support-request-id-investigation-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? 1 : 0
        }
      }
    )
  );
});

app.get("/sharing/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const capability = getPrivateSharingCapabilities();
  const privacyShareReleaseGate = getPrivacyShareReleaseGateCapabilities();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope({
      ...capability,
      privacy_share_release_gate: privacyShareReleaseGate
    }, {
      asOf: new Date().toISOString(),
      dataVersion: capability.version,
      methodologyVersion: capability.version,
      provenance: [
        {
          data_version: capability.version,
          methodology_version: capability.version,
          source: "sharing-runtime",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/sharing/private-links/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const fields = normalizeStringArray(body.fields) ?? ["synthetic_profile.company_name"];
  const creatorScopes =
    normalizeStringArray(body.creator_scopes ?? body.creatorScopes ?? body.scopes) ?? [];
  const recipientScopes =
    normalizeStringArray(body.recipient_scopes ?? body.recipientScopes) ?? [];
  const timeRange = isTimeRange(body.time_range)
    ? body.time_range
    : isTimeRange(body.timeRange)
      ? body.timeRange
      : undefined;
  const plan = createPrivateShareLinkPlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    creatorAccountId: normalizeString(body.creator_account_id ?? body.creatorAccountId),
    creatorPlan: normalizeString(body.creator_plan ?? body.creatorPlan ?? body.plan),
    creatorScopes,
    creatorWorkspaceId: normalizeString(body.creator_workspace_id ?? body.creatorWorkspaceId),
    dataset: normalizeString(body.dataset),
    expiresInHours: normalizeOptionalNumber(body.expires_in_hours ?? body.expiresInHours),
    fields,
    qualityState: isQualityState(body.quality_state)
      ? body.quality_state
      : isQualityState(body.qualityState)
        ? body.qualityState
        : "PASS",
    recipientAccountId: normalizeString(body.recipient_account_id ?? body.recipientAccountId),
    recipientPlan: normalizeString(body.recipient_plan ?? body.recipientPlan ?? body.plan),
    recipientScopes,
    recipientWorkspaceId: normalizeString(
      body.recipient_workspace_id ?? body.recipientWorkspaceId
    ),
    requestId,
    requestedRows:
      normalizeOptionalNumber(body.requested_rows ?? body.requestedRows) ?? undefined,
    runId: normalizeString(body.run_id ?? body.runId),
    timeRange
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getPrivateSharingCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.post("/sharing/release-gates/privacy-share/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const timeRange = isTimeRange(body.time_range)
    ? body.time_range
    : isTimeRange(body.timeRange)
      ? body.timeRange
      : undefined;
  const plan = createPrivacyShareReleaseGatePlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    asOf: normalizeString(body.as_of ?? body.asOf),
    creatorAccountId: normalizeString(body.creator_account_id ?? body.creatorAccountId),
    creatorPlan: normalizeString(body.creator_plan ?? body.creatorPlan ?? body.plan),
    creatorScopes: normalizeStringArray(body.creator_scopes ?? body.creatorScopes ?? body.scopes),
    creatorWorkspaceId: normalizeString(body.creator_workspace_id ?? body.creatorWorkspaceId),
    dataset: normalizeString(body.dataset),
    expiresInHours: normalizeOptionalNumber(body.expires_in_hours ?? body.expiresInHours),
    fields: normalizeStringArray(body.fields),
    recipientAccountId: normalizeString(body.recipient_account_id ?? body.recipientAccountId),
    recipientPlan: normalizeString(body.recipient_plan ?? body.recipientPlan ?? body.plan),
    recipientScopes: normalizeStringArray(body.recipient_scopes ?? body.recipientScopes),
    recipientWorkspaceId: normalizeString(body.recipient_workspace_id ?? body.recipientWorkspaceId),
    requestId,
    requestedAt: normalizeString(body.requested_at ?? body.requestedAt),
    requestedRows:
      normalizeOptionalNumber(body.requested_rows ?? body.requestedRows) ?? undefined,
    requestScopes: normalizeStringArray(body.request_scopes ?? body.requestScopes ?? body.data_scopes),
    retentionPolicyVersion: normalizeString(
      body.retention_policy_version ?? body.retentionPolicyVersion
    ),
    runId: normalizeString(body.run_id ?? body.runId),
    timeRange,
    verifiedBy: normalizeString(body.verified_by ?? body.verifiedBy),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(plan, {
      asOf: new Date().toISOString(),
      dataVersion: plan.version,
      methodologyVersion: plan.version,
      provenance: [
        {
          data_version: plan.version,
          methodology_version: plan.version,
          source: "sharing-runtime",
          source_record_id: "privacy-share-release-gate-plan"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: plan.release_checks.length
      }
    })
  );
});

app.get("/account/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...getAccountRuntimeCapabilities(),
        data_requests: getAccountDataRequestCapabilities(),
        subscription_lifecycle: getSubscriptionLifecycleCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "internal-account-session-manual-plan-scaffold-v0",
        provenance: [
          {
            data_version: "internal-account-session-manual-plan-scaffold-v0",
            methodology_version: "internal-account-session-manual-plan-scaffold-v0",
            source: "account-runtime-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.get("/account/package-pricing", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const catalog = getPackagePricingCatalog();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...catalog,
        capability: getPackagePricingCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: catalog.version,
        methodologyVersion: catalog.version,
        provenance: [
          {
            data_version: catalog.version,
            methodology_version: catalog.version,
            source: "account-runtime",
            source_record_id: "package-pricing-catalog"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: catalog.plans.length
        }
      }
    )
  );
});

app.post("/account/data-requests/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createAccountDataRequestPlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    action: normalizeAccountDataRequestAction(body.action),
    requestedAt: normalizeString(body.requested_at ?? body.requestedAt),
    requestId,
    requestScopes: normalizeStringArray(body.request_scopes ?? body.requestScopes ?? body.scopes),
    retentionPolicyVersion: normalizeString(
      body.retention_policy_version ?? body.retentionPolicyVersion
    ),
    verifiedBy: normalizeString(body.verified_by ?? body.verifiedBy),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAccountDataRequestCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "account-runtime",
            source_record_id: "account-data-request-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? plan.execution_plan.length : 0
        }
      }
    )
  );
});

app.post("/account/authorized-memory/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createAuthorizedSessionMemoryPlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    action: normalizeAuthorizedSessionMemoryAction(body.action),
    allowedFields: normalizeStringArray(body.allowed_fields ?? body.allowedFields),
    memoryKey: normalizeString(body.memory_key ?? body.memoryKey),
    memoryKeys: normalizeStringArray(body.memory_keys ?? body.memoryKeys ?? body.keys),
    requestId,
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAccountRuntimeCapabilities().authorized_memory
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "account-runtime",
            source_record_id: "authorized-session-memory-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? plan.memory.memory_refs.length : 0
        }
      }
    )
  );
});

app.post("/account/subscription/lifecycle/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createSubscriptionLifecyclePlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    action: normalizeSubscriptionLifecycleAction(body.action),
    currentBillingState: normalizeSubscriptionBillingState(
      body.current_billing_state ?? body.currentBillingState
    ),
    currentPlanCode: normalizeAccountPlanCode(body.current_plan_code ?? body.currentPlanCode),
    effectiveAt: normalizeString(body.effective_at ?? body.effectiveAt),
    gracePeriodEndsAt: normalizeString(body.grace_period_ends_at ?? body.gracePeriodEndsAt),
    reason: normalizeString(body.reason),
    renewalPeriodEnd: normalizeString(body.renewal_period_end ?? body.renewalPeriodEnd),
    requestId,
    subscriptionId: normalizeString(body.subscription_id ?? body.subscriptionId),
    targetPlanCode: normalizeAccountPlanCode(body.target_plan_code ?? body.targetPlanCode),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getSubscriptionLifecycleCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "account-runtime",
            source_record_id: "subscription-lifecycle-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? 1 : 0
        }
      }
    )
  );
});

app.post("/account/session/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createAccountSessionPlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    action: normalizeAccountSessionAction(body.action),
    deviceId: normalizeString(body.device_id ?? body.deviceId),
    emailHash: normalizeString(body.email_hash ?? body.emailHash),
    loginMethod: normalizeAccountLoginMethod(body.login_method ?? body.loginMethod),
    planCode: normalizeAccountPlanCode(body.plan_code ?? body.planCode),
    requestId,
    role: normalizeAccountRole(body.role),
    sessionId: normalizeString(body.session_id ?? body.sessionId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAccountRuntimeCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "account-runtime",
            source_record_id: "account-session-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? 1 : 0
        }
      }
    )
  );
});

app.get("/database/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        connection_path: "cloudflare_hyperdrive",
        hyperdrive: {
          binding_configured: Boolean(c.env?.AIPHABEE_HYPERDRIVE),
          binding_name: "AIPHABEE_HYPERDRIVE",
          requires_real_resource_id: true,
          status: "planned"
        },
        live_queries: false,
        market_data_surfaces: false,
        mcp_redistribution_surfaces: false,
        migration_contract: "deploy/database/migrations.contract.json",
        migration_directory: "supabase/migrations",
        provider: "supabase_postgres"
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "database-migration-scaffold-v0",
        provenance: [
          {
            data_version: "database-migration-scaffold-v0",
            methodology_version: "database-migration-scaffold-v0",
            source: "database-migration-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.get("/data/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        account_workspace: {
          default_entitlement_status: "default_deny",
          live_enforcement: false,
          status: "schema_scaffold",
          tables: [
            "core.account",
            "core.workspace",
            "core.workspace_membership",
            "core.subscription_plan",
            "core.workspace_subscription",
            "core.data_entitlement",
            "core.workspace_entitlement"
          ],
          workspace_isolation: true
        },
        corporate_actions: {
          adjustment_types: ["raw", "split_adjusted", "total_return_adjusted"],
          closed_open_intervals: true,
          engine: getCorporateActionAdjustmentCapabilities(),
          live_actions: false,
          quality_default_state: "HOLD",
          status: "schema_scaffold",
          tables: [
            "core.corporate_action",
            "core.adjustment_methodology",
            "core.price_adjustment_factor"
          ]
        },
        data_version_batches: {
          table: "core.data_version_batch",
          status: "schema_scaffold",
          live_batches: false
        },
        default_rights_status: "default_deny",
        financial_facts: {
          engine: getFinancialRestatementCapabilities(),
          live_facts: false,
          quality_default_state: "HOLD",
          restatement_versions: true,
          status: "schema_scaffold",
          tables: [
            "core.financial_statement",
            "core.financial_fact",
            "core.financial_restatement"
          ]
        },
        live_queries: false,
        market_data_loaded: false,
        raw_snapshots: {
          immutable: true,
          quality_default_state: "HOLD",
          table: "core.raw_snapshot"
        },
        security_master: {
          tables: [
            "core.company",
            "core.instrument",
            "core.listing",
            "core.identifier_history"
          ],
          status: "schema_scaffold"
        },
        serving_store: {
          cache_key_material: [
            "data_version",
            "rights_policy_version",
            "methodology_version",
            "field_set",
            "time_range"
          ],
          default_quality_state: "HOLD",
          default_rights_status: "default_deny",
          live_serving_reads: false,
          quality_release: getServingStoreQualityReleaseCapabilities(),
          release_state_default: "held",
          status: "schema_scaffold",
          tables: [
            "core.serving_dataset",
            "core.serving_field",
            "core.serving_snapshot",
            "core.serving_record"
          ]
        },
        source_batches: {
          rights_default_state: "default_deny",
          table: "core.raw_source_batch"
        }
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "serving-store-scaffold-v0",
        provenance: [
          {
            data_version: "security-master-raw-snapshot-scaffold-v0",
            methodology_version: "security-master-raw-snapshot-scaffold-v0",
            source: "database-migration-contract",
            source_record_id: "security-master-runtime-capabilities"
          },
          {
            data_version: "financial-facts-restatement-scaffold-v0",
            methodology_version: "financial-facts-restatement-scaffold-v0",
            source: "database-migration-contract",
            source_record_id: "financial-facts-runtime-capabilities"
          },
          {
            data_version: "corporate-action-adjustment-scaffold-v0",
            methodology_version: "corporate-action-adjustment-scaffold-v0",
            source: "database-migration-contract",
            source_record_id: "corporate-action-runtime-capabilities"
          },
          {
            data_version: "account-workspace-entitlement-scaffold-v0",
            methodology_version: "account-workspace-entitlement-scaffold-v0",
            source: "database-migration-contract",
            source_record_id: "account-workspace-runtime-capabilities"
          },
          {
            data_version: "serving-store-scaffold-v0",
            methodology_version: "serving-store-scaffold-v0",
            source: "database-migration-contract",
            source_record_id: "serving-store-runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.get("/gateway/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        account_workspace_entitlements: {
          live_enforcement: false,
          status: "schema_scaffold",
          tables: [
            "core.account",
            "core.workspace",
            "core.workspace_membership",
            "core.subscription_plan",
            "core.workspace_subscription",
            "core.data_entitlement",
            "core.workspace_entitlement"
          ],
          workspace_isolation: true
        },
        cache_key_fields: [
          "dataset",
          "channel",
          "plan",
          "workspace_id",
          "allowed_fields",
          "export_requested",
          "data_version",
          "rights_policy_version",
          "methodology_version",
          "time_range",
          "serving_snapshot_id",
          "release_state"
        ],
        channels: DEFAULT_DATA_ACCESS_POLICY.channels,
        contract: "deploy/gateway/access.contract.json",
        data_coverage_release_gate: getDataCoverageReleaseGateCapabilities(),
        default_rights_status: DEFAULT_DATA_ACCESS_POLICY.defaultFieldStatus,
        error_codes: [
          "DATA_NOT_LICENSED",
          "DATA_QUALITY_HOLD",
          "OUT_OF_RANGE",
          "TOO_MANY_ROWS"
        ],
        guards: [
          "channel_rights_default_deny",
          "field_redaction",
          "field_entitlement_policy_source_scaffold",
          "workspace_entitlement_default_deny",
          "plan_entitlement",
          "export_entitlement",
          "row_limit",
          "time_range_limit",
          "quality_hold",
          "serving_execution_adapter_scaffold",
          "serving_quality_release_isolation",
          "serving_query_planner_scaffold",
          "serving_read_default_deny",
          "serving_result_envelope_scaffold",
          "serving_sql_descriptor_scaffold",
          "serving_sql_text_compiler_scaffold",
          "cache_key_versioning",
          "provenance_required",
          "usage_event_writer_scaffold",
          "usage_preview"
        ],
        field_entitlement_enforcement: {
          dimensions: [
            "workspace",
            "plan",
            "channel",
            "dataset",
            "field",
            "time_range",
            "export"
          ],
          live_policy_source: false,
          operations_config: getFieldAuthorizationConfigCapabilities(),
          policy_source: getEntitlementPolicySourceCapabilities(),
          status: "scaffold",
          workspace_isolation: true
        },
        limits: {
          max_rows: DEFAULT_DATA_ACCESS_POLICY.maxRows,
          max_window_days: DEFAULT_DATA_ACCESS_POLICY.maxWindowDays
        },
        live_data_access: false,
        market_data_surfaces: false,
        methodology_version: DEFAULT_DATA_ACCESS_POLICY.methodologyVersion,
        mcp_redistribution_surfaces: false,
        p0_rights_matrix_coverage: getP0RightsMatrixCoverageCapabilities(),
        rights_policy_version: DEFAULT_DATA_ACCESS_POLICY.rightsPolicyVersion,
        restricted_exports: getRestrictedExportCapabilities(),
        serving_result_envelope: getServingResultEnvelopeCapabilities(),
        serving_store: {
          execution_adapter: getServingStoreExecutionAdapterCapabilities(),
          live_reads: false,
          quality_release: getServingStoreQualityReleaseCapabilities(),
          query_planner: getServingStoreQueryPlannerCapabilities(),
          release_state_default: "held",
          read_planner: getServingStoreReadCapabilities(),
          sql_descriptor: getServingStoreSqlDescriptorCapabilities(),
          sql_text_compiler: getServingStoreSqlTextCompilerCapabilities(),
          status: "schema_scaffold",
          tables: [
            "core.serving_dataset",
            "core.serving_field",
            "core.serving_snapshot",
            "core.serving_record"
          ],
          uses_quality_state: true,
          uses_versioned_snapshots: true
        },
        usage_ledger: {
          event_writer: getUsageLedgerEventWriterCapabilities(),
          live_writes: false,
          reconciliation_target_delay_minutes: 5,
          status: "schema_scaffold",
          tables: [
            "core.usage_meter_rule",
            "core.usage_event",
            "core.usage_reconciliation_batch",
            "core.usage_ledger_entry"
          ],
          weighted_credits: true
        },
        version: DATA_ACCESS_GATEWAY_VERSION
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: DATA_ACCESS_GATEWAY_VERSION,
        provenance: [
          {
            data_version: "gateway-scaffold-v0",
            methodology_version: DATA_ACCESS_GATEWAY_VERSION,
            source: "data-access-gateway-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.post("/gateway/field-authorizations/changes/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createFieldAuthorizationConfigChangePlan({
    approvalStatus: normalizeFieldAuthorizationApprovalStatus(
      body.approval_status ?? body.approvalStatus
    ),
    approvedBy: normalizeString(body.approved_by ?? body.approvedBy),
    asOf: normalizeString(body.as_of ?? body.asOf),
    channel: normalizeDataAccessChannel(body.channel),
    dataset: normalizeString(body.dataset),
    effectiveAt: normalizeString(body.effective_at ?? body.effectiveAt),
    expiresAt: normalizeString(body.expires_at ?? body.expiresAt),
    exportAllowed: normalizeOptionalBoolean(body.export_allowed ?? body.exportAllowed),
    fieldPattern: normalizeString(body.field_pattern ?? body.fieldPattern),
    maxWindowDays: normalizeOptionalNumber(body.max_window_days ?? body.maxWindowDays),
    operatorId: normalizeString(body.operator_id ?? body.operatorId),
    plan: normalizeString(body.plan ?? body.plan_code ?? body.planCode),
    policyVersion: normalizeString(body.policy_version ?? body.policyVersion),
    reason: normalizeString(body.reason),
    requestId,
    targetStatus: normalizeDataAccessFieldStatus(body.target_status ?? body.targetStatus),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getFieldAuthorizationConfigCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "field-authorization-config",
            source_record_id: "field-authorization-config-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "blocked_missing_context" ? 0 : 1
        }
      }
    )
  );
});

app.get("/usage/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...getUsageQuotaDisplayCapabilities(),
        billing_rules_release_gate: getBillingRulesReleaseGateCapabilities(),
        billing_reconciliation: getUsageBillingReconciliationCapabilities(),
        high_cost_reservation: getHighCostUsageReservationCapabilities(),
        partner_reconciliation_report: getPartnerReconciliationReportCapabilities(),
        partner_support_release_gate: getPartnerSupportReleaseGateCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "usage-quota-display-scaffold-v0",
        provenance: [
          {
            data_version: "usage-quota-display-scaffold-v0",
            methodology_version: "usage-quota-display-scaffold-v0",
            source: "usage-quota-display-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.post("/usage/release-gates/billing-rules/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createBillingRulesReleaseGatePlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    billingPeriodEnd: normalizeString(body.billing_period_end ?? body.billingPeriodEnd),
    billingPeriodStart: normalizeString(body.billing_period_start ?? body.billingPeriodStart),
    invoiceId: normalizeString(body.invoice_id ?? body.invoiceId),
    planCode: normalizeUsageQuotaPlanCode(body.plan_code ?? body.planCode),
    requestId,
    subscriptionId: normalizeString(body.subscription_id ?? body.subscriptionId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      plan,
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "billing-rules-release-gate",
            source_record_id: "billing-rules-release-gate-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.release_checks.length
        }
      }
    )
  );
});

app.post("/usage/release-gates/partner-support/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createPartnerSupportReleaseGatePlan({
    partnerId: normalizeString(body.partner_id ?? body.partnerId),
    periodEnd: normalizeString(body.period_end ?? body.periodEnd),
    periodStart: normalizeString(body.period_start ?? body.periodStart),
    requestId,
    supportAgentId: normalizeString(body.support_agent_id ?? body.supportAgentId),
    targetRequestId: normalizeString(body.target_request_id ?? body.targetRequestId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      plan,
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "partner-support-release-gate",
            source_record_id: "partner-support-release-gate-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.release_checks.length
        }
      }
    )
  );
});

app.post("/usage/quota/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createUsageQuotaDisplayPlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    channel: normalizeUsageQuotaChannel(body.channel),
    pendingCredits: normalizeOptionalNumber(body.pending_credits ?? body.pendingCredits),
    periodEnd: normalizeString(body.period_end ?? body.periodEnd),
    periodStart: normalizeString(body.period_start ?? body.periodStart),
    planCode: normalizeUsageQuotaPlanCode(body.plan_code ?? body.planCode),
    requestId,
    usedCredits: normalizeOptionalNumber(body.used_credits ?? body.usedCredits),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getUsageQuotaDisplayCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "usage-quota-display",
            source_record_id: "usage-quota-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? 1 : 0
        }
      }
    )
  );
});

app.post("/usage/billing/reconciliation/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createUsageBillingReconciliationPlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    billingPeriodEnd: normalizeString(body.billing_period_end ?? body.billingPeriodEnd),
    billingPeriodStart: normalizeString(body.billing_period_start ?? body.billingPeriodStart),
    currency: normalizeString(body.currency),
    invoiceAmountMinor: normalizeOptionalNumber(body.invoice_amount_minor ?? body.invoiceAmountMinor),
    invoiceCredits: normalizeOptionalNumber(body.invoice_credits ?? body.invoiceCredits),
    invoiceId: normalizeString(body.invoice_id ?? body.invoiceId),
    ledgerEntries: normalizeUsageBillingLedgerEntries(body.ledger_entries ?? body.ledgerEntries),
    requestId,
    subscriptionId: normalizeString(body.subscription_id ?? body.subscriptionId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getUsageBillingReconciliationCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "usage-billing-reconciliation",
            source_record_id: "usage-billing-reconciliation-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.invoice_lines.length
        }
      }
    )
  );
});

app.post("/usage/partner-reconciliation/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createPartnerReconciliationReportPlan({
    cadence: normalizePartnerReconciliationCadence(body.cadence),
    format: normalizePartnerReconciliationFormat(body.format),
    partnerId: normalizeString(body.partner_id ?? body.partnerId),
    periodEnd: normalizeString(body.period_end ?? body.periodEnd),
    periodStart: normalizeString(body.period_start ?? body.periodStart),
    requestId,
    usageRows: normalizePartnerReconciliationUsageRows(body.usage_rows ?? body.usageRows),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getPartnerReconciliationReportCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "partner-reconciliation-report",
            source_record_id: "partner-reconciliation-report-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.rows.length
        }
      }
    )
  );
});

app.post("/usage/high-cost/reservation/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createHighCostUsageReservationPlan({
    estimatedCredits: normalizeOptionalNumber(body.estimated_credits ?? body.estimatedCredits),
    executionStatus: normalizeHighCostUsageExecutionStatus(
      body.execution_status ?? body.executionStatus
    ),
    requestId,
    subscriptionId: normalizeString(body.subscription_id ?? body.subscriptionId),
    taskId: normalizeString(body.task_id ?? body.taskId),
    toolName: normalizeString(body.tool_name ?? body.toolName),
    userConfirmed: normalizeOptionalBoolean(body.user_confirmed ?? body.userConfirmed),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getHighCostUsageReservationCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "high-cost-usage-reservation",
            source_record_id: "high-cost-usage-reservation-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? 1 : 0
        }
      }
    )
  );
});

app.get("/watchlist/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getWatchlistRuntimeCapabilities(), {
      asOf: new Date().toISOString(),
      dataVersion: "watchlist-alerts-scaffold-v0",
      methodologyVersion: "2026-06-21.phase2.watchlist-alerts-scaffold.v0",
      provenance: [
        {
          data_version: "watchlist-alerts-scaffold-v0",
          methodology_version: "2026-06-21.phase2.watchlist-alerts-scaffold.v0",
          source: "watchlist-runtime",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/watchlist/alerts/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as WatchlistAlertsRequestBody;
  const plan = createWatchlistAlertsPlan({
    alertKinds: normalizeWatchlistAlertKinds(body.alert_kinds ?? body.alertKinds),
    channels: normalizeWatchlistAlertChannels(body.channels),
    condition: normalizeWatchlistAlertCondition(body.condition),
    explicitConfirmation: normalizeOptionalBoolean(
      body.explicit_confirmation ?? body.explicitConfirmation
    ),
    frequency: normalizeWatchlistAlertFrequency(body.frequency),
    idempotencyKey: normalizeString(body.idempotency_key ?? body.idempotencyKey),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    metricIds: normalizeStringArray(body.metric_ids ?? body.metricIds),
    quietHoursEnd: normalizeString(body.quiet_hours_end ?? body.quietHoursEnd),
    quietHoursStart: normalizeString(body.quiet_hours_start ?? body.quietHoursStart),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery),
    timezone: normalizeString(body.timezone),
    userId: normalizeString(body.user_id ?? body.userId),
    watchlistId: normalizeString(body.watchlist_id ?? body.watchlistId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getWatchlistRuntimeCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.post("/watchlist/briefings/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as WatchlistBriefingRequestBody;
  const plan = createWatchlistBriefingPlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    cadence: normalizeWatchlistBriefingCadence(body.cadence),
    channels: normalizeWatchlistAlertChannels(body.channels),
    maxItems: normalizeOptionalInteger(body.max_items ?? body.maxItems),
    minMaterialityScore: normalizeOptionalNumber(
      body.min_materiality_score ?? body.minMaterialityScore
    ),
    requestId,
    timezone: normalizeString(body.timezone),
    userId: normalizeString(body.user_id ?? body.userId),
    watchlistId: normalizeString(body.watchlist_id ?? body.watchlistId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getWatchlistBriefingCapabilities()
      },
      {
        asOf: plan.as_of,
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.get("/analytics/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const capability = getCompareSecuritiesCapabilities();
  const screenCapability = getScreenSecuritiesCapabilities();
  const financialRatiosCapability = getFinancialRatiosCapabilities();
  const returnsRiskCapability = getReturnsRiskCapabilities();
  const eventStudyCapability = getEventStudyCapabilities();
  const percentileComparisonCapability = getPercentileComparisonCapabilities();
  const highCostAnalyticsQueueCapability = getHighCostAnalyticsQueueCapabilities();

  return c.json(
    createSuccessEnvelope(
      {
        package: "@aiphabee/analytics-tools",
        compare_securities: capability,
        event_study: eventStudyCapability,
        financial_ratios: financialRatiosCapability,
        high_cost_analytics_queue: highCostAnalyticsQueueCapability,
        percentile_comparison: percentileComparisonCapability,
        returns_risk: returnsRiskCapability,
        screen_securities: screenCapability,
        frontend_rendering: false,
        live_data_access: false,
        route: capability.route,
        routes: [
          capability.route,
          screenCapability.route,
          financialRatiosCapability.route,
          returnsRiskCapability.route,
          eventStudyCapability.route,
          percentileComparisonCapability.route,
          highCostAnalyticsQueueCapability.route
        ],
        status: "analytics_tools_scaffold"
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: capability.version,
        methodologyVersion: capability.version,
        provenance: [
          {
            data_version: capability.version,
            methodology_version: capability.version,
            source: "analytics-tools-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.post("/analytics/high-cost/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const toolName = normalizeString(body.tool_name ?? body.toolName);
  const userConfirmed = normalizeOptionalBoolean(body.user_confirmed ?? body.userConfirmed);
  const plan = planHighCostAnalyticsQueue({
    eventCount: normalizeOptionalInteger(body.event_count ?? body.eventCount),
    eventWindowDays: normalizeOptionalInteger(
      body.event_window_days ?? body.eventWindowDays
    ),
    metricCount: normalizeOptionalInteger(body.metric_count ?? body.metricCount),
    requestId,
    securities: normalizeStringArray(body.securities),
    toolName,
    universeSize: normalizeOptionalInteger(body.universe_size ?? body.universeSize),
    userConfirmed
  });
  const usageReservation = createHighCostUsageReservationPlan({
    estimatedCredits: plan.cost_estimate.credit_weight,
    executionStatus: normalizeHighCostUsageExecutionStatus(
      body.execution_status ?? body.executionStatus
    ),
    requestId,
    subscriptionId: normalizeString(body.subscription_id ?? body.subscriptionId),
    taskId: plan.enqueue_plan.planned_task_id ?? plan.enqueue_plan.queue_key,
    toolName,
    userConfirmed,
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getHighCostAnalyticsQueueCapabilities(),
        usage_reservation: usageReservation
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: [
          {
            data_version: plan.data_version,
            methodology_version: plan.methodology_version,
            source: "analytics-high-cost-plan",
            source_record_id: "high-cost-analytics-queue"
          }
        ],
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.post("/analytics/event-study", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const eventStudy = runEventStudy({
    adjustment: normalizeString(body.adjustment),
    asOf: normalizeString(body.as_of ?? body.asOf),
    benchmarkInstrumentId: normalizeString(
      body.benchmark_instrument_id ?? body.benchmarkInstrumentId
    ),
    benchmarkSecurityQuery: normalizeString(
      body.benchmark_security_query ?? body.benchmarkSecurityQuery
    ),
    eventDate: normalizeString(body.event_date ?? body.eventDate),
    eventId: normalizeString(body.event_id ?? body.eventId),
    eventLabel: normalizeString(body.event_label ?? body.eventLabel),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery),
    windowPostDays: normalizeOptionalInteger(
      body.window_post_days ?? body.windowPostDays
    ),
    windowPreDays: normalizeOptionalInteger(body.window_pre_days ?? body.windowPreDays)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...eventStudy,
        capability: getEventStudyCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: eventStudy.data_version,
        methodologyVersion: eventStudy.methodology_version,
        provenance: [
          {
            data_version: eventStudy.data_version,
            methodology_version: eventStudy.methodology_version,
            source: "analytics-event-study",
            source_record_id: "event-study"
          }
        ],
        requestId,
        usage: eventStudy.usage
      }
    )
  );
});

app.post("/analytics/percentile-comparison", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const comparison = comparePercentiles({
    asOf: normalizeString(body.as_of ?? body.asOf),
    benchmarkTypes: normalizePercentileBenchmarkTypes(
      body.benchmark_types ?? body.benchmarkTypes
    ),
    financialFrom: normalizeString(body.financial_from ?? body.financialFrom),
    financialTo: normalizeString(body.financial_to ?? body.financialTo),
    from: normalizeString(body.from),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    metricId: normalizePercentileMetricId(body.metric_id ?? body.metricId),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery),
    to: normalizeString(body.to)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...comparison,
        capability: getPercentileComparisonCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: comparison.data_version,
        methodologyVersion: comparison.methodology_version,
        provenance: [
          {
            data_version: comparison.data_version,
            methodology_version: comparison.methodology_version,
            source: "analytics-percentile-comparison",
            source_record_id: "percentile-comparison"
          }
        ],
        requestId,
        usage: comparison.usage
      }
    )
  );
});

app.post("/analytics/returns-risk", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const returnsRisk = calculateReturnsRisk({
    adjustment: normalizeString(body.adjustment),
    asOf: normalizeString(body.as_of ?? body.asOf),
    benchmarkInstrumentId: normalizeString(
      body.benchmark_instrument_id ?? body.benchmarkInstrumentId
    ),
    benchmarkSecurityQuery: normalizeString(
      body.benchmark_security_query ?? body.benchmarkSecurityQuery
    ),
    from: normalizeString(body.from),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery),
    to: normalizeString(body.to)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...returnsRisk,
        capability: getReturnsRiskCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: returnsRisk.data_version,
        methodologyVersion: returnsRisk.methodology_version,
        provenance: [
          {
            data_version: returnsRisk.data_version,
            methodology_version: returnsRisk.methodology_version,
            source: "analytics-returns-risk",
            source_record_id: "returns-risk"
          }
        ],
        requestId,
        usage: returnsRisk.usage
      }
    )
  );
});

app.post("/analytics/financial-ratios", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const ratios = getFinancialRatios({
    asOf: normalizeString(body.as_of ?? body.asOf),
    financialFrom: normalizeString(body.financial_from ?? body.financialFrom),
    financialTo: normalizeString(body.financial_to ?? body.financialTo),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...ratios,
        capability: getFinancialRatiosCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: ratios.data_version,
        methodologyVersion: ratios.methodology_version,
        provenance: [
          {
            data_version: ratios.data_version,
            methodology_version: ratios.methodology_version,
            source: "analytics-financial-ratios",
            source_record_id: "financial-ratios"
          }
        ],
        requestId,
        usage: ratios.usage
      }
    )
  );
});

app.post("/analytics/screen-securities", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const screen = screenSecurities({
    asOf: normalizeString(body.as_of ?? body.asOf),
    classificationAsOf: normalizeString(body.classification_as_of ?? body.classificationAsOf),
    conditions: normalizeScreenConditionInputs(body.conditions),
    financialFrom: normalizeString(body.financial_from ?? body.financialFrom),
    financialTo: normalizeString(body.financial_to ?? body.financialTo),
    naturalLanguage: normalizeString(
      body.natural_language ?? body.naturalLanguage ?? body.query
    ),
    requestId,
    universe: normalizeStringArray(body.universe)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...screen,
        capability: getScreenSecuritiesCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: screen.data_version,
        methodologyVersion: screen.methodology_version,
        provenance: [
          {
            data_version: screen.data_version,
            methodology_version: screen.methodology_version,
            source: "analytics-screen-securities",
            source_record_id: "screen-securities"
          }
        ],
        requestId,
        usage: screen.usage
      }
    )
  );
});

app.post("/analytics/compare-securities", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const comparison = compareSecurities({
    asOf: normalizeString(body.as_of ?? body.asOf),
    financialFrom: normalizeString(body.financial_from ?? body.financialFrom),
    financialTo: normalizeString(body.financial_to ?? body.financialTo),
    requestId,
    securities: normalizeStringArray(body.securities) ?? [],
    targetCurrency: normalizeString(body.target_currency ?? body.targetCurrency)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...comparison,
        capability: getCompareSecuritiesCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: comparison.data_version,
        methodologyVersion: comparison.methodology_version,
        provenance: [
          {
            data_version: comparison.data_version,
            methodology_version: comparison.methodology_version,
            source: "analytics-compare-securities",
            source_record_id: "compare-securities"
          }
        ],
        requestId,
        usage: comparison.usage
      }
    )
  );
});

app.get("/workbench/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getStockWorkbenchCapabilities(), {
      asOf: new Date().toISOString(),
      methodologyVersion: "stock-workbench-aggregate-scaffold-v0",
      provenance: [
        {
          data_version: "stock-workbench-aggregate-scaffold-v0",
          methodology_version: "stock-workbench-aggregate-scaffold-v0",
          source: "workbench-contract",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/workbench/stock/snapshot", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const snapshot = createStockWorkbenchSnapshot({
    adjustment: normalizeWorkbenchAdjustment(body.adjustment),
    announcementCategories: normalizeStringArray(
      body.announcement_categories ?? body.announcementCategories
    ),
    announcementFrom: normalizeString(body.announcement_from ?? body.announcementFrom),
    announcementKeyword: normalizeString(body.announcement_keyword ?? body.announcementKeyword),
    announcementLimit: normalizeOptionalInteger(
      body.announcement_limit ?? body.announcementLimit
    ),
    announcementTo: normalizeString(body.announcement_to ?? body.announcementTo),
    asOf: normalizeString(body.as_of ?? body.asOf),
    corporateActionsFrom: normalizeString(
      body.corporate_actions_from ?? body.corporateActionsFrom
    ),
    corporateActionsTo: normalizeString(body.corporate_actions_to ?? body.corporateActionsTo),
    financialFrom: normalizeString(body.financial_from ?? body.financialFrom),
    financialTo: normalizeString(body.financial_to ?? body.financialTo),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    priceFrom: normalizeString(body.price_from ?? body.priceFrom),
    priceTo: normalizeString(body.price_to ?? body.priceTo),
    quoteMode: normalizeQuoteSnapshotMode(body.quote_mode ?? body.quoteMode),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery)
  });
  const rows =
    snapshot.security_profile.usage.rows +
    snapshot.quote_snapshot.usage.rows +
    snapshot.price_history.usage.rows +
    snapshot.financial_facts.usage.rows +
    snapshot.derived_metrics.usage.rows +
    snapshot.announcement_search.usage.rows +
    snapshot.corporate_actions.usage.rows;
  const credits =
    snapshot.security_profile.usage.credits +
    snapshot.quote_snapshot.usage.credits +
    snapshot.price_history.usage.credits +
    snapshot.financial_facts.usage.credits +
    snapshot.derived_metrics.usage.credits +
    snapshot.announcement_search.usage.credits +
    snapshot.corporate_actions.usage.credits;

  return c.json(
    createSuccessEnvelope(
      {
        ...snapshot,
        capability: getStockWorkbenchCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: snapshot.version,
        methodologyVersion: snapshot.version,
        provenance: [
          {
            data_version: snapshot.version,
            methodology_version: snapshot.version,
            source: "workbench-stock-snapshot",
            source_record_id: "stock-workbench-snapshot"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits,
          rows
        }
      }
    )
  );
});

app.post("/workbench/stock/announcements", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const announcementSearch = createStockWorkbenchAnnouncementSearch({
    asOf: normalizeString(body.as_of ?? body.asOf),
    categories: normalizeStringArray(body.categories ?? body.announcement_categories),
    from: normalizeString(body.from ?? body.announcement_from),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    keyword: normalizeString(body.keyword ?? body.announcement_keyword),
    limit: normalizeOptionalInteger(body.limit ?? body.announcement_limit),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery),
    to: normalizeString(body.to ?? body.announcement_to)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...announcementSearch,
        capability: getStockWorkbenchCapabilities().announcement_search
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: announcementSearch.data_version,
        methodologyVersion: announcementSearch.methodology_version,
        provenance: [
          {
            data_version: announcementSearch.data_version,
            methodology_version: announcementSearch.methodology_version,
            source: "workbench-announcement-search",
            source_record_id: "stock-workbench-announcement-search"
          }
        ],
        requestId,
        usage: announcementSearch.usage
      }
    )
  );
});

app.get("/documents/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const capabilities = getDocumentToolsCapabilities();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(capabilities, {
      asOf: new Date().toISOString(),
      dataVersion: capabilities.version,
      methodologyVersion: capabilities.version,
      provenance: [
        {
          data_version: capabilities.version,
          methodology_version: capabilities.version,
          source: "document-tools-contract",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/documents/search-announcements", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = searchAnnouncements({
    asOf: normalizeString(body.as_of ?? body.asOf),
    categories: normalizeStringArray(body.categories ?? body.announcement_categories),
    from: normalizeString(body.from ?? body.published_from ?? body.publishedFrom),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    keyword: normalizeString(body.keyword ?? body.query),
    language: normalizeString(body.language),
    limit: normalizeOptionalInteger(body.limit),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery),
    to: normalizeString(body.to ?? body.published_to ?? body.publishedTo)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...result,
        capability: getSearchAnnouncementsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: result.data_version,
        methodologyVersion: result.methodology_version,
        provenance: [
          {
            data_version: result.data_version,
            methodology_version: result.methodology_version,
            source: "document-search-announcements",
            source_record_id: "search-announcements"
          }
        ],
        requestId,
        usage: result.usage
      }
    )
  );
});

app.post("/documents/get-announcement", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = getAnnouncement({
    documentId: normalizeString(body.document_id ?? body.documentId),
    maxExcerptChars: normalizeOptionalInteger(
      body.max_excerpt_chars ?? body.maxExcerptChars
    ),
    requestId,
    sections: normalizeStringArray(body.sections)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...result,
        capability: getAnnouncementCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: result.data_version,
        methodologyVersion: result.methodology_version,
        provenance: [
          {
            data_version: result.data_version,
            methodology_version: result.methodology_version,
            source: "document-get-announcement",
            source_record_id: result.source?.source_record_id ?? "get-announcement"
          }
        ],
        requestId,
        usage: result.usage
      }
    )
  );
});

app.post("/documents/search-documents", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = searchDocuments({
    asOf: normalizeString(body.as_of ?? body.asOf),
    categories: normalizeStringArray(body.categories ?? body.document_categories),
    documentIds: normalizeStringArray(body.document_ids ?? body.documentIds),
    from: normalizeString(body.from ?? body.published_from ?? body.publishedFrom),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    language: normalizeString(body.language),
    limit: normalizeOptionalInteger(body.limit),
    minScore: normalizeOptionalNumber(body.min_score ?? body.minScore),
    query: normalizeString(body.query ?? body.semantic_query ?? body.semanticQuery),
    requestId,
    to: normalizeString(body.to ?? body.published_to ?? body.publishedTo)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...result,
        capability: getSearchDocumentsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: result.data_version,
        methodologyVersion: result.methodology_version,
        provenance: [
          {
            data_version: result.data_version,
            methodology_version: result.methodology_version,
            source: "document-search-documents",
            source_record_id: "search-documents"
          }
        ],
        requestId,
        usage: result.usage
      }
    )
  );
});

app.post("/documents/diff-announcements", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = diffAnnouncements({
    asOf: normalizeString(body.as_of ?? body.asOf),
    baseDocumentId: normalizeString(body.base_document_id ?? body.baseDocumentId),
    comparisonDocumentId: normalizeString(
      body.comparison_document_id ?? body.comparisonDocumentId
    ),
    requestId,
    sections: normalizeStringArray(body.sections)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...result,
        capability: getDiffAnnouncementsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: result.data_version,
        methodologyVersion: result.methodology_version,
        provenance: [
          {
            data_version: result.data_version,
            methodology_version: result.methodology_version,
            source: "document-diff-announcements",
            source_record_id:
              result.documents.comparison?.source_record_id ??
              result.documents.base?.source_record_id ??
              "diff-announcements"
          }
        ],
        requestId,
        usage: result.usage
      }
    )
  );
});

app.get("/research/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getResearchRuntimeCapabilities(), {
      asOf: new Date().toISOString(),
      dataVersion: "research-run-save-scaffold-v0",
      methodologyVersion: "2026-06-21.phase2.research-run-save-scaffold.v0",
      provenance: [
        {
          data_version: "research-run-save-scaffold-v0",
          methodology_version: "2026-06-21.phase2.research-run-save-scaffold.v0",
          source: "research-runtime",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/research/data-corrections/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as DataCorrectionNotificationRequestBody;
  const plan = createDataCorrectionNotificationPlan({
    affectedRuns: normalizeResearchSavedRuns(body.affected_runs ?? body.affectedRuns),
    asOf: normalizeString(body.as_of ?? body.asOf),
    corrections: normalizeDataCorrectionInputs(body.corrections),
    notificationChannels: normalizeDataCorrectionNotificationChannels(
      body.notification_channels ?? body.notificationChannels
    ),
    requestId,
    userId: normalizeString(body.user_id ?? body.userId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getDataCorrectionNotificationCapabilities()
      },
      {
        asOf: plan.as_of,
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.post("/research/golden-correction-rollback-drill/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as GoldenCorrectionRollbackDrillRequestBody;
  const correction = normalizeDataCorrectionInputs(
    body.correction === undefined ? undefined : [body.correction]
  )?.[0];
  const plan = createGoldenCorrectionRollbackDrillPlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    correction,
    goldenManifestVersion: normalizeString(
      body.golden_manifest_version ?? body.goldenManifestVersion
    ),
    goldenSampleCount: normalizeOptionalNumber(
      body.golden_sample_count ?? body.goldenSampleCount
    ),
    notificationChannels: normalizeDataCorrectionNotificationChannels(
      body.notification_channels ?? body.notificationChannels
    ),
    qualityRuleCount: normalizeOptionalNumber(
      body.quality_rule_count ?? body.qualityRuleCount
    ),
    requestId,
    rollbackReason: normalizeString(body.rollback_reason ?? body.rollbackReason),
    toolGoldenSampleCount: normalizeOptionalNumber(
      body.tool_golden_sample_count ?? body.toolGoldenSampleCount
    ),
    userId: normalizeString(body.user_id ?? body.userId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getGoldenCorrectionRollbackDrillCapabilities()
      },
      {
        asOf: plan.as_of,
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.post("/research/runs/save/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createResearchRunSavePlan({
      answerHash: normalizeString(body.answer_hash ?? body.answerHash),
      asOf: normalizeString(body.as_of ?? body.asOf),
      channel: normalizeResearchChannel(body.channel),
      evidenceRecords: normalizeResearchEvidenceRecords(
        body.evidence_records ?? body.evidenceRecords
      ),
      modelProvider: normalizeString(body.model_provider ?? body.modelProvider),
      modelVersion: normalizeString(body.model_version ?? body.modelVersion),
      parameters: normalizeResearchParameters(body.parameters),
      promptTemplateId: normalizeString(
        body.prompt_template_id ?? body.promptTemplateId
      ),
      promptVersion: normalizeString(body.prompt_version ?? body.promptVersion),
      question: normalizeString(body.question),
      requestId,
      runId: normalizeString(body.run_id ?? body.runId),
      toolCalls: normalizeResearchToolCalls(body.tool_calls ?? body.toolCalls),
      userId: normalizeString(body.user_id ?? body.userId),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getResearchRuntimeCapabilities()
        },
        {
          asOf: result.as_of,
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof ResearchRunInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          dataVersion: "research-run-save-scaffold-v0",
          methodologyVersion:
            "2026-06-21.phase2.research-run-save-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "research run save plan failed", {
        asOf: new Date().toISOString(),
        dataVersion: "research-run-save-scaffold-v0",
        methodologyVersion: "2026-06-21.phase2.research-run-save-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/research/runs/replay/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createResearchRunReplayPlan({
      currentRun: normalizeResearchReplayCurrentRun(
        body.current_run ?? body.currentRun
      ),
      replayReason: normalizeString(body.replay_reason ?? body.replayReason),
      requestId,
      savedRun: normalizeResearchSavedRun(body.saved_run ?? body.savedRun)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getResearchRuntimeCapabilities()
        },
        {
          asOf: result.as_of,
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof ResearchRunInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          dataVersion: "research-run-replay-scaffold-v0",
          methodologyVersion:
            "2026-06-21.phase2.research-run-replay-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "research run replay plan failed", {
        asOf: new Date().toISOString(),
        dataVersion: "research-run-replay-scaffold-v0",
        methodologyVersion: "2026-06-21.phase2.research-run-replay-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/research/reports/deep/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const question = normalizeString(body.question ?? body.prompt);

  try {
    if (question === undefined) {
      throw new ResearchRunInputError("QUESTION_REQUIRED", "question is required");
    }

    const requestedTools =
      normalizeStringArray(body.tools) ?? [...DEFAULT_DEEP_REPORT_WORKFLOW_TOOLS];
    const workflowTask = createWorkflowTaskPlan({
      ...createAgentRunInput(
        {
          ...body,
          max_steps:
            normalizeOptionalInteger(body.max_steps) ?? DEFAULT_DEEP_REPORT_WORKFLOW_TOOLS.length,
          prompt: question,
          tools: requestedTools,
          workflow_kind: "deep_report"
        },
        requestId
      ),
      notificationChannels: normalizeAgentWorkflowNotificationChannels(
        body.notification_channels ?? body.notificationChannels
      ),
      workflowKind: "deep_report"
    });
    const plan = createDeepReportWorkflowPlan({
      asOf: normalizeString(body.as_of ?? body.asOf),
      dataDelayMinutes: normalizeOptionalInteger(
        body.data_delay_minutes ?? body.dataDelayMinutes
      ),
      modelVersion: normalizeString(body.model_version ?? body.modelVersion),
      promptVersion: normalizeString(body.prompt_version ?? body.promptVersion),
      question,
      reportId: normalizeString(body.report_id ?? body.reportId),
      requestId,
      sections: normalizeStringArray(body.sections),
      securityQuery: normalizeString(body.security_query ?? body.securityQuery),
      userId: normalizeString(body.user_id ?? body.userId),
      workflowTaskId: workflowTask.task_id,
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    c.header("x-aiphabee-workflow-task-id", workflowTask.task_id);
    c.header("x-aiphabee-deep-report-id", plan.report_id);

    return c.json(
      createSuccessEnvelope(
        {
          ...plan,
          capability: getDeepReportWorkflowCapabilities(),
          workflow_task: workflowTask
        },
        {
          asOf: plan.as_of,
          dataVersion: plan.data_version,
          methodologyVersion: plan.methodology_version,
          provenance: plan.provenance,
          requestId,
          usage: plan.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof ResearchRunInputError || error instanceof AgentRuntimeInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          dataVersion: "deep-report-workflow-scaffold-v0",
          methodologyVersion: "2026-06-21.phase2.deep-report-workflow-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "deep report workflow planning failed", {
        asOf: new Date().toISOString(),
        dataVersion: "deep-report-workflow-scaffold-v0",
        methodologyVersion: "2026-06-21.phase2.deep-report-workflow-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/research/reports/static/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createStaticReportPlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    dataDelayMinutes: normalizeOptionalInteger(body.data_delay_minutes ?? body.dataDelayMinutes),
    dataVersion: normalizeString(body.data_version ?? body.dataVersion),
    disclaimer: normalizeString(body.disclaimer),
    format: normalizeString(body.format),
    generatedAt: normalizeString(body.generated_at ?? body.generatedAt),
    methodologyVersion: normalizeString(body.methodology_version ?? body.methodologyVersion),
    reportId: normalizeString(body.report_id ?? body.reportId),
    requestId,
    rightsPolicyVersion: normalizeString(
      body.rights_policy_version ?? body.rightsPolicyVersion
    ),
    scopes: normalizeStringArray(body.scopes) ?? [],
    sections: normalizeStringArray(body.sections),
    sourceRunId: normalizeString(body.source_run_id ?? body.sourceRunId),
    title: normalizeString(body.title),
    userId: normalizeString(body.user_id ?? body.userId),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getStaticReportCapabilities()
      },
      {
        asOf: plan.metadata.as_of,
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.get("/mcp/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getMcpRuntimeCapabilities(), {
      asOf: new Date().toISOString(),
      dataVersion: "mcp-endpoint-default-deny-scaffold-v0",
      methodologyVersion:
        "2026-06-21.phase2.mcp-endpoint-default-deny-scaffold.v0",
      provenance: [
        {
          data_version: "mcp-endpoint-default-deny-scaffold-v0",
          methodology_version:
            "2026-06-21.phase2.mcp-endpoint-default-deny-scaffold.v0",
          source: "mcp-runtime",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.get("/mcp/compatibility/status", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const plan = createMcpCompatibilityStatusPlan({ requestId });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getMcpCompatibilityStatusCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.post("/mcp/release-gates/protocol/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpProtocolReleaseGatePlan({
      clientName: normalizeString(body.client_name ?? body.clientName),
      clientVersion: normalizeString(body.client_version ?? body.clientVersion),
      origin: c.req.header("origin") ?? normalizeString(body.origin),
      pendingCredits: normalizeOptionalNumber(body.pending_credits ?? body.pendingCredits),
      requestId,
      usagePlanCode: normalizeUsageQuotaPlanCode(body.plan_code ?? body.planCode),
      usedCredits: normalizeOptionalNumber(body.used_credits ?? body.usedCredits),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpProtocolReleaseGateCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(
      c,
      error,
      requestId,
      "MCP protocol release gate plan failed",
      {
        dataVersion: "mcp-protocol-release-gate-scaffold-v0",
        methodologyVersion: "2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0",
        source: "mcp-runtime"
      }
    );
  }
});

app.post("/mcp/release-gates/auth-limits/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpAuthLimitsReleaseGatePlan({
      origin: c.req.header("origin") ?? normalizeString(body.origin),
      pendingCredits: normalizeOptionalNumber(body.pending_credits ?? body.pendingCredits),
      requestId,
      usagePlanCode: normalizeUsageQuotaPlanCode(body.plan_code ?? body.planCode),
      usedCredits: normalizeOptionalNumber(body.used_credits ?? body.usedCredits),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpAuthLimitsReleaseGateCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(
      c,
      error,
      requestId,
      "MCP auth and limits release gate plan failed",
      {
        dataVersion: "mcp-auth-limits-release-gate-scaffold-v0",
        methodologyVersion: "2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0",
        source: "mcp-runtime"
      }
    );
  }
});

app.post("/mcp/release-gates/target-clients-console/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpTargetClientsConsoleReleaseGatePlan({
      clientName: normalizeString(body.client_name ?? body.clientName),
      clientVersion: normalizeString(body.client_version ?? body.clientVersion),
      origin: c.req.header("origin") ?? normalizeString(body.origin),
      pendingCredits: normalizeOptionalNumber(body.pending_credits ?? body.pendingCredits),
      requestId,
      usagePlanCode: normalizeUsageQuotaPlanCode(body.plan_code ?? body.planCode),
      usedCredits: normalizeOptionalNumber(body.used_credits ?? body.usedCredits),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpTargetClientsConsoleReleaseGateCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(
      c,
      error,
      requestId,
      "MCP target clients and Console release gate plan failed",
      {
        dataVersion: "mcp-target-clients-console-release-gate-scaffold-v0",
        methodologyVersion:
          "2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0",
        source: "mcp-runtime"
      }
    );
  }
});

app.get("/mcp/oauth/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getMcpOAuthCapabilities(), {
      asOf: new Date().toISOString(),
      dataVersion: "mcp-oauth-pkce-scaffold-v0",
      methodologyVersion: "2026-06-21.phase2.mcp-oauth-pkce-scaffold.v0",
      provenance: [
        {
          data_version: "mcp-oauth-pkce-scaffold-v0",
          methodology_version: "2026-06-21.phase2.mcp-oauth-pkce-scaffold.v0",
          source: "mcp-oauth-pkce",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/mcp/oauth/authorize/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpOAuthAuthorizePlan({
      clientId: normalizeString(body.client_id ?? body.clientId),
      codeChallenge: normalizeString(body.code_challenge ?? body.codeChallenge),
      codeChallengeMethod: normalizeString(
        body.code_challenge_method ?? body.codeChallengeMethod
      ),
      origin: c.req.header("origin") ?? undefined,
      redirectUri: normalizeString(body.redirect_uri ?? body.redirectUri),
      requestId,
      requestedScopes: normalizeStringArray(body.scopes ?? body.requested_scopes),
      userId: normalizeString(body.user_id ?? body.userId),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpOAuthCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(c, error, requestId, "MCP OAuth authorize plan failed");
  }
});

app.post("/mcp/oauth/token/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpOAuthTokenPlan({
      authorizationCode: normalizeString(
        body.authorization_code ?? body.authorizationCode
      ),
      clientId: normalizeString(body.client_id ?? body.clientId),
      codeVerifier: normalizeString(body.code_verifier ?? body.codeVerifier),
      requestId,
      requestedScopes: normalizeStringArray(body.scopes ?? body.requested_scopes)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpOAuthCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(c, error, requestId, "MCP OAuth token plan failed");
  }
});

app.post("/mcp/oauth/revoke/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpOAuthRevokePlan({
      connectionId: normalizeString(body.connection_id ?? body.connectionId),
      reason: normalizeString(body.reason),
      requestId,
      tokenId: normalizeString(body.token_id ?? body.tokenId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpOAuthCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(c, error, requestId, "MCP OAuth revoke plan failed");
  }
});

app.get("/mcp/api-keys/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getMcpApiKeyCapabilities(), {
      asOf: new Date().toISOString(),
      dataVersion: "mcp-api-key-scaffold-v0",
      methodologyVersion: "2026-06-21.phase2.mcp-api-key-scaffold.v0",
      provenance: [
        {
          data_version: "mcp-api-key-scaffold-v0",
          methodology_version: "2026-06-21.phase2.mcp-api-key-scaffold.v0",
          source: "mcp-api-key",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/mcp/api-keys/create/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpApiKeyCreatePlan({
      ipAllowlist: normalizeStringArray(body.ip_allowlist ?? body.ipAllowlist),
      keyName: normalizeString(body.key_name ?? body.keyName),
      ownerId: normalizeString(body.owner_id ?? body.ownerId),
      rawApiKey: normalizeString(body.raw_api_key ?? body.rawApiKey ?? body.api_key),
      requestId,
      requestedScopes: normalizeStringArray(body.scopes ?? body.requested_scopes),
      rotationAfterDays: normalizeOptionalInteger(
        body.rotation_after_days ?? body.rotationAfterDays
      ),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpApiKeyCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(c, error, requestId, "MCP API key create plan failed", {
      dataVersion: "mcp-api-key-scaffold-v0",
      methodologyVersion: "2026-06-21.phase2.mcp-api-key-scaffold.v0",
      source: "mcp-api-key"
    });
  }
});

app.post("/mcp/api-keys/rotate/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpApiKeyRotatePlan({
      ipAllowlist: normalizeStringArray(body.ip_allowlist ?? body.ipAllowlist),
      keyId: normalizeString(body.key_id ?? body.keyId),
      rawApiKey: normalizeString(body.raw_api_key ?? body.rawApiKey ?? body.api_key),
      reason: normalizeString(body.reason),
      requestId,
      requestedScopes: normalizeStringArray(body.scopes ?? body.requested_scopes),
      rotationAfterDays: normalizeOptionalInteger(
        body.rotation_after_days ?? body.rotationAfterDays
      )
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpApiKeyCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(c, error, requestId, "MCP API key rotate plan failed", {
      dataVersion: "mcp-api-key-scaffold-v0",
      methodologyVersion: "2026-06-21.phase2.mcp-api-key-scaffold.v0",
      source: "mcp-api-key"
    });
  }
});

app.post("/mcp/api-keys/revoke/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpApiKeyRevokePlan({
      keyId: normalizeString(body.key_id ?? body.keyId),
      rawApiKey: normalizeString(body.raw_api_key ?? body.rawApiKey ?? body.api_key),
      reason: normalizeString(body.reason),
      requestId
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpApiKeyCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(c, error, requestId, "MCP API key revoke plan failed", {
      dataVersion: "mcp-api-key-scaffold-v0",
      methodologyVersion: "2026-06-21.phase2.mcp-api-key-scaffold.v0",
      source: "mcp-api-key"
    });
  }
});

app.post("/mcp/revocations/enforce/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as McpRevocationEnforcementRequestBody;

  try {
    const result = createMcpRevocationEnforcementPlan({
      connectionId: normalizeString(body.connection_id ?? body.connectionId),
      credentialKind: normalizeString(body.credential_kind ?? body.credentialKind),
      credentialStatus: normalizeString(body.credential_status ?? body.credentialStatus),
      keyId: normalizeString(body.key_id ?? body.keyId),
      method: normalizeString(body.method),
      reason: normalizeString(body.reason),
      requestId,
      revokedAt: normalizeString(body.revoked_at ?? body.revokedAt),
      rotatedAt: normalizeString(body.rotated_at ?? body.rotatedAt),
      toolName: normalizeString(body.tool_name ?? body.toolName)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpRevocationEnforcementCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    return handleMcpRuntimeError(
      c,
      error,
      requestId,
      "MCP revocation enforcement plan failed",
      {
        dataVersion: "mcp-revocation-enforcement-scaffold-v0",
        methodologyVersion: "2026-06-21.phase2.mcp-revocation-enforcement-scaffold.v0",
        source: "mcp-revocation-enforcement"
      }
    );
  }
});

app.post("/mcp", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const params = isPlainRecord(body.params) ? body.params : {};

  try {
    const result = createMcpProtocolPlan({
      accountId: normalizeString(params.account_id ?? params.accountId),
      clientIp: normalizeString(
        c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")
      ),
      clientName: normalizeString(params.client_name ?? params.clientName),
      clientVersion: normalizeString(params.client_version ?? params.clientVersion),
      connectionId: normalizeString(params.connection_id ?? params.connectionId),
      credentialKind: normalizeString(params.credential_kind ?? params.credentialKind),
      credentialStatus: normalizeString(params.credential_status ?? params.credentialStatus),
      grantedScopes: [],
      ipRiskLevel: normalizeString(
        params.ip_risk ?? params.ipRisk ?? c.req.header("x-aiphabee-ip-risk")
      ),
      keyId: normalizeString(params.key_id ?? params.keyId),
      membershipId: normalizeString(params.membership_id ?? params.membershipId),
      method: normalizeString(body.method),
      mcpRedistributionRightsConfirmed: false,
      origin: c.req.header("origin") ?? undefined,
      pendingCredits: normalizeOptionalNumber(params.pending_credits ?? params.pendingCredits),
      requestId,
      requestedScopes: normalizeStringArray(params.scopes ?? body.scopes),
      revocationReason: normalizeString(params.revocation_reason ?? params.revocationReason),
      revokedAt: normalizeString(params.revoked_at ?? params.revokedAt),
      rotatedAt: normalizeString(params.rotated_at ?? params.rotatedAt),
      subscriptionId: normalizeString(params.subscription_id ?? params.subscriptionId),
      toolArguments: params.arguments,
      toolName: normalizeString(params.name ?? params.tool_name ?? params.toolName),
      usagePlanCode: normalizeUsageQuotaPlanCode(params.plan_code ?? params.planCode),
      usedCredits: normalizeOptionalNumber(params.used_credits ?? params.usedCredits),
      workspaceId: normalizeString(params.workspace_id ?? params.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpRuntimeCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.data_version,
          methodologyVersion: result.methodology_version,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof McpRuntimeInputError) {
      const status = statusForMcpRuntimeError(error);

      return c.json(
        createMcpRuntimeErrorEnvelope(
          error,
          requestId,
          {
            dataVersion: "mcp-endpoint-default-deny-scaffold-v0",
            methodologyVersion:
              "2026-06-21.phase2.mcp-endpoint-default-deny-scaffold.v0",
            source: "mcp-runtime"
          },
          {
            cached: false,
            credits: 0,
            rows: 0
          }
        ),
        status
      );
    }

    return c.json(
      createMcpInternalErrorEnvelope(
        "MCP protocol plan failed",
        requestId,
        {
          dataVersion: "mcp-endpoint-default-deny-scaffold-v0",
          methodologyVersion:
            "2026-06-21.phase2.mcp-endpoint-default-deny-scaffold.v0",
          source: "mcp-runtime"
        },
        {
          cached: false,
          credits: 0,
          rows: 0
        }
      ),
      500
    );
  }
});

app.post("/gateway/access-check", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    channel?: unknown;
    dataset?: unknown;
    fields?: unknown;
    export_requested?: unknown;
    account_id?: unknown;
    plan?: unknown;
    quality_state?: unknown;
    requested_rows?: unknown;
    run_id?: unknown;
    membership_id?: unknown;
    subscription_id?: unknown;
    time_range?: unknown;
    workspace_id?: unknown;
  };
  const requestedFields = Array.isArray(body.fields)
    ? body.fields.filter((field): field is string => typeof field === "string")
    : ["quote.close"];
  const decision = evaluateDataAccessRequest({
    channel: isDataAccessChannel(body.channel) ? body.channel : "mcp",
    dataset: typeof body.dataset === "string" ? body.dataset : "hk_equity_quote",
    exportRequested:
      typeof body.export_requested === "boolean" ? body.export_requested : false,
    accountId: typeof body.account_id === "string" ? body.account_id : undefined,
    membershipId: typeof body.membership_id === "string" ? body.membership_id : undefined,
    occurredAt: new Date().toISOString(),
    plan: typeof body.plan === "string" ? body.plan : "free",
    qualityState: isQualityState(body.quality_state) ? body.quality_state : "PASS",
    requestId,
    requestedFields,
    requestedRows: typeof body.requested_rows === "number" ? body.requested_rows : 1,
    runId: typeof body.run_id === "string" ? body.run_id : undefined,
    subscriptionId:
      typeof body.subscription_id === "string" ? body.subscription_id : undefined,
    timeRange: isTimeRange(body.time_range) ? body.time_range : undefined,
    workspaceId: typeof body.workspace_id === "string" ? body.workspace_id : undefined
  });

  if (decision.error !== undefined) {
    const status =
      decision.error.code === "DATA_NOT_LICENSED"
        ? 403
        : decision.error.code === "DATA_QUALITY_HOLD"
          ? 409
          : 400;

    return c.json(
      createErrorEnvelope(decision.error.code, decision.error.message, {
        asOf: new Date().toISOString(),
        dataVersion: decision.dataVersion,
        methodologyVersion: decision.methodologyVersion,
        provenance: decision.provenance,
        requestId,
        usage: decision.usage
      }),
      status
    );
  }

  return c.json(
    createSuccessEnvelope(decision, {
      asOf: new Date().toISOString(),
      dataVersion: decision.dataVersion,
      methodologyVersion: decision.methodologyVersion,
      provenance: decision.provenance,
      requestId,
      usage: decision.usage
    })
  );
});

app.get("/gateway/rights-matrix/p0/coverage", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const report = createP0RightsMatrixCoverageReport({
    asOf: new Date().toISOString(),
    rightsPolicyVersion: DEFAULT_DATA_ACCESS_POLICY.rightsPolicyVersion,
    toolNames: REGISTERED_TOOLS.map((tool) => tool.name)
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(report, {
      asOf: report.as_of,
      dataVersion: report.version,
      methodologyVersion: report.version,
      provenance: [
        {
          data_version: report.version,
          methodology_version: report.version,
          source: "data-access-gateway",
          source_record_id: "p0-rights-matrix-coverage"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: report.tool_coverage.length + report.dataset_field_coverage.length
      }
    })
  );
});

app.get("/gateway/data-coverage/release-gate", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const report = createDataCoverageReleaseGateReport({
    asOf: new Date().toISOString(),
    coveragePolicyVersion: "coverage-policy-scaffold-v0"
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(report, {
      asOf: report.as_of,
      dataVersion: report.version,
      methodologyVersion: report.version,
      provenance: [
        {
          data_version: report.version,
          methodology_version: report.version,
          source: "data-access-gateway",
          source_record_id: "data-coverage-release-gate"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: report.freshness_markers.length + report.coverage_domains.length
      }
    })
  );
});

app.post("/gateway/exports/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    account_id?: unknown;
    accountId?: unknown;
    dataset?: unknown;
    fields?: unknown;
    format?: unknown;
    plan?: unknown;
    quality_state?: unknown;
    qualityState?: unknown;
    requested_rows?: unknown;
    requestedRows?: unknown;
    run_id?: unknown;
    runId?: unknown;
    scopes?: unknown;
    time_range?: unknown;
    timeRange?: unknown;
    workspace_id?: unknown;
    workspaceId?: unknown;
  };
  const fields = Array.isArray(body.fields)
    ? body.fields.filter((field): field is string => typeof field === "string")
    : ["synthetic_profile.company_name"];
  const scopes = Array.isArray(body.scopes)
    ? body.scopes.filter((scope): scope is string => typeof scope === "string")
    : [];
  const timeRange = isTimeRange(body.time_range)
    ? body.time_range
    : isTimeRange(body.timeRange)
      ? body.timeRange
      : undefined;
  const plan = createRestrictedExportPlan({
    accountId:
      typeof body.account_id === "string"
        ? body.account_id
        : typeof body.accountId === "string"
          ? body.accountId
          : undefined,
    dataset: typeof body.dataset === "string" ? body.dataset : "synthetic_profile",
    fields,
    format: typeof body.format === "string" ? body.format : "csv",
    plan: typeof body.plan === "string" ? body.plan : "pro",
    qualityState: isQualityState(body.quality_state)
      ? body.quality_state
      : isQualityState(body.qualityState)
        ? body.qualityState
        : "PASS",
    requestedRows:
      typeof body.requested_rows === "number"
        ? body.requested_rows
        : typeof body.requestedRows === "number"
          ? body.requestedRows
          : 1,
    requestId,
    runId:
      typeof body.run_id === "string"
        ? body.run_id
        : typeof body.runId === "string"
          ? body.runId
          : undefined,
    scopes,
    timeRange,
    workspaceId:
      typeof body.workspace_id === "string"
        ? body.workspace_id
        : typeof body.workspaceId === "string"
          ? body.workspaceId
          : undefined
  });
  const meta = {
    asOf: new Date().toISOString(),
    dataVersion: plan.data_version,
    methodologyVersion: plan.methodology_version,
    provenance: plan.provenance,
    requestId,
    usage: plan.usage
  };

  if (plan.status !== "planned_no_write") {
    const code =
      plan.status === "blocked_missing_scope" || plan.status === "blocked_unsupported_format"
        ? "SCOPE_DENIED"
        : plan.gateway_decision?.error_code ?? "DATA_NOT_LICENSED";
    const status =
      code === "DATA_NOT_LICENSED" || code === "SCOPE_DENIED"
        ? 403
        : code === "DATA_QUALITY_HOLD"
          ? 409
          : 400;

    return c.json(
      createErrorEnvelope(code, "restricted export plan was blocked", meta),
      status
    );
  }

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getRestrictedExportCapabilities()
      },
      meta
    )
  );
});

app.get("/secrets/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        emergency_revocation_sla_minutes: 30,
        provider_stores: [
          {
            name: "cloudflare_workers",
            status: "planned"
          },
          {
            name: "github_actions",
            status: "planned"
          },
          {
            name: "supabase",
            status: "planned"
          }
        ],
        rotation_cadence_days: 90,
        secret_values_available: false,
        store_contract: "deploy/secrets/stores.contract.json"
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "secret-stores-scaffold-v0",
        provenance: [
          {
            data_version: "secret-stores-scaffold-v0",
            methodology_version: "secret-stores-scaffold-v0",
            source: "secret-stores-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.get("/observability/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const otlpEndpointConfigured =
    typeof c.env?.OTLP_EXPORTER_OTLP_ENDPOINT === "string" &&
    c.env.OTLP_EXPORTER_OTLP_ENDPOINT.length > 0;
  const otlpHeadersConfigured =
    typeof c.env?.OTLP_EXPORTER_OTLP_HEADERS === "string" &&
    c.env.OTLP_EXPORTER_OTLP_HEADERS.length > 0;
  const evalStoreBindingConfigured = Boolean(c.env?.AIPHABEE_EVAL_STORE);

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        eval_store: {
          binding_configured: evalStoreBindingConfigured,
          binding_name: "AIPHABEE_EVAL_STORE",
          binding_type: "d1",
          persistent: true,
          schema_version: EVAL_STORE_SCHEMA_VERSION,
          status: evalStoreBindingConfigured ? "binding_detected" : "planned",
          writes_enabled: false
        },
        eval_v1: getEvalV1Capabilities(),
        event_contract: "deploy/observability/events.contract.json",
        event_types: ["run.audit", "run.eval"],
        event_version: OBSERVABILITY_EVENT_VERSION,
        forbidden_payloads: ["prompt", "api_key", "token", "secret", "password"],
        otlp_destination: {
          endpoint_configured: otlpEndpointConfigured,
          headers_configured: otlpHeadersConfigured,
          live_export_enabled: false,
          required_env: ["OTLP_EXPORTER_OTLP_ENDPOINT", "OTLP_EXPORTER_OTLP_HEADERS"],
          status:
            otlpEndpointConfigured && otlpHeadersConfigured
                ? "configuration_detected"
                : "planned"
        },
        performance_availability_release_gate:
          getPerformanceAvailabilityReleaseGateCapabilities(),
        load_dr_incident_drill_release_gate:
          getLoadDrIncidentDrillReleaseGateCapabilities(),
        sinks: [
          {
            live_export_enabled: false,
            name: "worker_console",
            status: "wired"
          },
          {
            live_export_enabled: false,
            name: "eval_store",
            status: evalStoreBindingConfigured ? "binding_detected" : "planned"
          },
          {
            live_export_enabled: false,
            name: "otlp_destination",
            status:
              otlpEndpointConfigured && otlpHeadersConfigured
                ? "configuration_detected"
                : "planned"
          }
        ]
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "observability-persistent-store-scaffold-v0",
        provenance: [
          {
            data_version: "observability-persistent-store-scaffold-v0",
            methodology_version: "observability-persistent-store-scaffold-v0",
            source: "observability-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.post("/observability/eval-v1/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const record = createEvalV1RunRecord({
    calculationAccuracy: normalizeEvalMetricInput(
      body.calculation_accuracy ?? body.calculationAccuracy
    ),
    citationAccuracy: normalizeEvalMetricInput(body.citation_accuracy ?? body.citationAccuracy),
    complianceBlocked: normalizeOptionalBoolean(
      body.compliance_blocked ?? body.complianceBlocked
    ),
    correctRefusalRate: normalizeEvalMetricInput(
      body.correct_refusal_rate ?? body.correctRefusalRate
    ),
    dataError: normalizeOptionalBoolean(body.data_error ?? body.dataError),
    environment: c.env?.APP_ENV ?? "local",
    factAccuracy: normalizeEvalMetricInput(body.fact_accuracy ?? body.factAccuracy),
    highIntentActions: normalizeEvalHighIntentActions(
      body.high_intent_actions ?? body.highIntentActions
    ),
    openableEvidenceItems: normalizeOptionalNumber(
      body.openable_evidence_items ?? body.openableEvidenceItems
    ),
    requestId,
    route: "/observability/eval-v1/plan",
    runId:
      typeof body.run_id === "string"
        ? body.run_id
        : typeof body.runId === "string"
          ? body.runId
          : `eval_${requestId}`,
    severeHallucination: normalizeOptionalBoolean(
      body.severe_hallucination ?? body.severeHallucination
    ),
    successfulFinancialToolCalls: normalizeOptionalNumber(
      body.successful_financial_tool_calls ?? body.successfulFinancialToolCalls
    ),
    unsourcedNumericClaims: normalizeUnsourcedNumericClaims(
      body.unsourced_numeric_claims ?? body.unsourcedNumericClaims
    ),
    weekStart:
      typeof body.week_start === "string"
        ? body.week_start
        : typeof body.weekStart === "string"
          ? body.weekStart
          : undefined
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...record,
        capability: getEvalV1Capabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: record.version,
        methodologyVersion: record.version,
        provenance: [
          {
            data_version: record.version,
            methodology_version: record.version,
            source: "observability-eval-v1",
            source_record_id: "eval-v1-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: record.quality_metrics.length + record.wvro.criteria.length
        }
      }
    )
  );
});

app.post("/observability/release-gates/performance-availability/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createPerformanceAvailabilityReleaseGatePlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    observations: normalizePerformanceAvailabilityObservations(
      body.observations ?? body.slo_observations ?? body.sloObservations
    ),
    requestId
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(plan, {
      asOf: plan.as_of,
      dataVersion: plan.version,
      methodologyVersion: plan.version,
      provenance: [
        {
          data_version: plan.version,
          methodology_version: plan.version,
          source: "observability-performance-availability",
          source_record_id: "performance-availability-release-gate-plan"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: plan.slo_report.observations.length
      }
    })
  );
});

app.post("/observability/release-gates/load-dr-incident-drill/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createLoadDrIncidentDrillReleaseGatePlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    evidence: normalizeLoadDrIncidentDrillEvidence(
      body.evidence ?? body.drill_evidence ?? body.drillEvidence
    ),
    requestId
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(plan, {
      asOf: plan.as_of,
      dataVersion: plan.version,
      methodologyVersion: plan.version,
      provenance: [
        {
          data_version: plan.version,
          methodology_version: plan.version,
          source: "observability-load-dr-incident-drill",
          source_record_id: "load-dr-incident-drill-release-gate-plan"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: plan.release_checks.length
      }
    })
  );
});

app.get("/agent/model-provider", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ai_gateway: {
          features: ["logging", "caching", "rate_limiting", "fallback", "guardrails"],
          gateway_id: "default",
          provider: "cloudflare_ai_gateway",
          status: "planned",
          unified_billing: true
        },
        ai_sdk: {
          execution_apis: ["generateText", "streamText"],
          package_name: "ai",
          stop_condition: "isStepCount",
          target_version: "7.0.0-beta.182"
        },
        execution_modes: [
          {
            model_calls: false,
            name: "dry_run",
            route: "POST /agent/runs/dry-run",
            status: "wired"
          },
          {
            model_calls: false,
            name: "generate_text",
            route: "POST /agent/runs/generate",
            status: "planned"
          },
          {
            model_calls: false,
            name: "stream_text",
            route: "POST /agent/runs/stream",
            status: "guarded"
          }
        ],
        model_calls_enabled: false,
        provider_contract: "deploy/model-providers/providers.contract.json",
        streaming_enabled: false
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "model-provider-scaffold-v0",
        provenance: [
          {
            data_version: "model-provider-scaffold-v0",
            methodology_version: "model-provider-scaffold-v0",
            source: "model-provider-contract",
            source_record_id: "runtime-capabilities"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    )
  );
});

app.get("/agent/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getAgentRuntimeCapabilities(), {
      asOf: new Date().toISOString(),
      methodologyVersion: "agent-runtime-scaffold-v0",
      provenance: [
        {
          data_version: "agent-runtime-scaffold-v0",
          methodology_version: "agent-runtime-scaffold-v0",
          source: "agent-runtime",
          source_record_id: "capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/agent/release-gates/product-agent/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
    const plan = createProductAgentReleaseGatePlan({
      ambiguousSecurityQuery: normalizeString(
        body.ambiguous_security_query ?? body.ambiguousSecurityQuery ?? body.security_query
      ),
      asOf: normalizeString(body.as_of ?? body.asOf),
      currency: normalizeString(body.currency),
      locale: normalizeString(
        body.locale ?? body.response_locale ?? body.responseLocale ?? body.language
      ),
      methodology: normalizeString(body.methodology),
      numericPrompt: normalizeString(body.numeric_prompt ?? body.numericPrompt ?? body.prompt),
      requestedTools: Array.isArray(body.tools)
        ? body.tools.filter((tool): tool is string => typeof tool === "string")
        : undefined,
      requestId,
      responseDepth: normalizeString(body.response_depth ?? body.responseDepth),
      userId: normalizeString(body.user_id ?? body.userId),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...plan,
          capability: getProductAgentReleaseGateCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: plan.version,
          methodologyVersion: plan.version,
          provenance: [
            {
              data_version: plan.version,
              methodology_version: plan.version,
              source: "agent-runtime",
              source_record_id: "product-agent-release-gate-plan"
            }
          ],
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: plan.release_checks.length
          }
        }
      )
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError) {
      const code =
        error.code === "STEP_LIMIT_OUT_OF_RANGE" ? "OUT_OF_RANGE" : "SCOPE_DENIED";
      const status = error.code === "UNREGISTERED_TOOL" ? 403 : 400;

      return c.json(
        createErrorEnvelope(code, error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "product-agent-release-gate-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        status
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "product Agent release gate planning failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "product-agent-release-gate-scaffold-v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/agent/release-gates/prompt-injection/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const plan = createPromptInjectionToolDenialReleaseGatePlan({
      asOf: normalizeString(body.as_of ?? body.asOf),
      locale: normalizeString(
        body.locale ?? body.response_locale ?? body.responseLocale ?? body.language
      ),
      maliciousDocumentId: normalizeString(
        body.malicious_document_id ?? body.maliciousDocumentId ?? body.document_id ?? body.documentId
      ),
      maliciousSectionId: normalizeString(
        body.malicious_section_id ?? body.maliciousSectionId ?? body.section_id ?? body.sectionId
      ),
      prompt: normalizeString(body.prompt),
      requestId,
      responseDepth: normalizeString(body.response_depth ?? body.responseDepth),
      userId: normalizeString(body.user_id ?? body.userId),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(plan, {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "agent-runtime",
            source_record_id: "prompt-injection-tool-denial-release-gate-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.release_checks.length
        }
      })
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError) {
      const code =
        error.code === "STEP_LIMIT_OUT_OF_RANGE" ? "OUT_OF_RANGE" : "SCOPE_DENIED";
      const status = error.code === "UNREGISTERED_TOOL" ? 403 : 400;

      return c.json(
        createErrorEnvelope(code, error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "prompt-injection-tool-denial-release-gate-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        status
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "prompt injection tool denial release gate planning failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "prompt-injection-tool-denial-release-gate-scaffold-v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/agent/release-gates/label-budget/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const highCostToolName =
      normalizeString(body.high_cost_tool_name ?? body.highCostToolName ?? body.tool_name ?? body.toolName) ??
      "run_event_study";
    const workspaceId =
      normalizeString(body.workspace_id ?? body.workspaceId) ?? "workspace_research";
    const subscriptionId =
      normalizeString(body.subscription_id ?? body.subscriptionId) ??
      `subscription_${workspaceId}`;
    const labelPlan = createToolLoopAgentPlan({
      locale: normalizeString(body.locale ?? body.response_locale ?? body.responseLocale),
      prompt:
        normalizeString(body.prompt) ??
        "Label fact, calculation, inference, and unknown claims for 00700.HK.",
      requestId: `${requestId}:claim-labels`,
      requestedTools: [
        "resolve_security",
        "get_entitlements",
        "get_financial_facts",
        "get_data_lineage"
      ],
      responseDepth: normalizeString(body.response_depth ?? body.responseDepth),
      securityQuery: normalizeString(body.security_query ?? body.securityQuery) ?? "00700.HK",
      userId: normalizeString(body.user_id ?? body.userId),
      workspaceId
    });
    const answerContract = labelPlan.answer_evidence_contract;
    const unconfirmedHighCostPlan = planHighCostAnalyticsQueue({
      eventCount: normalizeOptionalInteger(body.event_count ?? body.eventCount) ?? 1,
      eventWindowDays:
        normalizeOptionalInteger(body.event_window_days ?? body.eventWindowDays) ?? 11,
      metricCount: normalizeOptionalInteger(body.metric_count ?? body.metricCount),
      requestId: `${requestId}:high-cost-unconfirmed`,
      securities: normalizeStringArray(body.securities),
      toolName: highCostToolName,
      universeSize: normalizeOptionalInteger(body.universe_size ?? body.universeSize),
      userConfirmed: false
    });
    const confirmedHighCostPlan = planHighCostAnalyticsQueue({
      eventCount: normalizeOptionalInteger(body.event_count ?? body.eventCount) ?? 1,
      eventWindowDays:
        normalizeOptionalInteger(body.event_window_days ?? body.eventWindowDays) ?? 11,
      metricCount: normalizeOptionalInteger(body.metric_count ?? body.metricCount),
      requestId: `${requestId}:high-cost-confirmed`,
      securities: normalizeStringArray(body.securities),
      toolName: highCostToolName,
      universeSize: normalizeOptionalInteger(body.universe_size ?? body.universeSize),
      userConfirmed: true
    });
    const unconfirmedReservation = createHighCostUsageReservationPlan({
      estimatedCredits: unconfirmedHighCostPlan.cost_estimate.credit_weight,
      requestId: `${requestId}:reservation-unconfirmed`,
      subscriptionId,
      taskId:
        unconfirmedHighCostPlan.enqueue_plan.planned_task_id ??
        unconfirmedHighCostPlan.enqueue_plan.queue_key ??
        `task_${requestId}_unconfirmed`,
      toolName: highCostToolName,
      userConfirmed: false,
      workspaceId
    });
    const confirmedReservation = createHighCostUsageReservationPlan({
      estimatedCredits: confirmedHighCostPlan.cost_estimate.credit_weight,
      executionStatus: normalizeHighCostUsageExecutionStatus(
        body.execution_status ?? body.executionStatus
      ),
      requestId: `${requestId}:reservation-confirmed`,
      subscriptionId,
      taskId:
        confirmedHighCostPlan.enqueue_plan.planned_task_id ??
        confirmedHighCostPlan.enqueue_plan.queue_key ??
        `task_${requestId}_confirmed`,
      toolName: highCostToolName,
      userConfirmed: true,
      workspaceId
    });
    const claimLabelGate = {
      answer_contract_version: answerContract.version,
      evidence_strength: answerContract.evidence_strength,
      required_claim_labels: answerContract.claim_labels.required_labels,
      sample_claim_controls: [
        {
          effective: answerContract.claim_labels.fact_requires_evidence_card,
          label: "fact",
          required_binding: "evidence_card"
        },
        {
          effective: answerContract.claim_labels.calculation_requires_calculation_ref,
          label: "calculation",
          required_binding: "calculation_ref"
        },
        {
          effective: answerContract.claim_labels.inference_requires_evidence_strength,
          label: "inference",
          required_binding: "evidence_strength"
        },
        {
          effective: answerContract.claim_labels.unknown_requires_missing_reason,
          label: "unknown",
          required_binding: "missing_reason"
        }
      ],
      validation_rules: answerContract.validation_rules
    };
    const highCostBudgetGate = {
      analytics_capability: getHighCostAnalyticsQueueCapabilities(),
      confirmed_plan: confirmedHighCostPlan,
      confirmation_required_before_enqueue:
        unconfirmedHighCostPlan.usage_policy.requires_confirmation_before_enqueue,
      failure_refund_required: confirmedReservation.failure_refund.required,
      high_cost_threshold: unconfirmedHighCostPlan.cost_estimate.high_cost_threshold,
      pre_debit_required: confirmedReservation.pre_debit.required,
      usage_reservation_capability: getHighCostUsageReservationCapabilities(),
      reservation_after_confirmation: confirmedReservation,
      reservation_before_confirmation: unconfirmedReservation,
      unconfirmed_plan: unconfirmedHighCostPlan,
      usage_ledger_link_required: confirmedReservation.usage_ledger_link_required
    };
    const validation = {
      budget_estimate_present: unconfirmedHighCostPlan.cost_estimate.credit_weight > 0,
      fact_label_requires_evidence_card: answerContract.claim_labels.fact_requires_evidence_card,
      high_cost_requires_confirmation:
        unconfirmedHighCostPlan.status === "confirmation_required" &&
        unconfirmedHighCostPlan.enqueue_plan.status === "awaiting_confirmation",
      high_cost_routes_to_independent_pool:
        confirmedHighCostPlan.scheduling_decision.independent_pool_required &&
        confirmedHighCostPlan.scheduling_decision.concurrency_pool === "analytics_high_cost",
      inference_label_requires_evidence_strength:
        answerContract.claim_labels.inference_requires_evidence_strength,
      no_confidence_score_display: answerContract.evidence_strength.confidence_score_display === false,
      no_frontend_rendering:
        labelPlan.answer_evidence_contract.frontend_rendering === false &&
        unconfirmedHighCostPlan.frontend_rendering === false,
      no_live_execution:
        labelPlan.actual_tool_execution === false &&
        unconfirmedHighCostPlan.durable_queue_writes === false &&
        confirmedReservation.live_ledger_writes === false,
      pre_debit_planned_after_confirmation:
        confirmedReservation.status === "planned_no_write" &&
        confirmedReservation.pre_debit.status === "planned_no_write",
      unknown_label_requires_missing_reason:
        answerContract.claim_labels.unknown_requires_missing_reason,
      user_confirmation_blocks_enqueue_until_present:
        confirmedHighCostPlan.status === "queued_planned" &&
        unconfirmedHighCostPlan.status === "confirmation_required"
    };
    const releaseChecks = getAgentLabelBudgetReleaseGateCapabilities().required_checks.map(
      (check) => ({
        check,
        evidence:
          check === "fact_label_requires_evidence_card"
            ? "answer_evidence_contract.claim_labels.fact_requires_evidence_card=true"
            : check === "inference_label_requires_evidence_strength"
              ? "answer_evidence_contract.claim_labels.inference_requires_evidence_strength=true"
              : check === "unknown_label_requires_missing_reason"
                ? "answer_evidence_contract.claim_labels.unknown_requires_missing_reason=true"
                : check === "high_cost_task_requires_budget_estimate"
                  ? "planHighCostAnalyticsQueue.cost_estimate.credit_weight > 0"
                  : check === "high_cost_task_requires_confirmation_before_enqueue"
                    ? "unconfirmed high-cost plan returns confirmation_required and awaiting_confirmation"
                    : "confirmed high-cost usage reservation plans pre_debit and failure_refund",
        status: "planned_no_write"
      })
    );
    const version = getAgentLabelBudgetReleaseGateCapabilities().version;

    return c.json(
      createSuccessEnvelope(
        {
          actual_tool_execution: false,
          capability: getAgentLabelBudgetReleaseGateCapabilities(),
          claim_label_gate: claimLabelGate,
          frontend_rendering: false,
          high_cost_budget_gate: highCostBudgetGate,
          live_db_writes: false,
          live_queue_writes: false,
          live_tool_execution: false,
          model_calls: false,
          persistent_writes: false,
          release_checks: releaseChecks,
          release_gate: {
            blockers: [
              "actual_generated_answer_label_parser_missing",
              "frontend_budget_confirmation_ui_missing",
              "live_high_cost_queue_execution_missing"
            ],
            gate_status: "blocked_live_label_budget_validation",
            no_live_release_claim: true,
            required_signoffs: ["product", "agent", "analytics", "billing"]
          },
          request_id: requestId,
          route: "POST /agent/release-gates/label-budget/plan",
          sql_emitted: false,
          status: "planned_no_write",
          validation,
          version
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: version,
          methodologyVersion: version,
          provenance: [
            {
              data_version: version,
              methodology_version: version,
              source: "agent-runtime",
              source_record_id: "agent-label-budget-release-gate-plan"
            }
          ],
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: releaseChecks.length
          }
        }
      )
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError) {
      const code =
        error.code === "STEP_LIMIT_OUT_OF_RANGE" ? "OUT_OF_RANGE" : "SCOPE_DENIED";
      const status = error.code === "UNREGISTERED_TOOL" ? 403 : 400;

      return c.json(
        createErrorEnvelope(code, error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "agent-label-budget-release-gate-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        status
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "Agent label budget release gate planning failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "agent-label-budget-release-gate-scaffold-v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/agent/release-gates/task-replay-mode/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const prompt =
      normalizeString(body.prompt ?? body.question) ??
      "Explain 00700.HK revenue, free cash flow, and ROE with saved report replay.";
    const securityQuery =
      normalizeString(body.security_query ?? body.securityQuery) ?? "00700.HK";
    const userId = normalizeString(body.user_id ?? body.userId) ?? "user_internal_alpha";
    const workspaceId =
      normalizeString(body.workspace_id ?? body.workspaceId) ?? "workspace_research";
    const locale =
      normalizeString(body.locale ?? body.response_locale ?? body.responseLocale) ??
      "zh-Hant";
    const requestedTools = normalizeStringArray(body.tools) ?? [
      "resolve_security",
      "get_security_profile",
      "get_financial_facts",
      "get_data_lineage",
      "get_entitlements"
    ];
    const notificationChannels = normalizeAgentWorkflowNotificationChannels(
      body.notification_channels ?? body.notificationChannels
    );
    const workflowTask = createWorkflowTaskPlan({
      asOf: normalizeString(body.as_of ?? body.asOf),
      locale,
      maxSteps: normalizeOptionalInteger(body.max_steps ?? body.maxSteps),
      notificationChannels,
      prompt,
      requestId: `${requestId}:workflow-resume`,
      requestedTools,
      responseDepth: "professional",
      securityQuery,
      userId,
      workflowKind:
        normalizeAgentWorkflowTaskKind(body.workflow_kind ?? body.workflowKind) ??
        "deep_report",
      workspaceId
    });
    const savedToolCalls: ResearchRunToolCallInput[] = [
      {
        dataVersion: "synthetic-hk-equity-facts-v1",
        input: {
          metrics: ["revenue", "free_cash_flow", "roe"],
          security: securityQuery
        },
        inputSchemaId: "get_financial_facts.input.v1",
        methodologyVersion: "financial-facts-scaffold-v0",
        outputSchemaId: "get_financial_facts.output.v1",
        requestId: `${requestId}:tool-financial-facts-saved`,
        toolCallId: `tool_call_${requestId}_financial_facts_saved`,
        toolName: "get_financial_facts",
        toolVersion: "financial-facts-scaffold-v0"
      },
      {
        dataVersion: "synthetic-evidence-lineage-v1",
        input: {
          source_record_id: "src_00700_fy2024_annual_results"
        },
        inputSchemaId: "get_data_lineage.input.v1",
        methodologyVersion: "evidence-lineage-scaffold-v0",
        outputSchemaId: "get_data_lineage.output.v1",
        requestId: `${requestId}:tool-lineage-saved`,
        toolCallId: `tool_call_${requestId}_lineage_saved`,
        toolName: "get_data_lineage",
        toolVersion: "evidence-lineage-scaffold-v0"
      }
    ];
    const savedEvidenceRecords: ResearchRunEvidenceInput[] = [
      {
        citationLabel: "Tencent FY2024 annual results",
        dataVersion: "synthetic-hk-equity-facts-v1",
        documentLocation: {
          anchor: "financial-summary",
          documentId: "doc_00700_fy2024_annual_results",
          page: 12,
          paragraph: 4,
          sourceRecordId: "src_00700_fy2024_annual_results"
        },
        evidenceRecordId: "evidence_00700_fy2024_financials",
        methodologyVersion: "financial-facts-scaffold-v0",
        sourceRecordIds: ["src_00700_fy2024_annual_results"]
      }
    ];
    const savedRun =
      normalizeResearchSavedRun(body.saved_run ?? body.savedRun) ??
      createResearchRunSavePlan({
        answerHash: "answer_hash_saved_report_baseline",
        asOf: normalizeString(body.as_of ?? body.asOf),
        evidenceRecords: savedEvidenceRecords,
        modelProvider: "cloudflare_ai_gateway",
        modelVersion:
          normalizeString(body.saved_model_version ?? body.savedModelVersion) ??
          "dry-run-model-v1",
        parameters: {
          locale,
          response_depth: "professional",
          security: securityQuery
        },
        promptTemplateId: "agent_research_answer_v0",
        promptVersion:
          normalizeString(body.saved_prompt_version ?? body.savedPromptVersion) ??
          "agent-answer-evidence-v1",
        question: prompt,
        requestId: `${requestId}:saved-report`,
        runId: `research_run_${requestId}_saved_report`,
        toolCalls: savedToolCalls,
        userId,
        workspaceId
      });
    const currentRun =
      normalizeResearchReplayCurrentRun(body.current_run ?? body.currentRun) ?? {
        answerHash: "answer_hash_replay_candidate",
        asOf: normalizeString(body.current_as_of ?? body.currentAsOf),
        channel: "web" as const,
        evidenceRecords: [
          {
            citationLabel: "Tencent FY2024 annual results corrected",
            dataVersion: "synthetic-hk-equity-facts-v2",
            documentLocation: {
              anchor: "financial-summary-corrected",
              documentId: "doc_00700_fy2024_annual_results_corrected",
              page: 12,
              paragraph: 5,
              sourceRecordId: "src_00700_fy2024_annual_results_corrected"
            },
            evidenceRecordId: "evidence_00700_fy2024_financials_corrected",
            methodologyVersion: "financial-facts-scaffold-v0",
            sourceRecordIds: ["src_00700_fy2024_annual_results_corrected"]
          }
        ],
        modelProvider: "cloudflare_ai_gateway",
        modelVersion:
          normalizeString(body.current_model_version ?? body.currentModelVersion) ??
          "dry-run-model-v1",
        parameters: {
          locale,
          replay_reason: "saved_report_replay_release_gate",
          response_depth: "professional",
          security: securityQuery
        },
        promptTemplateId: "agent_research_answer_v0",
        promptVersion:
          normalizeString(body.current_prompt_version ?? body.currentPromptVersion) ??
          "agent-answer-evidence-v1",
        question: prompt,
        requestId: `${requestId}:replay-current`,
        runId: `research_run_${requestId}_replay_current`,
        toolCalls: savedToolCalls.map((toolCall) => ({
          ...toolCall,
          dataVersion:
            toolCall.toolName === "get_financial_facts"
              ? "synthetic-hk-equity-facts-v2"
              : toolCall.dataVersion,
          requestId: `${requestId}:${toolCall.toolName}-current`,
          toolCallId: `${toolCall.toolCallId}_current`
        })),
        userId,
        workspaceId
      };
    const replayPlan = createResearchRunReplayPlan({
      currentRun,
      replayReason:
        normalizeString(body.replay_reason ?? body.replayReason) ??
        "release gate saved report replay",
      requestId: `${requestId}:saved-report-replay`,
      savedRun
    });
    const newbiePlan = createToolLoopAgentPlan({
      locale,
      prompt,
      requestId: `${requestId}:newbie-mode`,
      requestedTools,
      responseDepth: "newbie",
      securityQuery,
      userId,
      workspaceId
    });
    const professionalPlan = createToolLoopAgentPlan({
      locale,
      prompt,
      requestId: `${requestId}:professional-mode`,
      requestedTools,
      responseDepth: "professional",
      securityQuery,
      userId,
      workspaceId
    });
    const newbiePresentation = newbiePlan.answer_evidence_contract.presentation;
    const professionalPresentation =
      professionalPlan.answer_evidence_contract.presentation;
    const sameToolPolicy =
      JSON.stringify(newbiePlan.run_context.toolset.tools.map((tool) => tool.name)) ===
      JSON.stringify(professionalPlan.run_context.toolset.tools.map((tool) => tool.name));
    const sameNumericPolicy =
      JSON.stringify(newbiePlan.numeric_source_guard.allowed_sources) ===
        JSON.stringify(professionalPlan.numeric_source_guard.allowed_sources) &&
      JSON.stringify(newbiePlan.numeric_source_guard.blocked_sources) ===
        JSON.stringify(professionalPlan.numeric_source_guard.blocked_sources);
    const sameEvidenceContract =
      JSON.stringify(newbiePlan.answer_evidence_contract.claim_labels) ===
        JSON.stringify(professionalPlan.answer_evidence_contract.claim_labels) &&
      JSON.stringify(newbiePlan.answer_evidence_contract.evidence_cards.required_fields) ===
        JSON.stringify(professionalPlan.answer_evidence_contract.evidence_cards.required_fields);
    const newbieDepthInvariant = Object.values(
      newbiePresentation.response_depth_invariant
    ).every(Boolean);
    const professionalDepthInvariant = Object.values(
      professionalPresentation.response_depth_invariant
    ).every(Boolean);
    const workflowResumeGate = {
      capability: getAgentWorkflowTaskCapabilities(),
      checkpoint_state_table: workflowTask.resume.state_table,
      disconnect_safe: workflowTask.resume.disconnect_safe,
      long_task_boundary: workflowTask.long_task_boundary,
      notification: workflowTask.notification,
      resume: workflowTask.resume,
      task_id: workflowTask.task_id,
      task_id_visible: workflowTask.task_id_visible,
      workflow: workflowTask.workflow,
      workflow_task: workflowTask
    };
    const savedReportReplayGate = {
      old_report: replayPlan.old_report,
      replay_capability: getResearchRuntimeCapabilities(),
      replay_diff: replayPlan.diff_summary,
      replay_execution: replayPlan.replay_execution,
      replay_plan: replayPlan,
      replay_snapshot_id: replayPlan.replay_snapshot_id,
      saved_report: savedRun,
      saved_snapshot_id: replayPlan.saved_snapshot_id,
      save_replay_seed: savedRun.replay_seed
    };
    const modeInvariantGate = {
      changed_surface: {
        newbie_response_depth: newbiePresentation.response_depth,
        professional_response_depth: professionalPresentation.response_depth,
        response_depth_policy: professionalPresentation.response_depth_policy
      },
      localized_response_capability: getAgentRuntimeCapabilities().response_presentation,
      newbie_plan: {
        answer_contract: newbiePlan.answer_evidence_contract,
        requested_tool_names: newbiePlan.run_context.toolset.tools.map((tool) => tool.name),
        response_depth: newbiePresentation.response_depth
      },
      professional_plan: {
        answer_contract: professionalPlan.answer_evidence_contract,
        requested_tool_names: professionalPlan.run_context.toolset.tools.map(
          (tool) => tool.name
        ),
        response_depth: professionalPresentation.response_depth
      },
      shared_contract: {
        newbie_depth_invariant: newbieDepthInvariant,
        professional_depth_invariant: professionalDepthInvariant,
        response_depth_changes_data: false,
        same_evidence_contract: sameEvidenceContract,
        same_numeric_source_policy: sameNumericPolicy,
        same_tool_policy: sameToolPolicy
      }
    };
    const validation = {
      checkpoint_state_is_disconnect_safe:
        workflowTask.resume.disconnect_safe &&
        workflowTask.resume.state_table === "core.workflow_task_checkpoint",
      long_task_returns_task_id_and_resume_handle:
        workflowTask.task_id_visible &&
        workflowTask.task_id.length > 0 &&
        workflowTask.resume.resumable &&
        workflowTask.resume.resume_handle.length > 0,
      mode_switch_changes_presentation_only:
        newbiePresentation.response_depth === "newbie" &&
        professionalPresentation.response_depth === "professional" &&
        sameToolPolicy &&
        sameNumericPolicy &&
        sameEvidenceContract,
      newbie_professional_depth_preserves_data_contract:
        newbieDepthInvariant && professionalDepthInvariant,
      no_frontend_rendering:
        workflowTask.frontend_rendering === false &&
        replayPlan.frontend_rendering === false &&
        newbiePlan.answer_evidence_contract.frontend_rendering === false,
      no_live_execution:
        workflowTask.live_workflow_execution === false &&
        replayPlan.replay_execution.live_model_call === false &&
        replayPlan.replay_execution.live_tool_execution === false &&
        newbiePlan.actual_tool_execution === false &&
        professionalPlan.actual_tool_execution === false,
      replay_preserves_old_report_snapshot:
        replayPlan.old_report.immutable_report_snapshot &&
        replayPlan.old_report.mutation_allowed === false &&
        replayPlan.old_report.silent_rewrite_allowed === false &&
        replayPlan.old_report.preserved_snapshot_id === savedRun.snapshot_id,
      saved_report_has_deterministic_replay_seed:
        savedRun.replay_seed.deterministic_replay_ready &&
        savedRun.replay_seed.replay_route === "POST /research/runs/replay/plan" &&
        savedRun.replay_seed.snapshot_id === savedRun.snapshot_id
    };
    const capability = getTaskReplayModeReleaseGateCapabilities();
    const releaseChecks = capability.required_checks.map((check) => ({
      check,
      evidence:
        check === "long_task_returns_task_id_and_resume_handle"
          ? "createWorkflowTaskPlan returns task_id, task_id_visible=true, resumable=true, and resume_handle"
          : check === "long_task_checkpoint_state_is_disconnect_safe"
            ? "workflow task resume uses core.workflow_task_checkpoint and disconnect_safe=true"
            : check === "saved_report_has_deterministic_replay_seed"
              ? "createResearchRunSavePlan returns replay_seed.deterministic_replay_ready=true"
              : check === "replay_preserves_old_report_snapshot"
                ? "createResearchRunReplayPlan preserves saved_snapshot_id and blocks mutation/silent rewrite"
                : check === "newbie_professional_depth_preserves_data_contract"
                  ? "localized response response_depth_invariant keeps conclusion/data/evidence/source/methodology fields"
                  : "newbie/professional plans share tool, numeric-source, and evidence contracts",
      status: "planned_no_write"
    }));
    const version = capability.version;

    return c.json(
      createSuccessEnvelope(
        {
          actual_tool_execution: false,
          capability,
          frontend_rendering: false,
          live_db_writes: false,
          live_queue_writes: false,
          live_tool_execution: false,
          live_workflow_execution: false,
          mode_invariant_gate: modeInvariantGate,
          model_calls: false,
          persistent_writes: false,
          release_checks: releaseChecks,
          release_gate: {
            blockers: [
              "live_workflow_resume_execution_missing",
              "live_replay_job_execution_missing",
              "frontend_mode_switch_release_ui_missing"
            ],
            gate_status: "blocked_live_task_replay_mode_validation",
            no_live_release_claim: true,
            required_signoffs: ["product", "agent", "research", "operations"]
          },
          request_id: requestId,
          route: "POST /agent/release-gates/task-replay-mode/plan",
          saved_report_replay_gate: savedReportReplayGate,
          sql_emitted: false,
          status: "planned_no_write",
          validation,
          version,
          workflow_resume_gate: workflowResumeGate
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: version,
          methodologyVersion: version,
          provenance: [
            {
              data_version: version,
              methodology_version: version,
              source: "agent-runtime",
              source_record_id: "task-replay-mode-release-gate-plan"
            }
          ],
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: releaseChecks.length
          }
        }
      )
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError || error instanceof ResearchRunInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "task-replay-mode-release-gate-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope(
        "INTERNAL_ERROR",
        "task replay mode release gate planning failed",
        {
          asOf: new Date().toISOString(),
          methodologyVersion: "task-replay-mode-release-gate-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }
      ),
      500
    );
  }
});

app.post("/agent/kill-switch/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createAgentKillSwitchPlan({
    killSwitchReason: normalizeString(body.kill_switch_reason ?? body.killSwitchReason),
    modelKillSwitch: normalizeOptionalBoolean(body.model_kill_switch ?? body.modelKillSwitch),
    requestId,
    toolKillSwitch: normalizeOptionalBoolean(body.tool_kill_switch ?? body.toolKillSwitch)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAgentRuntimeCapabilities().kill_switch
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: plan.provenance,
        requestId,
        usage: plan.usage
      }
    )
  );
});

app.post("/agent/runs/stream", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createErrorEnvelope(
      "MODEL_PROVIDER_NOT_CONFIGURED",
      "model provider and AI Gateway are not configured for streaming execution",
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "model-provider-scaffold-v0",
        provenance: [
          {
            data_version: "model-provider-scaffold-v0",
            methodology_version: "model-provider-scaffold-v0",
            source: "model-provider-contract",
            source_record_id: "stream-guard"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    ),
    503
  );
});

app.post("/agent/runs/dry-run", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  let requestedToolsForTelemetry: string[] = [];
  let maxStepsForTelemetry: number = AGENT_RUNTIME_LIMITS.maxSteps;
  let telemetryIdentity = createAgentTelemetryIdentity();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as {
      channel?: unknown;
      entitlement_policy_version?: unknown;
      entitlementPolicyVersion?: unknown;
      max_credits?: unknown;
      max_rows?: unknown;
      max_steps?: unknown;
      max_tokens?: unknown;
      max_wall_clock_ms?: unknown;
      model_tier?: unknown;
      modelTier?: unknown;
      plan?: unknown;
      prompt?: unknown;
      tools?: unknown;
      user_id?: unknown;
      userId?: unknown;
      workspace_id?: unknown;
      workspaceId?: unknown;
    };
    telemetryIdentity = createAgentTelemetryIdentity(body);
    const requestedTools = Array.isArray(body.tools)
      ? body.tools.filter((tool): tool is string => typeof tool === "string")
      : undefined;

    requestedToolsForTelemetry = requestedTools ?? [];
    maxStepsForTelemetry =
      typeof body.max_steps === "number" ? body.max_steps : AGENT_RUNTIME_LIMITS.maxSteps;

    const skeleton = createAgentRunSkeleton({
      channel: typeof body.channel === "string" ? body.channel : undefined,
      entitlementPolicyVersion:
        typeof body.entitlement_policy_version === "string"
          ? body.entitlement_policy_version
          : typeof body.entitlementPolicyVersion === "string"
            ? body.entitlementPolicyVersion
            : undefined,
      maxCredits: typeof body.max_credits === "number" ? body.max_credits : undefined,
      maxRows: typeof body.max_rows === "number" ? body.max_rows : undefined,
      maxSteps: maxStepsForTelemetry,
      maxTokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
      maxWallClockMs:
        typeof body.max_wall_clock_ms === "number" ? body.max_wall_clock_ms : undefined,
      modelTier:
        typeof body.model_tier === "string"
          ? body.model_tier
          : typeof body.modelTier === "string"
            ? body.modelTier
            : undefined,
      plan: typeof body.plan === "string" ? body.plan : undefined,
      prompt: typeof body.prompt === "string" ? body.prompt : "",
      requestedTools,
      requestId,
      userId:
        typeof body.user_id === "string"
          ? body.user_id
          : typeof body.userId === "string"
            ? body.userId
            : undefined,
      workspaceId:
        typeof body.workspace_id === "string"
          ? body.workspace_id
          : typeof body.workspaceId === "string"
            ? body.workspaceId
            : undefined
    });
    const telemetryEvents = createAgentDryRunTelemetry({
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: skeleton.budget.max_steps,
      modelTier: skeleton.run_context.model.tier,
      modelVersion: telemetryIdentity.modelVersion,
      outcome: "success",
      requestId,
      requestedTools: skeleton.tool_policy.requested_tools,
      route: "/agent/runs/dry-run",
      runId: skeleton.run_id,
      toolVersions: createTelemetryToolVersions(skeleton.run_context.toolset.tools),
      userId: skeleton.run_context.user.user_id,
      workspaceId: skeleton.run_context.workspace.workspace_id
    });

    await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

    c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
    c.header("x-aiphabee-telemetry-run-id", skeleton.run_id);

    return c.json(
      createSuccessEnvelope(skeleton, {
        asOf: new Date().toISOString(),
        methodologyVersion: "agent-runtime-scaffold-v0",
        provenance: [
          {
            data_version: "agent-runtime-scaffold-v0",
            methodology_version: "agent-runtime-scaffold-v0",
            source: "agent-runtime",
            source_record_id: "dry-run"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      })
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError) {
      const code =
        error.code === "STEP_LIMIT_OUT_OF_RANGE" ? "OUT_OF_RANGE" : "SCOPE_DENIED";
      const status = error.code === "UNREGISTERED_TOOL" ? 403 : 400;
      const deniedTools = Array.isArray(error.details.deniedTools)
        ? error.details.deniedTools.filter((tool): tool is string => typeof tool === "string")
        : [];
      const runId = `dry_${requestId}`;
      const telemetryEvents = createAgentDryRunTelemetry({
        deniedTools,
        environment: c.env?.APP_ENV ?? "local",
        maxSteps: maxStepsForTelemetry,
        modelTier: telemetryIdentity.modelTier,
        modelVersion: telemetryIdentity.modelVersion,
        outcome: "rejected",
        requestId,
        requestedTools: requestedToolsForTelemetry,
        route: "/agent/runs/dry-run",
        runId,
        toolVersions: createTelemetryToolVersions(undefined, requestedToolsForTelemetry),
        userId: telemetryIdentity.userId,
        workspaceId: telemetryIdentity.workspaceId
      });

      await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

      c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
      c.header("x-aiphabee-telemetry-run-id", runId);

      return c.json(
        createErrorEnvelope(code, error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "agent-runtime-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        status
      );
    }

    const runId = `dry_${requestId}`;
    const telemetryEvents = createAgentDryRunTelemetry({
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: maxStepsForTelemetry,
      modelTier: telemetryIdentity.modelTier,
      modelVersion: telemetryIdentity.modelVersion,
      outcome: "error",
      requestId,
      requestedTools: requestedToolsForTelemetry,
      route: "/agent/runs/dry-run",
      runId,
      toolVersions: createTelemetryToolVersions(undefined, requestedToolsForTelemetry),
      userId: telemetryIdentity.userId,
      workspaceId: telemetryIdentity.workspaceId
    });

    await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

    c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
    c.header("x-aiphabee-telemetry-run-id", runId);

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "agent dry run failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "agent-runtime-scaffold-v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/agent/runs/preflight", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as AgentRunRequestBody;
    const preflight = createPreToolCallResolution(createAgentRunInput(body, requestId));

    return c.json(
      createSuccessEnvelope(preflight, {
        asOf: new Date().toISOString(),
        methodologyVersion: "pre-tool-call-resolution-scaffold-v0",
        provenance: [
          {
            data_version: "pre-tool-call-resolution-scaffold-v0",
            methodology_version: "pre-tool-call-resolution-scaffold-v0",
            source: "agent-runtime",
            source_record_id: "pre-tool-call-resolution"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: preflight.security.resolved.length
        }
      })
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError) {
      const code =
        error.code === "STEP_LIMIT_OUT_OF_RANGE" ? "OUT_OF_RANGE" : "SCOPE_DENIED";
      const status = error.code === "UNREGISTERED_TOOL" ? 403 : 400;

      return c.json(
        createErrorEnvelope(code, error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "pre-tool-call-resolution-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        status
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "agent preflight resolution failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "pre-tool-call-resolution-scaffold-v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/agent/runs/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  let requestedToolsForTelemetry: string[] = [];
  let maxStepsForTelemetry: number = AGENT_RUNTIME_LIMITS.maxSteps;
  let telemetryIdentity = createAgentTelemetryIdentity();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as AgentRunRequestBody;
    telemetryIdentity = createAgentTelemetryIdentity(body);
    const requestedTools = Array.isArray(body.tools)
      ? body.tools.filter((tool): tool is string => typeof tool === "string")
      : undefined;

    requestedToolsForTelemetry = requestedTools ?? [];
    maxStepsForTelemetry =
      typeof body.max_steps === "number" ? body.max_steps : AGENT_RUNTIME_LIMITS.maxSteps;

    const plan = createToolLoopAgentPlan(createAgentRunInput(body, requestId));
    const telemetryEvents = createAgentDryRunTelemetry({
      dataVersion: plan.version,
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: plan.budget.max_steps,
      methodologyVersion: plan.version,
      modelTier: plan.run_context.model.tier,
      modelVersion: telemetryIdentity.modelVersion,
      outcome: "success",
      requestId,
      requestedTools: plan.run_context.entitlements.allowed_tools,
      route: "/agent/runs/plan",
      runId: plan.run_id,
      toolVersions: createTelemetryToolVersions(plan.run_context.toolset.tools),
      userId: plan.run_context.user.user_id,
      workspaceId: plan.run_context.workspace.workspace_id
    });

    await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

    c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
    c.header("x-aiphabee-telemetry-run-id", plan.run_id);

    return c.json(
      createSuccessEnvelope(plan, {
        asOf: new Date().toISOString(),
        methodologyVersion: "tool-loop-agent-planner-scaffold-v0",
        provenance: [
          {
            data_version: "tool-loop-agent-planner-scaffold-v0",
            methodology_version: "tool-loop-agent-planner-scaffold-v0",
            source: "agent-runtime",
            source_record_id: "tool-loop-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.planned_step_count
        }
      })
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError) {
      const code =
        error.code === "STEP_LIMIT_OUT_OF_RANGE" ? "OUT_OF_RANGE" : "SCOPE_DENIED";
      const status = error.code === "UNREGISTERED_TOOL" ? 403 : 400;
      const deniedTools = Array.isArray(error.details.deniedTools)
        ? error.details.deniedTools.filter((tool): tool is string => typeof tool === "string")
        : [];
      const runId = `dry_${requestId}`;
      const telemetryEvents = createAgentDryRunTelemetry({
        deniedTools,
        environment: c.env?.APP_ENV ?? "local",
        maxSteps: maxStepsForTelemetry,
        modelTier: telemetryIdentity.modelTier,
        modelVersion: telemetryIdentity.modelVersion,
        outcome: "rejected",
        requestId,
        requestedTools: requestedToolsForTelemetry,
        route: "/agent/runs/plan",
        runId,
        toolVersions: createTelemetryToolVersions(undefined, requestedToolsForTelemetry),
        userId: telemetryIdentity.userId,
        workspaceId: telemetryIdentity.workspaceId
      });

      await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

      c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
      c.header("x-aiphabee-telemetry-run-id", runId);

      return c.json(
        createErrorEnvelope(code, error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "tool-loop-agent-planner-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        status
      );
    }

    const runId = `dry_${requestId}`;
    const telemetryEvents = createAgentDryRunTelemetry({
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: maxStepsForTelemetry,
      modelTier: telemetryIdentity.modelTier,
      modelVersion: telemetryIdentity.modelVersion,
      outcome: "error",
      requestId,
      requestedTools: requestedToolsForTelemetry,
      route: "/agent/runs/plan",
      runId,
      toolVersions: createTelemetryToolVersions(undefined, requestedToolsForTelemetry),
      userId: telemetryIdentity.userId,
      workspaceId: telemetryIdentity.workspaceId
    });

    await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

    c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
    c.header("x-aiphabee-telemetry-run-id", runId);

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "agent tool loop planning failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "tool-loop-agent-planner-scaffold-v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/agent/runs/validate-answer", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as AgentRunRequestBody;
    const validation = validatePostGenerationEvidenceBinding(
      normalizePostGenerationEvidenceBindingInput(body, requestId)
    );

    return c.json(
      createSuccessEnvelope(validation, {
        asOf: validation.as_of,
        methodologyVersion: validation.version,
        provenance: [
          {
            data_version: validation.version,
            methodology_version: validation.version,
            source: "agent-runtime",
            source_record_id: "post-generation-evidence-binding-validator"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: validation.numeric_claims.length
        }
      })
    );
  } catch {
    return c.json(
      createErrorEnvelope("SCOPE_DENIED", "post-generation answer validation failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "2026-06-22.phase3.post-generation-evidence-binding.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      400
    );
  }
});

app.post("/agent/workflows/tasks/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  let requestedToolsForTelemetry: string[] = [];
  let maxStepsForTelemetry: number = AGENT_RUNTIME_LIMITS.maxSteps;
  let telemetryIdentity = createAgentTelemetryIdentity();

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as AgentRunRequestBody;
    telemetryIdentity = createAgentTelemetryIdentity(body);
    const requestedTools = Array.isArray(body.tools)
      ? body.tools.filter((tool): tool is string => typeof tool === "string")
      : undefined;

    requestedToolsForTelemetry = requestedTools ?? [];
    maxStepsForTelemetry =
      typeof body.max_steps === "number" ? body.max_steps : AGENT_RUNTIME_LIMITS.maxSteps;

    const plan = createWorkflowTaskPlan({
      ...createAgentRunInput(body, requestId),
      notificationChannels: normalizeAgentWorkflowNotificationChannels(
        body.notification_channels ?? body.notificationChannels
      ),
      workflowKind: normalizeAgentWorkflowTaskKind(body.workflow_kind ?? body.workflowKind)
    });
    const telemetryEvents = createAgentDryRunTelemetry({
      dataVersion: plan.version,
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: plan.tool_loop_plan.budget.max_steps,
      methodologyVersion: plan.tool_loop_plan.version,
      modelTier: plan.tool_loop_plan.run_context.model.tier,
      modelVersion: telemetryIdentity.modelVersion,
      outcome: "success",
      requestId,
      requestedTools: plan.tool_loop_plan.run_context.entitlements.allowed_tools,
      route: "/agent/workflows/tasks/plan",
      runId: plan.tool_loop_plan.run_id,
      toolVersions: createTelemetryToolVersions(plan.tool_loop_plan.run_context.toolset.tools),
      userId: plan.tool_loop_plan.run_context.user.user_id,
      workspaceId: plan.tool_loop_plan.run_context.workspace.workspace_id
    });

    await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

    c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
    c.header("x-aiphabee-telemetry-run-id", plan.tool_loop_plan.run_id);
    c.header("x-aiphabee-workflow-task-id", plan.task_id);

    return c.json(
      createSuccessEnvelope(
        {
          ...plan,
          capability: getAgentWorkflowTaskCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: plan.version,
          methodologyVersion: plan.version,
          provenance: [
            {
              data_version: plan.version,
              methodology_version: plan.version,
              source: "agent-workflow-task",
              source_record_id: "workflow-task-plan"
            }
          ],
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: plan.tool_loop_plan.planned_step_count
          }
        }
      )
    );
  } catch (error) {
    if (error instanceof AgentRuntimeInputError) {
      const code =
        error.code === "STEP_LIMIT_OUT_OF_RANGE" ? "OUT_OF_RANGE" : "SCOPE_DENIED";
      const status = error.code === "UNREGISTERED_TOOL" ? 403 : 400;
      const deniedTools = Array.isArray(error.details.deniedTools)
        ? error.details.deniedTools.filter((tool): tool is string => typeof tool === "string")
        : [];
      const runId = `dry_${requestId}`;
      const telemetryEvents = createAgentDryRunTelemetry({
        deniedTools,
        environment: c.env?.APP_ENV ?? "local",
        maxSteps: maxStepsForTelemetry,
        modelTier: telemetryIdentity.modelTier,
        modelVersion: telemetryIdentity.modelVersion,
        outcome: "rejected",
        requestId,
        requestedTools: requestedToolsForTelemetry,
        route: "/agent/workflows/tasks/plan",
        runId,
        toolVersions: createTelemetryToolVersions(undefined, requestedToolsForTelemetry),
        userId: telemetryIdentity.userId,
        workspaceId: telemetryIdentity.workspaceId
      });

      await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

      c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
      c.header("x-aiphabee-telemetry-run-id", runId);

      return c.json(
        createErrorEnvelope(code, error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion: "workflow-task-scaffold-v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        status
      );
    }

    const runId = `dry_${requestId}`;
    const telemetryEvents = createAgentDryRunTelemetry({
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: maxStepsForTelemetry,
      modelTier: telemetryIdentity.modelTier,
      modelVersion: telemetryIdentity.modelVersion,
      outcome: "error",
      requestId,
      requestedTools: requestedToolsForTelemetry,
      route: "/agent/workflows/tasks/plan",
      runId,
      toolVersions: createTelemetryToolVersions(undefined, requestedToolsForTelemetry),
      userId: telemetryIdentity.userId,
      workspaceId: telemetryIdentity.workspaceId
    });

    await recordTelemetryEvents(createConsoleTelemetrySink(console), telemetryEvents);

    c.header("x-aiphabee-telemetry-event-count", String(telemetryEvents.length));
    c.header("x-aiphabee-telemetry-run-id", runId);

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "agent workflow task planning failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: "workflow-task-scaffold-v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.get("/tools/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getToolRegistryCapabilities(), {
      asOf: new Date().toISOString(),
      methodologyVersion: "2026-06-21.phase1.shared-tool-registry-scaffold.v0",
      provenance: [
        {
          data_version: "tool-registry-scaffold-v0",
          methodology_version:
            "2026-06-21.phase1.shared-tool-registry-scaffold.v0",
          source: "tool-registry",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/tools/resolve-security", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    market?: unknown;
    query?: unknown;
  };

  try {
    const result = resolveSecurity({
      asOf: typeof body.as_of === "string" ? body.as_of : undefined,
      market: typeof body.market === "string" ? body.market : undefined,
      query: typeof body.query === "string" ? body.query : ""
    });

    if (result.status === "not_found") {
      return c.json(
        createErrorEnvelope("NOT_FOUND", "security identifier was not found", {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }),
        404
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getResolveSecurityCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof ResolveSecurityInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.resolve-security-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "resolve_security failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.resolve-security-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-security-profile", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    instrument_id?: unknown;
    instrumentId?: unknown;
  };
  const rawInstrumentId =
    typeof body.instrument_id === "string"
      ? body.instrument_id
      : typeof body.instrumentId === "string"
        ? body.instrumentId
        : "";

  try {
    const result = getSecurityProfile({
      asOf: typeof body.as_of === "string" ? body.as_of : undefined,
      instrumentId: rawInstrumentId
    });

    if (result.status === "not_found") {
      return c.json(
        createErrorEnvelope("NOT_FOUND", "security profile was not found", {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }),
        404
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getSecurityProfileCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof GetSecurityProfileInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.get-security-profile-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_security_profile failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.get-security-profile-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-security-history", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    asOf?: unknown;
    instrument_id?: unknown;
    instrumentId?: unknown;
  };
  const rawInstrumentId =
    typeof body.instrument_id === "string"
      ? body.instrument_id
      : typeof body.instrumentId === "string"
        ? body.instrumentId
        : "";
  const rawAsOf =
    typeof body.as_of === "string"
      ? body.as_of
      : typeof body.asOf === "string"
        ? body.asOf
        : undefined;

  try {
    const result = getSecurityHistory({
      asOf: rawAsOf,
      instrumentId: rawInstrumentId
    });

    if (result.status === "not_found") {
      return c.json(
        createErrorEnvelope("NOT_FOUND", "security history was not found", {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }),
        404
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getSecurityHistoryCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof GetSecurityHistoryInputError) {
      return c.json(
        createErrorEnvelope(
          error.code === "AS_OF_REQUIRED" ? "POINT_IN_TIME_UNAVAILABLE" : "SCOPE_DENIED",
          error.message,
          {
            asOf: new Date().toISOString(),
            methodologyVersion: GET_SECURITY_HISTORY_VERSION,
            requestId,
            usage: {
              cached: false,
              credits: 0,
              rows: 0
            }
          }
        ),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_security_history failed", {
        asOf: new Date().toISOString(),
        methodologyVersion: GET_SECURITY_HISTORY_VERSION,
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-market-calendar", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    from?: unknown;
    market?: unknown;
    to?: unknown;
  };

  try {
    const result = getMarketCalendar({
      from: typeof body.from === "string" ? body.from : "",
      market: typeof body.market === "string" ? body.market : "",
      to: typeof body.to === "string" ? body.to : ""
    });

    if (result.status === "not_found") {
      return c.json(
        createErrorEnvelope("NOT_FOUND", "market calendar was not found", {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }),
        404
      );
    }

    if (result.status === "out_of_range") {
      return c.json(
        createErrorEnvelope("OUT_OF_RANGE", "market calendar range is out of synthetic coverage", {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }),
        422
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMarketCalendarCapabilities()
        },
        {
          asOf: new Date().toISOString(),
          dataVersion: result.dataVersion,
          methodologyVersion: result.methodologyVersion,
          provenance: result.provenance,
          requestId,
          usage: result.usage
        }
      )
    );
  } catch (error) {
    if (error instanceof MarketCalendarInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.get-market-calendar-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_market_calendar failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.get-market-calendar-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-quote-snapshot", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    fields?: unknown;
    instrument_id?: unknown;
    instrumentId?: unknown;
    mode?: unknown;
  };
  const rawInstrumentId =
    typeof body.instrument_id === "string"
      ? body.instrument_id
      : typeof body.instrumentId === "string"
        ? body.instrumentId
        : "";
  const mode =
    body.mode === "close" || body.mode === "delayed" ? body.mode : undefined;
  const fields = Array.isArray(body.fields)
    ? body.fields.filter((field): field is string => typeof field === "string")
    : undefined;

  try {
    const result = getQuoteSnapshot({
      asOf: typeof body.as_of === "string" ? body.as_of : undefined,
      fields,
      instrumentId: rawInstrumentId,
      mode
    });
    const meta = {
      asOf: result.asOf ?? new Date().toISOString(),
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId,
      usage: result.usage
    };

    if (result.status === "not_found") {
      return c.json(createErrorEnvelope("NOT_FOUND", "quote snapshot was not found", meta), 404);
    }

    if (result.status === "data_not_licensed") {
      return c.json(
        createErrorEnvelope("DATA_NOT_LICENSED", "quote snapshot fields are not licensed", meta),
        403
      );
    }

    if (result.status === "data_quality_hold") {
      return c.json(
        createErrorEnvelope("DATA_QUALITY_HOLD", "quote snapshot is held by quality policy", meta),
        409
      );
    }

    if (result.status === "point_in_time_unavailable") {
      return c.json(
        createErrorEnvelope(
          "POINT_IN_TIME_UNAVAILABLE",
          "quote snapshot is unavailable for the requested point in time",
          meta
        ),
        422
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getQuoteSnapshotCapabilities()
        },
        meta
      )
    );
  } catch (error) {
    if (error instanceof QuoteSnapshotInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.get-quote-snapshot-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_quote_snapshot failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.get-quote-snapshot-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-price-history", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    adjustment?: unknown;
    cursor?: unknown;
    fields?: unknown;
    from?: unknown;
    instrument_id?: unknown;
    instrumentId?: unknown;
    limit?: unknown;
    to?: unknown;
  };
  const rawInstrumentId =
    typeof body.instrument_id === "string"
      ? body.instrument_id
      : typeof body.instrumentId === "string"
        ? body.instrumentId
        : "";
  const fields = Array.isArray(body.fields)
    ? body.fields.filter((field): field is string => typeof field === "string")
    : undefined;

  try {
    const result = getPriceHistory({
      adjustment: typeof body.adjustment === "string" ? body.adjustment : undefined,
      cursor: typeof body.cursor === "string" ? body.cursor : undefined,
      fields,
      from: typeof body.from === "string" ? body.from : "",
      instrumentId: rawInstrumentId,
      limit: typeof body.limit === "number" ? body.limit : undefined,
      to: typeof body.to === "string" ? body.to : ""
    });
    const meta = {
      asOf: new Date().toISOString(),
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId,
      usage: result.usage
    };

    if (result.status === "not_found") {
      return c.json(createErrorEnvelope("NOT_FOUND", "price history was not found", meta), 404);
    }

    if (result.status === "data_not_licensed") {
      return c.json(
        createErrorEnvelope(
          "DATA_NOT_LICENSED",
          "price history fields or adjustment are not licensed",
          meta
        ),
        403
      );
    }

    if (result.status === "data_quality_hold") {
      return c.json(
        createErrorEnvelope("DATA_QUALITY_HOLD", "price history is held by quality policy", meta),
        409
      );
    }

    if (result.status === "out_of_range") {
      return c.json(
        createErrorEnvelope("OUT_OF_RANGE", "price history range is out of synthetic coverage", meta),
        422
      );
    }

    if (result.status === "too_many_rows") {
      return c.json(
        createErrorEnvelope("TOO_MANY_ROWS", "price history request exceeds row limit", meta),
        422
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getPriceHistoryCapabilities()
        },
        meta
      )
    );
  } catch (error) {
    if (error instanceof PriceHistoryInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.get-price-history-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_price_history failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.get-price-history-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-corporate-actions", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    cursor?: unknown;
    from?: unknown;
    instrument_id?: unknown;
    instrumentId?: unknown;
    limit?: unknown;
    to?: unknown;
    types?: unknown;
  };
  const rawInstrumentId =
    typeof body.instrument_id === "string"
      ? body.instrument_id
      : typeof body.instrumentId === "string"
        ? body.instrumentId
        : "";
  const types = Array.isArray(body.types)
    ? body.types.filter((type): type is string => typeof type === "string")
    : undefined;

  try {
    const result = getCorporateActions({
      cursor: typeof body.cursor === "string" ? body.cursor : undefined,
      from: typeof body.from === "string" ? body.from : "",
      instrumentId: rawInstrumentId,
      limit: typeof body.limit === "number" ? body.limit : undefined,
      to: typeof body.to === "string" ? body.to : "",
      types
    });
    const meta = {
      asOf: new Date().toISOString(),
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId,
      usage: result.usage
    };

    if (result.status === "not_found") {
      return c.json(
        createErrorEnvelope("NOT_FOUND", "corporate actions were not found", meta),
        404
      );
    }

    if (result.status === "data_not_licensed") {
      return c.json(
        createErrorEnvelope(
          "DATA_NOT_LICENSED",
          "corporate action types are not licensed",
          meta
        ),
        403
      );
    }

    if (result.status === "data_quality_hold") {
      return c.json(
        createErrorEnvelope(
          "DATA_QUALITY_HOLD",
          "corporate actions are held by quality policy",
          meta
        ),
        409
      );
    }

    if (result.status === "out_of_range") {
      return c.json(
        createErrorEnvelope(
          "OUT_OF_RANGE",
          "corporate actions range is out of synthetic coverage",
          meta
        ),
        422
      );
    }

    if (result.status === "too_many_rows") {
      return c.json(
        createErrorEnvelope("TOO_MANY_ROWS", "corporate actions request exceeds row limit", meta),
        422
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getCorporateActionsCapabilities()
        },
        meta
      )
    );
  } catch (error) {
    if (error instanceof CorporateActionsInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.get-corporate-actions-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_corporate_actions failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.get-corporate-actions-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-event-timeline", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    cursor?: unknown;
    from?: unknown;
    instrument_id?: unknown;
    instrumentId?: unknown;
    limit?: unknown;
    to?: unknown;
    types?: unknown;
  };
  const rawInstrumentId =
    typeof body.instrument_id === "string"
      ? body.instrument_id
      : typeof body.instrumentId === "string"
        ? body.instrumentId
        : "";
  const types = Array.isArray(body.types)
    ? body.types.filter((type): type is string => typeof type === "string")
    : undefined;

  try {
    const result = getEventTimeline({
      cursor: typeof body.cursor === "string" ? body.cursor : undefined,
      from: typeof body.from === "string" ? body.from : "",
      instrumentId: rawInstrumentId,
      limit: typeof body.limit === "number" ? body.limit : undefined,
      to: typeof body.to === "string" ? body.to : "",
      types
    });
    const meta = {
      asOf: new Date().toISOString(),
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId,
      usage: result.usage
    };

    if (result.status === "not_found") {
      return c.json(
        createErrorEnvelope("NOT_FOUND", "event timeline rows were not found", meta),
        404
      );
    }

    if (result.status === "data_not_licensed") {
      return c.json(
        createErrorEnvelope("DATA_NOT_LICENSED", "event timeline types are not licensed", meta),
        403
      );
    }

    if (result.status === "data_quality_hold") {
      return c.json(
        createErrorEnvelope(
          "DATA_QUALITY_HOLD",
          "event timeline rows are held by quality policy",
          meta
        ),
        409
      );
    }

    if (result.status === "out_of_range") {
      return c.json(
        createErrorEnvelope(
          "OUT_OF_RANGE",
          "event timeline range is out of synthetic coverage",
          meta
        ),
        422
      );
    }

    if (result.status === "too_many_rows") {
      return c.json(
        createErrorEnvelope("TOO_MANY_ROWS", "event timeline request exceeds row limit", meta),
        422
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getEventTimelineCapabilities()
        },
        meta
      )
    );
  } catch (error) {
    if (error instanceof EventTimelineInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase3.get-event-timeline-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_event_timeline failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase3.get-event-timeline-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-financial-facts", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    asOf?: unknown;
    cursor?: unknown;
    from?: unknown;
    instrument_id?: unknown;
    instrumentId?: unknown;
    limit?: unknown;
    metrics?: unknown;
    statement_types?: unknown;
    statementTypes?: unknown;
    to?: unknown;
  };
  const rawInstrumentId =
    typeof body.instrument_id === "string"
      ? body.instrument_id
      : typeof body.instrumentId === "string"
        ? body.instrumentId
        : "";
  const metrics = Array.isArray(body.metrics)
    ? body.metrics.filter((metric): metric is string => typeof metric === "string")
    : undefined;
  const rawStatementTypes = Array.isArray(body.statement_types)
    ? body.statement_types
    : Array.isArray(body.statementTypes)
      ? body.statementTypes
      : undefined;
  const statementTypes = Array.isArray(rawStatementTypes)
    ? rawStatementTypes.filter(
        (statementType): statementType is string => typeof statementType === "string"
      )
    : undefined;

  try {
    const result = getFinancialFacts({
      asOf:
        typeof body.as_of === "string"
          ? body.as_of
          : typeof body.asOf === "string"
            ? body.asOf
            : undefined,
      cursor: typeof body.cursor === "string" ? body.cursor : undefined,
      from: typeof body.from === "string" ? body.from : "",
      instrumentId: rawInstrumentId,
      limit: typeof body.limit === "number" ? body.limit : undefined,
      metrics,
      statementTypes,
      to: typeof body.to === "string" ? body.to : ""
    });
    const meta = {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId,
      usage: result.usage
    };

    if (result.status === "not_found") {
      return c.json(
        createErrorEnvelope("NOT_FOUND", "financial facts were not found", meta),
        404
      );
    }

    if (result.status === "data_not_licensed") {
      return c.json(
        createErrorEnvelope(
          "DATA_NOT_LICENSED",
          "financial metrics or statement types are not licensed",
          meta
        ),
        403
      );
    }

    if (result.status === "data_quality_hold") {
      return c.json(
        createErrorEnvelope(
          "DATA_QUALITY_HOLD",
          "financial facts are held by quality policy",
          meta
        ),
        409
      );
    }

    if (result.status === "point_in_time_unavailable") {
      return c.json(
        createErrorEnvelope(
          "POINT_IN_TIME_UNAVAILABLE",
          "financial facts are unavailable for the requested point in time",
          meta
        ),
        422
      );
    }

    if (result.status === "out_of_range") {
      return c.json(
        createErrorEnvelope(
          "OUT_OF_RANGE",
          "financial facts range is out of synthetic coverage",
          meta
        ),
        422
      );
    }

    if (result.status === "too_many_rows") {
      return c.json(
        createErrorEnvelope("TOO_MANY_ROWS", "financial facts request exceeds row limit", meta),
        422
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getFinancialFactsCapabilities()
        },
        meta
      )
    );
  } catch (error) {
    if (error instanceof FinancialFactsInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_financial_facts failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-data-lineage", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    asOf?: unknown;
    evidence_id?: unknown;
    evidenceId?: unknown;
    include_upstream?: unknown;
    includeUpstream?: unknown;
    record_id?: unknown;
    recordId?: unknown;
  };

  try {
    const result = getDataLineage({
      asOf:
        typeof body.as_of === "string"
          ? body.as_of
          : typeof body.asOf === "string"
            ? body.asOf
            : undefined,
      evidenceId:
        typeof body.evidence_id === "string"
          ? body.evidence_id
          : typeof body.evidenceId === "string"
            ? body.evidenceId
            : undefined,
      includeUpstream:
        typeof body.include_upstream === "boolean"
          ? body.include_upstream
          : typeof body.includeUpstream === "boolean"
            ? body.includeUpstream
            : undefined,
      recordId:
        typeof body.record_id === "string"
          ? body.record_id
          : typeof body.recordId === "string"
            ? body.recordId
            : undefined
    });
    const meta = {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId,
      usage: result.usage
    };

    if (result.status === "not_found") {
      return c.json(createErrorEnvelope("NOT_FOUND", "data lineage was not found", meta), 404);
    }

    if (result.status === "data_quality_hold") {
      return c.json(
        createErrorEnvelope("DATA_QUALITY_HOLD", "data lineage is held by quality policy", meta),
        409
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getDataLineageCapabilities()
        },
        meta
      )
    );
  } catch (error) {
    if (error instanceof DataLineageInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.evidence-lineage-tools-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_data_lineage failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.evidence-lineage-tools-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.post("/tools/get-entitlements", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    asOf?: unknown;
    channel?: unknown;
    dataset?: unknown;
    export_requested?: unknown;
    exportRequested?: unknown;
    fields?: unknown;
    plan?: unknown;
    requested_rows?: unknown;
    requestedRows?: unknown;
    time_range?: unknown;
    timeRange?: unknown;
    tool_name?: unknown;
    toolName?: unknown;
    workspace_id?: unknown;
    workspaceId?: unknown;
  };
  const fields = Array.isArray(body.fields)
    ? body.fields.filter((field): field is string => typeof field === "string")
    : undefined;
  const rawTimeRange = isTimeRange(body.time_range)
    ? body.time_range
    : isTimeRange(body.timeRange)
      ? body.timeRange
      : undefined;

  try {
    const result = getEntitlements({
      asOf:
        typeof body.as_of === "string"
          ? body.as_of
          : typeof body.asOf === "string"
            ? body.asOf
            : undefined,
      channel: typeof body.channel === "string" ? body.channel : undefined,
      dataset: typeof body.dataset === "string" ? body.dataset : undefined,
      exportRequested:
        typeof body.export_requested === "boolean"
          ? body.export_requested
          : typeof body.exportRequested === "boolean"
            ? body.exportRequested
            : undefined,
      fields,
      plan: typeof body.plan === "string" ? body.plan : undefined,
      requestedRows:
        typeof body.requested_rows === "number"
          ? body.requested_rows
          : typeof body.requestedRows === "number"
            ? body.requestedRows
            : undefined,
      timeRange: rawTimeRange,
      toolName:
        typeof body.tool_name === "string"
          ? body.tool_name
          : typeof body.toolName === "string"
            ? body.toolName
            : undefined,
      workspaceId:
        typeof body.workspace_id === "string"
          ? body.workspace_id
          : typeof body.workspaceId === "string"
            ? body.workspaceId
            : undefined
    });
    const meta = {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId,
      usage: result.usage
    };

    if (result.status === "scope_denied") {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", "entitlement workspace scope is denied", meta),
        403
      );
    }

    if (result.status === "data_not_licensed") {
      return c.json(
        createErrorEnvelope("DATA_NOT_LICENSED", "requested entitlement scope is not licensed", meta),
        403
      );
    }

    if (result.status === "out_of_range") {
      return c.json(
        createErrorEnvelope("OUT_OF_RANGE", "entitlement time range is out of policy", meta),
        422
      );
    }

    if (result.status === "too_many_rows") {
      return c.json(
        createErrorEnvelope("TOO_MANY_ROWS", "entitlement row request exceeds policy", meta),
        422
      );
    }

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getEntitlementsCapabilities()
        },
        meta
      )
    );
  } catch (error) {
    if (error instanceof EntitlementsInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.evidence-lineage-tools-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "get_entitlements failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.evidence-lineage-tools-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

app.get("/evidence/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getEvidenceServiceCapabilities(), {
      asOf: new Date().toISOString(),
      dataVersion: "evidence-lineage-service-scaffold-v0",
      methodologyVersion:
        "2026-06-21.phase1.evidence-lineage-service-scaffold.v0",
      provenance: [
        {
          data_version: "evidence-lineage-service-scaffold-v0",
          methodology_version:
            "2026-06-21.phase1.evidence-lineage-service-scaffold.v0",
          source: "evidence-lineage-service",
          source_record_id: "runtime-capabilities"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    })
  );
});

app.post("/evidence/records/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    as_of?: unknown;
    asOf?: unknown;
    data_version?: unknown;
    dataVersion?: unknown;
    input_schema_id?: unknown;
    inputSchemaId?: unknown;
    methodology_version?: unknown;
    methodologyVersion?: unknown;
    output_schema_id?: unknown;
    outputSchemaId?: unknown;
    request_id?: unknown;
    requestId?: unknown;
    source_records?: unknown;
    sourceRecords?: unknown;
    tool_name?: unknown;
    toolName?: unknown;
    tool_version?: unknown;
    toolVersion?: unknown;
    user_visible_label?: unknown;
    userVisibleLabel?: unknown;
  };
  const rawSourceRecords = Array.isArray(body.source_records)
    ? body.source_records
    : Array.isArray(body.sourceRecords)
      ? body.sourceRecords
      : [];
  const sourceRecords = rawSourceRecords
    .filter((sourceRecord): sourceRecord is Record<string, unknown> =>
      typeof sourceRecord === "object" && sourceRecord !== null && !Array.isArray(sourceRecord)
    )
    .map((sourceRecord) => ({
      dataVersion:
        typeof sourceRecord.data_version === "string"
          ? sourceRecord.data_version
          : typeof sourceRecord.dataVersion === "string"
            ? sourceRecord.dataVersion
            : "",
      methodologyVersion:
        typeof sourceRecord.methodology_version === "string"
          ? sourceRecord.methodology_version
          : typeof sourceRecord.methodologyVersion === "string"
            ? sourceRecord.methodologyVersion
            : "",
      source: typeof sourceRecord.source === "string" ? sourceRecord.source : "",
      sourceRecordId:
        typeof sourceRecord.source_record_id === "string"
          ? sourceRecord.source_record_id
          : typeof sourceRecord.sourceRecordId === "string"
            ? sourceRecord.sourceRecordId
            : ""
    }));

  try {
    const result = createEvidenceRecordPlan({
      asOf:
        typeof body.as_of === "string"
          ? body.as_of
          : typeof body.asOf === "string"
            ? body.asOf
            : undefined,
      dataVersion:
        typeof body.data_version === "string"
          ? body.data_version
          : typeof body.dataVersion === "string"
            ? body.dataVersion
            : "",
      inputSchemaId:
        typeof body.input_schema_id === "string"
          ? body.input_schema_id
          : typeof body.inputSchemaId === "string"
            ? body.inputSchemaId
            : undefined,
      methodologyVersion:
        typeof body.methodology_version === "string"
          ? body.methodology_version
          : typeof body.methodologyVersion === "string"
            ? body.methodologyVersion
            : "",
      outputSchemaId:
        typeof body.output_schema_id === "string"
          ? body.output_schema_id
          : typeof body.outputSchemaId === "string"
            ? body.outputSchemaId
            : undefined,
      requestId:
        typeof body.request_id === "string"
          ? body.request_id
          : typeof body.requestId === "string"
            ? body.requestId
            : requestId,
      sourceRecords,
      toolName:
        typeof body.tool_name === "string"
          ? body.tool_name
          : typeof body.toolName === "string"
            ? body.toolName
            : "",
      toolVersion:
        typeof body.tool_version === "string"
          ? body.tool_version
          : typeof body.toolVersion === "string"
            ? body.toolVersion
            : undefined,
      userVisibleLabel:
        typeof body.user_visible_label === "string"
          ? body.user_visible_label
          : typeof body.userVisibleLabel === "string"
            ? body.userVisibleLabel
            : undefined
    });

    return c.json(
      createSuccessEnvelope(result, {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        provenance: result.provenance,
        requestId,
        usage: result.usage
      })
    );
  } catch (error) {
    if (error instanceof EvidenceServiceInputError) {
      return c.json(
        createErrorEnvelope("SCOPE_DENIED", error.message, {
          asOf: new Date().toISOString(),
          methodologyVersion:
            "2026-06-21.phase1.evidence-lineage-service-scaffold.v0",
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }),
        400
      );
    }

    return c.json(
      createErrorEnvelope("INTERNAL_ERROR", "evidence record plan failed", {
        asOf: new Date().toISOString(),
        methodologyVersion:
          "2026-06-21.phase1.evidence-lineage-service-scaffold.v0",
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      500
    );
  }
});

export class AiphaBeeRunCoordinator {
  private readonly state: RuntimeDurableObjectState;

  constructor(state: RuntimeDurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "POST" || url.pathname !== CLOUDFLARE_DURABLE_OBJECT_SMOKE_ROUTE) {
      return Response.json(
        {
          status: "not_found"
        },
        { status: 404 }
      );
    }

    const payload = await request.json().catch(() => undefined);

    if (!isCloudflareDurableObjectSmokePayload(payload)) {
      return Response.json(
        {
          failure_code: "invalid_durable_object_smoke_payload",
          status: "failed"
        },
        { status: 400 }
      );
    }

    await this.state.storage.put(payload.state_key, {
      stored_at: new Date().toISOString(),
      value_hash: payload.value_hash
    });
    const stored = await this.state.storage.get(payload.state_key);

    if (!isPlainRecord(stored) || stored.value_hash !== payload.value_hash) {
      return Response.json(
        {
          failure_code: "durable_object_state_read_mismatch",
          status: "failed"
        },
        { status: 500 }
      );
    }

    await this.state.storage.delete(payload.state_key);

    return Response.json({
      operation_count: 3,
      state_key_hash: await hashRuntimeSmokeString(payload.state_key),
      status: "ok",
      value_hash: payload.value_hash
    });
  }
}

export class AiphaBeeResearchWorkflow extends WorkflowEntrypoint<
  WorkerBindings,
  CloudflareWorkflowSmokePayload
> {
  async run(
    event: Readonly<WorkflowEvent<CloudflareWorkflowSmokePayload>>,
    step: WorkflowStep
  ): Promise<unknown> {
    const payload = event.payload;

    if (!isCloudflareWorkflowSmokePayload(payload)) {
      return {
        failure_code: "invalid_workflow_smoke_payload",
        status: "failed"
      };
    }

    return step.do("record workflow smoke evidence", async () => {
      const config = this.env.AIPHABEE_CONFIG;

      if (!isRuntimeKvNamespace(config)) {
        throw new Error("AIPHABEE_CONFIG binding is required for workflow smoke evidence");
      }

      await config.put(
        payload.evidence_key,
        JSON.stringify({
          instance_id_hash: await hashRuntimeSmokeString(event.instanceId),
          status: "executed",
          value_hash: payload.value_hash,
          workflow_name_hash: await hashRuntimeSmokeString(event.workflowName)
        })
      );

      return {
        evidence_key_hash: await hashRuntimeSmokeString(payload.evidence_key),
        operation_count: 1,
        status: "ok",
        value_hash: payload.value_hash
      };
    });
  }
}

const worker = Object.assign(app, {
  queue: handleCloudflareQueueBatch,
  scheduled: handleCloudflareScheduled
});

export default worker;

async function runCloudflareBindingRuntimeSmoke(
  env: WorkerBindings
): Promise<CloudflareBindingSmokeResult[]> {
  const results: CloudflareBindingSmokeResult[] = [];

  results.push(await smokeRuntimeKv(env.AIPHABEE_CONFIG));
  results.push(await smokeRuntimeR2(env.AIPHABEE_ARTIFACTS));
  results.push(await smokeRuntimeD1(env.AIPHABEE_EVAL_STORE));

  return results;
}

async function runCloudflareQueueSmoke(env: WorkerBindings): Promise<CloudflareQueueSmokeResult> {
  const queue = env.AIPHABEE_EVENTS_QUEUE;
  const config = env.AIPHABEE_CONFIG;
  const surface = "queue_publish_consume_smoke";

  if (!isRuntimeQueue(queue)) {
    return missingCloudflareQueueResult("missing_queue_binding");
  }

  if (!isRuntimeKvNamespace(config)) {
    return missingCloudflareQueueResult("missing_kv_binding");
  }

  const smokeId = crypto.randomUUID();
  const evidenceKey = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/queue/${smokeId}`;
  const messageHash = await hashRuntimeSmokeString(`${CLOUDFLARE_QUEUE_SMOKE_KIND}:${smokeId}`);
  const payload: CloudflareQueueSmokePayload = {
    evidence_key: evidenceKey,
    issued_at: new Date().toISOString(),
    kind: CLOUDFLARE_QUEUE_SMOKE_KIND,
    message_hash: messageHash,
    smoke_id: smokeId
  };

  try {
    await queue.send(payload);
    const evidence = await readQueueSmokeEvidence(config, evidenceKey);

    if (evidence === null) {
      return failedCloudflareQueueResult({
        detail: "queue consumer did not write smoke evidence before timeout",
        failureCode: "queue_consume_timeout",
        key: evidenceKey
      });
    }

    await config.delete(evidenceKey);

    return {
      binding_name: "AIPHABEE_EVENTS_QUEUE",
      evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
      message_hash: messageHash,
      operation_count: 3,
      status: "passed",
      surface
    };
  } catch (error) {
    await config.delete(evidenceKey).catch(() => undefined);

    return failedCloudflareQueueResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "queue_publish_consume_failed",
      key: evidenceKey
    });
  }
}

async function handleCloudflareQueueBatch(
  batch: RuntimeQueueBatch,
  env: WorkerBindings
): Promise<void> {
  const config = env.AIPHABEE_CONFIG;

  if (!isRuntimeKvNamespace(config)) {
    throw new Error("AIPHABEE_CONFIG binding is required for queue smoke evidence");
  }

  for (const message of batch.messages) {
    if (!isCloudflareQueueSmokePayload(message.body)) {
      continue;
    }

    await config.put(
      message.body.evidence_key,
      JSON.stringify({
        consumed_at: new Date().toISOString(),
        message_hash: message.body.message_hash,
        queue: batch.queue,
        status: "consumed"
      })
    );
    message.ack?.();
  }
}

async function runCloudflareDurableObjectSmoke(
  env: WorkerBindings
): Promise<CloudflareDurableObjectSmokeResult> {
  const namespace = env.AIPHABEE_RUN_COORDINATOR;

  if (!isRuntimeDurableObjectNamespace(namespace)) {
    return missingCloudflareDurableObjectResult("missing_durable_object_binding");
  }

  const smokeId = crypto.randomUUID();
  const objectName = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/do/${smokeId}`;
  const stateKey = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/do-state/${smokeId}`;
  const valueHash = await hashRuntimeSmokeString(
    `${CLOUDFLARE_DURABLE_OBJECT_SMOKE_KIND}:${smokeId}`
  );
  const payload: CloudflareDurableObjectSmokePayload = {
    kind: CLOUDFLARE_DURABLE_OBJECT_SMOKE_KIND,
    smoke_id: smokeId,
    state_key: stateKey,
    value_hash: valueHash
  };

  try {
    const stub = namespace.get(namespace.idFromName(objectName));
    const response = await stub.fetch(`https://aiphabee.internal${CLOUDFLARE_DURABLE_OBJECT_SMOKE_ROUTE}`, {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    });
    const body = await response.json().catch(() => undefined);

    if (response.status !== 200 || !isPlainRecord(body) || body.status !== "ok") {
      return failedCloudflareDurableObjectResult({
        detail: JSON.stringify({
          failure_code: isPlainRecord(body) ? body.failure_code : undefined,
          http_status: response.status,
          status: isPlainRecord(body) ? body.status : undefined
        }),
        failureCode: "durable_object_state_route_failed",
        objectName,
        stateKey
      });
    }

    return {
      binding_name: "AIPHABEE_RUN_COORDINATOR",
      object_name_hash: await hashRuntimeSmokeString(objectName),
      operation_count:
        typeof body.operation_count === "number" ? body.operation_count : 3,
      response_hash: await hashRuntimeSmokeString(JSON.stringify(body)),
      state_key_hash: await hashRuntimeSmokeString(stateKey),
      status: "passed",
      surface: "durable_object_state_smoke",
      value_hash: valueHash
    };
  } catch (error) {
    return failedCloudflareDurableObjectResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "durable_object_state_command_failed",
      objectName,
      stateKey
    });
  }
}

async function smokeRuntimeKv(value: unknown): Promise<CloudflareBindingSmokeResult> {
  const bindingName = "AIPHABEE_CONFIG";
  const surface = "kv_runtime_put_get_delete";

  if (!isRuntimeKvNamespace(value)) {
    return missingCloudflareBindingResult(bindingName, surface);
  }

  const key = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/kv/${crypto.randomUUID()}`;
  const storedValue = JSON.stringify({
    route: CLOUDFLARE_BINDING_SMOKE_ROUTE,
    surface,
    version: 1
  });

  try {
    await value.put(key, storedValue);
    const readValue = await value.get(key);

    if (readValue !== storedValue) {
      return failedCloudflareBindingResult({
        bindingName,
        detail: "kv read value did not match written value",
        failureCode: "kv_runtime_read_mismatch",
        key,
        surface
      });
    }

    await value.delete(key);

    return {
      binding_name: bindingName,
      key_hash: await hashRuntimeSmokeString(key),
      operation_count: 3,
      status: "passed",
      surface,
      value_hash: await hashRuntimeSmokeString(storedValue)
    };
  } catch (error) {
    await value.delete(key).catch(() => undefined);

    return failedCloudflareBindingResult({
      bindingName,
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "kv_runtime_command_failed",
      key,
      surface
    });
  }
}

async function smokeRuntimeR2(value: unknown): Promise<CloudflareBindingSmokeResult> {
  const bindingName = "AIPHABEE_ARTIFACTS";
  const surface = "r2_runtime_put_get_delete";

  if (!isRuntimeR2Bucket(value)) {
    return missingCloudflareBindingResult(bindingName, surface);
  }

  const objectKey = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/r2/${crypto.randomUUID()}.json`;
  const storedValue = JSON.stringify({
    route: CLOUDFLARE_BINDING_SMOKE_ROUTE,
    surface,
    version: 1
  });

  try {
    await value.put(objectKey, storedValue);
    const object = await value.get(objectKey);
    const readValue = object === null ? null : await object.text();

    if (readValue !== storedValue) {
      return failedCloudflareBindingResult({
        bindingName,
        detail: "r2 read value did not match written value",
        failureCode: "r2_runtime_read_mismatch",
        key: objectKey,
        surface
      });
    }

    await value.delete(objectKey);

    return {
      binding_name: bindingName,
      object_key_hash: await hashRuntimeSmokeString(objectKey),
      operation_count: 3,
      status: "passed",
      surface,
      value_hash: await hashRuntimeSmokeString(storedValue)
    };
  } catch (error) {
    await value.delete(objectKey).catch(() => undefined);

    return failedCloudflareBindingResult({
      bindingName,
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "r2_runtime_command_failed",
      key: objectKey,
      surface
    });
  }
}

async function smokeRuntimeD1(value: unknown): Promise<CloudflareBindingSmokeResult> {
  const bindingName = "AIPHABEE_EVAL_STORE";
  const surface = "d1_runtime_write_read_delete";

  if (!isRuntimeD1Database(value)) {
    return missingCloudflareBindingResult(bindingName, surface);
  }

  const table = "aiphabee_smoke_runtime";
  const rowKey = crypto.randomUUID();
  const storedValue = JSON.stringify({
    route: CLOUDFLARE_BINDING_SMOKE_ROUTE,
    surface,
    version: 1
  });

  try {
    await value
      .prepare(
        `CREATE TABLE IF NOT EXISTS ${table} (` +
          "id TEXT PRIMARY KEY, value TEXT NOT NULL, created_at TEXT NOT NULL" +
          ")"
      )
      .run();
    await value
      .prepare(`INSERT OR REPLACE INTO ${table} (id, value, created_at) VALUES (?, ?, datetime('now'))`)
      .bind(rowKey, storedValue)
      .run();
    const selected = await value
      .prepare(`SELECT value FROM ${table} WHERE id = ?`)
      .bind(rowKey)
      .first<{ value?: string }>();

    if (selected?.value !== storedValue) {
      return failedCloudflareBindingResult({
        bindingName,
        detail: "d1 select did not return written value",
        failureCode: "d1_runtime_select_mismatch",
        key: table,
        surface
      });
    }

    await value.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(rowKey).run();
    await value.prepare(`DROP TABLE IF EXISTS ${table}`).run();

    return {
      binding_name: bindingName,
      operation_count: 5,
      status: "passed",
      surface,
      table_hash: await hashRuntimeSmokeString(table),
      value_hash: await hashRuntimeSmokeString(storedValue)
    };
  } catch (error) {
    await value.prepare(`DROP TABLE IF EXISTS ${table}`).run().catch(() => undefined);

    return failedCloudflareBindingResult({
      bindingName,
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "d1_runtime_command_failed",
      key: table,
      surface
    });
  }
}

async function runCloudflareWorkflowSmoke(env: WorkerBindings): Promise<CloudflareWorkflowSmokeResult> {
  const workflow = env.AIPHABEE_RESEARCH_WORKFLOW;
  const config = env.AIPHABEE_CONFIG;

  if (!isRuntimeWorkflow(workflow)) {
    return missingCloudflareWorkflowResult("missing_workflow_binding");
  }

  if (!isRuntimeKvNamespace(config)) {
    return missingCloudflareWorkflowResult("missing_kv_binding");
  }

  const smokeId = crypto.randomUUID();
  const evidenceKey = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/workflow/${smokeId}`;
  const valueHash = await hashRuntimeSmokeString(`${CLOUDFLARE_WORKFLOW_SMOKE_KIND}:${smokeId}`);
  const payload: CloudflareWorkflowSmokePayload = {
    evidence_key: evidenceKey,
    issued_at: new Date().toISOString(),
    kind: CLOUDFLARE_WORKFLOW_SMOKE_KIND,
    smoke_id: smokeId,
    value_hash: valueHash
  };

  try {
    const instance = await workflow.create({
      id: smokeId,
      params: payload
    });
    const evidence = await readWorkflowSmokeEvidence(config, evidenceKey);

    if (evidence === null) {
      const status = await instance.status().catch(() => undefined);

      return failedCloudflareWorkflowResult({
        detail: JSON.stringify({
          instance_status: isPlainRecord(status) ? status.status : undefined,
          reason: "workflow did not write smoke evidence before timeout"
        }),
        evidenceKey,
        failureCode: "workflow_execution_timeout",
        instanceId: instance.id
      });
    }

    await config.delete(evidenceKey);

    return {
      binding_name: "AIPHABEE_RESEARCH_WORKFLOW",
      evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
      instance_id_hash: await hashRuntimeSmokeString(instance.id),
      operation_count: 3,
      response_hash: await hashRuntimeSmokeString(evidence),
      status: "passed",
      surface: "workflow_instance_execution",
      value_hash: valueHash
    };
  } catch (error) {
    await config.delete(evidenceKey).catch(() => undefined);

    return failedCloudflareWorkflowResult({
      detail: error instanceof Error ? error.message : String(error),
      evidenceKey,
      failureCode: "workflow_execution_failed",
      instanceId: smokeId
    });
  }
}

async function runCloudflareCronSmoke(
  env: WorkerBindings,
  controller: RuntimeScheduledController
): Promise<CloudflareCronSmokeResult> {
  const config = env.AIPHABEE_CONFIG;

  if (!isRuntimeKvNamespace(config)) {
    return missingCloudflareCronResult("missing_kv_binding");
  }

  const smokeId = crypto.randomUUID();
  const evidenceKey = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/cron/${smokeId}`;
  const valueHash = await hashRuntimeSmokeString(
    `${CLOUDFLARE_CRON_SMOKE_KIND}:${controller.cron}:${controller.scheduledTime}`
  );

  try {
    await config.put(
      evidenceKey,
      JSON.stringify({
        cron_hash: await hashRuntimeSmokeString(controller.cron),
        kind: CLOUDFLARE_CRON_SMOKE_KIND,
        scheduled_time_hash: await hashRuntimeSmokeString(String(controller.scheduledTime)),
        status: "executed",
        type: controller.type ?? "scheduled",
        value_hash: valueHash
      })
    );
    const evidence = await config.get(evidenceKey);

    if (evidence === null) {
      return failedCloudflareCronResult({
        cron: controller.cron,
        detail: "cron smoke evidence was not readable after write",
        evidenceKey,
        failureCode: "cron_evidence_read_mismatch",
        scheduledTime: controller.scheduledTime
      });
    }

    await config.delete(evidenceKey);

    return {
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      cron_hash: await hashRuntimeSmokeString(controller.cron),
      evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
      operation_count: 3,
      scheduled_time_hash: await hashRuntimeSmokeString(String(controller.scheduledTime)),
      status: "passed",
      surface: "cron_handler_smoke",
      value_hash: valueHash
    };
  } catch (error) {
    await config.delete(evidenceKey).catch(() => undefined);

    return failedCloudflareCronResult({
      cron: controller.cron,
      detail: error instanceof Error ? error.message : String(error),
      evidenceKey,
      failureCode: "cron_handler_failed",
      scheduledTime: controller.scheduledTime
    });
  }
}

function handleCloudflareScheduled(
  controller: RuntimeScheduledController,
  env: WorkerBindings,
  ctx: RuntimeExecutionContext
): void {
  const task = runCloudflareCronSmoke(env, controller).then((result) => {
    if (result.status !== "passed") {
      throw new Error(`Cloudflare cron smoke failed: ${result.failure_code ?? "unknown"}`);
    }
  });

  ctx.waitUntil?.(task);
}

function missingCloudflareQueueResult(failureCode: string): CloudflareQueueSmokeResult {
  return {
    binding_name: "AIPHABEE_EVENTS_QUEUE",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "queue_publish_consume_smoke"
  };
}

function missingQueueSmokeBindings(result: CloudflareQueueSmokeResult): string[] {
  if (result.status !== "missing_binding") {
    return [];
  }

  if (result.failure_code === "missing_kv_binding") {
    return ["AIPHABEE_CONFIG"];
  }

  return ["AIPHABEE_EVENTS_QUEUE"];
}

function missingCloudflareDurableObjectResult(
  failureCode: string
): CloudflareDurableObjectSmokeResult {
  return {
    binding_name: "AIPHABEE_RUN_COORDINATOR",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "durable_object_state_smoke"
  };
}

function missingCloudflareWorkflowResult(failureCode: string): CloudflareWorkflowSmokeResult {
  return {
    binding_name: "AIPHABEE_RESEARCH_WORKFLOW",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "workflow_instance_execution"
  };
}

function missingWorkflowSmokeBindings(result: CloudflareWorkflowSmokeResult): string[] {
  if (result.status !== "missing_binding") {
    return [];
  }

  if (result.failure_code === "missing_kv_binding") {
    return ["AIPHABEE_CONFIG"];
  }

  return ["AIPHABEE_RESEARCH_WORKFLOW"];
}

function missingCloudflareCronResult(failureCode: string): CloudflareCronSmokeResult {
  return {
    binding_name: "AIPHABEE_MAINTENANCE_CRON",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "cron_handler_smoke"
  };
}

async function failedCloudflareQueueResult({
  detail,
  failureCode,
  key
}: {
  detail: string;
  failureCode: string;
  key: string;
}): Promise<CloudflareQueueSmokeResult> {
  return {
    binding_name: "AIPHABEE_EVENTS_QUEUE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    evidence_key_hash: await hashRuntimeSmokeString(key),
    failure_code: failureCode,
    status: "failed",
    surface: "queue_publish_consume_smoke"
  };
}

async function failedCloudflareDurableObjectResult({
  detail,
  failureCode,
  objectName,
  stateKey
}: {
  detail: string;
  failureCode: string;
  objectName: string;
  stateKey: string;
}): Promise<CloudflareDurableObjectSmokeResult> {
  return {
    binding_name: "AIPHABEE_RUN_COORDINATOR",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    object_name_hash: await hashRuntimeSmokeString(objectName),
    state_key_hash: await hashRuntimeSmokeString(stateKey),
    status: "failed",
    surface: "durable_object_state_smoke"
  };
}

async function failedCloudflareWorkflowResult({
  detail,
  evidenceKey,
  failureCode,
  instanceId
}: {
  detail: string;
  evidenceKey: string;
  failureCode: string;
  instanceId: string;
}): Promise<CloudflareWorkflowSmokeResult> {
  return {
    binding_name: "AIPHABEE_RESEARCH_WORKFLOW",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
    failure_code: failureCode,
    instance_id_hash: await hashRuntimeSmokeString(instanceId),
    status: "failed",
    surface: "workflow_instance_execution"
  };
}

async function failedCloudflareCronResult({
  cron,
  detail,
  evidenceKey,
  failureCode,
  scheduledTime
}: {
  cron: string;
  detail: string;
  evidenceKey: string;
  failureCode: string;
  scheduledTime: number;
}): Promise<CloudflareCronSmokeResult> {
  return {
    binding_name: "AIPHABEE_MAINTENANCE_CRON",
    cron_hash: await hashRuntimeSmokeString(cron),
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
    failure_code: failureCode,
    scheduled_time_hash: await hashRuntimeSmokeString(String(scheduledTime)),
    status: "failed",
    surface: "cron_handler_smoke"
  };
}

async function readQueueSmokeEvidence(
  config: RuntimeKvNamespace,
  evidenceKey: string
): Promise<string | null> {
  for (let attempt = 1; attempt <= CLOUDFLARE_QUEUE_SMOKE_MAX_ATTEMPTS; attempt += 1) {
    const evidence = await config.get(evidenceKey);

    if (evidence !== null) {
      return evidence;
    }

    await sleepRuntimeSmoke(CLOUDFLARE_QUEUE_SMOKE_POLL_MS);
  }

  return null;
}

async function readWorkflowSmokeEvidence(
  config: RuntimeKvNamespace,
  evidenceKey: string
): Promise<string | null> {
  for (let attempt = 1; attempt <= CLOUDFLARE_WORKFLOW_SMOKE_MAX_ATTEMPTS; attempt += 1) {
    const evidence = await config.get(evidenceKey);

    if (evidence !== null) {
      return evidence;
    }

    await sleepRuntimeSmoke(CLOUDFLARE_WORKFLOW_SMOKE_POLL_MS);
  }

  return null;
}

function missingCloudflareBindingResult(
  bindingName: CloudflareBindingSmokeResult["binding_name"],
  surface: CloudflareBindingSmokeResult["surface"]
): CloudflareBindingSmokeResult {
  return {
    binding_name: bindingName,
    failure_code: "missing_binding",
    status: "missing_binding",
    surface
  };
}

async function failedCloudflareBindingResult({
  bindingName,
  detail,
  failureCode,
  key,
  surface
}: {
  bindingName: CloudflareBindingSmokeResult["binding_name"];
  detail: string;
  failureCode: string;
  key: string;
  surface: CloudflareBindingSmokeResult["surface"];
}): Promise<CloudflareBindingSmokeResult> {
  return {
    binding_name: bindingName,
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    key_hash: await hashRuntimeSmokeString(key),
    status: "failed",
    surface
  };
}

function isRuntimeKvNamespace(value: unknown): value is RuntimeKvNamespace {
  return (
    isPlainRecord(value) &&
    typeof value.delete === "function" &&
    typeof value.get === "function" &&
    typeof value.put === "function"
  );
}

function isRuntimeR2Bucket(value: unknown): value is RuntimeR2Bucket {
  return (
    isPlainRecord(value) &&
    typeof value.delete === "function" &&
    typeof value.get === "function" &&
    typeof value.put === "function"
  );
}

function isRuntimeD1Database(value: unknown): value is RuntimeD1Database {
  return isPlainRecord(value) && typeof value.prepare === "function";
}

function isRuntimeQueue(value: unknown): value is RuntimeQueue {
  return isPlainRecord(value) && typeof value.send === "function";
}

function isRuntimeWorkflow<T = unknown>(value: unknown): value is RuntimeWorkflow<T> {
  return isPlainRecord(value) && typeof value.create === "function";
}

function isRuntimeDurableObjectNamespace(
  value: unknown
): value is RuntimeDurableObjectNamespace {
  return (
    isPlainRecord(value) &&
    typeof value.get === "function" &&
    typeof value.idFromName === "function"
  );
}

function isCloudflareQueueSmokePayload(value: unknown): value is CloudflareQueueSmokePayload {
  return (
    isPlainRecord(value) &&
    value.kind === CLOUDFLARE_QUEUE_SMOKE_KIND &&
    typeof value.evidence_key === "string" &&
    value.evidence_key.startsWith(`${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/queue/`) &&
    typeof value.message_hash === "string" &&
    value.message_hash.startsWith("sha256:") &&
    typeof value.smoke_id === "string"
  );
}

function isCloudflareDurableObjectSmokePayload(
  value: unknown
): value is CloudflareDurableObjectSmokePayload {
  return (
    isPlainRecord(value) &&
    value.kind === CLOUDFLARE_DURABLE_OBJECT_SMOKE_KIND &&
    typeof value.smoke_id === "string" &&
    typeof value.state_key === "string" &&
    value.state_key.startsWith(`${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/do-state/`) &&
    typeof value.value_hash === "string" &&
    value.value_hash.startsWith("sha256:")
  );
}

function isCloudflareWorkflowSmokePayload(value: unknown): value is CloudflareWorkflowSmokePayload {
  return (
    isPlainRecord(value) &&
    value.kind === CLOUDFLARE_WORKFLOW_SMOKE_KIND &&
    typeof value.evidence_key === "string" &&
    value.evidence_key.startsWith(`${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/workflow/`) &&
    typeof value.issued_at === "string" &&
    typeof value.smoke_id === "string" &&
    typeof value.value_hash === "string" &&
    value.value_hash.startsWith("sha256:")
  );
}

async function hashRuntimeSmokeString(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

  return `sha256:${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function sanitizeRuntimeSmokeDetail(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/gu, "sk-[REDACTED]")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/gu, "gh[REDACTED]")
    .replace(/\b[a-f0-9]{32}\b/giu, "[REDACTED_ID]")
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/giu,
      "[REDACTED_UUID]"
    );
}

function sleepRuntimeSmoke(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function normalizePostGenerationEvidenceBindingInput(
  body: AgentRunRequestBody,
  requestId: string
): ValidatePostGenerationEvidenceBindingInput {
  return {
    answerText: normalizeString(body.answer_text ?? body.answerText),
    asOf: normalizeString(body.as_of ?? body.asOf),
    calculations: normalizePostGenerationCalculationRefs(body.calculations),
    claims: normalizePostGenerationClaims(body.claims),
    evidenceCards: normalizePostGenerationEvidenceCards(body.evidence_cards ?? body.evidenceCards),
    requestId
  };
}

function normalizePostGenerationClaims(
  value: unknown
): ValidatePostGenerationEvidenceBindingInput["claims"] {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const claims: NonNullable<ValidatePostGenerationEvidenceBindingInput["claims"]> = [];

  for (const item of value.filter((entry): entry is Record<string, unknown> => isPlainRecord(entry))) {
    const text = normalizeString(item.text ?? item.claim_text ?? item.claimText);

    if (text === undefined) {
      continue;
    }

    const claim: NonNullable<ValidatePostGenerationEvidenceBindingInput["claims"]>[number] = {
      text
    };
    const calculationId = normalizeString(item.calculation_id ?? item.calculationId);
    const claimId = normalizeString(item.claim_id ?? item.claimId);
    const dataVersion = normalizeString(item.data_version ?? item.dataVersion);
    const evidenceCardId = normalizeString(
      item.evidence_card_id ?? item.evidenceCardId ?? item.card_id ?? item.cardId
    );
    const label = normalizeAnswerClaimLabel(item.label);
    const methodologyVersion = normalizeString(item.methodology_version ?? item.methodologyVersion);
    const sourceRecordId = normalizeString(item.source_record_id ?? item.sourceRecordId);

    if (calculationId !== undefined) {
      claim.calculationId = calculationId;
    }
    if (claimId !== undefined) {
      claim.claimId = claimId;
    }
    if (dataVersion !== undefined) {
      claim.dataVersion = dataVersion;
    }
    if (evidenceCardId !== undefined) {
      claim.evidenceCardId = evidenceCardId;
    }
    if (label !== undefined) {
      claim.label = label;
    }
    if (methodologyVersion !== undefined) {
      claim.methodologyVersion = methodologyVersion;
    }
    if (sourceRecordId !== undefined) {
      claim.sourceRecordId = sourceRecordId;
    }

    claims.push(claim);
  }

  return claims.length > 0 ? claims : undefined;
}

function normalizePostGenerationEvidenceCards(
  value: unknown
): ValidatePostGenerationEvidenceBindingInput["evidenceCards"] {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cards = value
    .filter((item): item is Record<string, unknown> => isPlainRecord(item))
    .map((item) => {
      const cardId = normalizeString(item.card_id ?? item.cardId);
      const dataVersion = normalizeString(item.data_version ?? item.dataVersion);
      const methodologyVersion = normalizeString(item.methodology_version ?? item.methodologyVersion);
      const sourceRecordId = normalizeString(item.source_record_id ?? item.sourceRecordId);

      return cardId !== undefined &&
        dataVersion !== undefined &&
        methodologyVersion !== undefined &&
        sourceRecordId !== undefined
        ? {
            cardId,
            dataVersion,
            methodologyVersion,
            sourceRecordId
          }
        : undefined;
    })
    .filter(
      (
        card
      ): card is NonNullable<ValidatePostGenerationEvidenceBindingInput["evidenceCards"]>[number] =>
        card !== undefined
    );

  return cards.length > 0 ? cards : undefined;
}

function normalizePostGenerationCalculationRefs(
  value: unknown
): ValidatePostGenerationEvidenceBindingInput["calculations"] {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const calculations = value
    .filter((item): item is Record<string, unknown> => isPlainRecord(item))
    .map((item) => {
      const calculationId = normalizeString(item.calculation_id ?? item.calculationId);
      const methodologyVersion = normalizeString(item.methodology_version ?? item.methodologyVersion);
      const sourceRecordIds = normalizeStringArray(
        item.source_record_ids ?? item.sourceRecordIds
      );

      return calculationId !== undefined &&
        methodologyVersion !== undefined &&
        sourceRecordIds !== undefined &&
        sourceRecordIds.length > 0
        ? {
            calculationId,
            methodologyVersion,
            sourceRecordIds
          }
        : undefined;
    })
    .filter(
      (
        calculation
      ): calculation is NonNullable<
        ValidatePostGenerationEvidenceBindingInput["calculations"]
      >[number] => calculation !== undefined
    );

  return calculations.length > 0 ? calculations : undefined;
}

function normalizeAnswerClaimLabel(
  value: unknown
): NonNullable<ValidatePostGenerationEvidenceBindingInput["claims"]>[number]["label"] {
  return value === "calculation" || value === "fact" || value === "inference" || value === "unknown"
    ? value
    : undefined;
}

function createAgentRunInput(
  body: AgentRunRequestBody,
  requestId: string
): AgentRunSkeletonInput {
  return {
    asOf:
      typeof body.as_of === "string"
        ? body.as_of
        : typeof body.asOf === "string"
          ? body.asOf
          : undefined,
    channel: typeof body.channel === "string" ? body.channel : undefined,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    entitlementPolicyVersion:
      typeof body.entitlement_policy_version === "string"
        ? body.entitlement_policy_version
        : typeof body.entitlementPolicyVersion === "string"
          ? body.entitlementPolicyVersion
          : undefined,
    maxCredits: typeof body.max_credits === "number" ? body.max_credits : undefined,
    maxRows: typeof body.max_rows === "number" ? body.max_rows : undefined,
    maxSteps:
      typeof body.max_steps === "number" ? body.max_steps : AGENT_RUNTIME_LIMITS.maxSteps,
    maxTokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
    maxWallClockMs:
      typeof body.max_wall_clock_ms === "number" ? body.max_wall_clock_ms : undefined,
    killSwitchReason: normalizeString(body.kill_switch_reason ?? body.killSwitchReason),
    locale: normalizeString(
      body.locale ?? body.response_locale ?? body.responseLocale ?? body.language
    ),
    methodology: typeof body.methodology === "string" ? body.methodology : undefined,
    modelKillSwitch: normalizeOptionalBoolean(body.model_kill_switch ?? body.modelKillSwitch),
    modelTier:
      typeof body.model_tier === "string"
        ? body.model_tier
        : typeof body.modelTier === "string"
          ? body.modelTier
          : undefined,
    plan: typeof body.plan === "string" ? body.plan : undefined,
    prompt: typeof body.prompt === "string" ? body.prompt : "",
    requestedTools: Array.isArray(body.tools)
      ? body.tools.filter((tool): tool is string => typeof tool === "string")
      : undefined,
    requestId,
    responseDepth: normalizeString(body.response_depth ?? body.responseDepth),
    securities: Array.isArray(body.securities)
      ? body.securities.filter((security): security is string => typeof security === "string")
      : undefined,
    securityQuery:
      typeof body.security_query === "string"
        ? body.security_query
        : typeof body.securityQuery === "string"
          ? body.securityQuery
          : undefined,
    timeRange: normalizeAgentTimeRange(body.time_range ?? body.timeRange),
    toolKillSwitch: normalizeOptionalBoolean(body.tool_kill_switch ?? body.toolKillSwitch),
    userId:
      typeof body.user_id === "string"
        ? body.user_id
        : typeof body.userId === "string"
          ? body.userId
          : undefined,
    workspaceId:
      typeof body.workspace_id === "string"
        ? body.workspace_id
        : typeof body.workspaceId === "string"
          ? body.workspaceId
          : undefined
  };
}

function createAgentTelemetryIdentity(body?: AgentRunRequestBody): {
  modelTier: string;
  modelVersion: string;
  userId: string;
  workspaceId: string;
} {
  return {
    modelTier: normalizeTelemetryString(body?.model_tier ?? body?.modelTier, "dry_run"),
    modelVersion: "dry_run_no_model_provider",
    userId: normalizeTelemetryString(body?.user_id ?? body?.userId, "user_local_dry_run"),
    workspaceId: normalizeTelemetryString(
      body?.workspace_id ?? body?.workspaceId,
      "workspace_local_dry_run"
    )
  };
}

function createTelemetryToolVersions(
  toolContexts?: Array<{ name: string; version: string }>,
  requestedTools?: string[]
): AgentDryRunTelemetryInput["toolVersions"] {
  if (toolContexts !== undefined) {
    return toolContexts.map((tool) => ({
      tool_name: tool.name,
      tool_version: tool.version
    }));
  }

  const registryVersions = new Map<string, string>(
    REGISTERED_TOOLS.map((tool) => [tool.name, tool.version])
  );

  return (requestedTools ?? []).map((toolName) => ({
    tool_name: toolName,
    tool_version: registryVersions.get(toolName) ?? "unregistered"
  }));
}

function normalizeTelemetryString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function normalizeAgentTimeRange(value: unknown): AgentRunSkeletonInput["timeRange"] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const start =
    typeof record.start === "string"
      ? record.start
      : typeof record.from === "string"
        ? record.from
        : undefined;
  const end =
    typeof record.end === "string"
      ? record.end
      : typeof record.to === "string"
        ? record.to
        : undefined;

  return start !== undefined || end !== undefined
    ? {
        end,
        start
      }
    : undefined;
}

function normalizeEvalMetricInput(value: unknown): EvalV1MetricInput | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return {
    passed: normalizeOptionalNumber(record.passed ?? record.correct),
    total: normalizeOptionalNumber(record.total ?? record.count)
  };
}

function normalizeUnsourcedNumericClaims(
  value: unknown
): { sampledAnswers?: number; unsourcedClaims?: number } | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return {
    sampledAnswers: normalizeOptionalNumber(record.sampled_answers ?? record.sampledAnswers),
    unsourcedClaims: normalizeOptionalNumber(record.unsourced_claims ?? record.unsourcedClaims)
  };
}

function normalizeEvalHighIntentActions(value: unknown): WvroHighIntentAction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedActions = new Set<WvroHighIntentAction>(WVRO_HIGH_INTENT_ACTIONS);
  return value.filter(
    (action): action is WvroHighIntentAction =>
      typeof action === "string" && allowedActions.has(action as WvroHighIntentAction)
  );
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeOptionalInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeHighCostUsageExecutionStatus(
  value: unknown
): HighCostUsageExecutionStatus | undefined {
  return value === "failed" || value === "planned" || value === "succeeded" ? value : undefined;
}

function normalizeWatchlistAlertKinds(value: unknown): WatchlistAlertKind[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const kinds = value.filter(
    (kind): kind is WatchlistAlertKind =>
      typeof kind === "string" && WATCHLIST_ALERT_KINDS.includes(kind as WatchlistAlertKind)
  );

  return kinds.length > 0 ? [...new Set(kinds)] : undefined;
}

function normalizeWatchlistAlertChannels(value: unknown): WatchlistAlertChannel[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const channels = value.filter(
    (channel): channel is WatchlistAlertChannel =>
      typeof channel === "string" &&
      WATCHLIST_ALERT_CHANNELS.includes(channel as WatchlistAlertChannel)
  );

  return channels.length > 0 ? [...new Set(channels)] : undefined;
}

function normalizeWatchlistAlertFrequency(value: unknown): WatchlistAlertFrequency | undefined {
  return typeof value === "string" &&
    WATCHLIST_ALERT_FREQUENCIES.includes(value as WatchlistAlertFrequency)
    ? (value as WatchlistAlertFrequency)
    : undefined;
}

function normalizeWatchlistBriefingCadence(value: unknown): WatchlistBriefingCadence | undefined {
  return value === "daily" || value === "weekly" ? value : undefined;
}

function normalizeWatchlistAlertCondition(
  value: unknown
): WatchlistAlertConditionInput | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  return {
    comparator: normalizeWatchlistAlertComparator(value.comparator),
    metricId: normalizeString(value.metric_id ?? value.metricId),
    priceField: normalizeWatchlistPriceField(value.price_field ?? value.priceField),
    threshold: normalizeOptionalNumber(value.threshold)
  };
}

function normalizeWatchlistAlertComparator(
  value: unknown
): WatchlistAlertConditionInput["comparator"] | undefined {
  return value === "above" ||
    value === "below" ||
    value === "changed_by_percent" ||
    value === "changed_by_value"
    ? value
    : undefined;
}

function normalizeWatchlistPriceField(
  value: unknown
): WatchlistAlertConditionInput["priceField"] | undefined {
  return value === "close" || value === "last" || value === "volume" ? value : undefined;
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizePerformanceAvailabilityObservations(
  value: unknown
): PerformanceAvailabilityObservationInput | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  return {
    core_api_availability_bps: normalizeOptionalNumber(
      value.core_api_availability_bps ?? value.coreApiAvailabilityBps
    ),
    mcp_tool_cold_p95_ms: normalizeOptionalNumber(
      value.mcp_tool_cold_p95_ms ?? value.mcpToolColdP95Ms
    ),
    mcp_tool_hot_p95_ms: normalizeOptionalNumber(
      value.mcp_tool_hot_p95_ms ?? value.mcpToolHotP95Ms
    ),
    mcp_tool_success_rate_bps: normalizeOptionalNumber(
      value.mcp_tool_success_rate_bps ?? value.mcpToolSuccessRateBps
    ),
    simple_research_completion_p95_ms: normalizeOptionalNumber(
      value.simple_research_completion_p95_ms ?? value.simpleResearchCompletionP95Ms
    ),
    web_first_token_p95_ms: normalizeOptionalNumber(
      value.web_first_token_p95_ms ?? value.webFirstTokenP95Ms
    )
  };
}

function normalizeLoadDrIncidentDrillEvidence(
  value: unknown
): LoadDrIncidentDrillEvidenceInput | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  return {
    communications_drill_completed: normalizeOptionalBoolean(
      value.communications_drill_completed ?? value.communicationsDrillCompleted
    ),
    dr_rpo_minutes: normalizeOptionalNumber(value.dr_rpo_minutes ?? value.drRpoMinutes),
    dr_rto_minutes: normalizeOptionalNumber(value.dr_rto_minutes ?? value.drRtoMinutes),
    failover_plan_id: normalizeString(value.failover_plan_id ?? value.failoverPlanId),
    incident_drill_completed: normalizeOptionalBoolean(
      value.incident_drill_completed ?? value.incidentDrillCompleted
    ),
    load_test_artifact_id: normalizeString(
      value.load_test_artifact_id ?? value.loadTestArtifactId
    ),
    load_test_completed: normalizeOptionalBoolean(
      value.load_test_completed ?? value.loadTestCompleted
    ),
    load_test_error_rate_bps: normalizeOptionalNumber(
      value.load_test_error_rate_bps ?? value.loadTestErrorRateBps
    ),
    load_test_peak_rps: normalizeOptionalNumber(
      value.load_test_peak_rps ?? value.loadTestPeakRps
    ),
    restore_drill_completed: normalizeOptionalBoolean(
      value.restore_drill_completed ?? value.restoreDrillCompleted
    ),
    rollback_plan_id: normalizeString(value.rollback_plan_id ?? value.rollbackPlanId),
    status_page_drill_id: normalizeString(
      value.status_page_drill_id ?? value.statusPageDrillId
    )
  };
}

function normalizeExpectedUsageProfile(
  value: unknown
):
  | Partial<
      Record<
        "pro" | "developer",
        {
          cloudflare_db_search_cost_minor?: number;
          data_license_allocation_minor?: number;
          data_usage_cost_minor?: number;
          direct_support_cost_minor?: number;
          llm_token_cost_minor?: number;
          payment_fee_minor?: number;
          usage_credits?: number;
        }
      >
    >
  | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  const result: Partial<
    Record<
      "pro" | "developer",
      {
        cloudflare_db_search_cost_minor?: number;
        data_license_allocation_minor?: number;
        data_usage_cost_minor?: number;
        direct_support_cost_minor?: number;
        llm_token_cost_minor?: number;
        payment_fee_minor?: number;
        usage_credits?: number;
      }
    >
  > = {};

  for (const planCode of ["pro", "developer"] as const) {
    const raw = value[planCode];
    if (!isPlainRecord(raw)) {
      continue;
    }

    result[planCode] = {
      cloudflare_db_search_cost_minor: normalizeOptionalNumber(
        raw.cloudflare_db_search_cost_minor ?? raw.cloudflareDbSearchCostMinor
      ),
      data_license_allocation_minor: normalizeOptionalNumber(
        raw.data_license_allocation_minor ?? raw.dataLicenseAllocationMinor
      ),
      data_usage_cost_minor: normalizeOptionalNumber(
        raw.data_usage_cost_minor ?? raw.dataUsageCostMinor
      ),
      direct_support_cost_minor: normalizeOptionalNumber(
        raw.direct_support_cost_minor ?? raw.directSupportCostMinor
      ),
      llm_token_cost_minor: normalizeOptionalNumber(
        raw.llm_token_cost_minor ?? raw.llmTokenCostMinor
      ),
      payment_fee_minor: normalizeOptionalNumber(raw.payment_fee_minor ?? raw.paymentFeeMinor),
      usage_credits: normalizeOptionalNumber(raw.usage_credits ?? raw.usageCredits)
    };
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeUsageBillingLedgerEntries(
  value: unknown
): UsageBillingLedgerEntryInput[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value
    .filter((item): item is Record<string, unknown> => isPlainRecord(item))
    .map((item) => ({
      creditDelta: normalizeOptionalNumber(item.credit_delta ?? item.creditDelta) ?? 0,
      ledgerEntryId: normalizeString(item.ledger_entry_id ?? item.ledgerEntryId) ?? "",
      requestId: normalizeString(item.request_id ?? item.requestId) ?? "",
      usageEventId: normalizeString(item.usage_event_id ?? item.usageEventId) ?? ""
    }))
    .filter(
      (entry) =>
        entry.ledgerEntryId.length > 0 &&
        entry.requestId.length > 0 &&
        entry.usageEventId.length > 0
    );

  return entries.length > 0 ? entries : undefined;
}

function normalizePartnerReconciliationUsageRows(
  value: unknown
): PartnerReconciliationUsageRowInput[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const rows = value
    .filter((item): item is Record<string, unknown> => isPlainRecord(item))
    .map((item) => ({
      backfillCount: normalizeOptionalNumber(item.backfill_count ?? item.backfillCount),
      channel: normalizeUsageLedgerChannel(item.channel),
      credits: normalizeOptionalNumber(item.credits),
      dataDelayMinutes: normalizeOptionalNumber(
        item.data_delay_minutes ?? item.dataDelayMinutes
      ),
      dataset: normalizeString(item.dataset),
      errorCount: normalizeOptionalNumber(item.error_count ?? item.errorCount),
      meteredRows: normalizeOptionalNumber(item.metered_rows ?? item.meteredRows),
      missingRows: normalizeOptionalNumber(item.missing_rows ?? item.missingRows),
      packageCode: normalizeUsageQuotaPlanCode(
        item.package_code ?? item.packageCode ?? item.plan_code ?? item.planCode
      ),
      requestId: normalizeString(item.request_id ?? item.requestId),
      usageCount: normalizeOptionalNumber(item.usage_count ?? item.usageCount),
      usageEventId: normalizeString(item.usage_event_id ?? item.usageEventId),
      userId: normalizeString(item.user_id ?? item.userId)
    }));

  return rows.length > 0 ? rows : undefined;
}

function normalizeAgentWorkflowTaskKind(value: unknown): AgentWorkflowTaskKind | undefined {
  return typeof value === "string" &&
    AGENT_WORKFLOW_TASK_KINDS.includes(value as AgentWorkflowTaskKind)
    ? (value as AgentWorkflowTaskKind)
    : undefined;
}

function normalizeAgentWorkflowNotificationChannels(
  value: unknown
): AgentWorkflowNotificationChannel[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const channels = value.filter(
    (channel): channel is AgentWorkflowNotificationChannel =>
      typeof channel === "string" &&
      AGENT_WORKFLOW_NOTIFICATION_CHANNELS.includes(channel as AgentWorkflowNotificationChannel)
  );

  return channels.length > 0 ? [...new Set(channels)] : undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeResearchChannel(value: unknown): "api" | "mcp" | "web" | undefined {
  return value === "api" || value === "mcp" || value === "web" ? value : undefined;
}

function normalizeResearchToolCalls(
  value: unknown
): ResearchRunToolCallInput[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((item): item is Record<string, unknown> => isPlainRecord(item))
    .map((item) => ({
      dataVersion: normalizeString(item.data_version ?? item.dataVersion),
      input: normalizeResearchJsonValue(item.input ?? item.input_snapshot ?? item.inputSnapshot),
      inputSchemaId: normalizeString(item.input_schema_id ?? item.inputSchemaId),
      methodologyVersion: normalizeString(
        item.methodology_version ?? item.methodologyVersion
      ),
      outputSchemaId: normalizeString(item.output_schema_id ?? item.outputSchemaId),
      requestId: normalizeString(item.request_id ?? item.requestId),
      toolCallId: normalizeString(item.tool_call_id ?? item.toolCallId),
      toolName: normalizeString(item.tool_name ?? item.toolName),
      toolVersion: normalizeString(item.tool_version ?? item.toolVersion)
    }));
}

function normalizeResearchEvidenceRecords(
  value: unknown
): ResearchRunEvidenceInput[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((item): item is Record<string, unknown> => isPlainRecord(item))
    .map((item) => {
      const rawLocation = item.document_location ?? item.documentLocation;
      const documentLocation = isPlainRecord(rawLocation)
        ? {
            anchor: normalizeString(rawLocation.anchor),
            documentId: normalizeString(rawLocation.document_id ?? rawLocation.documentId),
            page: normalizeOptionalInteger(rawLocation.page),
            paragraph: normalizeOptionalInteger(rawLocation.paragraph),
            sourceRecordId: normalizeString(
              rawLocation.source_record_id ?? rawLocation.sourceRecordId
            )
          }
        : undefined;

      return {
        citationLabel: normalizeString(item.citation_label ?? item.citationLabel),
        dataVersion: normalizeString(item.data_version ?? item.dataVersion),
        documentLocation,
        evidenceRecordId: normalizeString(
          item.evidence_record_id ?? item.evidenceRecordId
        ),
        methodologyVersion: normalizeString(
          item.methodology_version ?? item.methodologyVersion
        ),
        sourceRecordIds: normalizeStringArray(
          item.source_record_ids ?? item.sourceRecordIds
        )
      };
    });
}

function normalizeResearchParameters(
  value: unknown
): Record<string, ResearchRunJsonValue> | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value)
    .map(([key, rawValue]) => [key, normalizeResearchJsonValue(rawValue)] as const)
    .filter((entry): entry is readonly [string, ResearchRunJsonValue] => entry[1] !== undefined);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeResearchReplayCurrentRun(
  value: unknown
): CreateResearchRunReplayCurrentRunInput | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  return {
    answerHash: normalizeString(value.answer_hash ?? value.answerHash),
    asOf: normalizeString(value.as_of ?? value.asOf),
    channel: normalizeResearchChannel(value.channel),
    evidenceRecords: normalizeResearchEvidenceRecords(
      value.evidence_records ?? value.evidenceRecords
    ),
    modelProvider: normalizeString(value.model_provider ?? value.modelProvider),
    modelVersion: normalizeString(value.model_version ?? value.modelVersion),
    parameters: normalizeResearchParameters(value.parameters),
    promptTemplateId: normalizeString(
      value.prompt_template_id ?? value.promptTemplateId
    ),
    promptVersion: normalizeString(value.prompt_version ?? value.promptVersion),
    question: normalizeString(value.question),
    requestId: normalizeString(value.request_id ?? value.requestId),
    runId: normalizeString(value.run_id ?? value.runId),
    toolCalls: normalizeResearchToolCalls(value.tool_calls ?? value.toolCalls),
    userId: normalizeString(value.user_id ?? value.userId),
    workspaceId: normalizeString(value.workspace_id ?? value.workspaceId)
  };
}

function normalizeResearchSavedRuns(value: unknown): ResearchRunSavePlan[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const savedRuns = value.filter((item): item is ResearchRunSavePlan => isPlainRecord(item));

  return savedRuns.length > 0 ? savedRuns : undefined;
}

function normalizeResearchSavedRun(value: unknown): ResearchRunSavePlan | undefined {
  return isPlainRecord(value) ? (value as unknown as ResearchRunSavePlan) : undefined;
}

function normalizeDataCorrectionInputs(value: unknown): DataCorrectionSourceInput[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const corrections = value
    .filter((item): item is Record<string, unknown> => isPlainRecord(item))
    .map((item) => ({
      correctedDataVersion: normalizeString(
        item.corrected_data_version ?? item.correctedDataVersion
      ),
      correctionId: normalizeString(item.correction_event_id ?? item.correctionId),
      previousDataVersion: normalizeString(
        item.previous_data_version ?? item.previousDataVersion
      ),
      reason: normalizeString(item.reason ?? item.correction_reason ?? item.correctionReason),
      severity: normalizeDataCorrectionSeverity(item.severity),
      sourceRecordId: normalizeString(item.source_record_id ?? item.sourceRecordId)
    }));

  return corrections.length > 0 ? corrections : undefined;
}

function normalizeDataCorrectionNotificationChannels(
  value: unknown
): DataCorrectionNotificationChannel[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const channels = value.filter(
    (channel): channel is DataCorrectionNotificationChannel =>
      channel === "in_app" || channel === "email"
  );

  return channels.length > 0 ? [...new Set(channels)] : undefined;
}

function normalizeDataCorrectionSeverity(value: unknown): DataCorrectionSeverity | undefined {
  return value === "low" || value === "medium" || value === "high" ? value : undefined;
}

function handleMcpRuntimeError(
  c: Context,
  error: unknown,
  requestId: string,
  fallbackMessage: string,
  context: {
    dataVersion: string;
    methodologyVersion: string;
    source: string;
  } = {
    dataVersion: "mcp-oauth-pkce-scaffold-v0",
    methodologyVersion: "2026-06-21.phase2.mcp-oauth-pkce-scaffold.v0",
    source: "mcp-oauth-pkce"
  }
): Response {
  if (error instanceof McpRuntimeInputError) {
    const status = statusForMcpRuntimeError(error);

    return c.json(
      createMcpRuntimeErrorEnvelope(error, requestId, context, {
        cached: false,
        credits: 0,
        rows: 0
      }),
      status
    );
  }

  return c.json(
    createMcpInternalErrorEnvelope(fallbackMessage, requestId, context, {
      cached: false,
      credits: 0,
      rows: 0
    }),
    500
  );
}

function createMcpRuntimeErrorEnvelope(
  error: McpRuntimeInputError,
  requestId: string,
  context: {
    dataVersion: string;
    methodologyVersion: string;
    source: string;
  },
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  }
) {
  const code = errorCodeForMcpRuntimeError(error);
  const definition = getMcpStandardErrorDefinition(code);
  const envelope = createErrorEnvelope(code, error.message, {
    asOf: new Date().toISOString(),
    dataVersion: context.dataVersion,
    methodologyVersion: context.methodologyVersion,
    provenance: [
      {
        data_version: context.dataVersion,
        methodology_version: context.methodologyVersion,
        source: context.source,
        source_record_id: error.code
      }
    ],
    requestId,
    usage
  });

  return {
    ...envelope,
    error: {
      ...envelope.error,
      detail: {
        category: definition.category,
        client_action: definition.client_action,
        internal_code: error.code,
        mcp_error_version: MCP_STANDARD_ERROR_CODES_VERSION,
        recoverable: definition.recoverable,
        request_id: requestId,
        retry_after_required: definition.retry_after_required,
        source_record_id: definition.source_record_id
      }
    }
  };
}

function createMcpInternalErrorEnvelope(
  message: string,
  requestId: string,
  context: {
    dataVersion: string;
    methodologyVersion: string;
    source: string;
  },
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  }
) {
  const definition = getMcpStandardErrorDefinition("INTERNAL_ERROR");
  const envelope = createErrorEnvelope("INTERNAL_ERROR", message, {
    asOf: new Date().toISOString(),
    dataVersion: context.dataVersion,
    methodologyVersion: context.methodologyVersion,
    provenance: [
      {
        data_version: context.dataVersion,
        methodology_version: context.methodologyVersion,
        source: context.source,
        source_record_id: "INTERNAL_ERROR"
      }
    ],
    requestId,
    usage
  });

  return {
    ...envelope,
    error: {
      ...envelope.error,
      detail: {
        category: definition.category,
        client_action: definition.client_action,
        internal_code: "INTERNAL_ERROR",
        mcp_error_version: MCP_STANDARD_ERROR_CODES_VERSION,
        recoverable: definition.recoverable,
        request_id: requestId,
        retry_after_required: definition.retry_after_required,
        source_record_id: definition.source_record_id
      }
    }
  };
}

function errorCodeForMcpRuntimeError(error: McpRuntimeInputError): McpStandardErrorCode {
  return getMcpRuntimeStandardError(error.code);
}

function statusForMcpRuntimeError(error: McpRuntimeInputError): 400 | 401 | 403 | 422 {
  switch (error.code) {
    case "MCP_CREDENTIAL_REVOKED":
      return 401;
    case "MCP_REDISTRIBUTION_RIGHTS_REQUIRED":
    case "ORIGIN_NOT_ALLOWED":
    case "ORIGIN_REQUIRED":
    case "TOOL_NOT_REGISTERED":
    case "TOOL_SCOPE_REQUIRED":
    case "UNSUPPORTED_SCOPE":
      return 403;
    case "TOOL_LIMIT_EXCEEDED":
    case "TOOL_TIME_RANGE_EXCEEDED":
    case "TOOL_TIME_RANGE_INVALID":
      return 422;
    default:
      return 400;
  }
}

function normalizeResearchJsonValue(value: unknown): ResearchRunJsonValue | undefined {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeResearchJsonValue(item))
      .filter((item): item is ResearchRunJsonValue => item !== undefined);
  }

  if (isPlainRecord(value)) {
    const entries = Object.entries(value)
      .map(([key, rawValue]) => [key, normalizeResearchJsonValue(rawValue)] as const)
      .filter((entry): entry is readonly [string, ResearchRunJsonValue] => entry[1] !== undefined);

    return Object.fromEntries(entries);
  }

  return undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : undefined;
}

function normalizePercentileMetricId(value: unknown): PercentileMetricId | undefined {
  return value === "net_margin" || value === "total_return" ? value : undefined;
}

function normalizePercentileBenchmarkTypes(
  value: unknown
): PercentileBenchmarkType[] | undefined {
  const values = normalizeStringArray(value)?.filter(
    (item): item is PercentileBenchmarkType =>
      item === "history" || item === "index" || item === "peer"
  );

  return values === undefined || values.length === 0 ? undefined : values;
}

function normalizeScreenConditionInputs(
  value: unknown
): Array<Partial<ScreenSecuritiesCondition>> | undefined {
  return Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => isPlainRecord(item))
        .map((item) => ({
          field:
            typeof item.field === "string"
              ? (item.field as ScreenSecuritiesCondition["field"])
              : undefined,
          operator:
            typeof item.operator === "string"
              ? (item.operator as ScreenSecuritiesCondition["operator"])
              : undefined,
          value: normalizeOptionalNumber(item.value)
        }))
    : undefined;
}

function normalizeAccountLoginMethod(value: unknown): AccountLoginMethod | undefined {
  return ACCOUNT_LOGIN_METHODS.includes(value as AccountLoginMethod)
    ? (value as AccountLoginMethod)
    : undefined;
}

function normalizeAccountPlanCode(value: unknown): AccountPlanCode | undefined {
  return ACCOUNT_PLAN_CODES.includes(value as AccountPlanCode)
    ? (value as AccountPlanCode)
    : undefined;
}

function normalizeAccountRole(value: unknown): AccountRole | undefined {
  return value === "admin" ||
    value === "billing" ||
    value === "member" ||
    value === "owner" ||
    value === "viewer"
    ? value
    : undefined;
}

function normalizeAccountSessionAction(value: unknown): AccountSessionAction | undefined {
  return value === "login" ||
    value === "logout" ||
    value === "refresh" ||
    value === "revoke_device" ||
    value === "revoke_session"
    ? value
    : undefined;
}

function normalizeAuthorizedSessionMemoryAction(
  value: unknown
): AuthorizedSessionMemoryAction | undefined {
  return typeof value === "string" &&
    AUTHORIZED_SESSION_MEMORY_ACTIONS.includes(value as AuthorizedSessionMemoryAction)
    ? (value as AuthorizedSessionMemoryAction)
    : undefined;
}

function normalizeAccountDataRequestAction(value: unknown): AccountDataRequestAction | undefined {
  return typeof value === "string" &&
    ACCOUNT_DATA_REQUEST_ACTIONS.includes(value as AccountDataRequestAction)
    ? (value as AccountDataRequestAction)
    : undefined;
}

function normalizeSubscriptionLifecycleAction(
  value: unknown
): SubscriptionLifecycleAction | undefined {
  return value === "upgrade" ||
    value === "downgrade" ||
    value === "renew" ||
    value === "cancel" ||
    value === "enter_grace_period" ||
    value === "exit_grace_period"
    ? value
    : undefined;
}

function normalizeSubscriptionBillingState(value: unknown): SubscriptionBillingState | undefined {
  return value === "trialing" ||
    value === "active" ||
    value === "grace_period" ||
    value === "paused" ||
    value === "canceled"
    ? value
    : undefined;
}

function normalizeUsageQuotaChannel(value: unknown): UsageQuotaChannel | undefined {
  return USAGE_QUOTA_CHANNELS.includes(value as UsageQuotaChannel)
    ? (value as UsageQuotaChannel)
    : undefined;
}

function normalizeUsageQuotaPlanCode(value: unknown): UsageQuotaPlanCode | undefined {
  return USAGE_QUOTA_PLAN_CODES.includes(value as UsageQuotaPlanCode)
    ? (value as UsageQuotaPlanCode)
    : undefined;
}

function normalizeUsageLedgerChannel(value: unknown): UsageLedgerChannel | undefined {
  return isDataAccessChannel(value) ? value : undefined;
}

function normalizeDataAccessChannel(value: unknown): DataAccessChannel | undefined {
  return isDataAccessChannel(value) ? value : undefined;
}

function normalizeDataAccessFieldStatus(value: unknown): DataAccessFieldStatus | undefined {
  return value === "approved" || value === "blocked" || value === "default_deny"
    ? value
    : undefined;
}

function normalizeFieldAuthorizationApprovalStatus(
  value: unknown
): FieldAuthorizationApprovalStatus | undefined {
  return value === "approved" || value === "pending" || value === "rejected"
    ? value
    : undefined;
}

function normalizePartnerReconciliationFormat(
  value: unknown
): PartnerReconciliationReportFormat | undefined {
  return value === "csv" || value === "json" ? value : undefined;
}

function normalizePartnerReconciliationCadence(
  value: unknown
): PartnerReconciliationReportCadence | undefined {
  return value === "daily" || value === "weekly" ? value : undefined;
}

function normalizeQuoteSnapshotMode(value: unknown): QuoteSnapshotMode | undefined {
  return value === "close" || value === "delayed" ? value : undefined;
}

function normalizeWorkbenchAdjustment(value: unknown): PriceHistoryAdjustment | undefined {
  return value === "raw" || value === "split_adjusted" || value === "total_return_adjusted"
    ? value
    : undefined;
}

function isDataAccessChannel(value: unknown): value is "api" | "export" | "mcp" | "web" {
  return value === "api" || value === "export" || value === "mcp" || value === "web";
}

function isQualityState(value: unknown): value is "HOLD" | "PASS" | "REJECT_RAW" | "WARN" {
  return value === "HOLD" || value === "PASS" || value === "REJECT_RAW" || value === "WARN";
}

function isTimeRange(value: unknown): value is { from: string; to: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "from" in value &&
    "to" in value &&
    typeof value.from === "string" &&
    typeof value.to === "string"
  );
}
