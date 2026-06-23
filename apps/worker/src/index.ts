import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { Hono, type Context } from "hono";
import { Client } from "pg";
import {
  ACCOUNT_LOGIN_METHODS,
  ACCOUNT_PLAN_CODES,
  ACCOUNT_DATA_REQUEST_ACTIONS,
  AUTHORIZED_SESSION_MEMORY_ACTIONS,
  createAccountDataRequestPlan,
  createAccountSessionPlan,
  createAuthorizedSessionMemoryPlan,
  createEnterpriseControlsPlan,
  createSubscriptionLifecyclePlan,
  getEnterpriseControlsCapabilities,
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
  type EnterpriseSsoProtocol,
  type PrivateDataConnectorKind,
  type SubscriptionBillingState,
  type SubscriptionLifecycleAction
} from "@aiphabee/account-runtime";
import {
  AI_GATEWAY_LIVE_SMOKE_VERSION,
  AgentRuntimeInputError,
  AGENT_RUNTIME_LIMITS,
  AGENT_WORKFLOW_NOTIFICATION_CHANNELS,
  AGENT_WORKFLOW_TASK_KINDS,
  createAgentKillSwitchPlan,
  createAgentProgressStreamReport,
  createAgentRunSkeleton,
  createAgentAiGatewayObservabilityReleaseGatePlan,
  createAgentLiveModelStreamingReleaseGatePlan,
  createAgentModelOutputCorpusReleaseGatePlan,
  createAgentTokenCostFallbackReleaseGatePlan,
  createAgentUserToolLoopExecutionReleaseGatePlan,
  createAgentUserRunPersistenceReleaseGatePlan,
  createPreToolCallResolution,
  createPromptInjectionToolDenialReleaseGatePlan,
  createProductAgentReleaseGatePlan,
  createToolLoopAgentPlan,
  createWorkflowTaskPlan,
  getAgentLabelBudgetReleaseGateCapabilities,
  getAgentWorkflowTaskCapabilities,
  getAgentAiGatewayObservabilityReleaseGateCapabilities,
  getAgentLiveModelStreamingReleaseGateCapabilities,
  getAgentModelOutputCorpusReleaseGateCapabilities,
  getAgentRuntimeCapabilities,
  getAgentTokenCostFallbackReleaseGateCapabilities,
  getAgentUserToolLoopExecutionReleaseGateCapabilities,
  getAgentUserRunPersistenceReleaseGateCapabilities,
  getProductAgentReleaseGateCapabilities,
  getTaskReplayModeReleaseGateCapabilities,
  runAiGatewayLiveSmoke,
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
  getBuybacksAndPlacements,
  getBuybacksAndPlacementsCapabilities,
  getConsensusOrEstimates,
  getConsensusOrEstimatesCapabilities,
  getCompareSecuritiesCapabilities,
  getEventStudyCapabilities,
  getFinancialRatios,
  getFinancialRatiosCapabilities,
  getHighCostAnalyticsQueueCapabilities,
  getMarketBreadth,
  getMarketBreadthCapabilities,
  getOwnershipAndShortSelling,
  getOwnershipAndShortSellingCapabilities,
  getPercentileComparisonCapabilities,
  getPortfolioAnalytics,
  getPortfolioAnalyticsCapabilities,
  getReturnsRiskCapabilities,
  getScreenSecuritiesCapabilities,
  getSavedScreeningCapabilities,
  runEventStudy,
  screenSecurities,
  createSavedScreeningPlan,
  planHighCostAnalyticsQueue,
  type ConsensusEstimateMetricId,
  type PercentileBenchmarkType,
  type PercentileMetricId,
  type PortfolioAnalyticsPositionInput,
  type SavedScreeningCadence,
  type ScreenSecuritiesCondition
} from "@aiphabee/analytics-tools";
import {
  CorporateActionsInputError,
  getCorporateActions,
  getCorporateActionAdjustmentCapabilities,
  getCorporateActionBenchmarkParityCapabilities,
  getCorporateActionsCapabilities,
  runCorporateActionBenchmarkParityGate
} from "@aiphabee/corporate-actions";
import {
  IPO_ACCESS_POLICY,
  IPO_FIXTURE_DATA_VERSION,
  IPO_PIPELINE_VERSION,
  IPO_RESEARCH_METHODOLOGY_VERSION,
  compareIpos,
  createIpoWorkbenchSnapshot,
  getIpoCapabilities,
  IpoNotFoundError,
  screenIpos,
  searchIpoCalendar,
  type IpoCalendarEvent,
  type IpoCalendarEventType,
  type IpoCalendarResult,
  type IpoCompareResult,
  type IpoCornerstoneFact,
  type IpoNarrativeSection,
  type IpoOfferingFact,
  type IpoProvenance,
  type IpoQualityState,
  type IpoResearchSignalBlock,
  type IpoScreenInput,
  type IpoScreenResult,
  type IpoWorkbenchSnapshot
} from "@aiphabee/ipo";
import {
  DATA_ACCESS_GATEWAY_VERSION,
  DEFAULT_DATA_ACCESS_POLICY,
  createDataCoverageReleaseGateReport,
  createFieldRightsLivePolicySourceReadinessReport,
  createFieldAuthorizationConfigChangePlan,
  createP0RightsMatrixCoverageReport,
  createRestrictedExportPlan,
  createServingQualityLiveReadinessReport,
  getRestrictedExportCapabilities,
  evaluateDataAccessRequest,
  getDataCoverageReleaseGateCapabilities,
  getFieldRightsLivePolicySourceCapabilities,
  getFieldAuthorizationConfigCapabilities,
  getEntitlementPolicySourceCapabilities,
  getP0RightsMatrixCoverageCapabilities,
  getServingResultEnvelopeCapabilities,
  getServingQualityLiveReadinessCapabilities,
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
  createUserPublicDataJoinPrivacyPlan,
  diffAnnouncements,
  getAnnouncement,
  getAnnouncementCapabilities,
  getDiffAnnouncementsCapabilities,
  getDocumentToolsCapabilities,
  getSearchAnnouncementsCapabilities,
  getSearchDocumentsCapabilities,
  getUserPublicDataJoinPrivacyCapabilities,
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
  createLicensedAdviceExplorationPlan,
  getLicensedAdviceExplorationCapabilities,
  getLicensedAdviceRuntimeCapabilities
} from "@aiphabee/licensed-advice-runtime";
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
  createHkDataDomainsCrossMarketPlan,
  getHkDataDomainsCrossMarketCapabilities,
  getMarketDomainRuntimeCapabilities
} from "@aiphabee/market-domain-runtime";
import {
  McpRuntimeInputError,
  createMcpAuthLimitsReleaseGatePlan,
  createMcpClientMaturityPlan,
  createMcpCompatibilityStatusPlan,
  createMcpDeveloperConsolePlan,
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
  getMcpClientMaturityCapabilities,
  getMcpCompatibilityStatusCapabilities,
  getMcpDeveloperConsoleCapabilities,
  getMcpOAuthCapabilities,
  getMcpProtocolReleaseGateCapabilities,
  getMcpRevocationEnforcementCapabilities,
  getMcpRuntimeCapabilities,
  getMcpRuntimeSchemaSnapshot,
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
  createEvalStoreRecord,
  createEvalV1RunRecord,
  createLoadDrIncidentDrillReleaseGatePlan,
  createPerformanceAvailabilityReleaseGatePlan,
  getEvalV1Capabilities,
  getLoadDrIncidentDrillReleaseGateCapabilities,
  getPerformanceAvailabilityReleaseGateCapabilities,
  type AgentDryRunTelemetryInput,
  type EvalStoreRecord,
  type EvalV1MetricInput,
  type LoadDrIncidentDrillEvidenceInput,
  type PerformanceAvailabilityObservationInput,
  type WvroHighIntentAction,
  recordTelemetryEvents
} from "@aiphabee/observability";
import {
  createWhiteLabelEmbedPlan,
  getPartnerRuntimeCapabilities,
  getWhiteLabelEmbedCapabilities
} from "@aiphabee/partner-runtime";
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
  createPartnerSlaReconciliationReadinessReport,
  createPartnerSupportReleaseGatePlan,
  createUsageBillingReconciliationPlan,
  createUsageLedgerEventPlan,
  createUsageQuotaDisplayPlan,
  getBillingRulesReleaseGateCapabilities,
  getHighCostUsageReservationCapabilities,
  getPartnerReconciliationReportCapabilities,
  getPartnerSlaReconciliationReadinessCapabilities,
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
  createAlertToolPlan,
  createWatchlistAlertsPlan,
  createWatchlistBriefingPlan,
  getCreateAlertToolCapabilities,
  getWatchlistBriefingCapabilities,
  getWatchlistRuntimeCapabilities,
  type CreateWatchlistAlertsPlanInput,
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
  AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN?: string;
  AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN?: string;
  AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN?: string;
  AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN?: string;
  AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN?: string;
  AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN?: string;
  AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN?: string;
  AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN?: string;
  AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN?: string;
  AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN?: string;
  AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN?: string;
  AIPHABEE_EVAL_STORE?: RuntimeD1Database;
  AIPHABEE_EVENTS_QUEUE?: RuntimeQueue;
  AIPHABEE_HYPERDRIVE?: RuntimeHyperdrive;
  AIPHABEE_RUN_COORDINATOR?: RuntimeDurableObjectNamespace;
  AIPHABEE_RESEARCH_WORKFLOW?: RuntimeWorkflow<CloudflareWorkflowSmokePayload>;
  APP_ENV?: string;
  APP_VERSION?: string;
  AI_GATEWAY_NAME?: string;
  AI_GATEWAY_LIVE_SMOKE_TOKEN?: string;
  AI_GATEWAY_SMOKE_MODEL?: string;
  AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
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
  head?(key: string): Promise<unknown | null>;
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

interface RuntimeHyperdrive {
  connectionString?: string;
}

interface IpoServingOfferingRow {
  board_lot: number | string | null;
  business_overview_text?: string | null;
  clawback_type: string | null;
  currency_code: string | null;
  data_version: string;
  final_offer_price: number | string | null;
  funds_raised_text_en: string | null;
  funds_raised_text_zh_hans: string | null;
  funds_raised_text_zh_hant: string | null;
  has_cornerstone?: boolean | null;
  hkex_code: string;
  ipo_status: string;
  listing_board: string | null;
  listing_date: Date | string;
  listing_type: string | null;
  market_cap_text_en: string | null;
  market_cap_text_zh_hans: string | null;
  market_cap_text_zh_hant: string | null;
  name_en: string | null;
  name_zh_hans: string | null;
  name_zh_hant: string | null;
  offer_price_max: number | string | null;
  offer_price_min: number | string | null;
  offering_id: string;
  one_lot_success_rate: number | string | null;
  over_subscription_multiple: number | string | null;
  quality_state: string;
  sector_code: string | null;
  source_record_id: string;
}

interface IpoServingNarrativeRow {
  content_html: string | null;
  content_text: string | null;
  lang: string;
  section_key: string;
}

interface IpoServingTimetableRow {
  event_code: string;
  event_date: Date | string | null;
  event_type: string;
  offering_id: string;
  title_en: string | null;
  title_zh_hant: string | null;
}

interface IpoServingCornerstoneRow {
  invest_amount: number | string | null;
  invest_currency_code: string | null;
  investor_name_en: string | null;
  investor_name_zh_hant: string | null;
  issued_share_pct: number | string | null;
  lockup_period_text: string | null;
  offer_share_pct: number | string | null;
}

type IpoSnapshotServingRead =
  | {
      snapshot: IpoWorkbenchSnapshot;
      status: "found";
    }
  | {
      dataVersion: string;
      status: "no_released_data" | "not_found";
    };

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
    | "d1_eval_store_record_write_read_delete"
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
  surface: "cron_handler_smoke" | "cron_natural_trigger_evidence";
  value_hash?: string;
}

interface CloudflareHyperdriveSmokeResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  current_database_hash?: string;
  current_user_hash?: string;
  database_create_privilege?: boolean;
  detail_hash?: string;
  failure_code?: string;
  operation_count?: number;
  query_hash?: string;
  row_count?: number;
  selected_value_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "hyperdrive_select_1_smoke";
}

interface CloudflareHyperdriveSchemaInventoryResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  current_database_hash?: string;
  current_user_hash?: string;
  database_create_privilege?: boolean;
  detail_hash?: string;
  expected_index_count?: number;
  expected_rls_table_count?: number;
  expected_schema_count?: number;
  expected_table_count?: number;
  failure_code?: string;
  missing_indexes?: string[];
  missing_rls_tables?: string[];
  missing_schemas?: string[];
  missing_tables?: string[];
  observed_index_count?: number;
  observed_rls_table_count?: number;
  observed_schema_count?: number;
  observed_table_count?: number;
  operation_count?: number;
  platform_product_aiphabee_present?: boolean;
  platform_product_aiphabee_status_hash?: string;
  query_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "platform_umbrella_schema_inventory";
}

interface PlatformUmbrellaRlsFixtureSmokeResult {
  account_id_hash?: string;
  binding_name: "AIPHABEE_HYPERDRIVE";
  cleanup_rolled_back?: boolean;
  current_role_bypassrls?: boolean;
  current_role_superuser?: boolean;
  current_user_hash?: string;
  detail_hash?: string;
  entitlement_policy_with_claim_rows?: number;
  failure_code?: string;
  failure_sqlstate?: string;
  failure_stage?: string;
  fixture_policy_count?: number;
  inserted_rows?: number;
  operation_count?: number;
  product_id_hash?: string;
  query_hash?: string;
  runtime_role_active_for_selects?: boolean;
  runtime_role_bypassrls?: boolean;
  runtime_role_superuser?: boolean;
  runtime_user_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "platform_umbrella_rls_fixture_smoke";
  workspace_entitlement_with_claim_rows?: number;
  workspace_id_hash?: string;
  workspace_membership_with_claim_rows?: number;
  workspace_product_access_with_claim_rows?: number;
  workspace_table_owner_is_current_user?: boolean;
  workspace_with_claim_rows?: number;
  workspace_without_claim_rows?: number;
  workspace_with_wrong_claim_rows?: number;
}

interface PlatformRuntimeRoleSmokeResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  current_database_hash?: string;
  current_role_bypassrls?: boolean;
  current_role_superuser?: boolean;
  current_user_hash?: string;
  database_create_privilege?: boolean;
  detail_hash?: string;
  failure_code?: string;
  operation_count?: number;
  platform_account_select_privilege?: boolean;
  platform_schema_create_privilege?: boolean;
  platform_schema_usage_privilege?: boolean;
  platform_workspace_rls_forced?: boolean;
  platform_workspace_select_privilege?: boolean;
  query_hash?: string;
  runtime_role_ready?: boolean;
  status: CloudflareBindingSmokeStatus;
  surface: "platform_runtime_role_smoke";
  workspace_table_owner_is_current_user?: boolean;
}

interface PlatformRlsReadContext {
  client: Client;
  operationCount: number;
  runtimeRoleActive: boolean;
  runtimeRoleBypassRls: boolean;
  runtimeRoleSuperuser: boolean;
  runtimeUserName: string;
}

interface PlatformRlsReadTransactionResult<T> {
  context: PlatformRlsReadContext;
  result: T;
}

interface EvidenceLiveDbWriteSmokeResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  deleted_rows?: number;
  detail_hash?: string;
  evidence_record_id_hash?: string;
  failure_code?: string;
  inserted_rows?: number;
  live_write_state?: "planned_no_write";
  operation_count?: number;
  query_hash?: string;
  selected_rows?: number;
  source_ref_count?: number;
  source_ref_hashes?: string[];
  status: CloudflareBindingSmokeStatus;
  surface: "evidence_record_source_ref_insert_select_delete";
  tables?: ["aiphabee_core.evidence_record", "aiphabee_core.evidence_source_ref"];
}

interface HkIpoPublicHeldDbApplySmokeResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  cleanup_verified?: boolean;
  data_version_hash?: string;
  deleted_rows?: number;
  detail_hash?: string;
  error_code?: string;
  failure_code?: string;
  failure_stage?: string;
  inserted_rows?: number;
  operation_count?: number;
  production_promotion_enabled?: false;
  query_hash?: string;
  raw_snapshot_id_hash?: string;
  readback_hash?: string;
  selected_rows?: number;
  source_run_id_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "hk_ipo_public_held_rows_insert_select_delete";
  tables?: [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.raw_snapshot",
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ];
  writes_serving_tables?: false;
}

interface HkIpoPublicHeldDbApplyResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  data_version_hash?: string;
  detail_hash?: string;
  error_code?: string;
  failure_code?: string;
  failure_stage?: string;
  inserted_or_updated_rows?: number;
  object_store_write_count?: number;
  operation_count?: number;
  packet_hash?: string;
  production_promotion_enabled: false;
  query_hash?: string;
  readback_hash?: string;
  release_state?: "held";
  selected_rows?: number;
  source_batch_id_hash?: string;
  source_run_id_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "hk_ipo_public_live_held_rows_upsert_readback";
  tables?: [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.raw_snapshot",
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ];
  writes_serving_tables: false;
}

interface HkIpoPublicHeldDbReadbackResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  data_version_hash?: string;
  detail_hash?: string;
  error_code?: string;
  failure_code?: string;
  failure_stage?: string;
  object_key_count?: number;
  object_key_hash?: string;
  object_store_binding_name?: "AIPHABEE_ARTIFACTS";
  object_store_missing_count?: number;
  object_store_readback_count?: number;
  operation_count?: number;
  payload_envelope_count?: number;
  production_promotion_enabled: false;
  query_hash?: string;
  raw_snapshot_payload_leak_count?: number;
  readback_hash?: string;
  release_state?: "held";
  selected_rows?: number;
  source_batch_id_hash?: string;
  source_run_id_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "hk_ipo_public_live_held_rows_readback";
  table_counts?: Record<string, number>;
  tables?: [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.raw_snapshot",
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ];
  writes_serving_tables: false;
}

type HkIpoPublicHeldDbApplyRow = Record<string, unknown>;

interface HkIpoPublicHeldDbApplyPayload {
  apply_plan_id: string;
  data_version: string;
  mode: "live";
  object_store_write_summary: Record<string, unknown>;
  packet_hash: string;
  packet_kind: "hk_ipo_public_held_db_apply_packet";
  row_groups: {
    data_version_batch: HkIpoPublicHeldDbApplyRow[];
    hk_ipo_public_observation: HkIpoPublicHeldDbApplyRow[];
    hk_ipo_public_reconciliation_row: HkIpoPublicHeldDbApplyRow[];
    hk_ipo_public_source_run: HkIpoPublicHeldDbApplyRow[];
    hk_ipo_public_supplement_candidate: HkIpoPublicHeldDbApplyRow[];
    raw_snapshot: HkIpoPublicHeldDbApplyRow[];
    raw_source_batch: HkIpoPublicHeldDbApplyRow[];
  };
  source_batch_id: string;
  source_run_id: string;
  version: string;
}

interface HkIpoPublicHeldDbReadbackPayload {
  data_version?: string;
  mode?: "latest" | "specific";
  object_store_readback?: boolean;
  source_batch_id?: string;
  source_run_id?: string;
}

interface AgentRunLiveWriteSmokeResult {
  audit_event_hash?: string;
  binding_name: "AIPHABEE_HYPERDRIVE";
  cleanup_verified?: boolean;
  deleted_rows?: number;
  detail_hash?: string;
  evidence_record_id_hash?: string;
  failure_code?: string;
  inserted_rows?: number;
  ledger_entry_id_hash?: string;
  operation_count?: number;
  production_persistence_enabled?: false;
  query_hash?: string;
  selected_rows?: number;
  status: CloudflareBindingSmokeStatus;
  surface: "agent_run_audit_evidence_usage_insert_select_delete";
  tables?: [
    "aiphabee_audit.agent_run_audit_event",
    "aiphabee_core.evidence_record",
    "aiphabee_core.evidence_source_ref",
    "platform.account",
    "platform.workspace",
    "aiphabee_core.usage_meter_rule",
    "aiphabee_core.usage_event",
    "aiphabee_core.usage_ledger_entry"
  ];
  usage_event_id_hash?: string;
}

interface McpDeveloperConsoleLogStoreSmokeResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  cleanup_verified?: boolean;
  deleted_rows?: number;
  detail_hash?: string;
  developer_console_live?: false;
  failure_code?: string;
  frontend_rendering?: false;
  inserted_rows?: number;
  live_api_key_generation?: false;
  live_console_log_store?: false;
  live_console_log_store_smoke?: true;
  live_oauth_provider?: false;
  live_tool_execution?: false;
  live_usage_ledger_reads?: false;
  operation_count?: number;
  production_console_log_store?: false;
  query_hash?: string;
  request_log_id_hash?: string;
  selected_rows?: number;
  source_record_hash?: string;
  status: CloudflareBindingSmokeStatus;
  surface: "mcp_developer_console_request_log_insert_select_delete";
  tables?: ["aiphabee_core.mcp_developer_console_request_log"];
}

interface AgentRunStatePersistenceSmokeResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  checkpoint_id_hash?: string;
  cleanup_verified?: boolean;
  deleted_rows?: number;
  detail_hash?: string;
  durable_run_state_smoke?: true;
  failure_code?: string;
  idempotency_key_hash?: string;
  inserted_rows?: number;
  operation_count?: number;
  production_persistence_enabled?: false;
  query_hash?: string;
  resume_token_hash?: string;
  run_state_id_hash?: string;
  selected_rows?: number;
  status: CloudflareBindingSmokeStatus;
  surface: "agent_run_state_checkpoint_insert_select_update_delete";
  tables?: ["aiphabee_core.agent_run_state", "aiphabee_core.agent_run_checkpoint"];
  updated_rows?: number;
  user_facing_resume_enabled?: false;
}

interface AgentBillingPostedLedgerSmokeResult {
  binding_name: "AIPHABEE_HYPERDRIVE";
  billing_provider_calls?: false;
  cleanup_verified?: boolean;
  deleted_rows?: number;
  detail_hash?: string;
  failure_code?: string;
  idempotency_key_hash?: string;
  idempotent_skipped_rows?: number;
  inserted_rows?: number;
  ledger_entry_id_hash?: string;
  no_double_charge_verified?: boolean;
  operation_count?: number;
  posted_credit_delta?: number;
  posted_ledger_entry_hash?: string;
  posted_rows?: number;
  production_billing_posted?: false;
  query_hash?: string;
  selected_rows?: number;
  status: CloudflareBindingSmokeStatus;
  surface: "agent_billing_posted_ledger_preview_to_posted_idempotency";
  synthetic_posted_transition?: true;
  tables?: [
    "platform.account",
    "platform.workspace",
    "aiphabee_core.usage_meter_rule",
    "aiphabee_core.usage_event",
    "aiphabee_core.usage_ledger_entry"
  ];
  updated_rows?: number;
  usage_event_id_hash?: string;
}

interface AgentRunRequestBody {
  account_analytics_read_permission_evidence?: unknown;
  accountAnalyticsReadPermissionEvidence?: unknown;
  ai_gateway_observability_gate_accepted?: unknown;
  aiGatewayObservabilityGateAccepted?: unknown;
  ambiguous_security_query?: unknown;
  ambiguousSecurityQuery?: unknown;
  as_of?: unknown;
  asOf?: unknown;
  answer_text?: unknown;
  answerText?: unknown;
  backend_progress_stream_accepted?: unknown;
  backendProgressStreamAccepted?: unknown;
  billing_posted_ledger_accepted?: unknown;
  billingPostedLedgerAccepted?: unknown;
  budget_stop_policy_accepted?: unknown;
  budgetStopPolicyAccepted?: unknown;
  channel?: unknown;
  calculations?: unknown;
  claims?: unknown;
  capture_packet_accepted?: unknown;
  capturePacketAccepted?: unknown;
  cost_cache_evidence_accepted?: unknown;
  costCacheEvidenceAccepted?: unknown;
  cost_rate_limit_fallback_evidence_accepted?: unknown;
  costRateLimitFallbackEvidenceAccepted?: unknown;
  currency?: unknown;
  entitlement_policy_version?: unknown;
  entitlementPolicyVersion?: unknown;
  eval_v1_accepted?: unknown;
  evalV1Accepted?: unknown;
  failure_recovery_policy_accepted?: unknown;
  failureRecoveryPolicyAccepted?: unknown;
  frontend_evidence_cards_accepted?: unknown;
  frontendEvidenceCardsAccepted?: unknown;
  frontend_streaming_ui_accepted?: unknown;
  frontendStreamingUiAccepted?: unknown;
  generated_answer_evidence_accepted?: unknown;
  generatedAnswerEvidenceAccepted?: unknown;
  fixed_live_tool_loop_smoke_accepted?: unknown;
  fixedLiveToolLoopSmokeAccepted?: unknown;
  fixed_tool_execution_evidence_accepted?: unknown;
  fixedToolExecutionEvidenceAccepted?: unknown;
  max_credits?: unknown;
  max_rows?: unknown;
  max_steps?: unknown;
  max_tokens?: unknown;
  max_wall_clock_ms?: unknown;
  methodology?: unknown;
  locale?: unknown;
  live_cost_ledger_writer_accepted?: unknown;
  liveCostLedgerWriterAccepted?: unknown;
  live_tool_loop_stream_text_accepted?: unknown;
  liveToolLoopStreamTextAccepted?: unknown;
  kill_switch_reason?: unknown;
  killSwitchReason?: unknown;
  language?: unknown;
  model_kill_switch?: unknown;
  modelKillSwitch?: unknown;
  model_tier?: unknown;
  modelTier?: unknown;
  model_audit_stream_text_accepted?: unknown;
  modelAuditStreamTextAccepted?: unknown;
  model_routing_audit_accepted?: unknown;
  modelRoutingAuditAccepted?: unknown;
  plan?: unknown;
  pre_tool_call_resolution_accepted?: unknown;
  preToolCallResolutionAccepted?: unknown;
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
  operator_signoff?: unknown;
  operatorSignoff?: unknown;
  partner_approved_corpus_accepted?: unknown;
  partnerApprovedCorpusAccepted?: unknown;
  ai_gateway_read_permission_evidence?: unknown;
  aiGatewayReadPermissionEvidence?: unknown;
  persistent_eval_writes_accepted?: unknown;
  persistentEvalWritesAccepted?: unknown;
  prompt_version?: unknown;
  promptVersion?: unknown;
  production_cutover_requested?: unknown;
  productionCutoverRequested?: unknown;
  rate_limit_fallback_evidence_accepted?: unknown;
  rateLimitFallbackEvidenceAccepted?: unknown;
  retention_policy_approved?: unknown;
  retentionPolicyApproved?: unknown;
  request_log_evidence_accepted?: unknown;
  requestLogEvidenceAccepted?: unknown;
  run_tool_audit_fields_accepted?: unknown;
  runToolAuditFieldsAccepted?: unknown;
  source_run_id?: unknown;
  sourceRunId?: unknown;
  stream_auth_redaction_accepted?: unknown;
  streamAuthRedactionAccepted?: unknown;
  tool_enforcement_accepted?: unknown;
  toolEnforcementAccepted?: unknown;
  title?: unknown;
  tool_loop_planner_accepted?: unknown;
  toolLoopPlannerAccepted?: unknown;
  user_auth_entitlement_accepted?: unknown;
  userAuthEntitlementAccepted?: unknown;
  user_run_persistence_gate_accepted?: unknown;
  userRunPersistenceGateAccepted?: unknown;
  live_model_streaming_gate_accepted?: unknown;
  liveModelStreamingGateAccepted?: unknown;
  live_smoke_evidence_ledger_accepted?: unknown;
  liveSmokeEvidenceLedgerAccepted?: unknown;
  model_execution_audit_accepted?: unknown;
  modelExecutionAuditAccepted?: unknown;
  unsourced_numeric_sampling_accepted?: unknown;
  unsourcedNumericSamplingAccepted?: unknown;
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
const MCP_TOOL_EXECUTION_ROUTE_MAP: Record<string, string> = {
  calculate_returns_risk: "/analytics/returns-risk",
  compare_ipos: "/analytics/compare-ipos",
  compare_securities: "/analytics/compare-securities",
  get_announcement: "/documents/get-announcement",
  get_corporate_actions: "/tools/get-corporate-actions",
  get_data_lineage: "/tools/get-data-lineage",
  get_entitlements: "/tools/get-entitlements",
  get_event_timeline: "/tools/get-event-timeline",
  get_financial_facts: "/tools/get-financial-facts",
  get_financial_ratios: "/analytics/financial-ratios",
  get_ipo_allotment: "/tools/get-ipo-allotment",
  get_ipo_offering: "/tools/get-ipo-offering",
  get_ipo_profile: "/workbench/ipo/snapshot",
  get_ipo_timetable: "/tools/get-ipo-timetable",
  get_market_calendar: "/tools/get-market-calendar",
  get_price_history: "/tools/get-price-history",
  get_quote_snapshot: "/tools/get-quote-snapshot",
  get_security_profile: "/tools/get-security-profile",
  resolve_security: "/tools/resolve-security",
  screen_securities: "/analytics/screen-securities",
  screen_ipos: "/analytics/screen-ipos",
  search_ipo_calendar: "/ipos/calendar",
  search_announcements: "/documents/search-announcements"
};
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
const CLOUDFLARE_BINDING_SMOKE_PREFIX = "aiphabee-smoke";
const CLOUDFLARE_DURABLE_OBJECT_SMOKE_ROUTE = "/cloudflare/durable-objects/smoke";
const CLOUDFLARE_DURABLE_OBJECT_SMOKE_KIND = "aiphabee.durable-object.smoke.v1";
const CLOUDFLARE_WORKFLOW_SMOKE_ROUTE = "/cloudflare/workflows/smoke";
const CLOUDFLARE_WORKFLOW_SMOKE_KIND = "aiphabee.workflow.smoke.v1";
const CLOUDFLARE_CRON_SMOKE_ROUTE = "/cloudflare/cron/smoke";
const CLOUDFLARE_CRON_NATURAL_EVIDENCE_ROUTE = "/cloudflare/cron/natural-evidence";
const CLOUDFLARE_CRON_SMOKE_KIND = "aiphabee.cron.smoke.v1";
const CLOUDFLARE_MAINTENANCE_CRON = "*/30 * * * *";
const CLOUDFLARE_CRON_NATURAL_EVIDENCE_KEY = `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/cron-natural/latest`;
const CLOUDFLARE_HYPERDRIVE_SMOKE_ROUTE = "/cloudflare/hyperdrive/smoke";
const CLOUDFLARE_HYPERDRIVE_SCHEMA_INVENTORY_ROUTE =
  "/cloudflare/hyperdrive/schema-inventory";
const CLOUDFLARE_PLATFORM_RLS_FIXTURE_SMOKE_ROUTE =
  "/cloudflare/hyperdrive/platform-rls-fixture-smoke";
const CLOUDFLARE_PLATFORM_RUNTIME_ROLE_SMOKE_ROUTE =
  "/cloudflare/hyperdrive/platform-runtime-role-smoke";
const PLATFORM_UMBRELLA_EXPECTED_SCHEMAS = ["platform", "platform_audit"] as const;
const PLATFORM_UMBRELLA_EXPECTED_TABLES = [
  "platform.account",
  "platform.entitlement_policy",
  "platform.product",
  "platform.product_environment",
  "platform.workspace",
  "platform.workspace_entitlement",
  "platform.workspace_membership",
  "platform.workspace_product_access",
  "platform_audit.product_access_event"
] as const;
const PLATFORM_UMBRELLA_EXPECTED_INDEXES = [
  "entitlement_policy_product_id_policy_version_idx",
  "product_access_event_actor_account_id_idx",
  "product_access_event_product_id_workspace_id_event_time_idx",
  "product_access_event_workspace_id_idx",
  "product_environment_product_id_idx",
  "workspace_entitlement_product_id_workspace_id_entitlement_key_s",
  "workspace_entitlement_workspace_id_idx",
  "workspace_membership_account_id_workspace_id_status_idx",
  "workspace_membership_workspace_id_idx",
  "workspace_owner_account_id_idx",
  "workspace_product_access_product_id_workspace_id_access_status_",
  "workspace_product_access_workspace_id_idx"
] as const;
const PLATFORM_UMBRELLA_EXPECTED_RLS_TABLES = PLATFORM_UMBRELLA_EXPECTED_TABLES;
const PLATFORM_UMBRELLA_SCHEMA_INVENTORY_QUERY_LABEL = JSON.stringify({
  indexes: PLATFORM_UMBRELLA_EXPECTED_INDEXES,
  rls_tables: PLATFORM_UMBRELLA_EXPECTED_RLS_TABLES,
  schemas: PLATFORM_UMBRELLA_EXPECTED_SCHEMAS,
  surface: "platform_umbrella_schema_inventory",
  tables: PLATFORM_UMBRELLA_EXPECTED_TABLES
});
const PLATFORM_RLS_FIXTURE_ID_PREFIX = "aiphabee-rls-smoke:";
const PLATFORM_RLS_RUNTIME_ROLE = "aiphabee_runtime_rls";
const PLATFORM_RLS_FIXTURE_QUERY_LABEL = JSON.stringify({
  claim: "aiphabee.account_id",
  fixture_prefix: PLATFORM_RLS_FIXTURE_ID_PREFIX,
  rollback: true,
  runtime_role: PLATFORM_RLS_RUNTIME_ROLE,
  surface: "platform_umbrella_rls_fixture_smoke",
  tables: [
    "platform.account",
    "platform.workspace",
    "platform.workspace_membership",
    "platform.workspace_product_access",
    "platform.entitlement_policy",
    "platform.workspace_entitlement"
  ]
});
const PLATFORM_RUNTIME_ROLE_QUERY_LABEL = JSON.stringify({
  binding: "AIPHABEE_HYPERDRIVE",
  required_false: [
    "current_role_bypassrls",
    "current_role_superuser",
    "database_create_privilege",
    "platform_schema_create_privilege",
    "workspace_table_owner_is_current_user"
  ],
  required_true: [
    "platform_schema_usage_privilege",
    "platform_account_select_privilege",
    "platform_workspace_select_privilege",
    "platform_workspace_rls_forced"
  ],
  surface: "platform_runtime_role_smoke"
});
const AGENT_TOOL_EXECUTION_SMOKE_ROUTE = "/agent/runs/tool-execution-evidence-smoke";
const AGENT_TOOL_EXECUTION_SMOKE_HEADER_VALUE = "agent-tool-execution-evidence-v1";
const AGENT_TOOL_EXECUTION_SMOKE_TOKEN_BINDING = "AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN";
const EVIDENCE_LIVE_DB_SMOKE_ROUTE = "/evidence/records/live-db-smoke";
const EVIDENCE_LIVE_DB_SMOKE_HEADER_VALUE = "evidence-lineage-live-db-v1";
const EVIDENCE_LIVE_DB_SMOKE_TOKEN_BINDING = "AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN";
const HK_IPO_PUBLIC_HELD_DB_APPLY_ROUTE = "/ingest/hk-ipo-public/held-db-apply";
const HK_IPO_PUBLIC_HELD_DB_APPLY_HEADER_VALUE = "hk-ipo-public-held-db-apply-live-v1";
const HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN_BINDING =
  "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN";
const HK_IPO_PUBLIC_HELD_DB_APPLY_VERSION =
  "2026-06-28.hk-ipo-public-held-db-apply-live.v0";
const HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE =
  "/ingest/hk-ipo-public/held-db-readback";
const HK_IPO_PUBLIC_HELD_DB_READBACK_HEADER_VALUE =
  "hk-ipo-public-held-db-readback-v1";
const HK_IPO_PUBLIC_HELD_DB_READBACK_VERSION =
  "2026-06-28.hk-ipo-public-held-db-readback.v0";
const HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_ROUTE =
  "/ingest/hk-ipo-public/held-db-apply-smoke";
const HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_HEADER_VALUE =
  "hk-ipo-public-held-db-apply-v1";
const HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN_BINDING =
  "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN";
const HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_VERSION =
  "2026-06-28.hk-ipo-public-held-db-apply-smoke.v0";
const MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_ROUTE =
  "/mcp/developer-console/log-store-smoke";
const MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_HEADER_VALUE =
  "mcp-developer-console-log-store-v1";
const MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_TOKEN_BINDING =
  "AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN";
const MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_VERSION =
  "2026-06-22.phase2.mcp-developer-console-log-store-smoke.v0";
const CLOUDFLARE_QUEUE_SMOKE_ROUTE = "/cloudflare/queues/smoke";
const IPO_NO_RELEASED_DATA_VERSION = "ipo-no-released-data-version";
const CLOUDFLARE_QUEUE_SMOKE_KIND = "aiphabee.queue.smoke.v1";
const CLOUDFLARE_QUEUE_SMOKE_MAX_ATTEMPTS = 20;
const CLOUDFLARE_QUEUE_SMOKE_POLL_MS = 500;
const CLOUDFLARE_WORKFLOW_SMOKE_MAX_ATTEMPTS = 20;
const CLOUDFLARE_WORKFLOW_SMOKE_POLL_MS = 500;
const AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE = "/agent/runs/model-execution-audit-smoke";
const AGENT_MODEL_EXECUTION_AUDIT_SMOKE_HEADER_VALUE = "agent-model-execution-audit-v1";
const AGENT_MODEL_EXECUTION_AUDIT_SMOKE_TOKEN_BINDING =
  "AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN";
const AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE = "/agent/runs/live-tool-loop-smoke";
const AGENT_LIVE_TOOL_LOOP_SMOKE_HEADER_VALUE = "agent-live-tool-loop-v1";
const AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN_BINDING =
  "AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN";
const AGENT_LIVE_TOOL_LOOP_SMOKE_VERSION =
  "2026-06-22.phase1.agent-live-tool-loop-smoke.v0";
const AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE =
  "/agent/runs/generated-answer-evidence-smoke";
const AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_HEADER_VALUE =
  "agent-generated-answer-evidence-v1";
const AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_TOKEN_BINDING =
  "AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN";
const AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_VERSION =
  "2026-06-22.phase1.agent-generated-answer-evidence-smoke.v0";
const AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE = "/agent/runs/live-write-smoke";
const AGENT_RUN_LIVE_WRITE_SMOKE_HEADER_VALUE = "agent-run-live-write-v1";
const AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN_BINDING =
  "AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN";
const AGENT_RUN_LIVE_WRITE_SMOKE_VERSION =
  "2026-06-22.phase1.agent-run-live-write-smoke.v0";
const AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE = "/agent/runs/state-persistence-smoke";
const AGENT_RUN_STATE_PERSISTENCE_SMOKE_HEADER_VALUE = "agent-run-state-persistence-v1";
const AGENT_RUN_STATE_PERSISTENCE_SMOKE_TOKEN_BINDING =
  "AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN";
const AGENT_RUN_STATE_PERSISTENCE_SMOKE_VERSION =
  "2026-06-22.phase1.agent-run-state-persistence-smoke.v0";
const AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE =
  "/agent/runs/billing-posted-ledger-smoke";
const AGENT_BILLING_POSTED_LEDGER_SMOKE_HEADER_VALUE =
  "agent-billing-posted-ledger-v1";
const AGENT_BILLING_POSTED_LEDGER_SMOKE_TOKEN_BINDING =
  "AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN";
const AGENT_BILLING_POSTED_LEDGER_SMOKE_VERSION =
  "2026-06-22.phase1.agent-billing-posted-ledger-smoke.v0";
const AI_GATEWAY_LIVE_SMOKE_ROUTE = "/agent/model-provider/live-smoke";
const AI_GATEWAY_LIVE_SMOKE_HEADER_VALUE = "model-provider-live-v1";

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

app.post(CLOUDFLARE_CRON_NATURAL_EVIDENCE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_CRON_NATURAL_EVIDENCE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const parsedBody = (await c.req.json().catch(() => ({}))) as unknown;
  const body = isPlainRecord(parsedBody) ? parsedBody : {};
  const afterIssuedAt =
    typeof body.after_issued_at === "string"
      ? body.after_issued_at
      : typeof body.afterIssuedAt === "string"
        ? body.afterIssuedAt
        : undefined;
  const cronResult = await readCloudflareCronNaturalEvidence(c.env ?? {}, afterIssuedAt);
  const bodyWithoutHash = {
    cron_result: cronResult,
    missing_bindings: cronResult.status === "missing_binding" ? ["AIPHABEE_CONFIG"] : [],
    request_id: requestId,
    route: `POST ${CLOUDFLARE_CRON_NATURAL_EVIDENCE_ROUTE}`,
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

app.post(CLOUDFLARE_HYPERDRIVE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_HYPERDRIVE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const hyperdriveResult = await runCloudflareHyperdriveSmoke(c.env ?? {});
  const bodyWithoutHash = {
    hyperdrive_result: hyperdriveResult,
    missing_bindings:
      hyperdriveResult.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${CLOUDFLARE_HYPERDRIVE_SMOKE_ROUTE}`,
    status: hyperdriveResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    hyperdriveResult.status === "passed" ? 200 : 424
  );
});

app.post(CLOUDFLARE_HYPERDRIVE_SCHEMA_INVENTORY_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_HYPERDRIVE_SCHEMA_INVENTORY_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const inventoryResult = await runPlatformUmbrellaSchemaInventory(c.env ?? {});
  const bodyWithoutHash = {
    hyperdrive_schema_inventory_result: inventoryResult,
    missing_bindings:
      inventoryResult.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${CLOUDFLARE_HYPERDRIVE_SCHEMA_INVENTORY_ROUTE}`,
    status: inventoryResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    inventoryResult.status === "passed" ? 200 : 424
  );
});

app.post(CLOUDFLARE_PLATFORM_RLS_FIXTURE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_PLATFORM_RLS_FIXTURE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const rlsResult = await runPlatformUmbrellaRlsFixtureSmoke(c.env ?? {});
  const bodyWithoutHash = {
    missing_bindings: rlsResult.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${CLOUDFLARE_PLATFORM_RLS_FIXTURE_SMOKE_ROUTE}`,
    rls_fixture_result: rlsResult,
    status: rlsResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    rlsResult.status === "passed" ? 200 : 424
  );
});

app.post(CLOUDFLARE_PLATFORM_RUNTIME_ROLE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${CLOUDFLARE_PLATFORM_RUNTIME_ROLE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const runtimeRoleResult = await runPlatformRuntimeRoleSmoke(c.env ?? {});
  const bodyWithoutHash = {
    missing_bindings:
      runtimeRoleResult.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${CLOUDFLARE_PLATFORM_RUNTIME_ROLE_SMOKE_ROUTE}`,
    runtime_role_result: runtimeRoleResult,
    status: runtimeRoleResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    runtimeRoleResult.status === "passed" ? 200 : 424
  );
});

app.post(EVIDENCE_LIVE_DB_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== EVIDENCE_LIVE_DB_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${EVIDENCE_LIVE_DB_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingEvidenceLiveDbWriteSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${EVIDENCE_LIVE_DB_SMOKE_ROUTE}`,
      status: "missing_env"
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isEvidenceLiveDbWriteSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${EVIDENCE_LIVE_DB_SMOKE_TOKEN_BINDING}`,
        route: `POST ${EVIDENCE_LIVE_DB_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const evidenceLiveDbWriteResult = await runEvidenceLiveDbWriteSmoke(
    c.env ?? {},
    requestId
  );
  const bodyWithoutHash = {
    evidence_live_db_write_result: evidenceLiveDbWriteResult,
    missing_bindings:
      evidenceLiveDbWriteResult.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${EVIDENCE_LIVE_DB_SMOKE_ROUTE}`,
    status: evidenceLiveDbWriteResult.status === "passed" ? "ok" : "failed",
    synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    evidenceLiveDbWriteResult.status === "passed" ? 200 : 424
  );
});

app.post(HK_IPO_PUBLIC_HELD_DB_APPLY_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    HK_IPO_PUBLIC_HELD_DB_APPLY_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingHkIpoPublicHeldDbApplyEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_ROUTE}`,
      status: "missing_env",
      version: HK_IPO_PUBLIC_HELD_DB_APPLY_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isHkIpoPublicHeldDbApplyAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN_BINDING}`,
        route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const payload = await c.req.json().catch(() => undefined);
  const validation = validateHkIpoPublicHeldDbApplyPayload(payload);

  if (validation.status !== "ok") {
    const bodyWithoutHash = {
      error_count: validation.errors.length,
      error_hash: await hashRuntimeSmokeString(validation.errors.join("\n")),
      request_id: requestId,
      route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_ROUTE}`,
      status: "invalid_payload",
      version: HK_IPO_PUBLIC_HELD_DB_APPLY_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      400
    );
  }

  const result = await runHkIpoPublicHeldDbApply(c.env ?? {}, validation.payload);
  const bodyWithoutHash = {
    held_db_apply_result: result,
    missing_bindings: result.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_ROUTE}`,
    status: result.status === "passed" ? "ok" : "failed",
    version: HK_IPO_PUBLIC_HELD_DB_APPLY_VERSION
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    result.status === "passed" ? 200 : result.status === "missing_binding" ? 424 : 502
  );
});

app.post(HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    HK_IPO_PUBLIC_HELD_DB_READBACK_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingHkIpoPublicHeldDbApplyEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE}`,
      status: "missing_env",
      version: HK_IPO_PUBLIC_HELD_DB_READBACK_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isHkIpoPublicHeldDbApplyAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN_BINDING}`,
        route: `POST ${HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const rawBody = await c.req.text().catch(() => "");
  const payload = rawBody.trim().length > 0 ? parseJsonObject(rawBody) : {};
  const validation = validateHkIpoPublicHeldDbReadbackPayload(payload);

  if (validation.status !== "ok") {
    const bodyWithoutHash = {
      error_count: validation.errors.length,
      error_hash: await hashRuntimeSmokeString(validation.errors.join("\n")),
      request_id: requestId,
      route: `POST ${HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE}`,
      status: "invalid_payload",
      version: HK_IPO_PUBLIC_HELD_DB_READBACK_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      400
    );
  }

  const result = await runHkIpoPublicHeldDbReadback(c.env ?? {}, validation.payload);
  const missingBindings =
    result.status === "missing_binding"
      ? [
          result.failure_code === "missing_r2_artifacts_binding"
            ? "AIPHABEE_ARTIFACTS"
            : "AIPHABEE_HYPERDRIVE"
        ]
      : [];
  const bodyWithoutHash = {
    held_db_readback_result: result,
    missing_bindings: missingBindings,
    request_id: requestId,
    route: `POST ${HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE}`,
    status: result.status === "passed" ? "ok" : "failed",
    version: HK_IPO_PUBLIC_HELD_DB_READBACK_VERSION
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    result.status === "passed" ? 200 : result.status === "missing_binding" ? 424 : 502
  );
});

app.post(HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingHkIpoPublicHeldDbApplySmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_ROUTE}`,
      status: "missing_env",
      version: HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isHkIpoPublicHeldDbApplySmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN_BINDING}`,
        route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const result = await runHkIpoPublicHeldDbApplySmoke(c.env ?? {}, requestId);
  const bodyWithoutHash = {
    held_db_apply_result: result,
    missing_bindings: result.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_ROUTE}`,
    status: result.status === "passed" ? "ok" : "failed",
    version: HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_VERSION
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    result.status === "passed" ? 200 : result.status === "missing_binding" ? 424 : 502
  );
});

app.post(AI_GATEWAY_LIVE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== AI_GATEWAY_LIVE_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AI_GATEWAY_LIVE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAiGatewayLiveSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AI_GATEWAY_LIVE_SMOKE_ROUTE}`,
      status: "missing_env",
      version: AI_GATEWAY_LIVE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  try {
    const modelProviderResult = await runAiGatewayLiveSmoke({
      accountId: c.env.CLOUDFLARE_ACCOUNT_ID ?? "",
      apiToken: getAiGatewayLiveSmokeToken(c.env ?? {}),
      gatewayId: c.env.AI_GATEWAY_NAME ?? "",
      model: c.env.AI_GATEWAY_SMOKE_MODEL ?? ""
    });
    const bodyWithoutHash = {
      model_provider_result: modelProviderResult,
      request_id: requestId,
      route: `POST ${AI_GATEWAY_LIVE_SMOKE_ROUTE}`,
      status: modelProviderResult.status === "ok" ? "ok" : "failed",
      version: AI_GATEWAY_LIVE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      modelProviderResult.status === "ok" ? 200 : 502
    );
  } catch (error) {
    const bodyWithoutHash = {
      detail_hash: await hashRuntimeSmokeString(
        sanitizeRuntimeSmokeDetail(error instanceof Error ? error.message : String(error))
      ),
      error_code:
        error instanceof AgentRuntimeInputError ? error.code : "AI_GATEWAY_REQUEST_FAILED",
      request_id: requestId,
      route: `POST ${AI_GATEWAY_LIVE_SMOKE_ROUTE}`,
      status: "failed",
      version: AI_GATEWAY_LIVE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      502
    );
  }
});

app.post(AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    AGENT_MODEL_EXECUTION_AUDIT_SMOKE_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAgentModelExecutionAuditSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE}`,
      status: "missing_env",
      version: AI_GATEWAY_LIVE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isAgentModelExecutionAuditSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${AGENT_MODEL_EXECUTION_AUDIT_SMOKE_TOKEN_BINDING}`,
        route: `POST ${AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  try {
    const modelProviderResult = await runAiGatewayLiveSmoke({
      accountId: c.env.CLOUDFLARE_ACCOUNT_ID ?? "",
      apiToken: getAiGatewayLiveSmokeToken(c.env ?? {}),
      gatewayId: c.env.AI_GATEWAY_NAME ?? "",
      model: c.env.AI_GATEWAY_SMOKE_MODEL ?? ""
    });
    const auditResult = await createAgentModelExecutionAuditSmokeResult(
      modelProviderResult,
      requestId
    );
    const bodyWithoutHash = {
      agent_model_execution_audit_result: auditResult,
      request_id: requestId,
      route: `POST ${AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE}`,
      status: auditResult.status === "passed" ? "ok" : "failed",
      version: AI_GATEWAY_LIVE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      auditResult.status === "passed" ? 200 : 502
    );
  } catch (error) {
    const bodyWithoutHash = {
      detail_hash: await hashRuntimeSmokeString(
        sanitizeRuntimeSmokeDetail(error instanceof Error ? error.message : String(error))
      ),
      error_code:
        error instanceof AgentRuntimeInputError ? error.code : "AGENT_MODEL_AUDIT_SMOKE_FAILED",
      request_id: requestId,
      route: `POST ${AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE}`,
      status: "failed",
      version: AI_GATEWAY_LIVE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      502
    );
  }
});

app.post(AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== AGENT_LIVE_TOOL_LOOP_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAgentLiveToolLoopSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE}`,
      status: "missing_env",
      version: AGENT_LIVE_TOOL_LOOP_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isAgentLiveToolLoopSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN_BINDING}`,
        route: `POST ${AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  try {
    const result = await executeAgentLiveToolLoopSmoke(c.env ?? {}, requestId);
    const bodyWithoutHash = {
      agent_live_tool_loop_result: result,
      request_id: requestId,
      route: `POST ${AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE}`,
      status: result.status === "passed" ? "ok" : "failed",
      version: AGENT_LIVE_TOOL_LOOP_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      result.status === "passed" ? 200 : 502
    );
  } catch (error) {
    const bodyWithoutHash = {
      detail_hash: await hashRuntimeSmokeString(
        sanitizeRuntimeSmokeDetail(error instanceof Error ? error.message : String(error))
      ),
      error_code:
        error instanceof AgentRuntimeInputError || error instanceof McpRuntimeInputError
          ? error.code
          : "AGENT_LIVE_TOOL_LOOP_SMOKE_FAILED",
      request_id: requestId,
      route: `POST ${AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE}`,
      status: "failed",
      version: AGENT_LIVE_TOOL_LOOP_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      502
    );
  }
});

app.post(AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAgentGeneratedAnswerEvidenceSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE}`,
      status: "missing_env",
      version: AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isAgentGeneratedAnswerEvidenceSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_TOKEN_BINDING}`,
        route: `POST ${AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  try {
    const result = await executeAgentGeneratedAnswerEvidenceSmoke(requestId);
    const bodyWithoutHash = {
      agent_generated_answer_evidence_result: result,
      request_id: requestId,
      route: `POST ${AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE}`,
      status: result.status === "passed" ? "ok" : "failed",
      version: AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      result.status === "passed" ? 200 : 502
    );
  } catch (error) {
    const bodyWithoutHash = {
      detail_hash: await hashRuntimeSmokeString(
        sanitizeRuntimeSmokeDetail(error instanceof Error ? error.message : String(error))
      ),
      error_code:
        error instanceof AgentRuntimeInputError || error instanceof McpRuntimeInputError
          ? error.code
          : "AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_FAILED",
      request_id: requestId,
      route: `POST ${AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE}`,
      status: "failed",
      version: AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      502
    );
  }
});

app.post(AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== AGENT_RUN_LIVE_WRITE_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAgentRunLiveWriteSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE}`,
      status: "missing_env",
      version: AGENT_RUN_LIVE_WRITE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isAgentRunLiveWriteSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN_BINDING}`,
        route: `POST ${AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const result = await runAgentRunLiveWriteSmoke(c.env ?? {}, requestId);
  const bodyWithoutHash = {
    agent_run_live_write_result: result,
    missing_bindings: result.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE}`,
    status: result.status === "passed" ? "ok" : "failed",
    version: AGENT_RUN_LIVE_WRITE_SMOKE_VERSION
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    result.status === "passed" ? 200 : result.status === "missing_binding" ? 424 : 502
  );
});

app.post(AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    AGENT_RUN_STATE_PERSISTENCE_SMOKE_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAgentRunStatePersistenceSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE}`,
      status: "missing_env",
      version: AGENT_RUN_STATE_PERSISTENCE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isAgentRunStatePersistenceSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${AGENT_RUN_STATE_PERSISTENCE_SMOKE_TOKEN_BINDING}`,
        route: `POST ${AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const result = await runAgentRunStatePersistenceSmoke(c.env ?? {}, requestId);
  const bodyWithoutHash = {
    agent_run_state_persistence_result: result,
    missing_bindings: result.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE}`,
    status: result.status === "passed" ? "ok" : "failed",
    version: AGENT_RUN_STATE_PERSISTENCE_SMOKE_VERSION
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    result.status === "passed" ? 200 : result.status === "missing_binding" ? 424 : 502
  );
});

app.post(AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    AGENT_BILLING_POSTED_LEDGER_SMOKE_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAgentBillingPostedLedgerSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE}`,
      status: "missing_env",
      version: AGENT_BILLING_POSTED_LEDGER_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isAgentBillingPostedLedgerSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${AGENT_BILLING_POSTED_LEDGER_SMOKE_TOKEN_BINDING}`,
        route: `POST ${AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const result = await runAgentBillingPostedLedgerSmoke(c.env ?? {}, requestId);
  const bodyWithoutHash = {
    agent_billing_posted_ledger_result: result,
    missing_bindings: result.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE}`,
    status: result.status === "passed" ? "ok" : "failed",
    version: AGENT_BILLING_POSTED_LEDGER_SMOKE_VERSION
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    result.status === "passed" ? 200 : result.status === "missing_binding" ? 424 : 502
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

app.get("/compliance/licensed-advice/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const capability = getLicensedAdviceRuntimeCapabilities();

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
          source: "licensed-advice-runtime-contract",
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

app.post("/compliance/licensed-advice/exploration/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createLicensedAdviceExplorationPlan({
    adviceRecordRetentionPolicyId: normalizeString(
      body.advice_record_retention_policy_id ?? body.adviceRecordRetentionPolicyId
    ),
    complaintHandlingPolicyId: normalizeString(
      body.complaint_handling_policy_id ?? body.complaintHandlingPolicyId
    ),
    humanReviewQueueId: normalizeString(body.human_review_queue_id ?? body.humanReviewQueueId),
    killSwitchPolicyId: normalizeString(body.kill_switch_policy_id ?? body.killSwitchPolicyId),
    legalReviewStatus: normalizeString(body.legal_review_status ?? body.legalReviewStatus),
    licensedEntityId: normalizeString(body.licensed_entity_id ?? body.licensedEntityId),
    proposedSurface: normalizeString(body.proposed_surface ?? body.proposedSurface),
    requestId,
    responsibleOfficerId: normalizeString(
      body.responsible_officer_id ?? body.responsibleOfficerId
    ),
    suitabilityProfileSchemaId: normalizeString(
      body.suitability_profile_schema_id ?? body.suitabilityProfileSchemaId
    ),
    type4WrittenOpinionId: normalizeString(
      body.type4_written_opinion_id ?? body.type4WrittenOpinionId
    ),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getLicensedAdviceExplorationCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "licensed-advice-runtime-contract",
            source_record_id: "licensed-advice-exploration-plan"
          }
        ],
        requestId,
        usage: plan.usage
      }
    )
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

app.get("/partner/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const capability = getPartnerRuntimeCapabilities();

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
          source: "partner-runtime-contract",
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

app.post("/partner/white-label-embeds/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createWhiteLabelEmbedPlan({
    allowedOrigins: normalizeStringArray(
      body.allowed_origins ?? body.allowedOrigins ?? body.origins
    ),
    brandMode: normalizeString(body.brand_mode ?? body.brandMode),
    commercialModel: normalizeString(body.commercial_model ?? body.commercialModel),
    dataScopes: normalizeStringArray(body.data_scopes ?? body.dataScopes),
    partnerId: normalizeString(body.partner_id ?? body.partnerId),
    partnerName: normalizeString(body.partner_name ?? body.partnerName),
    partnerType: normalizeString(body.partner_type ?? body.partnerType),
    requestedSurfaces: normalizeStringArray(
      body.requested_surfaces ?? body.requestedSurfaces ?? body.surfaces
    ),
    requestId,
    revenueShareBps: normalizeOptionalInteger(
      body.revenue_share_bps ?? body.revenueShareBps
    ),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getWhiteLabelEmbedCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "partner-runtime-contract",
            source_record_id: "white-label-embed-plan"
          }
        ],
        requestId,
        usage: plan.usage
      }
    )
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
        enterprise_controls: getEnterpriseControlsCapabilities(),
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

app.post("/account/enterprise-controls/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createEnterpriseControlsPlan({
    accountId: normalizeString(body.account_id ?? body.accountId),
    planCode: normalizeAccountPlanCode(body.plan_code ?? body.planCode),
    privateConnectorKind: normalizePrivateDataConnectorKind(
      body.private_connector_kind ?? body.privateConnectorKind
    ),
    privateConnectorName: normalizeString(
      body.private_connector_name ?? body.privateConnectorName
    ),
    requestedControls: normalizeStringArray(
      body.requested_controls ?? body.requestedControls ?? body.controls
    ),
    requestId,
    seatLimit: normalizeOptionalInteger(body.seat_limit ?? body.seatLimit),
    ssoDomainHash: normalizeString(body.sso_domain_hash ?? body.ssoDomainHash),
    ssoProtocol: normalizeEnterpriseSsoProtocol(body.sso_protocol ?? body.ssoProtocol),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getEnterpriseControlsCapabilities()
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
            source_record_id: "enterprise-controls-plan"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: plan.status === "planned_no_write" ? plan.requested_controls.length : 0
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

app.get("/database/runtime", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const liveReadRequested = ["1", "true"].includes(c.req.query("live") ?? "");

  c.header("Cache-Control", "no-store");

  if (
    liveReadRequested &&
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== CLOUDFLARE_BINDING_SMOKE_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: "GET /database/runtime?live=1",
        status: "forbidden"
      },
      403
    );
  }

  const liveReadiness = liveReadRequested
    ? await runPlatformUmbrellaSchemaInventory(c.env ?? {})
    : undefined;
  const liveQueries = liveReadiness?.status === "passed";

  return c.json(
    createSuccessEnvelope(
      {
        connection_path: "cloudflare_hyperdrive",
        hyperdrive: {
          binding_configured: Boolean(c.env?.AIPHABEE_HYPERDRIVE),
          binding_name: "AIPHABEE_HYPERDRIVE",
          requires_real_resource_id: true,
          status:
            liveReadiness === undefined
              ? "planned"
              : liveReadiness.status === "passed"
                ? "live_readiness_passed"
                : liveReadiness.status
        },
        live_queries: liveQueries,
        live_readiness: {
          requested: liveReadRequested,
          result: liveReadiness,
          route: "/database/runtime?live=1",
          source_route: CLOUDFLARE_HYPERDRIVE_SCHEMA_INVENTORY_ROUTE
        },
        market_data_surfaces: false,
        mcp_redistribution_surfaces: false,
        migration_contract: "deploy/database/migrations.contract.json",
        migration_directory: "supabase/migrations",
        provider: "planetscale_postgres"
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
          rows: liveReadiness?.operation_count ?? 0
        }
      }
    ),
    liveReadRequested && !liveQueries ? 424 : 200
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
            "platform.account",
            "platform.workspace",
            "platform.workspace_membership",
            "platform.subscription_plan",
            "platform.workspace_subscription",
            "aiphabee_governance.data_entitlement",
            "aiphabee_governance.workspace_entitlement"
          ],
          workspace_isolation: true
        },
        corporate_actions: {
          adjustment_types: ["raw", "split_adjusted", "total_return_adjusted"],
          benchmark_parity: getCorporateActionBenchmarkParityCapabilities(),
          closed_open_intervals: true,
          engine: getCorporateActionAdjustmentCapabilities(),
          live_actions: false,
          quality_default_state: "HOLD",
          status: "schema_scaffold",
          tables: [
            "aiphabee_core.corporate_action",
            "aiphabee_core.adjustment_methodology",
            "aiphabee_core.price_adjustment_factor"
          ]
        },
        data_version_batches: {
          table: "aiphabee_core.data_version_batch",
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
            "aiphabee_core.financial_statement",
            "aiphabee_core.financial_fact",
            "aiphabee_core.financial_restatement"
          ]
        },
        live_queries: false,
        market_data_loaded: false,
        raw_snapshots: {
          immutable: true,
          quality_default_state: "HOLD",
          table: "aiphabee_core.raw_snapshot"
        },
        security_master: {
          tables: [
            "aiphabee_core.company",
            "aiphabee_core.instrument",
            "aiphabee_core.listing",
            "aiphabee_core.identifier_history"
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
            "aiphabee_core.serving_dataset",
            "aiphabee_core.serving_field",
            "aiphabee_core.serving_snapshot",
            "aiphabee_core.serving_record"
          ]
        },
        source_batches: {
          rights_default_state: "default_deny",
          table: "aiphabee_core.raw_source_batch"
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

app.get("/data/corporate-actions/benchmark-parity", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const report = runCorporateActionBenchmarkParityGate();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...report,
        capability: getCorporateActionBenchmarkParityCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: report.benchmarkFixtureVersion,
        methodologyVersion: report.version,
        provenance: [
          {
            data_version: report.benchmarkFixtureVersion,
            methodology_version: report.version,
            source: "corporate-action-benchmark-fixture",
            source_record_id: "partner-public-benchmark-parity-v0"
          }
        ],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: report.sampleCount
        }
      }
    )
  );
});

app.get("/market-data/domains/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const capability = getMarketDomainRuntimeCapabilities();

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
          source: "market-domain-runtime-contract",
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

app.post("/market-data/domains/cross-market/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createHkDataDomainsCrossMarketPlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    baseMarket: normalizeString(body.base_market ?? body.baseMarket),
    comparisonMarkets: normalizeStringArray(
      body.comparison_markets ?? body.comparisonMarkets ?? body.markets
    ),
    mappingTypes: normalizeStringArray(
      body.mapping_types ?? body.mappingTypes ?? body.mappings
    ),
    requestId,
    requestedDomains: normalizeStringArray(
      body.requested_domains ?? body.requestedDomains ?? body.domains
    ),
    rightsMatrixVersion: normalizeString(
      body.rights_matrix_version ?? body.rightsMatrixVersion
    ),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getHkDataDomainsCrossMarketCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.version,
        methodologyVersion: plan.version,
        provenance: [
          {
            data_version: plan.version,
            methodology_version: plan.version,
            source: "market-domain-runtime-contract",
            source_record_id: "hk-data-domains-cross-market-plan"
          }
        ],
        requestId,
        usage: plan.usage
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
            "platform.account",
            "platform.workspace",
            "platform.workspace_membership",
            "platform.subscription_plan",
            "platform.workspace_subscription",
            "aiphabee_governance.data_entitlement",
            "aiphabee_governance.workspace_entitlement"
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
          "serving_quality_live_readiness",
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
          live_policy_source_readiness: getFieldRightsLivePolicySourceCapabilities(),
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
          serving_quality_live_readiness: getServingQualityLiveReadinessCapabilities(),
          query_planner: getServingStoreQueryPlannerCapabilities(),
          release_state_default: "held",
          read_planner: getServingStoreReadCapabilities(),
          sql_descriptor: getServingStoreSqlDescriptorCapabilities(),
          sql_text_compiler: getServingStoreSqlTextCompilerCapabilities(),
          status: "schema_scaffold",
          tables: [
            "aiphabee_core.serving_dataset",
            "aiphabee_core.serving_field",
            "aiphabee_core.serving_snapshot",
            "aiphabee_core.serving_record"
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
            "aiphabee_core.usage_meter_rule",
            "aiphabee_core.usage_event",
            "aiphabee_core.usage_reconciliation_batch",
            "aiphabee_core.usage_ledger_entry"
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

app.get("/gateway/field-rights/live-policy-source/readiness", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const report = createFieldRightsLivePolicySourceReadinessReport({
    asOf: new Date().toISOString()
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(report, {
      asOf: report.as_of,
      dataVersion: report.fixture_version,
      methodologyVersion: report.version,
      provenance: [
        {
          data_version: report.fixture_version,
          methodology_version: report.version,
          source: "field-rights-live-policy-source-readiness",
          source_record_id: "partner-matrix-db-policy-source-fixture-v0"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: report.validation.smoke_count
      }
    })
  );
});

app.get("/gateway/serving-quality/live-readiness", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const report = createServingQualityLiveReadinessReport({
    asOf: new Date().toISOString()
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(report, {
      asOf: report.as_of,
      dataVersion: report.fixture_version,
      methodologyVersion: report.version,
      provenance: [
        {
          data_version: report.fixture_version,
          methodology_version: report.version,
          source: "serving-quality-live-readiness",
          source_record_id: "quality-release-gateway-serving-fixture-v0"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: report.validation.smoke_count
      }
    })
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
        partner_sla_reconciliation_readiness:
          getPartnerSlaReconciliationReadinessCapabilities(),
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

app.get("/usage/partner-sla/reconciliation-readiness", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const report = createPartnerSlaReconciliationReadinessReport({
    requestId
  });

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(report, {
      asOf: new Date().toISOString(),
      dataVersion: report.version,
      methodologyVersion: report.version,
      provenance: [
        {
          data_version: report.version,
          methodology_version: report.version,
          source: "partner-sla-reconciliation-readiness",
          source_record_id: "partner-sla-reconciliation-readiness-report"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: report.release_checks.length
      }
    })
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
  const plan = createWatchlistAlertsPlan(normalizeWatchlistAlertsPlanInput(body, requestId));

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

app.post("/tools/create-alert", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as WatchlistAlertsRequestBody;
  const plan = createAlertToolPlan(normalizeWatchlistAlertsPlanInput(body, requestId));

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getCreateAlertToolCapabilities()
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
  const portfolioAnalyticsCapability = getPortfolioAnalyticsCapabilities();
  const marketBreadthCapability = getMarketBreadthCapabilities();
  const ownershipShortSellingCapability = getOwnershipAndShortSellingCapabilities();
  const buybacksPlacementsCapability = getBuybacksAndPlacementsCapabilities();
  const consensusEstimatesCapability = getConsensusOrEstimatesCapabilities();
  const highCostAnalyticsQueueCapability = getHighCostAnalyticsQueueCapabilities();
  const savedScreeningCapability = getSavedScreeningCapabilities();

  return c.json(
    createSuccessEnvelope(
      {
        package: "@aiphabee/analytics-tools",
        compare_securities: capability,
        event_study: eventStudyCapability,
        financial_ratios: financialRatiosCapability,
        high_cost_analytics_queue: highCostAnalyticsQueueCapability,
        market_breadth: marketBreadthCapability,
        ownership_and_short_selling: ownershipShortSellingCapability,
        consensus_or_estimates: consensusEstimatesCapability,
        percentile_comparison: percentileComparisonCapability,
        portfolio_analytics: portfolioAnalyticsCapability,
        buybacks_and_placements: buybacksPlacementsCapability,
        returns_risk: returnsRiskCapability,
        saved_screening: savedScreeningCapability,
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
          portfolioAnalyticsCapability.route,
          marketBreadthCapability.route,
          ownershipShortSellingCapability.route,
          buybacksPlacementsCapability.route,
          consensusEstimatesCapability.route,
          savedScreeningCapability.route,
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

app.post("/analytics/portfolio", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const portfolio = getPortfolioAnalytics({
    asOf: normalizeString(body.as_of ?? body.asOf),
    authorizedHoldings: normalizeOptionalBoolean(
      body.authorized_holdings ?? body.authorizedHoldings
    ),
    positions: normalizePortfolioPositionInputs(body.positions),
    requestId,
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...portfolio,
        capability: getPortfolioAnalyticsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: portfolio.data_version,
        methodologyVersion: portfolio.methodology_version,
        provenance: [
          {
            data_version: portfolio.data_version,
            methodology_version: portfolio.methodology_version,
            source: "analytics-portfolio",
            source_record_id: "portfolio-analytics"
          }
        ],
        requestId,
        usage: portfolio.usage
      }
    )
  );
});

app.post("/analytics/market-breadth", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const marketBreadth = getMarketBreadth({
    asOf: normalizeString(body.as_of ?? body.asOf),
    authorizedMarketStatistics: normalizeOptionalBoolean(
      body.authorized_market_statistics ?? body.authorizedMarketStatistics
    ),
    market: normalizeString(body.market),
    requestId,
    universe: normalizeStringArray(body.universe)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...marketBreadth,
        capability: getMarketBreadthCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: marketBreadth.data_version,
        methodologyVersion: marketBreadth.methodology_version,
        provenance: [
          {
            data_version: marketBreadth.data_version,
            methodology_version: marketBreadth.methodology_version,
            source: "analytics-market-breadth",
            source_record_id: "market-breadth"
          }
        ],
        requestId,
        usage: marketBreadth.usage
      }
    )
  );
});

app.post("/analytics/ownership-short-selling", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const ownershipShortSelling = getOwnershipAndShortSelling({
    asOf: normalizeString(body.as_of ?? body.asOf),
    authorizedMarketStatistics: normalizeOptionalBoolean(
      body.authorized_market_statistics ?? body.authorizedMarketStatistics
    ),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...ownershipShortSelling,
        capability: getOwnershipAndShortSellingCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: ownershipShortSelling.data_version,
        methodologyVersion: ownershipShortSelling.methodology_version,
        provenance: [
          {
            data_version: ownershipShortSelling.data_version,
            methodology_version: ownershipShortSelling.methodology_version,
            source: "analytics-ownership-short-selling",
            source_record_id: "ownership-short-selling"
          }
        ],
        requestId,
        usage: ownershipShortSelling.usage
      }
    )
  );
});

app.post("/analytics/buybacks-placements", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const buybacksPlacements = getBuybacksAndPlacements({
    asOf: normalizeString(body.as_of ?? body.asOf),
    authorizedMarketStatistics: normalizeOptionalBoolean(
      body.authorized_market_statistics ?? body.authorizedMarketStatistics
    ),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...buybacksPlacements,
        capability: getBuybacksAndPlacementsCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: buybacksPlacements.data_version,
        methodologyVersion: buybacksPlacements.methodology_version,
        provenance: [
          {
            data_version: buybacksPlacements.data_version,
            methodology_version: buybacksPlacements.methodology_version,
            source: "analytics-buybacks-placements",
            source_record_id: "buybacks-placements"
          }
        ],
        requestId,
        usage: buybacksPlacements.usage
      }
    )
  );
});

app.post("/analytics/consensus-estimates", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const consensusEstimates = getConsensusOrEstimates({
    asOf: normalizeString(body.as_of ?? body.asOf),
    fiscalYears: normalizeIntegerArray(body.fiscal_years ?? body.fiscalYears),
    instrumentId: normalizeString(body.instrument_id ?? body.instrumentId),
    metrics: normalizeConsensusEstimateMetrics(body.metrics),
    redistributionRightsConfirmed: normalizeOptionalBoolean(
      body.redistribution_rights_confirmed ?? body.redistributionRightsConfirmed
    ),
    requestId,
    securityQuery: normalizeString(body.security_query ?? body.securityQuery)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...consensusEstimates,
        capability: getConsensusOrEstimatesCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: consensusEstimates.data_version,
        methodologyVersion: consensusEstimates.methodology_version,
        provenance: [
          {
            data_version: consensusEstimates.data_version,
            methodology_version: consensusEstimates.methodology_version,
            source: "analytics-consensus-estimates",
            source_record_id: "consensus-estimates"
          }
        ],
        requestId,
        usage: consensusEstimates.usage
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

app.post("/analytics/saved-screenings/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createSavedScreeningPlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    cadence: normalizeSavedScreeningCadence(body.cadence),
    classificationAsOf: normalizeString(body.classification_as_of ?? body.classificationAsOf),
    conditions: normalizeScreenConditionInputs(body.conditions),
    financialFrom: normalizeString(body.financial_from ?? body.financialFrom),
    financialTo: normalizeString(body.financial_to ?? body.financialTo),
    idempotencyKey: normalizeString(body.idempotency_key ?? body.idempotencyKey),
    name: normalizeString(body.name),
    naturalLanguage: normalizeString(
      body.natural_language ?? body.naturalLanguage ?? body.query
    ),
    nextRunAt: normalizeString(body.next_run_at ?? body.nextRunAt),
    notificationChannels: normalizeStringArray(
      body.notification_channels ?? body.notificationChannels
    ),
    ownerUserId: normalizeString(body.owner_user_id ?? body.ownerUserId),
    requestId,
    savedScreeningId: normalizeString(body.saved_screening_id ?? body.savedScreeningId),
    scheduleEnabled: normalizeOptionalBoolean(body.schedule_enabled ?? body.scheduleEnabled),
    timezone: normalizeString(body.timezone),
    universe: normalizeStringArray(body.universe),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getSavedScreeningCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: [
          {
            data_version: plan.data_version,
            methodology_version: plan.methodology_version,
            source: "analytics-saved-screening",
            source_record_id: "saved-screening-schedule-plan"
          }
        ],
        requestId,
        usage: plan.usage
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

app.post("/analytics/screen-ipos", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const filters = {
    board: normalizeString(body.board),
    hasCornerstone: normalizeOptionalBoolean(body.has_cornerstone ?? body.hasCornerstone),
    listingDateFrom: normalizeString(body.listing_date_from ?? body.listingDateFrom),
    listingDateTo: normalizeString(body.listing_date_to ?? body.listingDateTo),
    listingType: normalizeString(body.listing_type ?? body.listingType),
    minOversubscription: normalizeOptionalNumber(
      body.min_oversubscription ?? body.minOversubscription
    ),
    sector: normalizeString(body.sector),
    status: normalizeIpoScreenStatus(body.status ?? body.stage)
  };
  const screen = (await readReleasedIpoScreen(c.env ?? {}, filters)) ?? screenIpos(filters);

  return c.json(
    createSuccessEnvelope(screen, {
      asOf: new Date().toISOString(),
      dataVersion: screen.dataVersion,
      methodologyVersion: IPO_PIPELINE_VERSION,
      provenance: createIpoRouteProvenance(
        screen.dataVersion,
        screen.status,
        "analytics-screen-ipos",
        "screen-ipos-fixture"
      ),
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: screen.totalRows
      }
    })
  );
});

app.post("/analytics/compare-ipos", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const input = {
    ipoIds: normalizeStringArray(body.ipo_ids ?? body.ipoIds)
  };
  const comparison = (await readReleasedIpoCompare(c.env ?? {}, input)) ?? compareIpos(input);

  return c.json(
    createSuccessEnvelope(comparison, {
      asOf: new Date().toISOString(),
      dataVersion: comparison.dataVersion,
      methodologyVersion: IPO_PIPELINE_VERSION,
      provenance: createIpoRouteProvenance(
        comparison.dataVersion,
        comparison.status,
        "analytics-compare-ipos",
        "compare-ipos-fixture"
      ),
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: comparison.rows.length
      }
    })
  );
});

app.get("/ipos/calendar", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const input = {
    eventTypes: normalizeIpoCalendarEventTypes(c.req.query("event_type")),
    from: normalizeString(c.req.query("from")),
    to: normalizeString(c.req.query("to"))
  };
  const calendar = (await readReleasedIpoCalendar(c.env ?? {}, input)) ?? searchIpoCalendar(input);

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(calendar, {
      asOf: new Date().toISOString(),
      dataVersion: calendar.dataVersion,
      methodologyVersion: IPO_PIPELINE_VERSION,
      provenance: createIpoRouteProvenance(
        calendar.dataVersion,
        calendar.status,
        "ipo-calendar",
        "ipo-calendar-fixture"
      ),
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: calendar.events.length
      }
    })
  );
});

app.post("/ipos/calendar", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const input = {
    eventTypes: normalizeIpoCalendarEventTypes(body.event_types ?? body.eventTypes),
    from: normalizeString(body.from),
    to: normalizeString(body.to)
  };
  const calendar = (await readReleasedIpoCalendar(c.env ?? {}, input)) ?? searchIpoCalendar(input);

  return c.json(
    createSuccessEnvelope(calendar, {
      asOf: new Date().toISOString(),
      dataVersion: calendar.dataVersion,
      methodologyVersion: IPO_PIPELINE_VERSION,
      provenance: createIpoRouteProvenance(
        calendar.dataVersion,
        calendar.status,
        "ipo-calendar",
        "ipo-calendar-fixture"
      ),
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: calendar.events.length
      }
    })
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

app.post("/workbench/ipo/snapshot", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const ipoId = normalizeString(body.ipo_id ?? body.ipoId ?? body.hkex_code ?? body.hkexCode);
  const includeSensitiveFields =
    normalizeOptionalBoolean(body.include_sensitive_fields ?? body.includeSensitiveFields) ===
    true;
  const snapshotRead = await resolveIpoSnapshotRead(c.env ?? {}, {
    includeSensitiveFields,
    ipoId
  });

  if (snapshotRead.status !== "found") {
    return c.json(
      createErrorEnvelope(
        "NOT_FOUND",
        snapshotRead.status === "no_released_data"
          ? "No released IPO data_version is available."
          : `No IPO matches id "${ipoId ?? ""}" in IPO serving data.`,
        {
          asOf: new Date().toISOString(),
          dataVersion: snapshotRead.dataVersion,
          methodologyVersion: IPO_PIPELINE_VERSION,
          provenance: [],
          requestId,
          usage: {
            cached: false,
            credits: 0,
            rows: 0
          }
        }
      ),
      404
    );
  }

  const snapshot = snapshotRead.snapshot;

  return c.json(
    createSuccessEnvelope(snapshot, {
      asOf: new Date().toISOString(),
      dataVersion: snapshot.dataVersion,
      methodologyVersion: IPO_PIPELINE_VERSION,
      provenance: snapshot.provenance,
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows:
          1 +
          snapshot.narratives.length +
          snapshot.timetable.length +
          snapshot.cornerstones.length
      }
    })
  );
});

app.post("/tools/get-ipo-timetable", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const snapshotRead = await resolveIpoSnapshotRead(c.env ?? {}, {
    ipoId: normalizeString(body.ipo_id ?? body.ipoId ?? body.hkex_code ?? body.hkexCode)
  });
  const snapshot = snapshotRead.status === "found" ? snapshotRead.snapshot : undefined;

  if (snapshot === undefined) {
    return c.json(
      createErrorEnvelope("NOT_FOUND", "No released IPO timetable is available.", {
        asOf: new Date().toISOString(),
        dataVersion: ipoSnapshotReadDataVersion(snapshotRead),
        methodologyVersion: IPO_PIPELINE_VERSION,
        provenance: [],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      404
    );
  }

  return c.json(
    createSuccessEnvelope(
      {
        accessPolicy: snapshot.accessPolicy,
        dataVersion: snapshot.dataVersion,
        liveDataAccess: snapshot.liveDataAccess,
        methodologyVersion: IPO_PIPELINE_VERSION,
        offering: snapshot.offering,
        status: snapshot.status,
        timetable: snapshot.timetable,
        toolName: "get_ipo_timetable"
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: snapshot.dataVersion,
        methodologyVersion: IPO_PIPELINE_VERSION,
        provenance: snapshot.provenance,
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: snapshot.timetable.length
        }
      }
    )
  );
});

app.post("/tools/get-ipo-offering", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const snapshotRead = await resolveIpoSnapshotRead(c.env ?? {}, {
    ipoId: normalizeString(body.ipo_id ?? body.ipoId ?? body.hkex_code ?? body.hkexCode)
  });
  const snapshot = snapshotRead.status === "found" ? snapshotRead.snapshot : undefined;

  if (snapshot === undefined) {
    return c.json(
      createErrorEnvelope("NOT_FOUND", "No released IPO offering is available.", {
        asOf: new Date().toISOString(),
        dataVersion: ipoSnapshotReadDataVersion(snapshotRead),
        methodologyVersion: IPO_PIPELINE_VERSION,
        provenance: [],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      404
    );
  }

  return c.json(
    createSuccessEnvelope(
      {
        accessPolicy: snapshot.accessPolicy,
        dataVersion: snapshot.dataVersion,
        liveDataAccess: snapshot.liveDataAccess,
        methodologyVersion: IPO_PIPELINE_VERSION,
        offering: snapshot.offering,
        status: snapshot.status,
        toolName: "get_ipo_offering"
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: snapshot.dataVersion,
        methodologyVersion: IPO_PIPELINE_VERSION,
        provenance: snapshot.provenance,
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 1
        }
      }
    )
  );
});

app.post("/tools/get-ipo-allotment", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const snapshotRead = await resolveIpoSnapshotRead(c.env ?? {}, {
    ipoId: normalizeString(body.ipo_id ?? body.ipoId ?? body.hkex_code ?? body.hkexCode)
  });
  const snapshot = snapshotRead.status === "found" ? snapshotRead.snapshot : undefined;

  if (snapshot === undefined) {
    return c.json(
      createErrorEnvelope("NOT_FOUND", "No released IPO allotment is available.", {
        asOf: new Date().toISOString(),
        dataVersion: ipoSnapshotReadDataVersion(snapshotRead),
        methodologyVersion: IPO_PIPELINE_VERSION,
        provenance: [],
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }),
      404
    );
  }

  return c.json(
    createSuccessEnvelope(
      {
        accessPolicy: snapshot.accessPolicy,
        allotmentSummary: {
          oneLotSuccessRate: snapshot.offering.oneLotSuccessRate,
          overSubscriptionMultiple: snapshot.offering.overSubscriptionMultiple,
          redactedFields: snapshot.accessPolicy.redactedFields.filter((field) =>
            field.startsWith("ipo_allotment")
          )
        },
        dataVersion: snapshot.dataVersion,
        liveDataAccess: snapshot.liveDataAccess,
        methodologyVersion: IPO_PIPELINE_VERSION,
        offering: snapshot.offering,
        status: snapshot.status,
        toolName: "get_ipo_allotment"
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: snapshot.dataVersion,
        methodologyVersion: IPO_PIPELINE_VERSION,
        provenance: snapshot.provenance,
        requestId,
        usage: {
          cached: false,
          credits: 0,
          rows: 1
        }
      }
    )
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

app.post("/documents/user-public-data-join/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = createUserPublicDataJoinPrivacyPlan({
    asOf: normalizeString(body.as_of ?? body.asOf),
    customLayoutId: normalizeString(body.custom_layout_id ?? body.customLayoutId),
    fieldAuthorizationPolicyId: normalizeString(
      body.field_authorization_policy_id ?? body.fieldAuthorizationPolicyId
    ),
    joinKeys: normalizeStringArray(body.join_keys ?? body.joinKeys),
    privacyPolicyId: normalizeString(body.privacy_policy_id ?? body.privacyPolicyId),
    publicDataScope: normalizeString(body.public_data_scope ?? body.publicDataScope),
    requestId,
    requestedFields: normalizeStringArray(body.requested_fields ?? body.requestedFields),
    retentionPolicyId: normalizeString(body.retention_policy_id ?? body.retentionPolicyId),
    userConsentId: normalizeString(body.user_consent_id ?? body.userConsentId),
    userFileId: normalizeString(body.user_file_id ?? body.userFileId),
    userFileSha256: normalizeString(body.user_file_sha256 ?? body.userFileSha256),
    workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getUserPublicDataJoinPrivacyCapabilities()
      },
      {
        asOf: new Date().toISOString(),
        dataVersion: plan.data_version,
        methodologyVersion: plan.methodology_version,
        provenance: [
          {
            data_version: plan.data_version,
            methodology_version: plan.methodology_version,
            source: "document-user-public-data-join-privacy",
            source_record_id: "user-public-data-join-privacy-plan"
          }
        ],
        requestId,
        usage: plan.usage
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

app.get("/mcp/runtime/tool-schemas", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const snapshot = getMcpRuntimeSchemaSnapshot();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(snapshot, {
      asOf: new Date().toISOString(),
      dataVersion: snapshot.version,
      methodologyVersion: snapshot.schema_snapshot_version,
      provenance: [
        {
          data_version: snapshot.version,
          methodology_version: snapshot.schema_snapshot_version,
          source: "mcp-runtime",
          source_record_id: "runtime-tool-schema-snapshot"
        }
      ],
      requestId,
      usage: {
        cached: false,
        credits: 0,
        rows: snapshot.tool_count
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

app.post("/mcp/developer-console/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpDeveloperConsolePlan({
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
          capability: getMcpDeveloperConsoleCapabilities()
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
      "MCP Developer Console plan failed",
      {
        dataVersion: "mcp-developer-console-backend-scaffold-v0",
        methodologyVersion:
          "2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0",
        source: "mcp-runtime"
      }
    );
  }
});

app.post(MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (
    c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !==
    MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_HEADER_VALUE
  ) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_ROUTE}`,
        status: "forbidden",
        version: MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_VERSION
      },
      403
    );
  }

  const missingEnv = missingMcpDeveloperConsoleLogStoreSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_ROUTE}`,
      status: "missing_env",
      version: MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_VERSION
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isMcpDeveloperConsoleLogStoreSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_TOKEN_BINDING}`,
        route: `POST ${MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_ROUTE}`,
        status: "forbidden",
        version: MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_VERSION
      },
      403
    );
  }

  const result = await runMcpDeveloperConsoleLogStoreSmoke(c.env ?? {}, requestId);
  const bodyWithoutHash = {
    mcp_developer_console_log_store_result: result,
    missing_bindings: result.status === "missing_binding" ? ["AIPHABEE_HYPERDRIVE"] : [],
    request_id: requestId,
    route: `POST ${MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_ROUTE}`,
    status: result.status === "passed" ? "ok" : "failed",
    version: MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_VERSION
  };
  const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

  return c.json(
    {
      ...bodyWithoutHash,
      response_hash: responseHash
    },
    result.status === "passed" ? 200 : result.status === "missing_binding" ? 424 : 502
  );
});

app.post("/mcp/client-maturity/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = createMcpClientMaturityPlan({
      clientName: normalizeString(body.client_name ?? body.clientName),
      clientVersion: normalizeString(body.client_version ?? body.clientVersion),
      origin: c.req.header("origin") ?? normalizeString(body.origin),
      pendingCredits: normalizeOptionalNumber(body.pending_credits ?? body.pendingCredits),
      requestId,
      requestedFeature: normalizeString(body.requested_feature ?? body.requestedFeature),
      usagePlanCode: normalizeUsageQuotaPlanCode(body.plan_code ?? body.planCode),
      usedCredits: normalizeOptionalNumber(body.used_credits ?? body.usedCredits),
      workspaceId: normalizeString(body.workspace_id ?? body.workspaceId)
    });

    return c.json(
      createSuccessEnvelope(
        {
          ...result,
          capability: getMcpClientMaturityCapabilities()
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
      "MCP client maturity plan failed",
      {
        dataVersion: "mcp-client-maturity-scaffold-v0",
        methodologyVersion: "2026-06-22.phase4.mcp-client-maturity-scaffold.v0",
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
  const smokeExecutionAuthorized = isMcpLiveExecutionSmokeAuthorized(c);

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
      grantedScopes: smokeExecutionAuthorized
        ? normalizeStringArray(params.scopes ?? body.scopes) ?? []
        : [],
      ipRiskLevel: normalizeString(
        params.ip_risk ?? params.ipRisk ?? c.req.header("x-aiphabee-ip-risk")
      ),
      keyId: normalizeString(params.key_id ?? params.keyId),
      membershipId: normalizeString(params.membership_id ?? params.membershipId),
      method: normalizeString(body.method),
      mcpRedistributionRightsConfirmed:
        smokeExecutionAuthorized &&
        normalizeBoolean(
          params.mcp_api_redistribution_rights_confirmed ??
            params.mcpApiRedistributionRightsConfirmed
        ),
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
    const executionResult =
      smokeExecutionAuthorized && result.tool_call !== undefined
        ? await executeMcpToolCallSmoke(params, requestId)
        : undefined;
    const responseData =
      executionResult === undefined
        ? {
            ...result,
            capability: getMcpRuntimeCapabilities()
          }
        : {
            ...result,
            live_tool_execution: true,
            status: "executed_mcp_tool_call_smoke",
            tool_call: {
              ...result.tool_call,
              live_execution: true,
              structured_content_validation: "executed_synthetic_tool_route"
            },
            tool_result: executionResult,
            capability: {
              ...getMcpRuntimeCapabilities(),
              live_tool_execution_smoke: true,
              mcp_api_redistribution_rights_confirmed: true
            }
          };

    return c.json(
      createSuccessEnvelope(
        responseData,
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

app.post("/agent/release-gates/ai-gateway-observability/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createAgentAiGatewayObservabilityReleaseGatePlan({
    accountAnalyticsReadPermissionEvidence: normalizeOptionalBoolean(
      body.account_analytics_read_permission_evidence ??
        body.accountAnalyticsReadPermissionEvidence
    ),
    aiGatewayReadPermissionEvidence: normalizeOptionalBoolean(
      body.ai_gateway_read_permission_evidence ?? body.aiGatewayReadPermissionEvidence
    ),
    capturePacketAccepted: normalizeOptionalBoolean(
      body.capture_packet_accepted ?? body.capturePacketAccepted
    ),
    costCacheEvidenceAccepted: normalizeOptionalBoolean(
      body.cost_cache_evidence_accepted ?? body.costCacheEvidenceAccepted
    ),
    rateLimitFallbackEvidenceAccepted: normalizeOptionalBoolean(
      body.rate_limit_fallback_evidence_accepted ?? body.rateLimitFallbackEvidenceAccepted
    ),
    requestId,
    requestLogEvidenceAccepted: normalizeOptionalBoolean(
      body.request_log_evidence_accepted ?? body.requestLogEvidenceAccepted
    )
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAgentAiGatewayObservabilityReleaseGateCapabilities()
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
            source_record_id: "agent-ai-gateway-observability-release-gate-plan"
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

app.post("/agent/release-gates/live-model-streaming/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createAgentLiveModelStreamingReleaseGatePlan({
    aiGatewayObservabilityGateAccepted: normalizeOptionalBoolean(
      body.ai_gateway_observability_gate_accepted ??
        body.aiGatewayObservabilityGateAccepted
    ),
    backendProgressStreamAccepted: normalizeOptionalBoolean(
      body.backend_progress_stream_accepted ?? body.backendProgressStreamAccepted
    ),
    frontendStreamingUiAccepted: normalizeOptionalBoolean(
      body.frontend_streaming_ui_accepted ?? body.frontendStreamingUiAccepted
    ),
    generatedAnswerEvidenceAccepted: normalizeOptionalBoolean(
      body.generated_answer_evidence_accepted ?? body.generatedAnswerEvidenceAccepted
    ),
    liveToolLoopStreamTextAccepted: normalizeOptionalBoolean(
      body.live_tool_loop_stream_text_accepted ?? body.liveToolLoopStreamTextAccepted
    ),
    modelAuditStreamTextAccepted: normalizeOptionalBoolean(
      body.model_audit_stream_text_accepted ?? body.modelAuditStreamTextAccepted
    ),
    requestId,
    streamAuthRedactionAccepted: normalizeOptionalBoolean(
      body.stream_auth_redaction_accepted ?? body.streamAuthRedactionAccepted
    )
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAgentLiveModelStreamingReleaseGateCapabilities()
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
            source_record_id: "agent-live-model-streaming-release-gate-plan"
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

app.post("/agent/release-gates/model-output-corpus/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createAgentModelOutputCorpusReleaseGatePlan({
    evalV1Accepted: normalizeOptionalBoolean(body.eval_v1_accepted ?? body.evalV1Accepted),
    frontendEvidenceCardsAccepted: normalizeOptionalBoolean(
      body.frontend_evidence_cards_accepted ?? body.frontendEvidenceCardsAccepted
    ),
    generatedAnswerEvidenceAccepted: normalizeOptionalBoolean(
      body.generated_answer_evidence_accepted ?? body.generatedAnswerEvidenceAccepted
    ),
    liveModelStreamingGateAccepted: normalizeOptionalBoolean(
      body.live_model_streaming_gate_accepted ?? body.liveModelStreamingGateAccepted
    ),
    liveSmokeEvidenceLedgerAccepted: normalizeOptionalBoolean(
      body.live_smoke_evidence_ledger_accepted ?? body.liveSmokeEvidenceLedgerAccepted
    ),
    modelExecutionAuditAccepted: normalizeOptionalBoolean(
      body.model_execution_audit_accepted ?? body.modelExecutionAuditAccepted
    ),
    partnerApprovedCorpusAccepted: normalizeOptionalBoolean(
      body.partner_approved_corpus_accepted ?? body.partnerApprovedCorpusAccepted
    ),
    persistentEvalWritesAccepted: normalizeOptionalBoolean(
      body.persistent_eval_writes_accepted ?? body.persistentEvalWritesAccepted
    ),
    requestId,
    unsourcedNumericSamplingAccepted: normalizeOptionalBoolean(
      body.unsourced_numeric_sampling_accepted ?? body.unsourcedNumericSamplingAccepted
    )
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAgentModelOutputCorpusReleaseGateCapabilities()
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
            source_record_id: "agent-model-output-corpus-release-gate-plan"
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

app.post("/agent/release-gates/token-cost-fallback/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createAgentTokenCostFallbackReleaseGatePlan({
    aiGatewayObservabilityGateAccepted: normalizeOptionalBoolean(
      body.ai_gateway_observability_gate_accepted ?? body.aiGatewayObservabilityGateAccepted
    ),
    billingPostedLedgerAccepted: normalizeOptionalBoolean(
      body.billing_posted_ledger_accepted ?? body.billingPostedLedgerAccepted
    ),
    costRateLimitFallbackEvidenceAccepted: normalizeOptionalBoolean(
      body.cost_rate_limit_fallback_evidence_accepted ??
        body.costRateLimitFallbackEvidenceAccepted
    ),
    liveCostLedgerWriterAccepted: normalizeOptionalBoolean(
      body.live_cost_ledger_writer_accepted ?? body.liveCostLedgerWriterAccepted
    ),
    modelExecutionAuditAccepted: normalizeOptionalBoolean(
      body.model_execution_audit_accepted ?? body.modelExecutionAuditAccepted
    ),
    modelRoutingAuditAccepted: normalizeOptionalBoolean(
      body.model_routing_audit_accepted ?? body.modelRoutingAuditAccepted
    ),
    requestId,
    runToolAuditFieldsAccepted: normalizeOptionalBoolean(
      body.run_tool_audit_fields_accepted ?? body.runToolAuditFieldsAccepted
    ),
    userRunPersistenceGateAccepted: normalizeOptionalBoolean(
      body.user_run_persistence_gate_accepted ?? body.userRunPersistenceGateAccepted
    )
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAgentTokenCostFallbackReleaseGateCapabilities()
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
            source_record_id: "agent-token-cost-fallback-release-gate-plan"
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

app.post("/agent/release-gates/user-tool-loop-execution/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createAgentUserToolLoopExecutionReleaseGatePlan({
    budgetStopPolicyAccepted: normalizeOptionalBoolean(
      body.budget_stop_policy_accepted ?? body.budgetStopPolicyAccepted
    ),
    failureRecoveryPolicyAccepted: normalizeOptionalBoolean(
      body.failure_recovery_policy_accepted ?? body.failureRecoveryPolicyAccepted
    ),
    fixedLiveToolLoopSmokeAccepted: normalizeOptionalBoolean(
      body.fixed_live_tool_loop_smoke_accepted ?? body.fixedLiveToolLoopSmokeAccepted
    ),
    fixedToolExecutionEvidenceAccepted: normalizeOptionalBoolean(
      body.fixed_tool_execution_evidence_accepted ?? body.fixedToolExecutionEvidenceAccepted
    ),
    preToolCallResolutionAccepted: normalizeOptionalBoolean(
      body.pre_tool_call_resolution_accepted ?? body.preToolCallResolutionAccepted
    ),
    requestId,
    toolEnforcementAccepted: normalizeOptionalBoolean(
      body.tool_enforcement_accepted ?? body.toolEnforcementAccepted
    ),
    toolLoopPlannerAccepted: normalizeOptionalBoolean(
      body.tool_loop_planner_accepted ?? body.toolLoopPlannerAccepted
    ),
    userAuthEntitlementAccepted: normalizeOptionalBoolean(
      body.user_auth_entitlement_accepted ?? body.userAuthEntitlementAccepted
    ),
    userRunPersistenceGateAccepted: normalizeOptionalBoolean(
      body.user_run_persistence_gate_accepted ?? body.userRunPersistenceGateAccepted
    )
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAgentUserToolLoopExecutionReleaseGateCapabilities()
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
            source_record_id: "agent-user-tool-loop-execution-release-gate-plan"
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

app.post("/agent/release-gates/user-run-persistence/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const plan = createAgentUserRunPersistenceReleaseGatePlan({
    operatorSignoff: normalizeOptionalBoolean(body.operator_signoff ?? body.operatorSignoff),
    productionCutoverRequested: normalizeOptionalBoolean(
      body.production_cutover_requested ?? body.productionCutoverRequested
    ),
    requestId,
    retentionPolicyApproved: normalizeOptionalBoolean(
      body.retention_policy_approved ?? body.retentionPolicyApproved
    )
  });

  return c.json(
    createSuccessEnvelope(
      {
        ...plan,
        capability: getAgentUserRunPersistenceReleaseGateCapabilities()
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
            source_record_id: "agent-user-run-persistence-release-gate-plan"
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
        workflowTask.resume.state_table === "aiphabee_core.workflow_task_checkpoint",
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
            ? "workflow task resume uses aiphabee_core.workflow_task_checkpoint and disconnect_safe=true"
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

app.post("/agent/runs/stream", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");
  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("X-Accel-Buffering", "no");

  const body = (await c.req.json().catch(() => ({}))) as AgentRunRequestBody;
  const report = createAgentProgressStreamReport(createAgentRunInput(body, requestId));
  const streamBody = report.stream_events
    .map((event) => `event: ${event.event}\ndata: ${JSON.stringify(event)}\n`)
    .join("\n");

  c.header("x-aiphabee-progress-event-count", String(report.stream_events.length));
  c.header("x-aiphabee-run-id", report.run_id);

  return c.body(`${streamBody}\n`);
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

app.post(AGENT_TOOL_EXECUTION_SMOKE_ROUTE, async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  if (c.req.header(CLOUDFLARE_BINDING_SMOKE_HEADER) !== AGENT_TOOL_EXECUTION_SMOKE_HEADER_VALUE) {
    return c.json(
      {
        request_id: requestId,
        required_header: CLOUDFLARE_BINDING_SMOKE_HEADER,
        route: `POST ${AGENT_TOOL_EXECUTION_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  const missingEnv = missingAgentToolExecutionSmokeEnv(c.env ?? {});

  if (missingEnv.length > 0) {
    const bodyWithoutHash = {
      missing_env: missingEnv,
      request_id: requestId,
      route: `POST ${AGENT_TOOL_EXECUTION_SMOKE_ROUTE}`,
      status: "missing_env"
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      424
    );
  }

  if (!isAgentToolExecutionSmokeAuthorized(c)) {
    return c.json(
      {
        request_id: requestId,
        required_authorization: `Bearer ${AGENT_TOOL_EXECUTION_SMOKE_TOKEN_BINDING}`,
        route: `POST ${AGENT_TOOL_EXECUTION_SMOKE_ROUTE}`,
        status: "forbidden"
      },
      403
    );
  }

  try {
    const result = await executeAgentToolExecutionEvidenceSmoke(requestId);
    const bodyWithoutHash = {
      agent_tool_execution_evidence_result: result,
      request_id: requestId,
      route: `POST ${AGENT_TOOL_EXECUTION_SMOKE_ROUTE}`,
      status: result.status === "passed" ? "ok" : "failed",
      synthetic_prefix: CLOUDFLARE_BINDING_SMOKE_PREFIX
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      result.status === "passed" ? 200 : 424
    );
  } catch (error) {
    const bodyWithoutHash = {
      detail_hash: await hashRuntimeSmokeString(
        sanitizeRuntimeSmokeDetail(error instanceof Error ? error.message : String(error))
      ),
      error_code:
        error instanceof McpRuntimeInputError ? error.code : "AGENT_TOOL_EXECUTION_SMOKE_FAILED",
      request_id: requestId,
      route: `POST ${AGENT_TOOL_EXECUTION_SMOKE_ROUTE}`,
      status: "failed"
    };
    const responseHash = await hashRuntimeSmokeString(JSON.stringify(bodyWithoutHash));

    return c.json(
      {
        ...bodyWithoutHash,
        response_hash: responseHash
      },
      502
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
  const surface = "d1_eval_store_record_write_read_delete";

  if (!isRuntimeD1Database(value)) {
    return missingCloudflareBindingResult(bindingName, surface);
  }

  const table = "aiphabee_eval_store_smoke";
  const rowKey = crypto.randomUUID();
  const record = createRuntimeEvalStoreSmokeRecord(rowKey);
  const storedValue = JSON.stringify(record);

  try {
    await value
      .prepare(
        `CREATE TABLE IF NOT EXISTS ${table} (` +
          [
            "event_id TEXT PRIMARY KEY",
            "schema_version TEXT NOT NULL",
            "event_version TEXT NOT NULL",
            "request_id TEXT NOT NULL",
            "run_id TEXT NOT NULL",
            "route TEXT NOT NULL",
            "result TEXT NOT NULL",
            "failed_check_count INTEGER NOT NULL",
            "wvro_eligible INTEGER NOT NULL",
            "record_json TEXT NOT NULL",
            "created_at TEXT NOT NULL"
          ].join(", ") +
          ")"
      )
      .run();
    await value
      .prepare(
        `INSERT OR REPLACE INTO ${table} (` +
          [
            "event_id",
            "schema_version",
            "event_version",
            "request_id",
            "run_id",
            "route",
            "result",
            "failed_check_count",
            "wvro_eligible",
            "record_json",
            "created_at"
          ].join(", ") +
          ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
      )
      .bind(
        record.event_id,
        record.schema_version,
        record.event_version,
        record.request_id,
        record.run_id,
        record.route,
        record.result,
        record.failed_check_count,
        record.wvro_eligible ? 1 : 0,
        storedValue
      )
      .run();
    const selected = await value
      .prepare(
        `SELECT schema_version, result, record_json FROM ${table} WHERE event_id = ?`
      )
      .bind(record.event_id)
      .first<{ record_json?: string; result?: string; schema_version?: string }>();

    if (
      selected?.record_json !== storedValue ||
      selected.result !== record.result ||
      selected.schema_version !== EVAL_STORE_SCHEMA_VERSION
    ) {
      return failedCloudflareBindingResult({
        bindingName,
        detail: "d1 select did not return written eval-store record",
        failureCode: "d1_eval_store_select_mismatch",
        key: table,
        surface
      });
    }

    await value.prepare(`DELETE FROM ${table} WHERE event_id = ?`).bind(record.event_id).run();
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

function createRuntimeEvalStoreSmokeRecord(smokeId: string): EvalStoreRecord {
  const [, evalEvent] = createAgentDryRunTelemetry({
    environment: "cloudflare_smoke",
    maxSteps: 1,
    outcome: "success",
    requestId: `req-${smokeId}`,
    requestedTools: ["resolve_security"],
    route: CLOUDFLARE_BINDING_SMOKE_ROUTE,
    runId: `run-${smokeId}`
  });

  return createEvalStoreRecord(evalEvent);
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
  controller: RuntimeScheduledController,
  options: {
    evidenceKey?: string;
    retainEvidence?: boolean;
    surface?: CloudflareCronSmokeResult["surface"];
  } = {}
): Promise<CloudflareCronSmokeResult> {
  const config = env.AIPHABEE_CONFIG;
  const surface = options.surface ?? "cron_handler_smoke";

  if (!isRuntimeKvNamespace(config)) {
    return missingCloudflareCronResult("missing_kv_binding", surface);
  }

  const smokeId = crypto.randomUUID();
  const evidenceKey =
    options.evidenceKey ?? `${CLOUDFLARE_BINDING_SMOKE_PREFIX}/runtime/cron/${smokeId}`;
  const issuedAt = new Date().toISOString();
  const valueHash = await hashRuntimeSmokeString(
    `${CLOUDFLARE_CRON_SMOKE_KIND}:${controller.cron}:${controller.scheduledTime}`
  );

  try {
    await config.put(
      evidenceKey,
      JSON.stringify({
        cron_hash: await hashRuntimeSmokeString(controller.cron),
        issued_at: issuedAt,
        kind: CLOUDFLARE_CRON_SMOKE_KIND,
        scheduled_time_ms: controller.scheduledTime,
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
        scheduledTime: controller.scheduledTime,
        surface
      });
    }

    if (options.retainEvidence !== true) {
      await config.delete(evidenceKey);
    }

    return {
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      cron_hash: await hashRuntimeSmokeString(controller.cron),
      evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
      operation_count: options.retainEvidence === true ? 2 : 3,
      scheduled_time_hash: await hashRuntimeSmokeString(String(controller.scheduledTime)),
      status: "passed",
      surface,
      value_hash: valueHash
    };
  } catch (error) {
    if (options.retainEvidence !== true) {
      await config.delete(evidenceKey).catch(() => undefined);
    }

    return failedCloudflareCronResult({
      cron: controller.cron,
      detail: error instanceof Error ? error.message : String(error),
      evidenceKey,
      failureCode: "cron_handler_failed",
      scheduledTime: controller.scheduledTime,
      surface
    });
  }
}

async function readCloudflareCronNaturalEvidence(
  env: WorkerBindings,
  afterIssuedAt?: string
): Promise<CloudflareCronSmokeResult> {
  const config = env.AIPHABEE_CONFIG;
  const surface = "cron_natural_trigger_evidence";
  const evidenceKey = CLOUDFLARE_CRON_NATURAL_EVIDENCE_KEY;

  if (!isRuntimeKvNamespace(config)) {
    return missingCloudflareCronResult("missing_kv_binding", surface);
  }

  try {
    const evidence = await config.get(evidenceKey);

    if (evidence === null) {
      return failedCloudflareCronResult({
        cron: CLOUDFLARE_MAINTENANCE_CRON,
        detail: "cron natural trigger evidence marker was not found",
        evidenceKey,
        failureCode: "cron_natural_evidence_missing",
        scheduledTime: 0,
        surface
      });
    }

    const parsed = JSON.parse(evidence) as unknown;

    if (!isCloudflareCronEvidenceRecord(parsed)) {
      return failedCloudflareCronResult({
        cron: CLOUDFLARE_MAINTENANCE_CRON,
        detail: "cron natural trigger evidence marker had invalid shape",
        evidenceKey,
        failureCode: "cron_natural_evidence_invalid",
        scheduledTime: 0,
        surface
      });
    }

    if (typeof afterIssuedAt === "string" && afterIssuedAt.length > 0) {
      const issuedAtMs = Date.parse(parsed.issued_at);
      const thresholdMs = Date.parse(afterIssuedAt);

      if (!Number.isFinite(issuedAtMs) || !Number.isFinite(thresholdMs) || issuedAtMs < thresholdMs) {
        return failedCloudflareCronResult({
          cron: CLOUDFLARE_MAINTENANCE_CRON,
          detail: "cron natural trigger evidence predates requested threshold",
          evidenceKey,
          failureCode: "cron_natural_evidence_stale",
          scheduledTime: parsed.scheduled_time_ms,
          surface
        });
      }
    }

    return {
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      cron_hash: parsed.cron_hash,
      evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
      operation_count: 1,
      scheduled_time_hash: parsed.scheduled_time_hash,
      status: "passed",
      surface,
      value_hash: parsed.value_hash
    };
  } catch (error) {
    return failedCloudflareCronResult({
      cron: CLOUDFLARE_MAINTENANCE_CRON,
      detail: error instanceof Error ? error.message : String(error),
      evidenceKey,
      failureCode: "cron_natural_evidence_read_failed",
      scheduledTime: 0,
      surface
    });
  }
}

async function withHyperdrivePostgresClient<T>(
  env: WorkerBindings,
  callback: (client: Client) => Promise<T>
): Promise<T | undefined> {
  const connectionString = getRuntimeHyperdriveConnectionString(env);

  if (connectionString === undefined) {
    return undefined;
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    return await callback(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

function getRuntimeHyperdriveConnectionString(env: WorkerBindings): string | undefined {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return undefined;
  }

  const connectionString = hyperdrive.connectionString?.trim();
  return connectionString && connectionString.length > 0 ? connectionString : undefined;
}

async function enterPlatformRlsReadContext(
  client: Client,
  accountId: string
): Promise<PlatformRlsReadContext> {
  let operationCount = 0;

  await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
  operationCount += 1;
  await client.query(`SET LOCAL ROLE ${quoteSqlIdentifier(PLATFORM_RLS_RUNTIME_ROLE)}`);
  operationCount += 1;

  const runtimeRoleInfo = await client.query<{
    runtime_role_bypassrls: boolean | null;
    runtime_role_superuser: boolean | null;
    runtime_user_name: string;
  }>(`
    SELECT
      current_user AS runtime_user_name,
      role.rolbypassrls AS runtime_role_bypassrls,
      role.rolsuper AS runtime_role_superuser
    FROM pg_roles role
    WHERE role.rolname = current_user
    LIMIT 1
  `);
  operationCount += 1;

  const runtimeUserName = runtimeRoleInfo.rows[0]?.runtime_user_name ?? "";

  return {
    client,
    operationCount,
    runtimeRoleActive: runtimeUserName === PLATFORM_RLS_RUNTIME_ROLE,
    runtimeRoleBypassRls: Boolean(runtimeRoleInfo.rows[0]?.runtime_role_bypassrls),
    runtimeRoleSuperuser: Boolean(runtimeRoleInfo.rows[0]?.runtime_role_superuser),
    runtimeUserName
  };
}

async function withPlatformRlsReadTransaction<T>(
  env: WorkerBindings,
  accountId: string,
  callback: (context: PlatformRlsReadContext) => Promise<T>
): Promise<PlatformRlsReadTransactionResult<T> | undefined> {
  return withHyperdrivePostgresClient(env, async (client) => {
    let transactionStarted = false;
    let committed = false;

    try {
      await client.query("BEGIN");
      transactionStarted = true;
      const context = await enterPlatformRlsReadContext(client, accountId);
      const result = await callback(context);
      await client.query("RESET ROLE");
      await client.query("COMMIT");
      committed = true;

      return { context, result };
    } catch (error) {
      if (transactionStarted && !committed) {
        await client.query("ROLLBACK").catch(() => undefined);
      }

      throw error;
    }
  });
}

async function runCloudflareHyperdriveSmoke(
  env: WorkerBindings
): Promise<CloudflareHyperdriveSmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;
  const query = `
    SELECT
      1 AS hyperdrive_smoke_result,
      current_database() AS current_database_name,
      current_user AS current_user_name,
      has_database_privilege(current_user, current_database(), 'CREATE') AS database_create_privilege
  `;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingCloudflareHyperdriveResult("missing_hyperdrive_binding");
  }

  const client = new Client({
    connectionString: hyperdrive.connectionString
  });

  try {
    await client.connect();
    const result = await client.query<{
      current_database_name: string;
      current_user_name: string;
      database_create_privilege: boolean;
      hyperdrive_smoke_result: number | string;
    }>(query);
    const row = result.rows[0];
    const selectedValue = row?.hyperdrive_smoke_result;

    if (Number(selectedValue) !== 1) {
      return failedCloudflareHyperdriveResult({
        detail: JSON.stringify({
          row_count: result.rowCount,
          selected_value_type: typeof selectedValue
        }),
        failureCode: "hyperdrive_select_1_mismatch",
        query
      });
    }

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      current_database_hash: await hashRuntimeSmokeString(row?.current_database_name ?? ""),
      current_user_hash: await hashRuntimeSmokeString(row?.current_user_name ?? ""),
      database_create_privilege: Boolean(row?.database_create_privilege),
      operation_count: 2,
      query_hash: await hashRuntimeSmokeString(query),
      row_count: result.rowCount ?? result.rows.length,
      selected_value_hash: await hashRuntimeSmokeString(String(selectedValue)),
      status: "passed",
      surface: "hyperdrive_select_1_smoke"
    };
  } catch (error) {
    return failedCloudflareHyperdriveResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "hyperdrive_select_1_failed",
      query
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runPlatformUmbrellaSchemaInventory(
  env: WorkerBindings
): Promise<CloudflareHyperdriveSchemaInventoryResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;
  const connectionInfoQuery = `
    SELECT
      current_database() AS current_database_name,
      current_user AS current_user_name,
      has_database_privilege(current_user, current_database(), 'CREATE') AS database_create_privilege
  `;
  const schemaQuery = `
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name = ANY($1::text[])
    ORDER BY schema_name
  `;
  const tableQuery = `
    SELECT table_schema || '.' || table_name AS table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema || '.' || table_name = ANY($1::text[])
    ORDER BY table_schema, table_name
  `;
  const indexQuery = `
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = ANY($1::text[])
      AND indexname = ANY($2::text[])
    ORDER BY indexname
  `;
  const rlsQuery = `
    SELECT n.nspname || '.' || c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname || '.' || c.relname = ANY($1::text[])
      AND c.relrowsecurity
      AND c.relforcerowsecurity
    ORDER BY n.nspname, c.relname
  `;
  const productQuery = `
    SELECT product_id, status
    FROM platform.product
    WHERE product_code = 'aiphabee'
    LIMIT 1
  `;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingCloudflareHyperdriveSchemaInventoryResult("missing_hyperdrive_binding");
  }

  const client = new Client({
    connectionString: hyperdrive.connectionString
  });

  try {
    await client.connect();
    const connectionInfo = await client.query<{
      current_database_name: string;
      current_user_name: string;
      database_create_privilege: boolean;
    }>(connectionInfoQuery);
    const schemaResult = await client.query<{ schema_name: string }>(schemaQuery, [
      [...PLATFORM_UMBRELLA_EXPECTED_SCHEMAS]
    ]);
    const tableResult = await client.query<{ table_name: string }>(tableQuery, [
      [...PLATFORM_UMBRELLA_EXPECTED_TABLES]
    ]);
    const indexResult = await client.query<{ indexname: string }>(indexQuery, [
      [...PLATFORM_UMBRELLA_EXPECTED_SCHEMAS],
      [...PLATFORM_UMBRELLA_EXPECTED_INDEXES]
    ]);
    const rlsResult = await client.query<{ table_name: string }>(rlsQuery, [
      [...PLATFORM_UMBRELLA_EXPECTED_RLS_TABLES]
    ]);

    const observedSchemas = new Set(schemaResult.rows.map((row) => row.schema_name));
    const observedTables = new Set(tableResult.rows.map((row) => row.table_name));
    const observedIndexes = new Set(indexResult.rows.map((row) => row.indexname));
    const observedRlsTables = new Set(rlsResult.rows.map((row) => row.table_name));
    const missingSchemas = missingExpectedRuntimeNames(
      PLATFORM_UMBRELLA_EXPECTED_SCHEMAS,
      observedSchemas
    );
    const missingTables = missingExpectedRuntimeNames(
      PLATFORM_UMBRELLA_EXPECTED_TABLES,
      observedTables
    );
    const missingIndexes = missingExpectedRuntimeNames(
      PLATFORM_UMBRELLA_EXPECTED_INDEXES,
      observedIndexes
    );
    const missingRlsTables = missingExpectedRuntimeNames(
      PLATFORM_UMBRELLA_EXPECTED_RLS_TABLES,
      observedRlsTables
    );
    let operationCount = 5;
    let productStatus: string | undefined;

    if (observedTables.has("platform.product")) {
      const productResult = await client.query<{ product_id: string; status: string }>(productQuery);
      operationCount += 1;
      const productRow = productResult.rows.find((row) => row.product_id === "aiphabee");
      productStatus = productRow?.status;
    }

    const productPresent = typeof productStatus === "string";
    const failureCode =
      missingSchemas.length > 0 ||
      missingTables.length > 0 ||
      missingIndexes.length > 0 ||
      missingRlsTables.length > 0
        ? "platform_umbrella_schema_inventory_incomplete"
        : productPresent
          ? undefined
          : "platform_product_aiphabee_missing";
    const connectionRow = connectionInfo.rows[0];

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      current_database_hash: await hashRuntimeSmokeString(
        connectionRow?.current_database_name ?? ""
      ),
      current_user_hash: await hashRuntimeSmokeString(connectionRow?.current_user_name ?? ""),
      database_create_privilege: Boolean(connectionRow?.database_create_privilege),
      expected_index_count: PLATFORM_UMBRELLA_EXPECTED_INDEXES.length,
      expected_rls_table_count: PLATFORM_UMBRELLA_EXPECTED_RLS_TABLES.length,
      expected_schema_count: PLATFORM_UMBRELLA_EXPECTED_SCHEMAS.length,
      expected_table_count: PLATFORM_UMBRELLA_EXPECTED_TABLES.length,
      failure_code: failureCode,
      missing_indexes: missingIndexes,
      missing_rls_tables: missingRlsTables,
      missing_schemas: missingSchemas,
      missing_tables: missingTables,
      observed_index_count: observedIndexes.size,
      observed_rls_table_count: observedRlsTables.size,
      observed_schema_count: observedSchemas.size,
      observed_table_count: observedTables.size,
      operation_count: operationCount,
      platform_product_aiphabee_present: productPresent,
      platform_product_aiphabee_status_hash:
        typeof productStatus === "string" ? await hashRuntimeSmokeString(productStatus) : undefined,
      query_hash: await hashRuntimeSmokeString(PLATFORM_UMBRELLA_SCHEMA_INVENTORY_QUERY_LABEL),
      status: failureCode === undefined ? "passed" : "failed",
      surface: "platform_umbrella_schema_inventory"
    };
  } catch (error) {
    return failedCloudflareHyperdriveSchemaInventoryResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "platform_umbrella_schema_inventory_failed",
      queryLabel: PLATFORM_UMBRELLA_SCHEMA_INVENTORY_QUERY_LABEL
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runPlatformUmbrellaRlsFixtureSmoke(
  env: WorkerBindings
): Promise<PlatformUmbrellaRlsFixtureSmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingPlatformUmbrellaRlsFixtureSmokeResult("missing_hyperdrive_binding");
  }

  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  const suffix = crypto.randomUUID().replace(/-/gu, "").slice(0, 12);
  const accountId = `${PLATFORM_RLS_FIXTURE_ID_PREFIX}account:${suffix}`;
  const wrongAccountId = `${PLATFORM_RLS_FIXTURE_ID_PREFIX}account:wrong:${suffix}`;
  const workspaceId = `${PLATFORM_RLS_FIXTURE_ID_PREFIX}workspace:${suffix}`;
  const policyVersion = `${PLATFORM_RLS_FIXTURE_ID_PREFIX}policy:${suffix}`;
  const entitlementKey = "market_data:ipo:read";
  const policyStatements = [
    `CREATE POLICY ${quoteSqlIdentifier(`ab_rls_acc_i_${suffix}`)}
      ON platform.account
      FOR INSERT
      WITH CHECK (account_id LIKE 'aiphabee-rls-smoke:account:%')`,
    `CREATE POLICY ${quoteSqlIdentifier(`ab_rls_ws_i_${suffix}`)}
      ON platform.workspace
      FOR INSERT
      WITH CHECK (
        workspace_id LIKE 'aiphabee-rls-smoke:workspace:%'
        AND owner_account_id LIKE 'aiphabee-rls-smoke:account:%'
      )`,
    `CREATE POLICY ${quoteSqlIdentifier(`ab_rls_wm_i_${suffix}`)}
      ON platform.workspace_membership
      FOR INSERT
      WITH CHECK (
        membership_id LIKE 'aiphabee-rls-smoke:membership:%'
        AND workspace_id LIKE 'aiphabee-rls-smoke:workspace:%'
        AND account_id LIKE 'aiphabee-rls-smoke:account:%'
      )`,
    `CREATE POLICY ${quoteSqlIdentifier(`ab_rls_wpa_i_${suffix}`)}
      ON platform.workspace_product_access
      FOR INSERT
      WITH CHECK (
        workspace_product_access_id LIKE 'aiphabee-rls-smoke:workspace-product-access:%'
        AND workspace_id LIKE 'aiphabee-rls-smoke:workspace:%'
        AND product_id = 'aiphabee'
        AND policy_version LIKE 'aiphabee-rls-smoke:policy:%'
      )`,
    `CREATE POLICY ${quoteSqlIdentifier(`ab_rls_ep_i_${suffix}`)}
      ON platform.entitlement_policy
      FOR INSERT
      WITH CHECK (
        entitlement_policy_id LIKE 'aiphabee-rls-smoke:entitlement-policy:%'
        AND product_id = 'aiphabee'
        AND policy_version LIKE 'aiphabee-rls-smoke:policy:%'
        AND default_rights_status = 'default_deny'
      )`,
    `CREATE POLICY ${quoteSqlIdentifier(`ab_rls_we_i_${suffix}`)}
      ON platform.workspace_entitlement
      FOR INSERT
      WITH CHECK (
        workspace_entitlement_id LIKE 'aiphabee-rls-smoke:workspace-entitlement:%'
        AND workspace_id LIKE 'aiphabee-rls-smoke:workspace:%'
        AND product_id = 'aiphabee'
      )`
  ];
  let cleanupRolledBack = false;
  let insertedRows = 0;
  let operationCount = 0;
  let transactionStarted = false;
  let failureStage = "connect";

  try {
    failureStage = "connect";
    await client.connect();
    failureStage = "begin";
    await client.query("BEGIN");
    transactionStarted = true;

    failureStage = "origin_role_info";
    const roleInfo = await client.query<{
      current_role_bypassrls: boolean | null;
      current_role_superuser: boolean | null;
      current_user_name: string;
      workspace_table_owner_is_current_user: boolean;
    }>(`
      SELECT
        current_user AS current_user_name,
        role.rolbypassrls AS current_role_bypassrls,
        role.rolsuper AS current_role_superuser,
        EXISTS (
          SELECT 1
          FROM pg_class cls
          JOIN pg_namespace ns ON ns.oid = cls.relnamespace
          JOIN pg_roles owner_role ON owner_role.oid = cls.relowner
          WHERE ns.nspname = 'platform'
            AND cls.relname = 'workspace'
            AND owner_role.rolname = current_user
        ) AS workspace_table_owner_is_current_user
      FROM pg_roles role
      WHERE role.rolname = current_user
      LIMIT 1
    `);
    operationCount += 1;

    failureStage = "create_insert_policies";
    for (const statement of policyStatements) {
      await client.query(statement);
      operationCount += 1;
    }

    failureStage = "insert_account";
    insertedRows +=
      (
        await client.query(
          `
            INSERT INTO platform.account (
              account_id,
              auth_subject,
              email_hash,
              display_name,
              status
            )
            VALUES ($1, $2, $3, 'AiphaBee RLS fixture', 'active')
          `,
          [accountId, accountId, `sha256:${suffix}`]
        )
      ).rowCount ?? 0;
    operationCount += 1;

    failureStage = "insert_workspace";
    insertedRows +=
      (
        await client.query(
          `
            INSERT INTO platform.workspace (
              workspace_id,
              owner_account_id,
              display_name,
              billing_region,
              data_region,
              status
            )
            VALUES ($1, $2, 'AiphaBee RLS fixture workspace', 'HK', 'HK', 'active')
          `,
          [workspaceId, accountId]
        )
      ).rowCount ?? 0;
    operationCount += 1;

    failureStage = "insert_workspace_membership";
    insertedRows +=
      (
        await client.query(
          `
            INSERT INTO platform.workspace_membership (
              membership_id,
              workspace_id,
              account_id,
              role,
              status,
              valid_from
            )
            VALUES ($1, $2, $3, 'owner', 'active', now() - interval '1 minute')
          `,
          [`${PLATFORM_RLS_FIXTURE_ID_PREFIX}membership:${suffix}`, workspaceId, accountId]
        )
      ).rowCount ?? 0;
    operationCount += 1;

    failureStage = "insert_workspace_product_access";
    insertedRows +=
      (
        await client.query(
          `
            INSERT INTO platform.workspace_product_access (
              workspace_product_access_id,
              workspace_id,
              product_id,
              access_status,
              policy_version,
              valid_from
            )
            VALUES ($1, $2, 'aiphabee', 'active', $3, now() - interval '1 minute')
          `,
          [
            `${PLATFORM_RLS_FIXTURE_ID_PREFIX}workspace-product-access:${suffix}`,
            workspaceId,
            policyVersion
          ]
        )
      ).rowCount ?? 0;
    operationCount += 1;

    failureStage = "insert_entitlement_policy";
    insertedRows +=
      (
        await client.query(
          `
            INSERT INTO platform.entitlement_policy (
              entitlement_policy_id,
              product_id,
              policy_version,
              status,
              default_rights_status,
              source_ref,
              effective_from
            )
            VALUES ($1, 'aiphabee', $2, 'active', 'default_deny', $3, now() - interval '1 minute')
          `,
          [
            `${PLATFORM_RLS_FIXTURE_ID_PREFIX}entitlement-policy:${suffix}`,
            policyVersion,
            `${PLATFORM_RLS_FIXTURE_ID_PREFIX}source:${suffix}`
          ]
        )
      ).rowCount ?? 0;
    operationCount += 1;

    failureStage = "insert_workspace_entitlement";
    insertedRows +=
      (
        await client.query(
          `
            INSERT INTO platform.workspace_entitlement (
              workspace_entitlement_id,
              workspace_id,
              product_id,
              entitlement_key,
              status,
              valid_from
            )
            VALUES ($1, $2, 'aiphabee', $3, 'approved', now() - interval '1 minute')
          `,
          [
            `${PLATFORM_RLS_FIXTURE_ID_PREFIX}workspace-entitlement:${suffix}`,
            workspaceId,
            entitlementKey
          ]
        )
      ).rowCount ?? 0;
    operationCount += 1;

    failureStage = "enter_platform_rls_read_context";
    const rlsContext = await enterPlatformRlsReadContext(client, "");
    operationCount += rlsContext.operationCount;
    failureStage = "select_workspace_without_claim";
    const workspaceWithoutClaimRows = await countPlatformRows(
      client,
      "SELECT count(*) AS row_count FROM platform.workspace WHERE workspace_id = $1",
      [workspaceId]
    );
    operationCount += 1;

    failureStage = "select_workspace_with_wrong_claim";
    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [wrongAccountId]);
    operationCount += 1;
    const workspaceWithWrongClaimRows = await countPlatformRows(
      client,
      "SELECT count(*) AS row_count FROM platform.workspace WHERE workspace_id = $1",
      [workspaceId]
    );
    operationCount += 1;

    failureStage = "select_platform_rows_with_claim";
    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    operationCount += 1;
    const accountWithClaimRows = await countPlatformRows(
      client,
      "SELECT count(*) AS row_count FROM platform.account WHERE account_id = $1",
      [accountId]
    );
    const workspaceWithClaimRows = await countPlatformRows(
      client,
      "SELECT count(*) AS row_count FROM platform.workspace WHERE workspace_id = $1",
      [workspaceId]
    );
    const workspaceMembershipWithClaimRows = await countPlatformRows(
      client,
      `
        SELECT count(*) AS row_count
        FROM platform.workspace_membership
        WHERE workspace_id = $1
          AND account_id = $2
      `,
      [workspaceId, accountId]
    );
    const workspaceProductAccessWithClaimRows = await countPlatformRows(
      client,
      `
        SELECT count(*) AS row_count
        FROM platform.workspace_product_access
        WHERE workspace_id = $1
          AND product_id = 'aiphabee'
      `,
      [workspaceId]
    );
    const entitlementPolicyWithClaimRows = await countPlatformRows(
      client,
      `
        SELECT count(*) AS row_count
        FROM platform.entitlement_policy
        WHERE product_id = 'aiphabee'
          AND policy_version = $1
      `,
      [policyVersion]
    );
    const workspaceEntitlementWithClaimRows = await countPlatformRows(
      client,
      `
        SELECT count(*) AS row_count
        FROM platform.workspace_entitlement
        WHERE workspace_id = $1
          AND product_id = 'aiphabee'
          AND entitlement_key = $2
      `,
      [workspaceId, entitlementKey]
    );
    operationCount += 6;

    failureStage = "reset_role";
    await client.query("RESET ROLE");
    operationCount += 1;
    failureStage = "rollback";
    await client.query("ROLLBACK");
    cleanupRolledBack = true;

    const failureCode =
      rlsContext.runtimeRoleActive &&
      !rlsContext.runtimeRoleBypassRls &&
      !rlsContext.runtimeRoleSuperuser &&
      workspaceWithoutClaimRows === 0 &&
      workspaceWithWrongClaimRows === 0 &&
      accountWithClaimRows === 1 &&
      workspaceWithClaimRows === 1 &&
      workspaceMembershipWithClaimRows === 1 &&
      workspaceProductAccessWithClaimRows === 1 &&
      entitlementPolicyWithClaimRows === 1 &&
      workspaceEntitlementWithClaimRows === 1
        ? undefined
        : "platform_umbrella_rls_fixture_mismatch";

    return {
      account_id_hash: await hashRuntimeSmokeString(accountId),
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_rolled_back: cleanupRolledBack,
      current_role_bypassrls: Boolean(roleInfo.rows[0]?.current_role_bypassrls),
      current_role_superuser: Boolean(roleInfo.rows[0]?.current_role_superuser),
      current_user_hash: await hashRuntimeSmokeString(roleInfo.rows[0]?.current_user_name ?? ""),
      entitlement_policy_with_claim_rows: entitlementPolicyWithClaimRows,
      failure_code: failureCode,
      fixture_policy_count: policyStatements.length,
      inserted_rows: insertedRows,
      operation_count: operationCount,
      product_id_hash: await hashRuntimeSmokeString("aiphabee"),
      query_hash: await hashRuntimeSmokeString(PLATFORM_RLS_FIXTURE_QUERY_LABEL),
      runtime_role_active_for_selects: rlsContext.runtimeRoleActive,
      runtime_role_bypassrls: rlsContext.runtimeRoleBypassRls,
      runtime_role_superuser: rlsContext.runtimeRoleSuperuser,
      runtime_user_hash: await hashRuntimeSmokeString(rlsContext.runtimeUserName),
      status: failureCode === undefined ? "passed" : "failed",
      surface: "platform_umbrella_rls_fixture_smoke",
      workspace_entitlement_with_claim_rows: workspaceEntitlementWithClaimRows,
      workspace_id_hash: await hashRuntimeSmokeString(workspaceId),
      workspace_membership_with_claim_rows: workspaceMembershipWithClaimRows,
      workspace_product_access_with_claim_rows: workspaceProductAccessWithClaimRows,
      workspace_table_owner_is_current_user: Boolean(
        roleInfo.rows[0]?.workspace_table_owner_is_current_user
      ),
      workspace_with_claim_rows: workspaceWithClaimRows,
      workspace_without_claim_rows: workspaceWithoutClaimRows,
      workspace_with_wrong_claim_rows: workspaceWithWrongClaimRows
    };
  } catch (error) {
    if (transactionStarted && !cleanupRolledBack) {
      await client
        .query("ROLLBACK")
        .then(() => {
          cleanupRolledBack = true;
        })
        .catch(() => undefined);
    }

    return failedPlatformUmbrellaRlsFixtureSmokeResult({
      cleanupRolledBack,
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "platform_umbrella_rls_fixture_failed",
      failureSqlstate:
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : undefined,
      failureStage,
      queryLabel: PLATFORM_RLS_FIXTURE_QUERY_LABEL
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runPlatformRuntimeRoleSmoke(
  env: WorkerBindings
): Promise<PlatformRuntimeRoleSmokeResult> {
  const query = `
    SELECT
      $1::text AS smoke_nonce,
      current_database() AS current_database_name,
      current_user AS current_user_name,
      role.rolbypassrls AS current_role_bypassrls,
      role.rolsuper AS current_role_superuser,
      has_database_privilege(current_user, current_database(), 'CREATE') AS database_create_privilege,
      has_schema_privilege(current_user, 'platform', 'USAGE') AS platform_schema_usage_privilege,
      has_schema_privilege(current_user, 'platform', 'CREATE') AS platform_schema_create_privilege,
      has_table_privilege(current_user, 'platform.account', 'SELECT') AS platform_account_select_privilege,
      has_table_privilege(current_user, 'platform.workspace', 'SELECT') AS platform_workspace_select_privilege,
      EXISTS (
        SELECT 1
        FROM pg_class cls
        JOIN pg_namespace ns ON ns.oid = cls.relnamespace
        WHERE ns.nspname = 'platform'
          AND cls.relname = 'workspace'
          AND cls.relrowsecurity
          AND cls.relforcerowsecurity
      ) AS platform_workspace_rls_forced,
      EXISTS (
        SELECT 1
        FROM pg_class cls
        JOIN pg_namespace ns ON ns.oid = cls.relnamespace
        JOIN pg_roles owner_role ON owner_role.oid = cls.relowner
        WHERE ns.nspname = 'platform'
          AND cls.relname = 'workspace'
          AND owner_role.rolname = current_user
      ) AS workspace_table_owner_is_current_user
    FROM pg_roles role
    WHERE role.rolname = current_user
    LIMIT 1
  `;

  try {
    const result = await withHyperdrivePostgresClient(env, async (client) =>
      client.query<{
        current_database_name: string;
        current_role_bypassrls: boolean | null;
        current_role_superuser: boolean | null;
        current_user_name: string;
        database_create_privilege: boolean | null;
        platform_account_select_privilege: boolean | null;
        platform_schema_create_privilege: boolean | null;
        platform_schema_usage_privilege: boolean | null;
        platform_workspace_rls_forced: boolean | null;
        platform_workspace_select_privilege: boolean | null;
        workspace_table_owner_is_current_user: boolean | null;
      }>(query, [crypto.randomUUID()])
    );

    if (result === undefined) {
      return missingPlatformRuntimeRoleSmokeResult("missing_hyperdrive_binding");
    }

    const row = result.rows[0];
    const currentRoleBypassRls = Boolean(row?.current_role_bypassrls);
    const currentRoleSuperuser = Boolean(row?.current_role_superuser);
    const databaseCreatePrivilege = Boolean(row?.database_create_privilege);
    const platformSchemaUsagePrivilege = Boolean(row?.platform_schema_usage_privilege);
    const platformSchemaCreatePrivilege = Boolean(row?.platform_schema_create_privilege);
    const platformAccountSelectPrivilege = Boolean(row?.platform_account_select_privilege);
    const platformWorkspaceSelectPrivilege = Boolean(row?.platform_workspace_select_privilege);
    const platformWorkspaceRlsForced = Boolean(row?.platform_workspace_rls_forced);
    const workspaceTableOwnerIsCurrentUser = Boolean(row?.workspace_table_owner_is_current_user);
    const runtimeRoleReady =
      !currentRoleBypassRls &&
      !currentRoleSuperuser &&
      !databaseCreatePrivilege &&
      !platformSchemaCreatePrivilege &&
      !workspaceTableOwnerIsCurrentUser &&
      platformSchemaUsagePrivilege &&
      platformAccountSelectPrivilege &&
      platformWorkspaceSelectPrivilege &&
      platformWorkspaceRlsForced;

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      current_database_hash: await hashRuntimeSmokeString(row?.current_database_name ?? ""),
      current_role_bypassrls: currentRoleBypassRls,
      current_role_superuser: currentRoleSuperuser,
      current_user_hash: await hashRuntimeSmokeString(row?.current_user_name ?? ""),
      database_create_privilege: databaseCreatePrivilege,
      failure_code: runtimeRoleReady ? undefined : "platform_runtime_role_not_ready",
      operation_count: 2,
      platform_account_select_privilege: platformAccountSelectPrivilege,
      platform_schema_create_privilege: platformSchemaCreatePrivilege,
      platform_schema_usage_privilege: platformSchemaUsagePrivilege,
      platform_workspace_rls_forced: platformWorkspaceRlsForced,
      platform_workspace_select_privilege: platformWorkspaceSelectPrivilege,
      query_hash: await hashRuntimeSmokeString(PLATFORM_RUNTIME_ROLE_QUERY_LABEL),
      runtime_role_ready: runtimeRoleReady,
      status: runtimeRoleReady ? "passed" : "failed",
      surface: "platform_runtime_role_smoke",
      workspace_table_owner_is_current_user: workspaceTableOwnerIsCurrentUser
    };
  } catch (error) {
    return failedPlatformRuntimeRoleSmokeResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "platform_runtime_role_smoke_failed",
      queryLabel: PLATFORM_RUNTIME_ROLE_QUERY_LABEL
    });
  }
}

async function runEvidenceLiveDbWriteSmoke(
  env: WorkerBindings,
  requestId: string
): Promise<EvidenceLiveDbWriteSmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingEvidenceLiveDbWriteSmokeResult("missing_hyperdrive_binding");
  }

  const plan = createEvidenceRecordPlan({
    dataVersion: "evidence-live-db-smoke-source-v0",
    inputSchemaId: "tool.get_quote_snapshot.input.v0",
    methodologyVersion: "2026-06-22.phase1.evidence-live-db-write-smoke.v0",
    outputSchemaId: "tool.get_quote_snapshot.output.v0",
    requestId,
    sourceRecords: [
      {
        dataVersion: "evidence-live-db-smoke-source-v0",
        methodologyVersion: "2026-06-22.phase1.evidence-live-db-write-smoke.v0",
        source: "evidence-live-db-smoke",
        sourceRecordId: `source:${requestId}`
      }
    ],
    toolName: "get_quote_snapshot",
    toolVersion: "get_quote_snapshot@smoke",
    userVisibleLabel: "Evidence live DB write smoke"
  });
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  const evidenceRecord = plan.evidenceRecord;
  const queryLabel = "evidence-live-db-write-smoke:v0:insert-select-delete";
  let transactionStarted = false;
  let committed = false;

  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const recordInsert = await client.query(
      `insert into aiphabee_core.evidence_record (
        evidence_record_id,
        request_id,
        tool_name,
        tool_version,
        input_schema_id,
        output_schema_id,
        data_version,
        methodology_version,
        as_of,
        rights_state,
        quality_state,
        citation_label,
        citation_visibility,
        live_write_state,
        source_record_count
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      on conflict (evidence_record_id) do update set
        request_id = excluded.request_id,
        tool_name = excluded.tool_name,
        tool_version = excluded.tool_version,
        input_schema_id = excluded.input_schema_id,
        output_schema_id = excluded.output_schema_id,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version,
        as_of = excluded.as_of,
        rights_state = excluded.rights_state,
        quality_state = excluded.quality_state,
        citation_label = excluded.citation_label,
        citation_visibility = excluded.citation_visibility,
        live_write_state = excluded.live_write_state,
        source_record_count = excluded.source_record_count,
        updated_at = now()`,
      [
        evidenceRecord.evidenceRecordId,
        evidenceRecord.requestId,
        evidenceRecord.toolName,
        evidenceRecord.toolVersion,
        evidenceRecord.inputSchemaId ?? null,
        evidenceRecord.outputSchemaId ?? null,
        evidenceRecord.dataVersion,
        evidenceRecord.methodologyVersion,
        plan.asOf,
        evidenceRecord.rightsState,
        "PASS",
        plan.citation.label,
        plan.citation.visibility,
        "planned_no_write",
        plan.sourceRefs.length
      ]
    );

    let sourceRefInsertRows = 0;

    for (const sourceRef of plan.sourceRefs) {
      const sourceRefInsert = await client.query(
        `insert into aiphabee_core.evidence_source_ref (
          evidence_source_ref_id,
          evidence_record_id,
          source,
          source_record_id,
          data_version,
          methodology_version,
          rights_state
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (evidence_record_id, source_record_id, data_version) do update set
          source = excluded.source,
          methodology_version = excluded.methodology_version,
          rights_state = excluded.rights_state`,
        [
          sourceRef.evidenceSourceRefId,
          sourceRef.evidenceRecordId,
          sourceRef.source,
          sourceRef.sourceRecordId,
          sourceRef.dataVersion,
          sourceRef.methodologyVersion,
          "default_deny"
        ]
      );
      sourceRefInsertRows += sourceRefInsert.rowCount ?? 0;
    }

    const recordSelect = await client.query<{
      evidence_record_id: string;
      live_write_state: string;
      source_record_count: number | string;
    }>(
      `select evidence_record_id, live_write_state, source_record_count
      from aiphabee_core.evidence_record
      where evidence_record_id = $1`,
      [evidenceRecord.evidenceRecordId]
    );
    const sourceRefCountSelect = await client.query<{ source_ref_count: number | string }>(
      `select count(*)::int as source_ref_count
      from aiphabee_core.evidence_source_ref
      where evidence_record_id = $1`,
      [evidenceRecord.evidenceRecordId]
    );
    const selectedRecord = recordSelect.rows[0];
    const selectedSourceRefCount = Number(
      sourceRefCountSelect.rows[0]?.source_ref_count ?? 0
    );

    if (
      recordSelect.rows.length !== 1 ||
      selectedRecord?.evidence_record_id !== evidenceRecord.evidenceRecordId ||
      selectedRecord.live_write_state !== "planned_no_write" ||
      Number(selectedRecord.source_record_count) !== plan.sourceRefs.length ||
      selectedSourceRefCount !== plan.sourceRefs.length
    ) {
      throw new Error("evidence live DB write smoke readback mismatch");
    }

    const sourceRefDelete = await client.query(
      `delete from aiphabee_core.evidence_source_ref
      where evidence_record_id = $1`,
      [evidenceRecord.evidenceRecordId]
    );
    const recordDelete = await client.query(
      `delete from aiphabee_core.evidence_record
      where evidence_record_id = $1`,
      [evidenceRecord.evidenceRecordId]
    );

    await client.query("COMMIT");
    committed = true;

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      deleted_rows: (sourceRefDelete.rowCount ?? 0) + (recordDelete.rowCount ?? 0),
      evidence_record_id_hash: await hashRuntimeSmokeString(evidenceRecord.evidenceRecordId),
      inserted_rows: (recordInsert.rowCount ?? 0) + sourceRefInsertRows,
      live_write_state: "planned_no_write",
      operation_count: 8 + plan.sourceRefs.length,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      selected_rows: recordSelect.rows.length,
      source_ref_count: selectedSourceRefCount,
      source_ref_hashes: await Promise.all(
        plan.sourceRefs.map((sourceRef) =>
          hashRuntimeSmokeString(sourceRef.evidenceSourceRefId)
        )
      ),
      status: "passed",
      surface: "evidence_record_source_ref_insert_select_delete",
      tables: ["aiphabee_core.evidence_record", "aiphabee_core.evidence_source_ref"]
    };
  } catch (error) {
    if (transactionStarted && !committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    return failedEvidenceLiveDbWriteSmokeResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "evidence_live_db_write_failed",
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runHkIpoPublicHeldDbApplySmoke(
  env: WorkerBindings,
  requestId: string
): Promise<HkIpoPublicHeldDbApplySmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingHkIpoPublicHeldDbApplySmokeResult("missing_hyperdrive_binding");
  }

  const safeRequestId = requestId.replace(/[^A-Za-z0-9_]/gu, "_").slice(0, 80);
  const suffix = crypto.randomUUID().replace(/-/gu, "").slice(0, 12);
  const smokeId = `hk_ipo_public_held_db_apply_smoke_${safeRequestId}_${suffix}`;
  const sourceBatchId = `rsb_${smokeId}`;
  const dataVersion = `dv_${smokeId}`;
  const rawSnapshotId = `raw_${smokeId}`;
  const sourceRunId = `sr_${smokeId}`;
  const sourceRecordId = `source:${smokeId}`;
  const observationId = `obs_${smokeId}`;
  const reconciliationRowId = `recon_${smokeId}`;
  const supplementCandidateId = `supp_${smokeId}`;
  const payloadEnvelope = {
    object_key_hash: await hashRuntimeSmokeString(`object:${smokeId}`),
    payload_body_included: false,
    smoke: true,
    storage_binding: "AIPHABEE_ARTIFACTS",
    storage_target: "external_raw_snapshot_store"
  };
  const sourceIds = JSON.stringify(["aastocks_ipo_plus"]);
  const sourceObservationIds = JSON.stringify([observationId]);
  const rawSnapshotRequestIds = JSON.stringify([`request:${smokeId}`]);
  const hkexEvidenceIds = JSON.stringify(["https://www1.hkexnews.hk"]);
  const methodologyVersion = HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_VERSION;
  const queryLabel = "hk-ipo-public-held-db-apply-smoke:v0:held-row-insert-select-delete";
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  let failureStage = "connect";
  let transactionStarted = false;
  let committed = false;

  try {
    failureStage = "connect";
    await client.connect();
    failureStage = "begin_transaction";
    await client.query("BEGIN");
    transactionStarted = true;

    failureStage = "insert_raw_source_batch";
    const rawSourceBatchInsert = await client.query(
      `insert into core.raw_source_batch (
        source_batch_id,
        source_name,
        source_dataset,
        received_at,
        source_rights_status,
        checksum_sha256,
        row_count
      )
      values ($1, 'hk_ipo_public_sources', 'hk_ipo_public_observation', now(), 'default_deny', $2, 1)
      on conflict (source_batch_id) do update set
        source_name = excluded.source_name,
        source_dataset = excluded.source_dataset,
        received_at = excluded.received_at,
        source_rights_status = excluded.source_rights_status,
        checksum_sha256 = excluded.checksum_sha256,
        row_count = excluded.row_count`,
      [sourceBatchId, await hashRuntimeSmokeString(sourceRecordId)]
    );
    failureStage = "insert_data_version_batch";
    const dataVersionInsert = await client.query(
      `insert into core.data_version_batch (
        data_version,
        source_batch_id,
        methodology_version,
        rights_policy_version,
        release_state
      )
      values ($1, $2, $3, 'default_deny', 'held')
      on conflict (data_version) do update set
        source_batch_id = excluded.source_batch_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        release_state = excluded.release_state`,
      [dataVersion, sourceBatchId, methodologyVersion]
    );
    failureStage = "insert_raw_snapshot";
    const rawSnapshotInsert = await client.query(
      `insert into core.raw_snapshot (
        raw_snapshot_id,
        source_batch_id,
        source_record_id,
        record_kind,
        payload,
        payload_hash_sha256,
        received_at,
        quality_state,
        data_version,
        methodology_version
      )
      values ($1, $2, $3, 'hk_ipo_public_source_record', $4::jsonb, $5, now(), 'HOLD', $6, $7)
      on conflict (raw_snapshot_id) do update set
        source_batch_id = excluded.source_batch_id,
        source_record_id = excluded.source_record_id,
        record_kind = excluded.record_kind,
        payload = excluded.payload,
        payload_hash_sha256 = excluded.payload_hash_sha256,
        received_at = excluded.received_at,
        quality_state = excluded.quality_state,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version`,
      [
        rawSnapshotId,
        sourceBatchId,
        sourceRecordId,
        JSON.stringify(payloadEnvelope),
        await hashRuntimeSmokeString(JSON.stringify(payloadEnvelope)),
        dataVersion,
        methodologyVersion
      ]
    );
    failureStage = "insert_hk_ipo_public_source_run";
    const sourceRunInsert = await client.query(
      `insert into core.hk_ipo_public_source_run (
        source_run_id,
        source_batch_id,
        data_version,
        adapter_version,
        packet_version,
        source_mode,
        status,
        source_ids,
        security_count,
        observation_count,
        reconciliation_row_count,
        supplement_candidate_count,
        live_network_writes,
        writes_serving_tables
      )
      values ($1, $2, $3, 'hk-ipo-public-held-db-apply-smoke', $4, 'held', 'held', $5::jsonb, 1, 1, 1, 1, false, false)
      on conflict (source_run_id) do update set
        source_batch_id = excluded.source_batch_id,
        data_version = excluded.data_version,
        adapter_version = excluded.adapter_version,
        packet_version = excluded.packet_version,
        source_mode = excluded.source_mode,
        status = excluded.status,
        source_ids = excluded.source_ids,
        security_count = excluded.security_count,
        observation_count = excluded.observation_count,
        reconciliation_row_count = excluded.reconciliation_row_count,
        supplement_candidate_count = excluded.supplement_candidate_count,
        live_network_writes = excluded.live_network_writes,
        writes_serving_tables = excluded.writes_serving_tables`,
      [sourceRunId, sourceBatchId, dataVersion, methodologyVersion, sourceIds]
    );
    failureStage = "insert_hk_ipo_public_observation";
    const observationInsert = await client.query(
      `insert into core.hk_ipo_public_observation (
        observation_id,
        source_run_id,
        source_id,
        provider,
        source_url,
        observed_at,
        source_record_id,
        security_code,
        field_name,
        field_value,
        field_value_type,
        raw_snapshot_id,
        raw_snapshot_required,
        reconciled_with_hkex,
        conflict_status,
        locator,
        locator_hash,
        data_version,
        quality_state
      )
      values ($1, $2, 'aastocks_ipo_plus', 'AASTOCKS', $3, now(), $4, '09999.HK', 'lot_size', $5::jsonb, 'number', $6, true, false, 'unreconciled', $7::jsonb, $8, $9, 'HOLD')
      on conflict (observation_id) do update set
        source_run_id = excluded.source_run_id,
        source_id = excluded.source_id,
        provider = excluded.provider,
        source_url = excluded.source_url,
        observed_at = excluded.observed_at,
        source_record_id = excluded.source_record_id,
        security_code = excluded.security_code,
        field_name = excluded.field_name,
        field_value = excluded.field_value,
        field_value_type = excluded.field_value_type,
        raw_snapshot_id = excluded.raw_snapshot_id,
        raw_snapshot_required = excluded.raw_snapshot_required,
        reconciled_with_hkex = excluded.reconciled_with_hkex,
        conflict_status = excluded.conflict_status,
        locator = excluded.locator,
        locator_hash = excluded.locator_hash,
        data_version = excluded.data_version,
        quality_state = excluded.quality_state`,
      [
        observationId,
        sourceRunId,
        "https://www.aastocks.com/en/stocks/market/ipo/mainpage.aspx",
        sourceRecordId,
        JSON.stringify(1000),
        rawSnapshotId,
        JSON.stringify({ row: 1, smoke: true }),
        await hashRuntimeSmokeString(`locator:${smokeId}`),
        dataVersion
      ]
    );
    failureStage = "insert_hk_ipo_public_reconciliation_row";
    const reconciliationInsert = await client.query(
      `insert into core.hk_ipo_public_reconciliation_row (
        reconciliation_row_id,
        source_run_id,
        security_code,
        fact_name,
        status,
        canonical_candidate,
        source_observation_ids,
        source_ids,
        raw_snapshot_request_ids,
        hkex_evidence_ids,
        confidence,
        reason,
        raw_snapshot_required,
        conflict_requires_manual_review,
        promotes_fact,
        data_version,
        quality_state
      )
      values ($1, $2, '09999.HK', 'lot_size', 'single_source', $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, 'low', 'synthetic held DB apply smoke', true, false, false, $8, 'HOLD')
      on conflict (reconciliation_row_id) do update set
        source_run_id = excluded.source_run_id,
        security_code = excluded.security_code,
        fact_name = excluded.fact_name,
        status = excluded.status,
        canonical_candidate = excluded.canonical_candidate,
        source_observation_ids = excluded.source_observation_ids,
        source_ids = excluded.source_ids,
        raw_snapshot_request_ids = excluded.raw_snapshot_request_ids,
        hkex_evidence_ids = excluded.hkex_evidence_ids,
        confidence = excluded.confidence,
        reason = excluded.reason,
        raw_snapshot_required = excluded.raw_snapshot_required,
        conflict_requires_manual_review = excluded.conflict_requires_manual_review,
        promotes_fact = excluded.promotes_fact,
        data_version = excluded.data_version,
        quality_state = excluded.quality_state`,
      [
        reconciliationRowId,
        sourceRunId,
        JSON.stringify({ field_name: "lot_size", value_hash: await hashRuntimeSmokeString("1000") }),
        sourceObservationIds,
        sourceIds,
        rawSnapshotRequestIds,
        hkexEvidenceIds,
        dataVersion
      ]
    );
    failureStage = "insert_hk_ipo_public_supplement_candidate";
    const supplementInsert = await client.query(
      `insert into core.hk_ipo_public_supplement_candidate (
        supplement_candidate_id,
        source_run_id,
        source_observation_id,
        security_code,
        source_id,
        source_record_id,
        field_name,
        field_value_type,
        status,
        raw_snapshot_required,
        promotes_fact,
        reason,
        data_version,
        quality_state
      )
      values ($1, $2, $3, '09999.HK', 'aastocks_ipo_plus', $4, 'lot_size', 'number', 'candidate', true, false, 'synthetic held DB apply smoke', $5, 'HOLD')
      on conflict (supplement_candidate_id) do update set
        source_run_id = excluded.source_run_id,
        source_observation_id = excluded.source_observation_id,
        security_code = excluded.security_code,
        source_id = excluded.source_id,
        source_record_id = excluded.source_record_id,
        field_name = excluded.field_name,
        field_value_type = excluded.field_value_type,
        status = excluded.status,
        raw_snapshot_required = excluded.raw_snapshot_required,
        promotes_fact = excluded.promotes_fact,
        reason = excluded.reason,
        data_version = excluded.data_version,
        quality_state = excluded.quality_state`,
      [supplementCandidateId, sourceRunId, observationId, sourceRecordId, dataVersion]
    );
    failureStage = "select_readback";
    const readback = await client.query<{
      data_version_batch_count: number | string;
      observation_count: number | string;
      raw_snapshot_count: number | string;
      raw_source_batch_count: number | string;
      reconciliation_row_count: number | string;
      source_run_count: number | string;
      supplement_candidate_count: number | string;
    }>(
      `select
        (select count(*)::int from core.raw_source_batch where source_batch_id = $1) as raw_source_batch_count,
        (select count(*)::int from core.data_version_batch where data_version = $2 and release_state = 'held') as data_version_batch_count,
        (select count(*)::int from core.raw_snapshot where raw_snapshot_id = $3 and record_kind = 'hk_ipo_public_source_record' and quality_state = 'HOLD') as raw_snapshot_count,
        (select count(*)::int from core.hk_ipo_public_source_run where source_run_id = $4 and status = 'held' and live_network_writes = false and writes_serving_tables = false) as source_run_count,
        (select count(*)::int from core.hk_ipo_public_observation where observation_id = $5 and raw_snapshot_required = true and reconciled_with_hkex = false and quality_state = 'HOLD') as observation_count,
        (select count(*)::int from core.hk_ipo_public_reconciliation_row where reconciliation_row_id = $6 and raw_snapshot_required = true and promotes_fact = false and quality_state = 'HOLD') as reconciliation_row_count,
        (select count(*)::int from core.hk_ipo_public_supplement_candidate where supplement_candidate_id = $7 and raw_snapshot_required = true and promotes_fact = false and quality_state = 'HOLD') as supplement_candidate_count`,
      [
        sourceBatchId,
        dataVersion,
        rawSnapshotId,
        sourceRunId,
        observationId,
        reconciliationRowId,
        supplementCandidateId
      ]
    );
    const readbackRow = readback.rows[0];
    const selectedRows =
      Number(readbackRow?.raw_source_batch_count ?? 0) +
      Number(readbackRow?.data_version_batch_count ?? 0) +
      Number(readbackRow?.raw_snapshot_count ?? 0) +
      Number(readbackRow?.source_run_count ?? 0) +
      Number(readbackRow?.observation_count ?? 0) +
      Number(readbackRow?.reconciliation_row_count ?? 0) +
      Number(readbackRow?.supplement_candidate_count ?? 0);

    if (selectedRows !== 7) {
      failureStage = "validate_readback";
      throw new Error("HK IPO public held DB apply smoke readback mismatch");
    }

    failureStage = "delete_hk_ipo_public_supplement_candidate";
    const supplementDelete = await client.query(
      `delete from core.hk_ipo_public_supplement_candidate
      where supplement_candidate_id = $1`,
      [supplementCandidateId]
    );
    failureStage = "delete_hk_ipo_public_reconciliation_row";
    const reconciliationDelete = await client.query(
      `delete from core.hk_ipo_public_reconciliation_row
      where reconciliation_row_id = $1`,
      [reconciliationRowId]
    );
    failureStage = "delete_hk_ipo_public_observation";
    const observationDelete = await client.query(
      `delete from core.hk_ipo_public_observation
      where observation_id = $1`,
      [observationId]
    );
    failureStage = "delete_hk_ipo_public_source_run";
    const sourceRunDelete = await client.query(
      `delete from core.hk_ipo_public_source_run
      where source_run_id = $1`,
      [sourceRunId]
    );
    failureStage = "delete_raw_snapshot";
    const rawSnapshotDelete = await client.query(
      `delete from core.raw_snapshot
      where raw_snapshot_id = $1`,
      [rawSnapshotId]
    );
    failureStage = "delete_data_version_batch";
    const dataVersionDelete = await client.query(
      `delete from core.data_version_batch
      where data_version = $1`,
      [dataVersion]
    );
    failureStage = "delete_raw_source_batch";
    const rawSourceBatchDelete = await client.query(
      `delete from core.raw_source_batch
      where source_batch_id = $1`,
      [sourceBatchId]
    );

    failureStage = "commit";
    await client.query("COMMIT");
    committed = true;

    const insertedRows =
      (rawSourceBatchInsert.rowCount ?? 0) +
      (dataVersionInsert.rowCount ?? 0) +
      (rawSnapshotInsert.rowCount ?? 0) +
      (sourceRunInsert.rowCount ?? 0) +
      (observationInsert.rowCount ?? 0) +
      (reconciliationInsert.rowCount ?? 0) +
      (supplementInsert.rowCount ?? 0);
    const deletedRows =
      (supplementDelete.rowCount ?? 0) +
      (reconciliationDelete.rowCount ?? 0) +
      (observationDelete.rowCount ?? 0) +
      (sourceRunDelete.rowCount ?? 0) +
      (rawSnapshotDelete.rowCount ?? 0) +
      (dataVersionDelete.rowCount ?? 0) +
      (rawSourceBatchDelete.rowCount ?? 0);

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: deletedRows === insertedRows,
      data_version_hash: await hashRuntimeSmokeString(dataVersion),
      deleted_rows: deletedRows,
      inserted_rows: insertedRows,
      operation_count: 17,
      production_promotion_enabled: false,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      raw_snapshot_id_hash: await hashRuntimeSmokeString(rawSnapshotId),
      readback_hash: await hashRuntimeSmokeString(JSON.stringify(readbackRow ?? {})),
      selected_rows: selectedRows,
      source_run_id_hash: await hashRuntimeSmokeString(sourceRunId),
      status: "passed",
      surface: "hk_ipo_public_held_rows_insert_select_delete",
      tables: [
        "core.raw_source_batch",
        "core.data_version_batch",
        "core.raw_snapshot",
        "core.hk_ipo_public_source_run",
        "core.hk_ipo_public_observation",
        "core.hk_ipo_public_reconciliation_row",
        "core.hk_ipo_public_supplement_candidate"
      ],
      writes_serving_tables: false
    };
  } catch (error) {
    if (transactionStarted && !committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    return failedHkIpoPublicHeldDbApplySmokeResult({
      detail: error instanceof Error ? error.message : String(error),
      errorCode:
        isPlainRecord(error) && typeof error.code === "string" ? error.code : undefined,
      failureCode: "hk_ipo_public_held_db_apply_failed",
      failureStage,
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runHkIpoPublicHeldDbApply(
  env: WorkerBindings,
  payload: HkIpoPublicHeldDbApplyPayload
): Promise<HkIpoPublicHeldDbApplyResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingHkIpoPublicHeldDbApplyResult("missing_hyperdrive_binding");
  }

  const queryLabel = "hk-ipo-public-held-db-apply-live:v0:bulk-upsert-readback";
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  let failureStage = "connect";
  let transactionStarted = false;
  let committed = false;

  try {
    failureStage = "connect";
    await client.connect();
    failureStage = "begin_transaction";
    await client.query("BEGIN");
    transactionStarted = true;

    failureStage = "upsert_raw_source_batch";
    const rawSourceBatch = await client.query(
      `insert into core.raw_source_batch (
        source_batch_id,
        source_name,
        source_dataset,
        received_at,
        source_rights_status,
        checksum_sha256,
        row_count
      )
      select
        row.source_batch_id,
        row.source_name,
        row.source_dataset,
        row.received_at,
        row.source_rights_status,
        row.checksum_sha256,
        row.row_count
      from jsonb_to_recordset($1::jsonb) as row(
        source_batch_id text,
        source_name text,
        source_dataset text,
        received_at timestamptz,
        source_rights_status text,
        checksum_sha256 text,
        row_count integer
      )
      on conflict (source_batch_id) do update set
        source_name = excluded.source_name,
        source_dataset = excluded.source_dataset,
        received_at = excluded.received_at,
        source_rights_status = excluded.source_rights_status,
        checksum_sha256 = excluded.checksum_sha256,
        row_count = excluded.row_count`,
      [JSON.stringify(payload.row_groups.raw_source_batch)]
    );

    failureStage = "upsert_data_version_batch";
    const dataVersionBatch = await client.query(
      `insert into core.data_version_batch (
        data_version,
        source_batch_id,
        methodology_version,
        rights_policy_version,
        release_state
      )
      select
        row.data_version,
        row.source_batch_id,
        row.methodology_version,
        row.rights_policy_version,
        row.release_state
      from jsonb_to_recordset($1::jsonb) as row(
        data_version text,
        source_batch_id text,
        methodology_version text,
        rights_policy_version text,
        release_state text
      )
      on conflict (data_version) do update set
        source_batch_id = excluded.source_batch_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        release_state = excluded.release_state`,
      [JSON.stringify(payload.row_groups.data_version_batch)]
    );

    failureStage = "upsert_hk_ipo_public_source_run";
    const sourceRun = await client.query(
      `insert into core.hk_ipo_public_source_run (
        source_run_id,
        source_batch_id,
        data_version,
        adapter_version,
        packet_version,
        source_mode,
        status,
        source_ids,
        security_count,
        observation_count,
        reconciliation_row_count,
        supplement_candidate_count,
        live_network_writes,
        writes_serving_tables
      )
      select
        row.source_run_id,
        row.source_batch_id,
        row.data_version,
        row.adapter_version,
        row.packet_version,
        row.source_mode,
        row.status,
        row.source_ids,
        row.security_count,
        row.observation_count,
        row.reconciliation_row_count,
        row.supplement_candidate_count,
        row.live_network_writes,
        row.writes_serving_tables
      from jsonb_to_recordset($1::jsonb) as row(
        source_run_id text,
        source_batch_id text,
        data_version text,
        adapter_version text,
        packet_version text,
        source_mode text,
        status text,
        source_ids jsonb,
        security_count integer,
        observation_count integer,
        reconciliation_row_count integer,
        supplement_candidate_count integer,
        live_network_writes boolean,
        writes_serving_tables boolean
      )
      on conflict (source_run_id) do update set
        source_batch_id = excluded.source_batch_id,
        data_version = excluded.data_version,
        adapter_version = excluded.adapter_version,
        packet_version = excluded.packet_version,
        source_mode = excluded.source_mode,
        status = excluded.status,
        source_ids = excluded.source_ids,
        security_count = excluded.security_count,
        observation_count = excluded.observation_count,
        reconciliation_row_count = excluded.reconciliation_row_count,
        supplement_candidate_count = excluded.supplement_candidate_count,
        live_network_writes = excluded.live_network_writes,
        writes_serving_tables = excluded.writes_serving_tables`,
      [JSON.stringify(payload.row_groups.hk_ipo_public_source_run)]
    );

    failureStage = "upsert_raw_snapshot";
    const rawSnapshot = await client.query(
      `insert into core.raw_snapshot (
        raw_snapshot_id,
        source_batch_id,
        source_record_id,
        record_kind,
        payload,
        payload_hash_sha256,
        received_at,
        quality_state,
        data_version,
        methodology_version
      )
      select
        row.raw_snapshot_id,
        row.source_batch_id,
        row.source_record_id,
        row.record_kind,
        row.payload,
        row.payload_hash_sha256,
        row.received_at,
        row.quality_state,
        row.data_version,
        row.methodology_version
      from jsonb_to_recordset($1::jsonb) as row(
        raw_snapshot_id text,
        source_batch_id text,
        source_record_id text,
        record_kind text,
        payload jsonb,
        payload_hash_sha256 text,
        received_at timestamptz,
        quality_state text,
        data_version text,
        methodology_version text
      )
      on conflict (raw_snapshot_id) do update set
        source_batch_id = excluded.source_batch_id,
        source_record_id = excluded.source_record_id,
        record_kind = excluded.record_kind,
        payload = excluded.payload,
        payload_hash_sha256 = excluded.payload_hash_sha256,
        received_at = excluded.received_at,
        quality_state = excluded.quality_state,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version`,
      [JSON.stringify(payload.row_groups.raw_snapshot)]
    );

    failureStage = "upsert_hk_ipo_public_observation";
    const observation = await client.query(
      `insert into core.hk_ipo_public_observation (
        observation_id,
        source_run_id,
        source_id,
        provider,
        source_url,
        observed_at,
        source_record_id,
        security_code,
        field_name,
        field_value,
        field_value_type,
        raw_snapshot_id,
        raw_snapshot_required,
        reconciled_with_hkex,
        conflict_status,
        confidence,
        locator,
        locator_hash,
        data_version,
        quality_state
      )
      select
        row.observation_id,
        row.source_run_id,
        row.source_id,
        row.provider,
        row.source_url,
        row.observed_at,
        row.source_record_id,
        row.security_code,
        row.field_name,
        row.field_value,
        row.field_value_type,
        row.raw_snapshot_id,
        row.raw_snapshot_required,
        row.reconciled_with_hkex,
        row.conflict_status,
        row.confidence,
        row.locator,
        row.locator_hash,
        row.data_version,
        row.quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        observation_id text,
        source_run_id text,
        source_id text,
        provider text,
        source_url text,
        observed_at timestamptz,
        source_record_id text,
        security_code text,
        field_name text,
        field_value jsonb,
        field_value_type text,
        raw_snapshot_id text,
        raw_snapshot_required boolean,
        reconciled_with_hkex boolean,
        conflict_status text,
        confidence numeric,
        locator jsonb,
        locator_hash text,
        data_version text,
        quality_state text
      )
      on conflict (observation_id) do update set
        source_run_id = excluded.source_run_id,
        source_id = excluded.source_id,
        provider = excluded.provider,
        source_url = excluded.source_url,
        observed_at = excluded.observed_at,
        source_record_id = excluded.source_record_id,
        security_code = excluded.security_code,
        field_name = excluded.field_name,
        field_value = excluded.field_value,
        field_value_type = excluded.field_value_type,
        raw_snapshot_id = excluded.raw_snapshot_id,
        raw_snapshot_required = excluded.raw_snapshot_required,
        reconciled_with_hkex = excluded.reconciled_with_hkex,
        conflict_status = excluded.conflict_status,
        confidence = excluded.confidence,
        locator = excluded.locator,
        locator_hash = excluded.locator_hash,
        data_version = excluded.data_version,
        quality_state = excluded.quality_state`,
      [JSON.stringify(payload.row_groups.hk_ipo_public_observation)]
    );

    failureStage = "upsert_hk_ipo_public_reconciliation_row";
    const reconciliation = await client.query(
      `insert into core.hk_ipo_public_reconciliation_row (
        reconciliation_row_id,
        source_run_id,
        security_code,
        fact_name,
        status,
        canonical_candidate,
        source_observation_ids,
        source_ids,
        raw_snapshot_request_ids,
        hkex_evidence_ids,
        confidence,
        reason,
        raw_snapshot_required,
        conflict_requires_manual_review,
        promotes_fact,
        data_version,
        quality_state
      )
      select
        row.reconciliation_row_id,
        row.source_run_id,
        row.security_code,
        row.fact_name,
        row.status,
        row.canonical_candidate,
        row.source_observation_ids,
        row.source_ids,
        row.raw_snapshot_request_ids,
        row.hkex_evidence_ids,
        row.confidence,
        row.reason,
        row.raw_snapshot_required,
        row.conflict_requires_manual_review,
        row.promotes_fact,
        row.data_version,
        row.quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        reconciliation_row_id text,
        source_run_id text,
        security_code text,
        fact_name text,
        status text,
        canonical_candidate jsonb,
        source_observation_ids jsonb,
        source_ids jsonb,
        raw_snapshot_request_ids jsonb,
        hkex_evidence_ids jsonb,
        confidence text,
        reason text,
        raw_snapshot_required boolean,
        conflict_requires_manual_review boolean,
        promotes_fact boolean,
        data_version text,
        quality_state text
      )
      on conflict (reconciliation_row_id) do update set
        source_run_id = excluded.source_run_id,
        security_code = excluded.security_code,
        fact_name = excluded.fact_name,
        status = excluded.status,
        canonical_candidate = excluded.canonical_candidate,
        source_observation_ids = excluded.source_observation_ids,
        source_ids = excluded.source_ids,
        raw_snapshot_request_ids = excluded.raw_snapshot_request_ids,
        hkex_evidence_ids = excluded.hkex_evidence_ids,
        confidence = excluded.confidence,
        reason = excluded.reason,
        raw_snapshot_required = excluded.raw_snapshot_required,
        conflict_requires_manual_review = excluded.conflict_requires_manual_review,
        promotes_fact = excluded.promotes_fact,
        data_version = excluded.data_version,
        quality_state = excluded.quality_state`,
      [JSON.stringify(payload.row_groups.hk_ipo_public_reconciliation_row)]
    );

    failureStage = "upsert_hk_ipo_public_supplement_candidate";
    const supplement = await client.query(
      `insert into core.hk_ipo_public_supplement_candidate (
        supplement_candidate_id,
        source_run_id,
        source_observation_id,
        security_code,
        source_id,
        source_record_id,
        field_name,
        field_value_type,
        status,
        raw_snapshot_required,
        promotes_fact,
        reason,
        data_version,
        quality_state
      )
      select
        row.supplement_candidate_id,
        row.source_run_id,
        row.source_observation_id,
        row.security_code,
        row.source_id,
        row.source_record_id,
        row.field_name,
        row.field_value_type,
        row.status,
        row.raw_snapshot_required,
        row.promotes_fact,
        row.reason,
        row.data_version,
        row.quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        supplement_candidate_id text,
        source_run_id text,
        source_observation_id text,
        security_code text,
        source_id text,
        source_record_id text,
        field_name text,
        field_value_type text,
        status text,
        raw_snapshot_required boolean,
        promotes_fact boolean,
        reason text,
        data_version text,
        quality_state text
      )
      on conflict (supplement_candidate_id) do update set
        source_run_id = excluded.source_run_id,
        source_observation_id = excluded.source_observation_id,
        security_code = excluded.security_code,
        source_id = excluded.source_id,
        source_record_id = excluded.source_record_id,
        field_name = excluded.field_name,
        field_value_type = excluded.field_value_type,
        status = excluded.status,
        raw_snapshot_required = excluded.raw_snapshot_required,
        promotes_fact = excluded.promotes_fact,
        reason = excluded.reason,
        data_version = excluded.data_version,
        quality_state = excluded.quality_state`,
      [JSON.stringify(payload.row_groups.hk_ipo_public_supplement_candidate)]
    );

    failureStage = "select_readback";
    const readback = await client.query<{
      data_version_batch_count: number | string;
      observation_count: number | string;
      raw_snapshot_count: number | string;
      raw_source_batch_count: number | string;
      reconciliation_row_count: number | string;
      source_run_count: number | string;
      supplement_candidate_count: number | string;
    }>(
      `select
        (select count(*)::int from core.raw_source_batch where source_batch_id = $1) as raw_source_batch_count,
        (select count(*)::int from core.data_version_batch where data_version = $2 and release_state = 'held') as data_version_batch_count,
        (select count(*)::int from core.raw_snapshot where data_version = $2 and record_kind = 'hk_ipo_public_source_record' and quality_state = 'HOLD') as raw_snapshot_count,
        (select count(*)::int from core.hk_ipo_public_source_run where source_run_id = $3 and status = 'held' and source_mode = 'live' and writes_serving_tables = false) as source_run_count,
        (select count(*)::int from core.hk_ipo_public_observation where source_run_id = $3 and raw_snapshot_required = true and reconciled_with_hkex = false and quality_state = 'HOLD') as observation_count,
        (select count(*)::int from core.hk_ipo_public_reconciliation_row where source_run_id = $3 and raw_snapshot_required = true and promotes_fact = false and quality_state = 'HOLD') as reconciliation_row_count,
        (select count(*)::int from core.hk_ipo_public_supplement_candidate where source_run_id = $3 and raw_snapshot_required = true and promotes_fact = false and quality_state = 'HOLD') as supplement_candidate_count`,
      [payload.source_batch_id, payload.data_version, payload.source_run_id]
    );
    const readbackRow = readback.rows[0];
    const selectedRows =
      Number(readbackRow?.raw_source_batch_count ?? 0) +
      Number(readbackRow?.data_version_batch_count ?? 0) +
      Number(readbackRow?.raw_snapshot_count ?? 0) +
      Number(readbackRow?.source_run_count ?? 0) +
      Number(readbackRow?.observation_count ?? 0) +
      Number(readbackRow?.reconciliation_row_count ?? 0) +
      Number(readbackRow?.supplement_candidate_count ?? 0);
    const expectedRows = hkIpoPublicHeldDbApplyExpectedRows(payload);

    if (selectedRows !== expectedRows) {
      failureStage = "validate_readback";
      throw new Error("HK IPO public held DB apply live readback mismatch");
    }

    failureStage = "commit";
    await client.query("COMMIT");
    committed = true;

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      data_version_hash: await hashRuntimeSmokeString(payload.data_version),
      inserted_or_updated_rows:
        (rawSourceBatch.rowCount ?? 0) +
        (dataVersionBatch.rowCount ?? 0) +
        (sourceRun.rowCount ?? 0) +
        (rawSnapshot.rowCount ?? 0) +
        (observation.rowCount ?? 0) +
        (reconciliation.rowCount ?? 0) +
        (supplement.rowCount ?? 0),
      object_store_write_count: Number(
        payload.object_store_write_summary.remote_object_store_write_count ?? 0
      ),
      operation_count: 10,
      packet_hash: payload.packet_hash,
      production_promotion_enabled: false,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      readback_hash: await hashRuntimeSmokeString(JSON.stringify(readbackRow ?? {})),
      release_state: "held",
      selected_rows: selectedRows,
      source_batch_id_hash: await hashRuntimeSmokeString(payload.source_batch_id),
      source_run_id_hash: await hashRuntimeSmokeString(payload.source_run_id),
      status: "passed",
      surface: "hk_ipo_public_live_held_rows_upsert_readback",
      tables: hkIpoPublicHeldDbApplyTables(),
      writes_serving_tables: false
    };
  } catch (error) {
    if (transactionStarted && !committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    return failedHkIpoPublicHeldDbApplyResult({
      detail: error instanceof Error ? error.message : String(error),
      errorCode:
        isPlainRecord(error) && typeof error.code === "string" ? error.code : undefined,
      failureCode: "hk_ipo_public_held_db_apply_failed",
      failureStage,
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runHkIpoPublicHeldDbReadback(
  env: WorkerBindings,
  payload: HkIpoPublicHeldDbReadbackPayload
): Promise<HkIpoPublicHeldDbReadbackResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingHkIpoPublicHeldDbReadbackResult("missing_hyperdrive_binding");
  }

  const shouldReadObjectStore = payload.object_store_readback !== false;
  const artifacts = env.AIPHABEE_ARTIFACTS;
  if (shouldReadObjectStore && !isRuntimeR2Bucket(artifacts)) {
    return missingHkIpoPublicHeldDbReadbackResult("missing_r2_artifacts_binding");
  }

  const queryLabel = "hk-ipo-public-held-db-readback:v0:latest-held-row-and-r2-envelope";
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  let failureStage = "connect";

  try {
    failureStage = "connect";
    await client.connect();

    failureStage = "select_source_run";
    const specific = payload.mode === "specific";
    const sourceRun = specific
      ? await client.query<{
          data_version: string;
          observation_count: number | string;
          reconciliation_row_count: number | string;
          security_count: number | string;
          source_batch_id: string;
          source_run_id: string;
          supplement_candidate_count: number | string;
        }>(
          `select
            source_run_id,
            source_batch_id,
            data_version,
            security_count,
            observation_count,
            reconciliation_row_count,
            supplement_candidate_count
          from core.hk_ipo_public_source_run
          where source_run_id = $1
            and source_batch_id = $2
            and data_version = $3
            and source_mode = 'live'
            and status = 'held'
            and writes_serving_tables = false
          limit 1`,
          [payload.source_run_id, payload.source_batch_id, payload.data_version]
        )
      : await client.query<{
          data_version: string;
          observation_count: number | string;
          reconciliation_row_count: number | string;
          security_count: number | string;
          source_batch_id: string;
          source_run_id: string;
          supplement_candidate_count: number | string;
        }>(
          `select
            source_run_id,
            source_batch_id,
            data_version,
            security_count,
            observation_count,
            reconciliation_row_count,
            supplement_candidate_count
          from core.hk_ipo_public_source_run
          where source_mode = 'live'
            and status = 'held'
            and writes_serving_tables = false
          order by created_at desc, source_run_id desc
          limit 1`
        );
    const runRow = sourceRun.rows[0];
    if (!runRow) {
      return failedHkIpoPublicHeldDbReadbackResult({
        detail: "no live held source run found",
        failureCode: "hk_ipo_public_held_db_readback_no_source_run",
        failureStage,
        queryLabel
      });
    }

    failureStage = "select_table_counts";
    const readback = await client.query<{
      data_version_batch_count: number | string;
      observation_count: number | string;
      object_key_count: number | string;
      payload_envelope_count: number | string;
      raw_snapshot_count: number | string;
      raw_snapshot_payload_leak_count: number | string;
      raw_source_batch_count: number | string;
      reconciliation_row_count: number | string;
      source_run_count: number | string;
      supplement_candidate_count: number | string;
    }>(
      `select
        (select count(*)::int from core.raw_source_batch where source_batch_id = $1) as raw_source_batch_count,
        (select count(*)::int from core.data_version_batch where data_version = $2 and release_state = 'held') as data_version_batch_count,
        (select count(*)::int from core.raw_snapshot where data_version = $2 and record_kind = 'hk_ipo_public_source_record' and quality_state = 'HOLD') as raw_snapshot_count,
        (select count(*)::int from core.hk_ipo_public_source_run where source_run_id = $3 and status = 'held' and source_mode = 'live' and writes_serving_tables = false) as source_run_count,
        (select count(*)::int from core.hk_ipo_public_observation where source_run_id = $3 and raw_snapshot_required = true and reconciled_with_hkex = false and quality_state = 'HOLD') as observation_count,
        (select count(*)::int from core.hk_ipo_public_reconciliation_row where source_run_id = $3 and raw_snapshot_required = true and promotes_fact = false and quality_state = 'HOLD') as reconciliation_row_count,
        (select count(*)::int from core.hk_ipo_public_supplement_candidate where source_run_id = $3 and raw_snapshot_required = true and promotes_fact = false and quality_state = 'HOLD') as supplement_candidate_count,
        (
          select count(*)::int
          from core.raw_snapshot
          where data_version = $2
            and record_kind = 'hk_ipo_public_source_record'
            and quality_state = 'HOLD'
            and payload->>'storage_target' = 'external_raw_snapshot_store'
            and payload->>'payload_body_included' = 'false'
            and payload->>'raw_html_included' = 'false'
            and payload ? 'object_key'
            and payload ? 'payload_hash_sha256'
        ) as payload_envelope_count,
        (
          select count(distinct payload->>'object_key')::int
          from core.raw_snapshot
          where data_version = $2
            and record_kind = 'hk_ipo_public_source_record'
            and quality_state = 'HOLD'
            and payload ? 'object_key'
        ) as object_key_count,
        (
          select count(*)::int
          from core.raw_snapshot
          where data_version = $2
            and record_kind = 'hk_ipo_public_source_record'
            and quality_state = 'HOLD'
            and (
              payload ? 'payload_body'
              or payload ? 'raw_html'
              or coalesce(payload->>'payload_body_included', '') <> 'false'
              or coalesce(payload->>'raw_html_included', '') <> 'false'
            )
        ) as raw_snapshot_payload_leak_count`,
      [runRow.source_batch_id, runRow.data_version, runRow.source_run_id]
    );
    const readbackRow = readback.rows[0] ?? {};
    const tableCounts = {
      data_version_batch: Number(readbackRow.data_version_batch_count ?? 0),
      hk_ipo_public_observation: Number(readbackRow.observation_count ?? 0),
      hk_ipo_public_reconciliation_row: Number(readbackRow.reconciliation_row_count ?? 0),
      hk_ipo_public_source_run: Number(readbackRow.source_run_count ?? 0),
      hk_ipo_public_supplement_candidate: Number(readbackRow.supplement_candidate_count ?? 0),
      raw_snapshot: Number(readbackRow.raw_snapshot_count ?? 0),
      raw_source_batch: Number(readbackRow.raw_source_batch_count ?? 0)
    };
    const selectedRows = Object.values(tableCounts).reduce((sum, count) => sum + count, 0);
    const payloadEnvelopeCount = Number(readbackRow.payload_envelope_count ?? 0);
    const rawSnapshotPayloadLeakCount = Number(readbackRow.raw_snapshot_payload_leak_count ?? 0);
    const objectKeyCount = Number(readbackRow.object_key_count ?? 0);
    const expectedRows =
      3 +
      tableCounts.raw_snapshot +
      Number(runRow.observation_count ?? 0) +
      Number(runRow.reconciliation_row_count ?? 0) +
      Number(runRow.supplement_candidate_count ?? 0);

    failureStage = "select_object_keys";
    const objectKeys = await client.query<{ object_key: string }>(
      `select distinct payload->>'object_key' as object_key
      from core.raw_snapshot
      where data_version = $1
        and record_kind = 'hk_ipo_public_source_record'
        and quality_state = 'HOLD'
        and payload ? 'object_key'
      order by object_key
      limit 100`,
      [runRow.data_version]
    );
    const objectKeyValues = objectKeys.rows
      .map((row) => row.object_key)
      .filter((key): key is string => typeof key === "string" && key.length > 0);
    let objectStoreReadbackCount = 0;
    let objectStoreMissingCount = 0;

    if (shouldReadObjectStore && isRuntimeR2Bucket(artifacts)) {
      failureStage = "readback_r2_objects";
      for (const objectKey of objectKeyValues) {
        if (await runtimeR2ObjectExists(artifacts, objectKey)) {
          objectStoreReadbackCount += 1;
        } else {
          objectStoreMissingCount += 1;
        }
      }
    }

    const invariantFailures = [
      selectedRows !== expectedRows ? "selected_row_count_mismatch" : null,
      tableCounts.hk_ipo_public_observation !== Number(runRow.observation_count ?? 0)
        ? "observation_count_mismatch"
        : null,
      tableCounts.hk_ipo_public_reconciliation_row !== Number(runRow.reconciliation_row_count ?? 0)
        ? "reconciliation_count_mismatch"
        : null,
      tableCounts.hk_ipo_public_supplement_candidate !== Number(runRow.supplement_candidate_count ?? 0)
        ? "supplement_count_mismatch"
        : null,
      tableCounts.raw_snapshot !== payloadEnvelopeCount ? "raw_snapshot_envelope_mismatch" : null,
      rawSnapshotPayloadLeakCount !== 0 ? "raw_snapshot_payload_leak" : null,
      objectKeyValues.length !== objectKeyCount ? "object_key_count_mismatch" : null,
      shouldReadObjectStore && objectStoreMissingCount !== 0 ? "object_store_missing" : null
    ].filter((failure): failure is string => Boolean(failure));

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      data_version_hash: await hashRuntimeSmokeString(runRow.data_version),
      ...(invariantFailures.length > 0
        ? {
            detail_hash: await hashRuntimeSmokeString(invariantFailures.join("\n")),
            failure_code: "hk_ipo_public_held_db_readback_invariant_failed",
            failure_stage: "validate_readback"
          }
        : {}),
      object_key_count: objectKeyCount,
      object_key_hash: await hashRuntimeSmokeString(JSON.stringify(objectKeyValues)),
      object_store_binding_name: "AIPHABEE_ARTIFACTS",
      object_store_missing_count: objectStoreMissingCount,
      object_store_readback_count: objectStoreReadbackCount,
      operation_count: 3 + (shouldReadObjectStore ? objectKeyValues.length : 0),
      payload_envelope_count: payloadEnvelopeCount,
      production_promotion_enabled: false,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      raw_snapshot_payload_leak_count: rawSnapshotPayloadLeakCount,
      readback_hash: await hashRuntimeSmokeString(JSON.stringify({ readbackRow, tableCounts })),
      release_state: "held",
      selected_rows: selectedRows,
      source_batch_id_hash: await hashRuntimeSmokeString(runRow.source_batch_id),
      source_run_id_hash: await hashRuntimeSmokeString(runRow.source_run_id),
      status: invariantFailures.length === 0 ? "passed" : "failed",
      surface: "hk_ipo_public_live_held_rows_readback",
      table_counts: tableCounts,
      tables: hkIpoPublicHeldDbApplyTables(),
      writes_serving_tables: false
    };
  } catch (error) {
    return failedHkIpoPublicHeldDbReadbackResult({
      detail: error instanceof Error ? error.message : String(error),
      errorCode:
        isPlainRecord(error) && typeof error.code === "string" ? error.code : undefined,
      failureCode: "hk_ipo_public_held_db_readback_failed",
      failureStage,
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

function validateHkIpoPublicHeldDbApplyPayload(
  value: unknown
):
  | { status: "ok"; payload: HkIpoPublicHeldDbApplyPayload }
  | { errors: string[]; status: "invalid" } {
  const errors: string[] = [];

  if (!isPlainRecord(value)) {
    return { errors: ["payload must be an object"], status: "invalid" };
  }

  const rowGroups = value.row_groups;
  if (!isPlainRecord(rowGroups)) {
    errors.push("row_groups must be an object");
  }

  const payload = value as unknown as HkIpoPublicHeldDbApplyPayload;
  const groups = isPlainRecord(rowGroups) ? rowGroups : {};
  const requiredGroups = [
    "raw_source_batch",
    "data_version_batch",
    "hk_ipo_public_source_run",
    "raw_snapshot",
    "hk_ipo_public_observation",
    "hk_ipo_public_reconciliation_row",
    "hk_ipo_public_supplement_candidate"
  ];

  if (value.version !== HK_IPO_PUBLIC_HELD_DB_APPLY_VERSION) {
    errors.push("version mismatch");
  }
  if (value.packet_kind !== "hk_ipo_public_held_db_apply_packet") {
    errors.push("packet_kind mismatch");
  }
  if (value.mode !== "live") {
    errors.push("mode must be live");
  }
  if (!/^packet:[a-f0-9]{64}$/u.test(String(value.packet_hash ?? ""))) {
    errors.push("packet_hash must be packet-prefixed sha256 material");
  }
  if (!/^rsb_hk_ipo_public_[a-f0-9]{24}$/u.test(String(value.source_batch_id ?? ""))) {
    errors.push("source_batch_id must be a HK IPO public batch id");
  }
  if (!/^dv_hk_ipo_public_[a-f0-9]{24}$/u.test(String(value.data_version ?? ""))) {
    errors.push("data_version must be a HK IPO public held data version");
  }
  if (!/^sr_hk_ipo_public_[a-f0-9]{24}$/u.test(String(value.source_run_id ?? ""))) {
    errors.push("source_run_id must be a HK IPO public source run id");
  }

  for (const group of requiredGroups) {
    const rows = groups[group];
    if (!Array.isArray(rows) || rows.length === 0) {
      errors.push(`row_groups.${group} must be a non-empty array`);
    }
  }

  const totalRows = requiredGroups.reduce((sum, group) => {
    const rows = groups[group];
    return sum + (Array.isArray(rows) ? rows.length : 0);
  }, 0);
  if (totalRows <= 0 || totalRows > 5000) {
    errors.push("total row count must be between 1 and 5000");
  }

  if ((groups.raw_source_batch as unknown[])?.length !== 1) {
    errors.push("raw_source_batch must contain exactly one row");
  }
  if ((groups.data_version_batch as unknown[])?.length !== 1) {
    errors.push("data_version_batch must contain exactly one row");
  }
  if ((groups.hk_ipo_public_source_run as unknown[])?.length !== 1) {
    errors.push("hk_ipo_public_source_run must contain exactly one row");
  }

  const dataVersionRow = firstRecord(groups.data_version_batch);
  if (dataVersionRow?.release_state !== "held") {
    errors.push("data_version_batch.release_state must be held");
  }
  if (dataVersionRow?.data_version !== value.data_version) {
    errors.push("data_version_batch must match payload data_version");
  }

  const sourceRunRow = firstRecord(groups.hk_ipo_public_source_run);
  if (sourceRunRow?.source_run_id !== value.source_run_id) {
    errors.push("source_run must match payload source_run_id");
  }
  if (sourceRunRow?.source_mode !== "live" || sourceRunRow?.status !== "held") {
    errors.push("source_run must remain live held");
  }
  if (
    sourceRunRow?.live_network_writes !== false ||
    sourceRunRow?.writes_serving_tables !== false
  ) {
    errors.push("source_run must not claim network writes or serving table writes");
  }

  const objectStoreSummary = value.object_store_write_summary;
  if (!isPlainRecord(objectStoreSummary)) {
    errors.push("object_store_write_summary must be an object");
  } else {
    if (Number(objectStoreSummary.remote_object_store_write_count ?? 0) <= 0) {
      errors.push("object_store_write_summary must include remote object writes");
    }
    if (Number(objectStoreSummary.payload_body_output_count ?? 0) !== 0) {
      errors.push("object_store_write_summary must not output payload bodies");
    }
    if (Number(objectStoreSummary.writes_database_count ?? 0) !== 0) {
      errors.push("object_store_write_summary must not write database");
    }
  }

  const serialized = JSON.stringify(value);
  if (/<html|<body|__NUXT__|<script|<\/script>/iu.test(serialized)) {
    errors.push("payload must not include raw HTML or script text");
  }
  if (/postgres(?:ql)?:\/\/|Bearer\s+[A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9_-]{20,}/iu.test(serialized)) {
    errors.push("payload must not include secrets or database URLs");
  }

  if (requiredGroups.every((group) => Array.isArray(groups[group]))) {
    validateHkIpoPublicRows(payload, errors);
  }

  return errors.length > 0
    ? { errors, status: "invalid" }
    : { payload, status: "ok" };
}

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function validateHkIpoPublicHeldDbReadbackPayload(
  value: unknown
):
  | { status: "ok"; payload: HkIpoPublicHeldDbReadbackPayload }
  | { errors: string[]; status: "invalid" } {
  const errors: string[] = [];

  if (!isPlainRecord(value)) {
    return { errors: ["payload must be an object"], status: "invalid" };
  }

  const mode = value.mode === "specific" ? "specific" : "latest";
  const payload: HkIpoPublicHeldDbReadbackPayload = {
    mode,
    object_store_readback: value.object_store_readback !== false
  };

  if (mode === "specific") {
    payload.source_run_id = String(value.source_run_id ?? "");
    payload.source_batch_id = String(value.source_batch_id ?? "");
    payload.data_version = String(value.data_version ?? "");
  } else {
    for (const field of ["source_run_id", "source_batch_id", "data_version"]) {
      if (typeof value[field] === "string" && value[field].length > 0) {
        errors.push(`${field} requires mode specific`);
      }
    }
  }

  if (mode === "specific") {
    if (!/^sr_hk_ipo_public_[a-f0-9]{24}$/u.test(String(payload.source_run_id ?? ""))) {
      errors.push("source_run_id must be a HK IPO public source run id");
    }
    if (!/^rsb_hk_ipo_public_[a-f0-9]{24}$/u.test(String(payload.source_batch_id ?? ""))) {
      errors.push("source_batch_id must be a HK IPO public batch id");
    }
    if (!/^dv_hk_ipo_public_[a-f0-9]{24}$/u.test(String(payload.data_version ?? ""))) {
      errors.push("data_version must be a HK IPO public held data version");
    }
  }

  return errors.length > 0
    ? { errors, status: "invalid" }
    : { payload, status: "ok" };
}

function validateHkIpoPublicRows(
  payload: HkIpoPublicHeldDbApplyPayload,
  errors: string[]
): void {
  for (const row of payload.row_groups.raw_snapshot) {
    if (!isPlainRecord(row)) {
      errors.push("raw_snapshot rows must be objects");
      continue;
    }
    if (row.data_version !== payload.data_version || row.source_batch_id !== payload.source_batch_id) {
      errors.push("raw_snapshot row must match payload data_version and source_batch_id");
    }
    if (row.record_kind !== "hk_ipo_public_source_record" || row.quality_state !== "HOLD") {
      errors.push("raw_snapshot row must stay HK IPO public HOLD");
    }
    if (!isPlainRecord(row.payload)) {
      errors.push("raw_snapshot row must use a payload envelope object");
    } else if (
      row.payload.payload_body_included !== false ||
      row.payload.raw_html_included !== false ||
      row.payload.storage_target !== "external_raw_snapshot_store"
    ) {
      errors.push("raw_snapshot payload envelope must not include raw payload text");
    }
  }

  for (const row of payload.row_groups.hk_ipo_public_observation) {
    if (!isPlainRecord(row)) {
      errors.push("observation rows must be objects");
      continue;
    }
    if (
      row.source_run_id !== payload.source_run_id ||
      row.data_version !== payload.data_version ||
      row.raw_snapshot_required !== true ||
      row.reconciled_with_hkex !== false ||
      row.quality_state !== "HOLD"
    ) {
      errors.push("observation rows must stay held and unreconciled");
    }
    if (!/^[0-9]{5}\.HK$/u.test(String(row.security_code ?? ""))) {
      errors.push("observation row security_code must be HK code");
    }
    if (!["aastocks_ipo_plus", "vbkr_hk_ipo"].includes(String(row.source_id ?? ""))) {
      errors.push("observation row source_id must be an approved candidate source");
    }
  }

  for (const row of payload.row_groups.hk_ipo_public_reconciliation_row) {
    if (!isPlainRecord(row)) {
      errors.push("reconciliation rows must be objects");
      continue;
    }
    if (
      row.source_run_id !== payload.source_run_id ||
      row.data_version !== payload.data_version ||
      row.raw_snapshot_required !== true ||
      row.promotes_fact !== false ||
      row.quality_state !== "HOLD"
    ) {
      errors.push("reconciliation rows must stay held and non-promoting");
    }
    if (!["low", "medium", "high"].includes(String(row.confidence ?? ""))) {
      errors.push("reconciliation row confidence must be low, medium, or high");
    }
    if (typeof row.reason !== "string" || row.reason.trim().length === 0) {
      errors.push("reconciliation row reason must be present");
    }
    if (!Array.isArray(row.source_ids) || row.source_ids.length === 0) {
      errors.push("reconciliation row source_ids must be present");
    }
    if (!Array.isArray(row.source_observation_ids) || row.source_observation_ids.length === 0) {
      errors.push("reconciliation row source_observation_ids must be present");
    }
    if (!Array.isArray(row.raw_snapshot_request_ids)) {
      errors.push("reconciliation row raw_snapshot_request_ids must be an array");
    }
    if (!Array.isArray(row.hkex_evidence_ids)) {
      errors.push("reconciliation row hkex_evidence_ids must be an array");
    }
  }

  for (const row of payload.row_groups.hk_ipo_public_supplement_candidate) {
    if (!isPlainRecord(row)) {
      errors.push("supplement rows must be objects");
      continue;
    }
    if (
      row.source_run_id !== payload.source_run_id ||
      row.data_version !== payload.data_version ||
      row.raw_snapshot_required !== true ||
      row.promotes_fact !== false ||
      row.quality_state !== "HOLD" ||
      row.status !== "candidate"
    ) {
      errors.push("supplement rows must stay held candidates");
    }
    if (typeof row.reason !== "string" || row.reason.trim().length === 0) {
      errors.push("supplement row reason must be present");
    }
  }
}

function firstRecord(value: unknown): Record<string, unknown> | undefined {
  return Array.isArray(value) && isPlainRecord(value[0]) ? value[0] : undefined;
}

function hkIpoPublicHeldDbApplyExpectedRows(payload: HkIpoPublicHeldDbApplyPayload): number {
  return (
    payload.row_groups.raw_source_batch.length +
    payload.row_groups.data_version_batch.length +
    payload.row_groups.hk_ipo_public_source_run.length +
    payload.row_groups.raw_snapshot.length +
    payload.row_groups.hk_ipo_public_observation.length +
    payload.row_groups.hk_ipo_public_reconciliation_row.length +
    payload.row_groups.hk_ipo_public_supplement_candidate.length
  );
}

function hkIpoPublicHeldDbApplyTables(): HkIpoPublicHeldDbApplyResult["tables"] {
  return [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.raw_snapshot",
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ];
}

async function runMcpDeveloperConsoleLogStoreSmoke(
  env: WorkerBindings,
  requestId: string
): Promise<McpDeveloperConsoleLogStoreSmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingMcpDeveloperConsoleLogStoreSmokeResult("missing_hyperdrive_binding");
  }

  const safeRequestId = requestId.replace(/[^A-Za-z0-9_]/gu, "_").slice(0, 80);
  const requestLogId = [
    "mcp_developer_console_log_smoke",
    safeRequestId,
    crypto.randomUUID().replace(/-/gu, "_")
  ].join("_");
  const sourceRecordId = `source:${requestLogId}`;
  const credentialReference = await hashRuntimeSmokeString(`credential:${requestLogId}`);
  const queryLabel = "mcp-developer-console-log-store-smoke:v0:insert-select-delete";
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  let transactionStarted = false;
  let committed = false;

  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const insertResult = await client.query(
      `insert into aiphabee_core.mcp_developer_console_request_log (
        request_log_id,
        request_id,
        workspace_id,
        client_name,
        client_version,
        credential_kind,
        credential_reference,
        scope,
        tool_name,
        tool_version,
        status,
        standard_error_code,
        credits,
        credits_remaining,
        usage_event_id,
        data_version,
        methodology_version,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        requestLogId,
        requestId,
        "workspace_mcp_developer_console_smoke",
        "synthetic_console_client",
        "0.0.0-smoke",
        "api_key",
        credentialReference,
        "market.read",
        "get_quote_snapshot",
        "get_quote_snapshot@smoke",
        "DATA_NOT_LICENSED",
        "DATA_NOT_LICENSED",
        0,
        0,
        null,
        "mcp-developer-console-log-store-smoke-v0",
        MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_VERSION,
        sourceRecordId
      ]
    );
    const selectResult = await client.query<{
      credits: number | string;
      credits_remaining: number | string;
      developer_console_live: boolean;
      live_api_key_generation_enabled: boolean;
      live_console_log_store_enabled: boolean;
      live_oauth_provider_enabled: boolean;
      live_tool_execution_enabled: boolean;
      live_usage_ledger_reads_enabled: boolean;
      request_log_id: string;
      standard_error_code: string;
      status: string;
    }>(
      `select
        request_log_id,
        status,
        standard_error_code,
        credits,
        credits_remaining,
        developer_console_live,
        live_api_key_generation_enabled,
        live_console_log_store_enabled,
        live_oauth_provider_enabled,
        live_tool_execution_enabled,
        live_usage_ledger_reads_enabled
      from aiphabee_core.mcp_developer_console_request_log
      where request_log_id = $1`,
      [requestLogId]
    );
    const selectedRow = selectResult.rows[0];

    if (
      selectResult.rows.length !== 1 ||
      selectedRow?.request_log_id !== requestLogId ||
      selectedRow.status !== "DATA_NOT_LICENSED" ||
      selectedRow.standard_error_code !== "DATA_NOT_LICENSED" ||
      Number(selectedRow.credits) !== 0 ||
      Number(selectedRow.credits_remaining) !== 0 ||
      selectedRow.developer_console_live !== false ||
      selectedRow.live_api_key_generation_enabled !== false ||
      selectedRow.live_console_log_store_enabled !== false ||
      selectedRow.live_oauth_provider_enabled !== false ||
      selectedRow.live_tool_execution_enabled !== false ||
      selectedRow.live_usage_ledger_reads_enabled !== false
    ) {
      throw new Error("MCP Developer Console log-store smoke readback mismatch");
    }

    const deleteResult = await client.query(
      `delete from aiphabee_core.mcp_developer_console_request_log
      where request_log_id = $1`,
      [requestLogId]
    );

    await client.query("COMMIT");
    committed = true;

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: (deleteResult.rowCount ?? 0) === (insertResult.rowCount ?? 0),
      deleted_rows: deleteResult.rowCount ?? 0,
      developer_console_live: false,
      frontend_rendering: false,
      inserted_rows: insertResult.rowCount ?? 0,
      live_api_key_generation: false,
      live_console_log_store: false,
      live_console_log_store_smoke: true,
      live_oauth_provider: false,
      live_tool_execution: false,
      live_usage_ledger_reads: false,
      operation_count: 4,
      production_console_log_store: false,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      request_log_id_hash: await hashRuntimeSmokeString(requestLogId),
      selected_rows: selectResult.rows.length,
      source_record_hash: await hashRuntimeSmokeString(sourceRecordId),
      status: "passed",
      surface: "mcp_developer_console_request_log_insert_select_delete",
      tables: ["aiphabee_core.mcp_developer_console_request_log"]
    };
  } catch (error) {
    if (transactionStarted && !committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    return failedMcpDeveloperConsoleLogStoreSmokeResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "mcp_developer_console_log_store_smoke_failed",
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runAgentRunLiveWriteSmoke(
  env: WorkerBindings,
  requestId: string
): Promise<AgentRunLiveWriteSmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingAgentRunLiveWriteSmokeResult("missing_hyperdrive_binding");
  }

  const safeRequestId = requestId.replace(/[^A-Za-z0-9_]/gu, "_").slice(0, 80);
  const runId = `agent_run_live_write_smoke_${safeRequestId}`;
  const accountId = `account_${runId}`;
  const workspaceId = `workspace_${runId}`;
  const smokeVersion = AGENT_RUN_LIVE_WRITE_SMOKE_VERSION;
  const sourceRecordId = `source:${runId}`;
  const [auditEvent] = createAgentDryRunTelemetry({
    dataVersion: "agent-run-live-write-smoke-v0",
    environment: "smoke",
    estimatedCostUsd: 0,
    inputTokens: 4,
    latencyMs: 1,
    maxSteps: 2,
    methodologyVersion: smokeVersion,
    modelId: "agent-run-live-write-smoke-no-model",
    modelTier: "smoke",
    modelVersion: "agent-run-live-write-smoke-v0",
    outcome: "success",
    outputHash: await hashRuntimeSmokeString("agent-run-live-write-smoke-output"),
    outputTokens: 6,
    requestId,
    requestedTools: ["get_quote_snapshot"],
    route: `POST ${AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE}`,
    runId,
    toolVersions: [
      {
        tool_name: "get_quote_snapshot",
        tool_version: "get_quote_snapshot@smoke"
      }
    ],
    userId: accountId,
    workspaceId
  });
  const evidencePlan = createEvidenceRecordPlan({
    dataVersion: "agent-run-live-write-smoke-source-v0",
    inputSchemaId: "tool.get_quote_snapshot.input.v0",
    methodologyVersion: smokeVersion,
    outputSchemaId: "tool.get_quote_snapshot.output.v0",
    requestId,
    sourceRecords: [
      {
        dataVersion: "agent-run-live-write-smoke-source-v0",
        methodologyVersion: smokeVersion,
        source: "agent-run-live-write-smoke",
        sourceRecordId
      }
    ],
    toolName: "get_quote_snapshot",
    toolVersion: "get_quote_snapshot@smoke",
    userVisibleLabel: "Agent run live write smoke"
  });
  const usagePlan = createUsageLedgerEventPlan({
    accountId,
    cached: false,
    channel: "web",
    credits: 1,
    dataVersion: "agent-run-live-write-smoke-usage-v0",
    dataset: "agent_run_smoke",
    gatewayStatus: "ok",
    inputUnits: 4,
    meteredFields: 1,
    meteredRows: 1,
    methodologyVersion: smokeVersion,
    occurredAt: "2026-06-22T00:00:00.000Z",
    operation: "agent_run",
    outputUnits: 6,
    qualityState: "PASS",
    requestId,
    rightsPolicyVersion: "default_deny",
    runId,
    sourceRecordId,
    toolName: "get_quote_snapshot",
    workspaceId
  });
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  const evidenceRecord = evidencePlan.evidenceRecord;
  const sourceRef = evidencePlan.sourceRefs[0];
  const auditEventJson = JSON.stringify(auditEvent);
  const queryLabel = "agent-run-live-write-smoke:v0:audit-evidence-usage";
  let transactionStarted = false;
  let committed = false;

  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const auditInsert = await client.query(
      `insert into aiphabee_audit.agent_run_audit_event (
        audit_event_id,
        event_type,
        event_version,
        request_id,
        run_id,
        route,
        outcome,
        event_json,
        payload_hash,
        default_rights_status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      on conflict (audit_event_id) do update set
        event_version = excluded.event_version,
        request_id = excluded.request_id,
        run_id = excluded.run_id,
        route = excluded.route,
        outcome = excluded.outcome,
        event_json = excluded.event_json,
        payload_hash = excluded.payload_hash,
        default_rights_status = excluded.default_rights_status`,
      [
        auditEvent.event_id,
        auditEvent.event_type,
        auditEvent.event_version,
        auditEvent.request_id,
        auditEvent.run_id,
        auditEvent.route,
        auditEvent.outcome,
        auditEventJson,
        await hashRuntimeSmokeString(auditEventJson),
        "default_deny"
      ]
    );
    const evidenceInsert = await client.query(
      `insert into aiphabee_core.evidence_record (
        evidence_record_id,
        request_id,
        tool_name,
        tool_version,
        input_schema_id,
        output_schema_id,
        data_version,
        methodology_version,
        as_of,
        rights_state,
        quality_state,
        citation_label,
        citation_visibility,
        live_write_state,
        source_record_count
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      on conflict (evidence_record_id) do update set
        request_id = excluded.request_id,
        tool_name = excluded.tool_name,
        tool_version = excluded.tool_version,
        input_schema_id = excluded.input_schema_id,
        output_schema_id = excluded.output_schema_id,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version,
        as_of = excluded.as_of,
        rights_state = excluded.rights_state,
        quality_state = excluded.quality_state,
        citation_label = excluded.citation_label,
        citation_visibility = excluded.citation_visibility,
        live_write_state = excluded.live_write_state,
        source_record_count = excluded.source_record_count,
        updated_at = now()`,
      [
        evidenceRecord.evidenceRecordId,
        evidenceRecord.requestId,
        evidenceRecord.toolName,
        evidenceRecord.toolVersion,
        evidenceRecord.inputSchemaId ?? null,
        evidenceRecord.outputSchemaId ?? null,
        evidenceRecord.dataVersion,
        evidenceRecord.methodologyVersion,
        evidencePlan.asOf,
        evidenceRecord.rightsState,
        "PASS",
        evidencePlan.citation.label,
        evidencePlan.citation.visibility,
        "planned_no_write",
        evidencePlan.sourceRefs.length
      ]
    );
    const sourceRefInsert = await client.query(
      `insert into aiphabee_core.evidence_source_ref (
        evidence_source_ref_id,
        evidence_record_id,
        source,
        source_record_id,
        data_version,
        methodology_version,
        rights_state
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (evidence_record_id, source_record_id, data_version) do update set
        source = excluded.source,
        methodology_version = excluded.methodology_version,
        rights_state = excluded.rights_state`,
      [
        sourceRef.evidenceSourceRefId,
        sourceRef.evidenceRecordId,
        sourceRef.source,
        sourceRef.sourceRecordId,
        sourceRef.dataVersion,
        sourceRef.methodologyVersion,
        "default_deny"
      ]
    );
    const accountInsert = await client.query(
      `insert into platform.account (
        account_id,
        email_hash,
        display_name,
        status,
        region,
        default_timezone,
        data_retention_state,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (account_id) do update set
        email_hash = excluded.email_hash,
        display_name = excluded.display_name,
        status = excluded.status,
        region = excluded.region,
        default_timezone = excluded.default_timezone,
        data_retention_state = excluded.data_retention_state,
        source_record_id = excluded.source_record_id,
        updated_at = now()`,
      [
        accountId,
        await hashRuntimeSmokeString(accountId),
        "Agent run live write smoke",
        "active",
        "HK",
        "Asia/Hong_Kong",
        "standard",
        sourceRecordId
      ]
    );
    const workspaceInsert = await client.query(
      `insert into platform.workspace (
        workspace_id,
        owner_account_id,
        display_name,
        billing_region,
        data_region,
        status,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (workspace_id) do update set
        owner_account_id = excluded.owner_account_id,
        display_name = excluded.display_name,
        billing_region = excluded.billing_region,
        data_region = excluded.data_region,
        status = excluded.status,
        source_record_id = excluded.source_record_id,
        updated_at = now()`,
      [workspaceId, accountId, "Agent run live write smoke", "HK", "HK", "active", sourceRecordId]
    );
    const meterRuleInsert = await client.query(
      `insert into aiphabee_core.usage_meter_rule (
        meter_rule_id,
        meter_name,
        channel,
        dataset,
        operation,
        unit_name,
        credit_weight,
        rights_policy_version,
        methodology_version,
        effective_from,
        status,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      on conflict (meter_rule_id) do update set
        meter_name = excluded.meter_name,
        channel = excluded.channel,
        dataset = excluded.dataset,
        operation = excluded.operation,
        unit_name = excluded.unit_name,
        credit_weight = excluded.credit_weight,
        rights_policy_version = excluded.rights_policy_version,
        methodology_version = excluded.methodology_version,
        effective_from = excluded.effective_from,
        status = excluded.status,
        source_record_id = excluded.source_record_id,
        updated_at = now()`,
      [
        usagePlan.ledgerEntry.meterRuleId,
        "Agent run smoke credit",
        usagePlan.event.channel,
        usagePlan.event.dataset,
        usagePlan.event.operation,
        "credit",
        usagePlan.ledgerEntry.creditDelta,
        usagePlan.event.rightsPolicyVersion,
        usagePlan.event.methodologyVersion,
        usagePlan.event.occurredAt,
        "planned",
        sourceRecordId
      ]
    );
    const usageEventInsert = await client.query(
      `insert into aiphabee_core.usage_event (
        usage_event_id,
        request_id,
        run_id,
        workspace_id,
        account_id,
        channel,
        dataset,
        tool_name,
        operation,
        occurred_at,
        metered_rows,
        metered_fields,
        input_units,
        output_units,
        cache_state,
        quality_state,
        data_version,
        methodology_version,
        rights_policy_version,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      on conflict (usage_event_id) do update set
        request_id = excluded.request_id,
        run_id = excluded.run_id,
        workspace_id = excluded.workspace_id,
        account_id = excluded.account_id,
        channel = excluded.channel,
        dataset = excluded.dataset,
        tool_name = excluded.tool_name,
        operation = excluded.operation,
        occurred_at = excluded.occurred_at,
        metered_rows = excluded.metered_rows,
        metered_fields = excluded.metered_fields,
        input_units = excluded.input_units,
        output_units = excluded.output_units,
        cache_state = excluded.cache_state,
        quality_state = excluded.quality_state,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        source_record_id = excluded.source_record_id`,
      [
        usagePlan.event.usageEventId,
        usagePlan.event.requestId,
        usagePlan.event.runId ?? null,
        usagePlan.event.workspaceId,
        usagePlan.event.accountId ?? null,
        usagePlan.event.channel,
        usagePlan.event.dataset,
        usagePlan.event.toolName ?? null,
        usagePlan.event.operation,
        usagePlan.event.occurredAt,
        usagePlan.event.meteredRows,
        usagePlan.event.meteredFields,
        usagePlan.event.inputUnits,
        usagePlan.event.outputUnits,
        usagePlan.event.cacheState,
        usagePlan.event.qualityState,
        usagePlan.event.dataVersion,
        usagePlan.event.methodologyVersion,
        usagePlan.event.rightsPolicyVersion,
        usagePlan.event.sourceRecordId
      ]
    );
    const ledgerEntryInsert = await client.query(
      `insert into aiphabee_core.usage_ledger_entry (
        ledger_entry_id,
        usage_event_id,
        workspace_id,
        account_id,
        subscription_id,
        meter_rule_id,
        credit_delta,
        billable_state,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (ledger_entry_id) do update set
        usage_event_id = excluded.usage_event_id,
        workspace_id = excluded.workspace_id,
        account_id = excluded.account_id,
        subscription_id = excluded.subscription_id,
        meter_rule_id = excluded.meter_rule_id,
        credit_delta = excluded.credit_delta,
        billable_state = excluded.billable_state,
        source_record_id = excluded.source_record_id,
        updated_at = now()`,
      [
        usagePlan.ledgerEntry.ledgerEntryId,
        usagePlan.ledgerEntry.usageEventId,
        usagePlan.ledgerEntry.workspaceId,
        usagePlan.ledgerEntry.accountId ?? null,
        usagePlan.ledgerEntry.subscriptionId ?? null,
        usagePlan.ledgerEntry.meterRuleId,
        usagePlan.ledgerEntry.creditDelta,
        usagePlan.ledgerEntry.billableState,
        usagePlan.ledgerEntry.sourceRecordId
      ]
    );
    const auditSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_audit.agent_run_audit_event
      where audit_event_id = $1 and event_type = 'run.audit'`,
      [auditEvent.event_id]
    );
    const evidenceSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_core.evidence_record
      where evidence_record_id = $1`,
      [evidenceRecord.evidenceRecordId]
    );
    const usageSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_core.usage_event
      where usage_event_id = $1`,
      [usagePlan.event.usageEventId]
    );
    const ledgerSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_core.usage_ledger_entry
      where ledger_entry_id = $1`,
      [usagePlan.ledgerEntry.ledgerEntryId]
    );
    const selectedRows =
      Number(auditSelect.rows[0]?.row_count ?? 0) +
      Number(evidenceSelect.rows[0]?.row_count ?? 0) +
      Number(usageSelect.rows[0]?.row_count ?? 0) +
      Number(ledgerSelect.rows[0]?.row_count ?? 0);

    if (selectedRows !== 4) {
      throw new Error("agent run live write smoke readback mismatch");
    }

    const ledgerDelete = await client.query(
      `delete from aiphabee_core.usage_ledger_entry
      where ledger_entry_id = $1`,
      [usagePlan.ledgerEntry.ledgerEntryId]
    );
    const usageEventDelete = await client.query(
      `delete from aiphabee_core.usage_event
      where usage_event_id = $1`,
      [usagePlan.event.usageEventId]
    );
    const meterRuleDelete = await client.query(
      `delete from aiphabee_core.usage_meter_rule
      where meter_rule_id = $1`,
      [usagePlan.ledgerEntry.meterRuleId]
    );
    const sourceRefDelete = await client.query(
      `delete from aiphabee_core.evidence_source_ref
      where evidence_record_id = $1`,
      [evidenceRecord.evidenceRecordId]
    );
    const evidenceDelete = await client.query(
      `delete from aiphabee_core.evidence_record
      where evidence_record_id = $1`,
      [evidenceRecord.evidenceRecordId]
    );
    const workspaceDelete = await client.query(
      `delete from platform.workspace
      where workspace_id = $1`,
      [workspaceId]
    );
    const accountDelete = await client.query(
      `delete from platform.account
      where account_id = $1`,
      [accountId]
    );
    const auditDelete = await client.query(
      `delete from aiphabee_audit.agent_run_audit_event
      where audit_event_id = $1`,
      [auditEvent.event_id]
    );

    await client.query("COMMIT");
    committed = true;

    const insertedRows =
      (auditInsert.rowCount ?? 0) +
      (evidenceInsert.rowCount ?? 0) +
      (sourceRefInsert.rowCount ?? 0) +
      (accountInsert.rowCount ?? 0) +
      (workspaceInsert.rowCount ?? 0) +
      (meterRuleInsert.rowCount ?? 0) +
      (usageEventInsert.rowCount ?? 0) +
      (ledgerEntryInsert.rowCount ?? 0);
    const deletedRows =
      (ledgerDelete.rowCount ?? 0) +
      (usageEventDelete.rowCount ?? 0) +
      (meterRuleDelete.rowCount ?? 0) +
      (sourceRefDelete.rowCount ?? 0) +
      (evidenceDelete.rowCount ?? 0) +
      (workspaceDelete.rowCount ?? 0) +
      (accountDelete.rowCount ?? 0) +
      (auditDelete.rowCount ?? 0);

    return {
      audit_event_hash: await hashRuntimeSmokeString(auditEvent.event_id),
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: deletedRows === insertedRows,
      deleted_rows: deletedRows,
      evidence_record_id_hash: await hashRuntimeSmokeString(evidenceRecord.evidenceRecordId),
      inserted_rows: insertedRows,
      ledger_entry_id_hash: await hashRuntimeSmokeString(usagePlan.ledgerEntry.ledgerEntryId),
      operation_count: 21,
      production_persistence_enabled: false,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      selected_rows: selectedRows,
      status: "passed",
      surface: "agent_run_audit_evidence_usage_insert_select_delete",
      tables: [
        "aiphabee_audit.agent_run_audit_event",
        "aiphabee_core.evidence_record",
        "aiphabee_core.evidence_source_ref",
        "platform.account",
        "platform.workspace",
        "aiphabee_core.usage_meter_rule",
        "aiphabee_core.usage_event",
        "aiphabee_core.usage_ledger_entry"
      ],
      usage_event_id_hash: await hashRuntimeSmokeString(usagePlan.event.usageEventId)
    };
  } catch (error) {
    if (transactionStarted && !committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    return failedAgentRunLiveWriteSmokeResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "agent_run_live_write_failed",
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runAgentRunStatePersistenceSmoke(
  env: WorkerBindings,
  requestId: string
): Promise<AgentRunStatePersistenceSmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingAgentRunStatePersistenceSmokeResult("missing_hyperdrive_binding");
  }

  const safeRequestId = requestId.replace(/[^A-Za-z0-9_]/gu, "_").slice(0, 80);
  const runId = `agent_run_state_smoke_${safeRequestId}`;
  const runStateId = `run_state_${runId}`;
  const checkpointId = `checkpoint_${runId}_step_1`;
  const accountId = `account_${runId}`;
  const workspaceId = `workspace_${runId}`;
  const resumeToken = `resume_${runId}`;
  const idempotencyKey = `idempotency_${runId}_step_1`;
  const smokeVersion = AGENT_RUN_STATE_PERSISTENCE_SMOKE_VERSION;
  const initialStatePayload = JSON.stringify({
    completed_step_count: 0,
    current_step_id: "step.fetch_quote",
    recovery_state: {
      checkpoint_table: "aiphabee_core.agent_run_checkpoint",
      persisted: true,
      state_store: "aiphabee_core.agent_run_state"
    },
    requested_tools: ["get_quote_snapshot"],
    route: `POST ${AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE}`,
    run_id: runId,
    status: "running",
    total_step_count: 2,
    version: smokeVersion
  });
  const checkpointPayload = JSON.stringify({
    checkpoint_sequence: 1,
    completed_step_id: "step.fetch_quote",
    evidence_binding: "hash_only",
    next_step_id: "step.answer_contract",
    retry_attempt_count: 0,
    status: "completed",
    version: smokeVersion
  });
  const partialStatePayload = JSON.stringify({
    completed_step_count: 1,
    current_step_id: "step.answer_contract",
    recovery_state: {
      checkpoint_table: "aiphabee_core.agent_run_checkpoint",
      persisted: true,
      state_store: "aiphabee_core.agent_run_state"
    },
    requested_tools: ["get_quote_snapshot"],
    route: `POST ${AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE}`,
    run_id: runId,
    status: "partial",
    total_step_count: 2,
    version: smokeVersion
  });
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  const queryLabel = "agent-run-state-persistence-smoke:v0:state-checkpoint";
  const resumeTokenHash = await hashRuntimeSmokeString(resumeToken);
  const idempotencyKeyHash = await hashRuntimeSmokeString(idempotencyKey);
  let transactionStarted = false;
  let committed = false;

  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const stateInsert = await client.query(
      `insert into aiphabee_core.agent_run_state (
        run_state_id,
        run_id,
        request_id,
        workspace_id,
        account_id,
        status,
        current_step_id,
        completed_step_count,
        total_step_count,
        resume_token_hash,
        idempotency_key_hash,
        state_json,
        state_hash,
        default_rights_status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14)
      on conflict (run_state_id) do update set
        run_id = excluded.run_id,
        request_id = excluded.request_id,
        workspace_id = excluded.workspace_id,
        account_id = excluded.account_id,
        status = excluded.status,
        current_step_id = excluded.current_step_id,
        completed_step_count = excluded.completed_step_count,
        total_step_count = excluded.total_step_count,
        resume_token_hash = excluded.resume_token_hash,
        idempotency_key_hash = excluded.idempotency_key_hash,
        state_json = excluded.state_json,
        state_hash = excluded.state_hash,
        default_rights_status = excluded.default_rights_status,
        updated_at = now()`,
      [
        runStateId,
        runId,
        requestId,
        workspaceId,
        accountId,
        "running",
        "step.fetch_quote",
        0,
        2,
        resumeTokenHash,
        idempotencyKeyHash,
        initialStatePayload,
        await hashRuntimeSmokeString(initialStatePayload),
        "default_deny"
      ]
    );
    const checkpointInsert = await client.query(
      `insert into aiphabee_core.agent_run_checkpoint (
        checkpoint_id,
        run_state_id,
        step_id,
        step_status,
        checkpoint_sequence,
        checkpoint_json,
        checkpoint_hash,
        idempotency_key_hash,
        evidence_record_id,
        usage_event_id,
        default_rights_status
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
      on conflict (checkpoint_id) do update set
        run_state_id = excluded.run_state_id,
        step_id = excluded.step_id,
        step_status = excluded.step_status,
        checkpoint_sequence = excluded.checkpoint_sequence,
        checkpoint_json = excluded.checkpoint_json,
        checkpoint_hash = excluded.checkpoint_hash,
        idempotency_key_hash = excluded.idempotency_key_hash,
        evidence_record_id = excluded.evidence_record_id,
        usage_event_id = excluded.usage_event_id,
        default_rights_status = excluded.default_rights_status`,
      [
        checkpointId,
        runStateId,
        "step.fetch_quote",
        "completed",
        1,
        checkpointPayload,
        await hashRuntimeSmokeString(checkpointPayload),
        idempotencyKeyHash,
        null,
        null,
        "default_deny"
      ]
    );
    const stateSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_core.agent_run_state
      where run_state_id = $1 and status = 'running'`,
      [runStateId]
    );
    const checkpointSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_core.agent_run_checkpoint
      where checkpoint_id = $1 and step_status = 'completed'`,
      [checkpointId]
    );
    const stateUpdate = await client.query(
      `update aiphabee_core.agent_run_state
      set status = $2,
        current_step_id = $3,
        completed_step_count = $4,
        state_json = $5::jsonb,
        state_hash = $6,
        updated_at = now()
      where run_state_id = $1`,
      [
        runStateId,
        "partial",
        "step.answer_contract",
        1,
        partialStatePayload,
        await hashRuntimeSmokeString(partialStatePayload)
      ]
    );
    const updatedStateSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_core.agent_run_state
      where run_state_id = $1 and status = 'partial' and completed_step_count = 1`,
      [runStateId]
    );
    const selectedRows =
      Number(stateSelect.rows[0]?.row_count ?? 0) +
      Number(checkpointSelect.rows[0]?.row_count ?? 0) +
      Number(updatedStateSelect.rows[0]?.row_count ?? 0);

    if (selectedRows !== 3 || (stateUpdate.rowCount ?? 0) !== 1) {
      throw new Error("agent run state persistence smoke readback mismatch");
    }

    const checkpointDelete = await client.query(
      `delete from aiphabee_core.agent_run_checkpoint
      where checkpoint_id = $1`,
      [checkpointId]
    );
    const stateDelete = await client.query(
      `delete from aiphabee_core.agent_run_state
      where run_state_id = $1`,
      [runStateId]
    );

    await client.query("COMMIT");
    committed = true;

    const insertedRows = (stateInsert.rowCount ?? 0) + (checkpointInsert.rowCount ?? 0);
    const deletedRows = (checkpointDelete.rowCount ?? 0) + (stateDelete.rowCount ?? 0);

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      checkpoint_id_hash: await hashRuntimeSmokeString(checkpointId),
      cleanup_verified: deletedRows === insertedRows,
      deleted_rows: deletedRows,
      durable_run_state_smoke: true,
      idempotency_key_hash: idempotencyKeyHash,
      inserted_rows: insertedRows,
      operation_count: 10,
      production_persistence_enabled: false,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      resume_token_hash: resumeTokenHash,
      run_state_id_hash: await hashRuntimeSmokeString(runStateId),
      selected_rows: selectedRows,
      status: "passed",
      surface: "agent_run_state_checkpoint_insert_select_update_delete",
      tables: ["aiphabee_core.agent_run_state", "aiphabee_core.agent_run_checkpoint"],
      updated_rows: stateUpdate.rowCount ?? 0,
      user_facing_resume_enabled: false
    };
  } catch (error) {
    if (transactionStarted && !committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    return failedAgentRunStatePersistenceSmokeResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "agent_run_state_persistence_failed",
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runAgentBillingPostedLedgerSmoke(
  env: WorkerBindings,
  requestId: string
): Promise<AgentBillingPostedLedgerSmokeResult> {
  const hyperdrive = env.AIPHABEE_HYPERDRIVE;

  if (!isRuntimeHyperdrive(hyperdrive)) {
    return missingAgentBillingPostedLedgerSmokeResult("missing_hyperdrive_binding");
  }

  const safeRequestId = requestId.replace(/[^A-Za-z0-9_]/gu, "_").slice(0, 80);
  const runId = `agent_billing_posted_ledger_smoke_${safeRequestId}`;
  const accountId = `account_${runId}`;
  const workspaceId = `workspace_${runId}`;
  const sourceRecordId = `source:${runId}`;
  const idempotencyKey = `idempotency_${runId}_billing_posted`;
  const smokeVersion = AGENT_BILLING_POSTED_LEDGER_SMOKE_VERSION;
  const postedAt = "2026-06-22T00:05:00.000Z";
  const usagePlan = createUsageLedgerEventPlan({
    accountId,
    cached: false,
    channel: "web",
    credits: 2,
    dataVersion: "agent-billing-posted-ledger-smoke-usage-v0",
    dataset: "agent_billing_smoke",
    gatewayStatus: "ok",
    inputUnits: 8,
    meteredFields: 1,
    meteredRows: 1,
    methodologyVersion: smokeVersion,
    occurredAt: "2026-06-22T00:00:00.000Z",
    operation: "agent_run",
    outputUnits: 12,
    qualityState: "PASS",
    requestId,
    rightsPolicyVersion: "default_deny",
    runId,
    sourceRecordId,
    toolName: "get_quote_snapshot",
    workspaceId
  });
  const client = new Client({
    connectionString: hyperdrive.connectionString
  });
  const queryLabel = "agent-billing-posted-ledger-smoke:v0:preview-posted-idempotency";
  let transactionStarted = false;
  let committed = false;

  try {
    if (usagePlan.ledgerEntry.billableState !== "preview") {
      throw new Error("agent billing posted ledger smoke must start from preview");
    }

    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountInsert = await client.query(
      `insert into platform.account (
        account_id,
        email_hash,
        display_name,
        status,
        region,
        default_timezone,
        data_retention_state,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (account_id) do update set
        email_hash = excluded.email_hash,
        display_name = excluded.display_name,
        status = excluded.status,
        region = excluded.region,
        default_timezone = excluded.default_timezone,
        data_retention_state = excluded.data_retention_state,
        source_record_id = excluded.source_record_id,
        updated_at = now()`,
      [
        accountId,
        await hashRuntimeSmokeString(accountId),
        "Agent billing posted ledger smoke",
        "active",
        "HK",
        "Asia/Hong_Kong",
        "standard",
        sourceRecordId
      ]
    );
    const workspaceInsert = await client.query(
      `insert into platform.workspace (
        workspace_id,
        owner_account_id,
        display_name,
        billing_region,
        data_region,
        status,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (workspace_id) do update set
        owner_account_id = excluded.owner_account_id,
        display_name = excluded.display_name,
        billing_region = excluded.billing_region,
        data_region = excluded.data_region,
        status = excluded.status,
        source_record_id = excluded.source_record_id,
        updated_at = now()`,
      [
        workspaceId,
        accountId,
        "Agent billing posted ledger smoke",
        "HK",
        "HK",
        "active",
        sourceRecordId
      ]
    );
    const meterRuleInsert = await client.query(
      `insert into aiphabee_core.usage_meter_rule (
        meter_rule_id,
        meter_name,
        channel,
        dataset,
        operation,
        unit_name,
        credit_weight,
        rights_policy_version,
        methodology_version,
        effective_from,
        status,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      on conflict (meter_rule_id) do update set
        meter_name = excluded.meter_name,
        channel = excluded.channel,
        dataset = excluded.dataset,
        operation = excluded.operation,
        unit_name = excluded.unit_name,
        credit_weight = excluded.credit_weight,
        rights_policy_version = excluded.rights_policy_version,
        methodology_version = excluded.methodology_version,
        effective_from = excluded.effective_from,
        status = excluded.status,
        source_record_id = excluded.source_record_id,
        updated_at = now()`,
      [
        usagePlan.ledgerEntry.meterRuleId,
        "Agent billing posted ledger smoke credit",
        usagePlan.event.channel,
        usagePlan.event.dataset,
        usagePlan.event.operation,
        "credit",
        usagePlan.ledgerEntry.creditDelta,
        usagePlan.event.rightsPolicyVersion,
        usagePlan.event.methodologyVersion,
        usagePlan.event.occurredAt,
        "planned",
        sourceRecordId
      ]
    );
    const usageEventInsert = await client.query(
      `insert into aiphabee_core.usage_event (
        usage_event_id,
        request_id,
        run_id,
        workspace_id,
        account_id,
        channel,
        dataset,
        tool_name,
        operation,
        occurred_at,
        metered_rows,
        metered_fields,
        input_units,
        output_units,
        cache_state,
        quality_state,
        data_version,
        methodology_version,
        rights_policy_version,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      on conflict (usage_event_id) do update set
        request_id = excluded.request_id,
        run_id = excluded.run_id,
        workspace_id = excluded.workspace_id,
        account_id = excluded.account_id,
        channel = excluded.channel,
        dataset = excluded.dataset,
        tool_name = excluded.tool_name,
        operation = excluded.operation,
        occurred_at = excluded.occurred_at,
        metered_rows = excluded.metered_rows,
        metered_fields = excluded.metered_fields,
        input_units = excluded.input_units,
        output_units = excluded.output_units,
        cache_state = excluded.cache_state,
        quality_state = excluded.quality_state,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        source_record_id = excluded.source_record_id`,
      [
        usagePlan.event.usageEventId,
        usagePlan.event.requestId,
        usagePlan.event.runId ?? null,
        usagePlan.event.workspaceId,
        usagePlan.event.accountId ?? null,
        usagePlan.event.channel,
        usagePlan.event.dataset,
        usagePlan.event.toolName ?? null,
        usagePlan.event.operation,
        usagePlan.event.occurredAt,
        usagePlan.event.meteredRows,
        usagePlan.event.meteredFields,
        usagePlan.event.inputUnits,
        usagePlan.event.outputUnits,
        usagePlan.event.cacheState,
        usagePlan.event.qualityState,
        usagePlan.event.dataVersion,
        usagePlan.event.methodologyVersion,
        usagePlan.event.rightsPolicyVersion,
        usagePlan.event.sourceRecordId
      ]
    );
    const ledgerEntryInsert = await client.query(
      `insert into aiphabee_core.usage_ledger_entry (
        ledger_entry_id,
        usage_event_id,
        workspace_id,
        account_id,
        subscription_id,
        meter_rule_id,
        credit_delta,
        billable_state,
        source_record_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (ledger_entry_id) do update set
        usage_event_id = excluded.usage_event_id,
        workspace_id = excluded.workspace_id,
        account_id = excluded.account_id,
        subscription_id = excluded.subscription_id,
        meter_rule_id = excluded.meter_rule_id,
        credit_delta = excluded.credit_delta,
        billable_state = excluded.billable_state,
        source_record_id = excluded.source_record_id,
        posted_at = null,
        updated_at = now()`,
      [
        usagePlan.ledgerEntry.ledgerEntryId,
        usagePlan.ledgerEntry.usageEventId,
        usagePlan.ledgerEntry.workspaceId,
        usagePlan.ledgerEntry.accountId ?? null,
        usagePlan.ledgerEntry.subscriptionId ?? null,
        usagePlan.ledgerEntry.meterRuleId,
        usagePlan.ledgerEntry.creditDelta,
        usagePlan.ledgerEntry.billableState,
        usagePlan.ledgerEntry.sourceRecordId
      ]
    );
    const previewSelect = await client.query<{ row_count: number | string }>(
      `select count(*)::int as row_count
      from aiphabee_core.usage_ledger_entry
      where ledger_entry_id = $1 and billable_state = 'preview' and posted_at is null`,
      [usagePlan.ledgerEntry.ledgerEntryId]
    );
    const postedUpdate = await client.query(
      `update aiphabee_core.usage_ledger_entry
      set billable_state = 'posted',
        posted_at = $2::timestamptz,
        updated_at = now()
      where ledger_entry_id = $1 and billable_state = 'preview'`,
      [usagePlan.ledgerEntry.ledgerEntryId, postedAt]
    );
    const idempotentPostedUpdate = await client.query(
      `update aiphabee_core.usage_ledger_entry
      set billable_state = 'posted',
        posted_at = $2::timestamptz,
        updated_at = now()
      where ledger_entry_id = $1 and billable_state = 'preview'`,
      [usagePlan.ledgerEntry.ledgerEntryId, postedAt]
    );
    const postedSelect = await client.query<{
      credit_delta: number | string;
      row_count: number | string;
    }>(
      `select count(*)::int as row_count,
        coalesce(sum(credit_delta), 0)::numeric as credit_delta
      from aiphabee_core.usage_ledger_entry
      where ledger_entry_id = $1 and billable_state = 'posted' and posted_at = $2::timestamptz`,
      [usagePlan.ledgerEntry.ledgerEntryId, postedAt]
    );
    const previewRows = Number(previewSelect.rows[0]?.row_count ?? 0);
    const postedRows = Number(postedSelect.rows[0]?.row_count ?? 0);
    const postedCreditDelta = Number(postedSelect.rows[0]?.credit_delta ?? 0);
    const updatedRows = postedUpdate.rowCount ?? 0;
    const idempotentSkippedRows = idempotentPostedUpdate.rowCount ?? 0;
    const selectedRows = previewRows + postedRows;

    if (
      previewRows !== 1 ||
      postedRows !== 1 ||
      postedCreditDelta !== usagePlan.ledgerEntry.creditDelta ||
      updatedRows !== 1 ||
      idempotentSkippedRows !== 0
    ) {
      throw new Error("agent billing posted ledger smoke no-double-charge mismatch");
    }

    const ledgerDelete = await client.query(
      `delete from aiphabee_core.usage_ledger_entry
      where ledger_entry_id = $1`,
      [usagePlan.ledgerEntry.ledgerEntryId]
    );
    const usageEventDelete = await client.query(
      `delete from aiphabee_core.usage_event
      where usage_event_id = $1`,
      [usagePlan.event.usageEventId]
    );
    const meterRuleDelete = await client.query(
      `delete from aiphabee_core.usage_meter_rule
      where meter_rule_id = $1`,
      [usagePlan.ledgerEntry.meterRuleId]
    );
    const workspaceDelete = await client.query(
      `delete from platform.workspace
      where workspace_id = $1`,
      [workspaceId]
    );
    const accountDelete = await client.query(
      `delete from platform.account
      where account_id = $1`,
      [accountId]
    );

    await client.query("COMMIT");
    committed = true;

    const insertedRows =
      (accountInsert.rowCount ?? 0) +
      (workspaceInsert.rowCount ?? 0) +
      (meterRuleInsert.rowCount ?? 0) +
      (usageEventInsert.rowCount ?? 0) +
      (ledgerEntryInsert.rowCount ?? 0);
    const deletedRows =
      (ledgerDelete.rowCount ?? 0) +
      (usageEventDelete.rowCount ?? 0) +
      (meterRuleDelete.rowCount ?? 0) +
      (workspaceDelete.rowCount ?? 0) +
      (accountDelete.rowCount ?? 0);

    return {
      binding_name: "AIPHABEE_HYPERDRIVE",
      billing_provider_calls: false,
      cleanup_verified: deletedRows === insertedRows,
      deleted_rows: deletedRows,
      idempotency_key_hash: await hashRuntimeSmokeString(idempotencyKey),
      idempotent_skipped_rows: idempotentSkippedRows,
      inserted_rows: insertedRows,
      ledger_entry_id_hash: await hashRuntimeSmokeString(usagePlan.ledgerEntry.ledgerEntryId),
      no_double_charge_verified:
        updatedRows === 1 &&
        idempotentSkippedRows === 0 &&
        postedRows === 1 &&
        postedCreditDelta === usagePlan.ledgerEntry.creditDelta,
      operation_count: 16,
      posted_credit_delta: postedCreditDelta,
      posted_ledger_entry_hash: await hashRuntimeSmokeString(
        JSON.stringify({
          billable_state: "posted",
          credit_delta: postedCreditDelta,
          ledger_entry_id: usagePlan.ledgerEntry.ledgerEntryId,
          posted_at: postedAt
        })
      ),
      posted_rows: postedRows,
      production_billing_posted: false,
      query_hash: await hashRuntimeSmokeString(queryLabel),
      selected_rows: selectedRows,
      status: "passed",
      surface: "agent_billing_posted_ledger_preview_to_posted_idempotency",
      synthetic_posted_transition: true,
      tables: [
        "platform.account",
        "platform.workspace",
        "aiphabee_core.usage_meter_rule",
        "aiphabee_core.usage_event",
        "aiphabee_core.usage_ledger_entry"
      ],
      updated_rows: updatedRows,
      usage_event_id_hash: await hashRuntimeSmokeString(usagePlan.event.usageEventId)
    };
  } catch (error) {
    if (transactionStarted && !committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    return failedAgentBillingPostedLedgerSmokeResult({
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "agent_billing_posted_ledger_failed",
      queryLabel
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}

function handleCloudflareScheduled(
  controller: RuntimeScheduledController,
  env: WorkerBindings,
  ctx: RuntimeExecutionContext
): void {
  const task = runCloudflareCronSmoke(env, controller, {
    evidenceKey: CLOUDFLARE_CRON_NATURAL_EVIDENCE_KEY,
    retainEvidence: true,
    surface: "cron_natural_trigger_evidence"
  }).then((result) => {
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

function missingCloudflareCronResult(
  failureCode: string,
  surface: CloudflareCronSmokeResult["surface"] = "cron_handler_smoke"
): CloudflareCronSmokeResult {
  return {
    binding_name: "AIPHABEE_MAINTENANCE_CRON",
    failure_code: failureCode,
    status: "missing_binding",
    surface
  };
}

function missingCloudflareHyperdriveResult(
  failureCode: string
): CloudflareHyperdriveSmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "hyperdrive_select_1_smoke"
  };
}

function missingCloudflareHyperdriveSchemaInventoryResult(
  failureCode: string
): CloudflareHyperdriveSchemaInventoryResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "platform_umbrella_schema_inventory"
  };
}

function missingPlatformUmbrellaRlsFixtureSmokeResult(
  failureCode: string
): PlatformUmbrellaRlsFixtureSmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    cleanup_rolled_back: false,
    failure_code: failureCode,
    status: "missing_binding",
    surface: "platform_umbrella_rls_fixture_smoke"
  };
}

function missingPlatformRuntimeRoleSmokeResult(
  failureCode: string
): PlatformRuntimeRoleSmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "platform_runtime_role_smoke"
  };
}

function missingEvidenceLiveDbWriteSmokeResult(
  failureCode: string
): EvidenceLiveDbWriteSmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    status: "missing_binding",
    surface: "evidence_record_source_ref_insert_select_delete"
  };
}

function missingHkIpoPublicHeldDbApplySmokeResult(
  failureCode: string
): HkIpoPublicHeldDbApplySmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    production_promotion_enabled: false,
    status: "missing_binding",
    surface: "hk_ipo_public_held_rows_insert_select_delete",
    writes_serving_tables: false
  };
}

function missingHkIpoPublicHeldDbApplyResult(
  failureCode: string
): HkIpoPublicHeldDbApplyResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    production_promotion_enabled: false,
    status: "missing_binding",
    surface: "hk_ipo_public_live_held_rows_upsert_readback",
    writes_serving_tables: false
  };
}

function missingHkIpoPublicHeldDbReadbackResult(
  failureCode: string
): HkIpoPublicHeldDbReadbackResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    production_promotion_enabled: false,
    status: "missing_binding",
    surface: "hk_ipo_public_live_held_rows_readback",
    writes_serving_tables: false
  };
}

function missingMcpDeveloperConsoleLogStoreSmokeResult(
  failureCode: string
): McpDeveloperConsoleLogStoreSmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    developer_console_live: false,
    failure_code: failureCode,
    frontend_rendering: false,
    live_api_key_generation: false,
    live_console_log_store: false,
    live_console_log_store_smoke: true,
    live_oauth_provider: false,
    live_tool_execution: false,
    live_usage_ledger_reads: false,
    production_console_log_store: false,
    status: "missing_binding",
    surface: "mcp_developer_console_request_log_insert_select_delete"
  };
}

function missingAgentRunLiveWriteSmokeResult(failureCode: string): AgentRunLiveWriteSmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    production_persistence_enabled: false,
    status: "missing_binding",
    surface: "agent_run_audit_evidence_usage_insert_select_delete"
  };
}

function missingAgentRunStatePersistenceSmokeResult(
  failureCode: string
): AgentRunStatePersistenceSmokeResult {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    durable_run_state_smoke: true,
    failure_code: failureCode,
    production_persistence_enabled: false,
    status: "missing_binding",
    surface: "agent_run_state_checkpoint_insert_select_update_delete",
    user_facing_resume_enabled: false
  };
}

function missingAgentBillingPostedLedgerSmokeResult(
  failureCode: string
): AgentBillingPostedLedgerSmokeResult {
  return {
    billing_provider_calls: false,
    binding_name: "AIPHABEE_HYPERDRIVE",
    failure_code: failureCode,
    production_billing_posted: false,
    status: "missing_binding",
    surface: "agent_billing_posted_ledger_preview_to_posted_idempotency",
    synthetic_posted_transition: true
  };
}

function missingAiGatewayLiveSmokeEnv(env: WorkerBindings): string[] {
  const requiredEnv: Array<readonly [string, string | undefined]> = [
    ["CLOUDFLARE_ACCOUNT_ID", env.CLOUDFLARE_ACCOUNT_ID],
    ["AI_GATEWAY_NAME", env.AI_GATEWAY_NAME],
    ["AI_GATEWAY_SMOKE_MODEL", env.AI_GATEWAY_SMOKE_MODEL]
  ];
  const missing = requiredEnv
    .filter(([, value]) => typeof value !== "string" || value.trim().length === 0)
    .map(([name]) => name);

  if (getAiGatewayLiveSmokeToken(env).length === 0) {
    missing.splice(1, 0, "CLOUDFLARE_API_TOKEN or AI_GATEWAY_LIVE_SMOKE_TOKEN");
  }

  return missing;
}

function getAiGatewayLiveSmokeToken(env: WorkerBindings): string {
  const runtimeToken = env.CLOUDFLARE_API_TOKEN?.trim();

  if (runtimeToken) {
    return runtimeToken;
  }

  return env.AI_GATEWAY_LIVE_SMOKE_TOKEN?.trim() ?? "";
}

function missingAgentModelExecutionAuditSmokeEnv(env: WorkerBindings): string[] {
  const missingEnv = missingAiGatewayLiveSmokeEnv(env);

  if (getAgentModelExecutionAuditSmokeToken(env).length < 16) {
    return [AGENT_MODEL_EXECUTION_AUDIT_SMOKE_TOKEN_BINDING, ...missingEnv];
  }

  return missingEnv;
}

function getAgentModelExecutionAuditSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN?.trim() ?? "";
}

function missingAgentLiveToolLoopSmokeEnv(env: WorkerBindings): string[] {
  const missingEnv = missingAiGatewayLiveSmokeEnv(env);

  if (getAgentLiveToolLoopSmokeToken(env).length < 16) {
    return [AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN_BINDING, ...missingEnv];
  }

  return missingEnv;
}

function getAgentLiveToolLoopSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN?.trim() ?? "";
}

function missingAgentGeneratedAnswerEvidenceSmokeEnv(env: WorkerBindings): string[] {
  return getAgentGeneratedAnswerEvidenceSmokeToken(env).length >= 16
    ? []
    : [AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_TOKEN_BINDING];
}

function getAgentGeneratedAnswerEvidenceSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN?.trim() ?? "";
}

function missingAgentRunLiveWriteSmokeEnv(env: WorkerBindings): string[] {
  return getAgentRunLiveWriteSmokeToken(env).length >= 16
    ? []
    : [AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN_BINDING];
}

function getAgentRunLiveWriteSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN?.trim() ?? "";
}

function missingAgentRunStatePersistenceSmokeEnv(env: WorkerBindings): string[] {
  return getAgentRunStatePersistenceSmokeToken(env).length >= 16
    ? []
    : [AGENT_RUN_STATE_PERSISTENCE_SMOKE_TOKEN_BINDING];
}

function getAgentRunStatePersistenceSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN?.trim() ?? "";
}

function missingAgentBillingPostedLedgerSmokeEnv(env: WorkerBindings): string[] {
  return getAgentBillingPostedLedgerSmokeToken(env).length >= 16
    ? []
    : [AGENT_BILLING_POSTED_LEDGER_SMOKE_TOKEN_BINDING];
}

function getAgentBillingPostedLedgerSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN?.trim() ?? "";
}

function missingAgentToolExecutionSmokeEnv(env: WorkerBindings): string[] {
  return getAgentToolExecutionSmokeToken(env).length >= 16
    ? []
    : [AGENT_TOOL_EXECUTION_SMOKE_TOKEN_BINDING];
}

function getAgentToolExecutionSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN?.trim() ?? "";
}

function missingEvidenceLiveDbWriteSmokeEnv(env: WorkerBindings): string[] {
  return getEvidenceLiveDbWriteSmokeToken(env).length >= 16
    ? []
    : [EVIDENCE_LIVE_DB_SMOKE_TOKEN_BINDING];
}

function getEvidenceLiveDbWriteSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN?.trim() ?? "";
}

function missingHkIpoPublicHeldDbApplyEnv(env: WorkerBindings): string[] {
  return getHkIpoPublicHeldDbApplyToken(env).length >= 16
    ? []
    : [HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN_BINDING];
}

function getHkIpoPublicHeldDbApplyToken(env: WorkerBindings): string {
  return env.AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN?.trim() ?? "";
}

function missingHkIpoPublicHeldDbApplySmokeEnv(env: WorkerBindings): string[] {
  return getHkIpoPublicHeldDbApplySmokeToken(env).length >= 16
    ? []
    : [HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN_BINDING];
}

function getHkIpoPublicHeldDbApplySmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN?.trim() ?? "";
}

function missingMcpDeveloperConsoleLogStoreSmokeEnv(env: WorkerBindings): string[] {
  return getMcpDeveloperConsoleLogStoreSmokeToken(env).length >= 16
    ? []
    : [MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_TOKEN_BINDING];
}

function getMcpDeveloperConsoleLogStoreSmokeToken(env: WorkerBindings): string {
  return env.AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN?.trim() ?? "";
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
  scheduledTime,
  surface = "cron_handler_smoke"
}: {
  cron: string;
  detail: string;
  evidenceKey: string;
  failureCode: string;
  scheduledTime: number;
  surface?: CloudflareCronSmokeResult["surface"];
}): Promise<CloudflareCronSmokeResult> {
  return {
    binding_name: "AIPHABEE_MAINTENANCE_CRON",
    cron_hash: await hashRuntimeSmokeString(cron),
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    evidence_key_hash: await hashRuntimeSmokeString(evidenceKey),
    failure_code: failureCode,
    scheduled_time_hash: await hashRuntimeSmokeString(String(scheduledTime)),
    status: "failed",
    surface
  };
}

async function failedCloudflareHyperdriveResult({
  detail,
  failureCode,
  query
}: {
  detail: string;
  failureCode: string;
  query: string;
}): Promise<CloudflareHyperdriveSmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    query_hash: await hashRuntimeSmokeString(query),
    status: "failed",
    surface: "hyperdrive_select_1_smoke"
  };
}

async function failedCloudflareHyperdriveSchemaInventoryResult({
  detail,
  failureCode,
  queryLabel
}: {
  detail: string;
  failureCode: string;
  queryLabel: string;
}): Promise<CloudflareHyperdriveSchemaInventoryResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "platform_umbrella_schema_inventory"
  };
}

async function failedPlatformUmbrellaRlsFixtureSmokeResult({
  cleanupRolledBack,
  detail,
  failureCode,
  failureSqlstate,
  failureStage,
  queryLabel
}: {
  cleanupRolledBack: boolean;
  detail: string;
  failureCode: string;
  failureSqlstate?: string;
  failureStage?: string;
  queryLabel: string;
}): Promise<PlatformUmbrellaRlsFixtureSmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    cleanup_rolled_back: cleanupRolledBack,
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    failure_sqlstate: failureSqlstate,
    failure_stage: failureStage,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "platform_umbrella_rls_fixture_smoke"
  };
}

async function failedPlatformRuntimeRoleSmokeResult({
  detail,
  failureCode,
  queryLabel
}: {
  detail: string;
  failureCode: string;
  queryLabel: string;
}): Promise<PlatformRuntimeRoleSmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "platform_runtime_role_smoke"
  };
}

async function failedEvidenceLiveDbWriteSmokeResult({
  detail,
  failureCode,
  queryLabel
}: {
  detail: string;
  failureCode: string;
  queryLabel: string;
}): Promise<EvidenceLiveDbWriteSmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "evidence_record_source_ref_insert_select_delete"
  };
}

async function failedHkIpoPublicHeldDbApplySmokeResult({
  detail,
  errorCode,
  failureCode,
  failureStage,
  queryLabel
}: {
  detail: string;
  errorCode?: string;
  failureCode: string;
  failureStage: string;
  queryLabel: string;
}): Promise<HkIpoPublicHeldDbApplySmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    ...(errorCode ? { error_code: errorCode } : {}),
    failure_code: failureCode,
    failure_stage: failureStage,
    production_promotion_enabled: false,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "hk_ipo_public_held_rows_insert_select_delete",
    writes_serving_tables: false
  };
}

async function failedHkIpoPublicHeldDbApplyResult({
  detail,
  errorCode,
  failureCode,
  failureStage,
  queryLabel
}: {
  detail: string;
  errorCode?: string;
  failureCode: string;
  failureStage: string;
  queryLabel: string;
}): Promise<HkIpoPublicHeldDbApplyResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    ...(errorCode ? { error_code: errorCode } : {}),
    failure_code: failureCode,
    failure_stage: failureStage,
    production_promotion_enabled: false,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "hk_ipo_public_live_held_rows_upsert_readback",
    writes_serving_tables: false
  };
}

async function failedHkIpoPublicHeldDbReadbackResult({
  detail,
  errorCode,
  failureCode,
  failureStage,
  queryLabel
}: {
  detail: string;
  errorCode?: string;
  failureCode: string;
  failureStage: string;
  queryLabel: string;
}): Promise<HkIpoPublicHeldDbReadbackResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    ...(errorCode ? { error_code: errorCode } : {}),
    failure_code: failureCode,
    failure_stage: failureStage,
    production_promotion_enabled: false,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "hk_ipo_public_live_held_rows_readback",
    writes_serving_tables: false
  };
}

async function failedMcpDeveloperConsoleLogStoreSmokeResult({
  detail,
  failureCode,
  queryLabel
}: {
  detail: string;
  failureCode: string;
  queryLabel: string;
}): Promise<McpDeveloperConsoleLogStoreSmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    developer_console_live: false,
    failure_code: failureCode,
    frontend_rendering: false,
    live_api_key_generation: false,
    live_console_log_store: false,
    live_console_log_store_smoke: true,
    live_oauth_provider: false,
    live_tool_execution: false,
    live_usage_ledger_reads: false,
    production_console_log_store: false,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "mcp_developer_console_request_log_insert_select_delete"
  };
}

async function failedAgentRunLiveWriteSmokeResult({
  detail,
  failureCode,
  queryLabel
}: {
  detail: string;
  failureCode: string;
  queryLabel: string;
}): Promise<AgentRunLiveWriteSmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    production_persistence_enabled: false,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "agent_run_audit_evidence_usage_insert_select_delete"
  };
}

async function failedAgentRunStatePersistenceSmokeResult({
  detail,
  failureCode,
  queryLabel
}: {
  detail: string;
  failureCode: string;
  queryLabel: string;
}): Promise<AgentRunStatePersistenceSmokeResult> {
  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    durable_run_state_smoke: true,
    failure_code: failureCode,
    production_persistence_enabled: false,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "agent_run_state_checkpoint_insert_select_update_delete",
    user_facing_resume_enabled: false
  };
}

async function failedAgentBillingPostedLedgerSmokeResult({
  detail,
  failureCode,
  queryLabel
}: {
  detail: string;
  failureCode: string;
  queryLabel: string;
}): Promise<AgentBillingPostedLedgerSmokeResult> {
  return {
    billing_provider_calls: false,
    binding_name: "AIPHABEE_HYPERDRIVE",
    detail_hash: await hashRuntimeSmokeString(sanitizeRuntimeSmokeDetail(detail)),
    failure_code: failureCode,
    production_billing_posted: false,
    query_hash: await hashRuntimeSmokeString(queryLabel),
    status: "failed",
    surface: "agent_billing_posted_ledger_preview_to_posted_idempotency",
    synthetic_posted_transition: true
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

async function runtimeR2ObjectExists(bucket: RuntimeR2Bucket, key: string): Promise<boolean> {
  if (typeof bucket.head === "function") {
    return (await bucket.head(key)) !== null;
  }

  return (await bucket.get(key)) !== null;
}

function isRuntimeD1Database(value: unknown): value is RuntimeD1Database {
  return isPlainRecord(value) && typeof value.prepare === "function";
}

function isRuntimeQueue(value: unknown): value is RuntimeQueue {
  return isPlainRecord(value) && typeof value.send === "function";
}

function isRuntimeHyperdrive(value: unknown): value is RuntimeHyperdrive {
  return isPlainRecord(value) && typeof value.connectionString === "string";
}

async function countPlatformRows(
  client: Client,
  query: string,
  values: unknown[]
): Promise<number> {
  const result = await client.query<{ row_count: number | string }>(query, values);

  return Number(result.rows[0]?.row_count ?? 0);
}

function missingExpectedRuntimeNames(
  expected: readonly string[],
  observed: ReadonlySet<string>
): string[] {
  return expected.filter((name) => !observed.has(name));
}

function quoteSqlIdentifier(value: string): string {
  return `"${value.replace(/"/gu, "\"\"")}"`;
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

function isCloudflareCronEvidenceRecord(value: unknown): value is {
  cron_hash: string;
  issued_at: string;
  kind: typeof CLOUDFLARE_CRON_SMOKE_KIND;
  scheduled_time_hash: string;
  scheduled_time_ms: number;
  status: "executed";
  type: string;
  value_hash: string;
} {
  return (
    isPlainRecord(value) &&
    value.kind === CLOUDFLARE_CRON_SMOKE_KIND &&
    typeof value.cron_hash === "string" &&
    value.cron_hash.startsWith("sha256:") &&
    typeof value.issued_at === "string" &&
    typeof value.scheduled_time_hash === "string" &&
    value.scheduled_time_hash.startsWith("sha256:") &&
    typeof value.scheduled_time_ms === "number" &&
    Number.isFinite(value.scheduled_time_ms) &&
    value.status === "executed" &&
    typeof value.type === "string" &&
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

function normalizeIntegerArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = value.filter((item): item is number => Number.isInteger(item));
  return values.length > 0 ? [...new Set(values)] : undefined;
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeWatchlistAlertsPlanInput(
  body: WatchlistAlertsRequestBody,
  requestId: string
): CreateWatchlistAlertsPlanInput {
  return {
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
  };
}

function normalizeHighCostUsageExecutionStatus(
  value: unknown
): HighCostUsageExecutionStatus | undefined {
  return value === "failed" || value === "planned" || value === "succeeded" ? value : undefined;
}

function normalizeConsensusEstimateMetrics(
  value: unknown
): ConsensusEstimateMetricId[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const metrics = value.filter(
    (metric): metric is ConsensusEstimateMetricId =>
      metric === "revenue" || metric === "eps" || metric === "ebitda"
  );

  return metrics.length > 0 ? [...new Set(metrics)] : undefined;
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

async function withIpoPostgres<T>(
  env: WorkerBindings,
  callback: (client: Client) => Promise<T>
): Promise<T | undefined> {
  return withHyperdrivePostgresClient(env, callback);
}

async function getLatestReleasedIpoDataVersion(
  client: Client
): Promise<string | undefined> {
  const result = await client.query<{ data_version: string }>(
    `
      select batch.data_version
      from core.data_version_batch batch
      where batch.release_state = 'released'
        and exists (
          select 1
          from core.ipo_offering offering
          where offering.data_version = batch.data_version
        )
      order by coalesce(batch.released_at, batch.created_at) desc, batch.data_version desc
      limit 1
    `
  );

  return result.rows[0]?.data_version;
}

async function readReleasedIpoScreen(
  env: WorkerBindings,
  filters: IpoScreenInput
): Promise<IpoScreenResult | undefined> {
  return withIpoPostgres(env, async (client) => {
    const dataVersion = await getLatestReleasedIpoDataVersion(client);

    if (dataVersion === undefined) {
      return createNoReleasedIpoScreen(filters);
    }

    const rows = await readIpoOfferingRows(client, dataVersion);
    const filteredRows = rows
      .map((row) => ({
        hasCornerstone: row.has_cornerstone === true,
        offering: ipoOfferingFromPostgres(row)
      }))
      .filter(({ hasCornerstone, offering }) =>
        matchesIpoScreenFilters(offering, hasCornerstone, filters)
      )
      .map(({ offering }) => offering);

    return {
      accessPolicy: IPO_ACCESS_POLICY,
      dataVersion,
      filters,
      liveDataAccess: true,
      methodologyVersion: IPO_PIPELINE_VERSION,
      rows: filteredRows,
      status: "released_serving",
      toolName: "screen_ipos",
      totalRows: filteredRows.length
    };
  });
}

async function readReleasedIpoCalendar(
  env: WorkerBindings,
  input: {
    eventTypes?: IpoCalendarEventType[];
    from?: string;
    to?: string;
  }
): Promise<IpoCalendarResult | undefined> {
  return withIpoPostgres(env, async (client) => {
    const dataVersion = await getLatestReleasedIpoDataVersion(client);

    if (dataVersion === undefined) {
      return createNoReleasedIpoCalendar();
    }

    const result = await client.query<IpoServingTimetableRow>(
      `
        select
          event.offering_id,
          event.event_code,
          event.event_type,
          event.event_date,
          event.title_en,
          event.title_zh_hant
        from core.ipo_timetable_event event
        where event.data_version = $1
          and event.event_date is not null
        order by event.event_date asc, event.offering_id asc, event.event_code asc
      `,
      [dataVersion]
    );
    const events = result.rows
      .map(ipoCalendarEventFromPostgres)
      .filter((event): event is IpoCalendarEvent => event !== undefined)
      .filter((event) => !input.from || event.date >= input.from)
      .filter((event) => !input.to || event.date <= input.to)
      .filter(
        (event) => !input.eventTypes?.length || input.eventTypes.includes(event.eventType)
      );

    return {
      accessPolicy: IPO_ACCESS_POLICY,
      dataVersion,
      events,
      liveDataAccess: true,
      methodologyVersion: IPO_PIPELINE_VERSION,
      status: "released_serving",
      toolName: "search_ipo_calendar"
    };
  });
}

async function readReleasedIpoCompare(
  env: WorkerBindings,
  input: { ipoIds?: string[] }
): Promise<IpoCompareResult | undefined> {
  return withIpoPostgres(env, async (client) => {
    const dataVersion = await getLatestReleasedIpoDataVersion(client);

    if (dataVersion === undefined) {
      return createNoReleasedIpoCompare();
    }

    const rows = (await readIpoOfferingRows(client, dataVersion)).map(ipoOfferingFromPostgres);
    const requestedIds = input.ipoIds?.length ? input.ipoIds : rows.slice(0, 3).map((row) => row.id);
    const selected = requestedIds
      .map((id) => rows.find((row) => ipoOfferingMatchesLookup(row, id)))
      .filter((row): row is IpoOfferingFact => row !== undefined)
      .slice(0, 5)
      .map((offering) => ({
        board: offering.board,
        finalOfferPrice: offering.finalOfferPrice,
        fundsRaisedText: offering.fundsRaisedText,
        id: offering.id,
        listingDate: offering.listingDate,
        listingType: offering.listingType,
        marketCapText: offering.marketCapText,
        nameZhHant: offering.nameZhHant,
        oneLotSuccessRate: offering.oneLotSuccessRate,
        overSubscriptionMultiple: offering.overSubscriptionMultiple,
        sector: offering.sector,
        ticker: offering.ticker
      }));

    return {
      accessPolicy: IPO_ACCESS_POLICY,
      dataVersion,
      liveDataAccess: true,
      methodologyVersion: IPO_PIPELINE_VERSION,
      rows: selected,
      status: "released_serving",
      toolName: "compare_ipos"
    };
  });
}

async function readReleasedIpoSnapshot(
  env: WorkerBindings,
  input: {
    includeSensitiveFields?: boolean;
    ipoId?: string;
  }
): Promise<IpoSnapshotServingRead | undefined> {
  return withIpoPostgres(env, async (client) => {
    const dataVersion = await getLatestReleasedIpoDataVersion(client);

    if (dataVersion === undefined) {
      return {
        dataVersion: IPO_NO_RELEASED_DATA_VERSION,
        status: "no_released_data"
      };
    }

    const row = await readIpoOfferingRow(client, dataVersion, input.ipoId);

    if (row === undefined) {
      return {
        dataVersion,
        status: "not_found"
      };
    }

    const offering = ipoOfferingFromPostgres(row);
    const narratives = await readIpoNarratives(client, row.offering_id, dataVersion, offering);
    const timetable = await readIpoTimetable(client, row.offering_id, dataVersion);
    const cornerstones = await readIpoCornerstones(
      client,
      row.offering_id,
      dataVersion,
      input.includeSensitiveFields === true
    );

    const snapshot: IpoWorkbenchSnapshot = {
      accessPolicy: IPO_ACCESS_POLICY,
      capability: getIpoCapabilities({
        liveDataAccess: true,
        status: "released_serving"
      }),
      cornerstones,
      dataVersion,
      liveDataAccess: true,
      methodologyVersion: IPO_PIPELINE_VERSION,
      narratives,
      offering: {
        ...offering,
        desc: narratives[0]?.contentText ?? offering.desc
      },
      provenance: createIpoServingProvenance(dataVersion, row.source_record_id),
      qualityState: normalizeIpoQualityState(row.quality_state),
      researchSignal: createIpoServingResearchSignal(offering),
      status: "released_serving",
      timetable,
      toolName: "get_ipo_profile"
    };

    return {
      snapshot,
      status: "found"
    };
  });
}

async function resolveIpoSnapshotRead(
  env: WorkerBindings,
  input: {
    includeSensitiveFields?: boolean;
    ipoId?: string;
  }
): Promise<IpoSnapshotServingRead> {
  const releasedRead = await readReleasedIpoSnapshot(env, input);

  if (releasedRead !== undefined) {
    return releasedRead;
  }

  try {
    return {
      snapshot: createIpoWorkbenchSnapshot(input),
      status: "found"
    };
  } catch (error) {
    if (error instanceof IpoNotFoundError) {
      return {
        dataVersion: IPO_FIXTURE_DATA_VERSION,
        status: "not_found"
      };
    }

    throw error;
  }
}

async function readIpoOfferingRows(
  client: Client,
  dataVersion: string
): Promise<IpoServingOfferingRow[]> {
  const result = await client.query<IpoServingOfferingRow>(
    `
      select
        offering.*,
        exists (
          select 1
          from core.ipo_cornerstone cornerstone
          where cornerstone.offering_id = offering.offering_id
            and cornerstone.data_version = offering.data_version
        ) as has_cornerstone,
        (
          select narrative.content_text
          from core.ipo_narrative narrative
          where narrative.offering_id = offering.offering_id
            and narrative.data_version = offering.data_version
            and narrative.lang = 'zh_hant'
            and narrative.section_key = 'business_overview'
          order by narrative.created_at asc
          limit 1
        ) as business_overview_text
      from core.ipo_offering offering
      where offering.data_version = $1
      order by offering.listing_date desc, offering.hkex_code asc
    `,
    [dataVersion]
  );

  return result.rows;
}

async function readIpoOfferingRow(
  client: Client,
  dataVersion: string,
  ipoId: string | undefined
): Promise<IpoServingOfferingRow | undefined> {
  const lookup = normalizeIpoLookup(ipoId);

  if (lookup === undefined) {
    const result = await client.query<IpoServingOfferingRow>(
      `
        select
          offering.*,
          exists (
            select 1
            from core.ipo_cornerstone cornerstone
            where cornerstone.offering_id = offering.offering_id
              and cornerstone.data_version = offering.data_version
          ) as has_cornerstone,
          (
            select narrative.content_text
            from core.ipo_narrative narrative
            where narrative.offering_id = offering.offering_id
              and narrative.data_version = offering.data_version
              and narrative.lang = 'zh_hant'
              and narrative.section_key = 'business_overview'
            order by narrative.created_at asc
            limit 1
          ) as business_overview_text
        from core.ipo_offering offering
        where offering.data_version = $1
        order by offering.listing_date desc, offering.hkex_code asc
        limit 1
      `,
      [dataVersion]
    );

    return result.rows[0];
  }

  const result = await client.query<IpoServingOfferingRow>(
    `
      select
        offering.*,
        exists (
          select 1
          from core.ipo_cornerstone cornerstone
          where cornerstone.offering_id = offering.offering_id
            and cornerstone.data_version = offering.data_version
        ) as has_cornerstone,
        (
          select narrative.content_text
          from core.ipo_narrative narrative
          where narrative.offering_id = offering.offering_id
            and narrative.data_version = offering.data_version
            and narrative.lang = 'zh_hant'
            and narrative.section_key = 'business_overview'
          order by narrative.created_at asc
          limit 1
        ) as business_overview_text
      from core.ipo_offering offering
      where offering.data_version = $1
        and (
          lower(offering.offering_id) = lower($2)
          or offering.hkex_code = $3
          or lower(offering.hkex_code || '.HK') = lower($4)
        )
      order by offering.listing_date desc, offering.hkex_code asc
      limit 1
    `,
    [dataVersion, lookup.raw, lookup.hkexCode, lookup.ticker]
  );

  return result.rows[0];
}

async function readIpoNarratives(
  client: Client,
  offeringId: string,
  dataVersion: string,
  offering: IpoOfferingFact
): Promise<IpoNarrativeSection[]> {
  const result = await client.query<IpoServingNarrativeRow>(
    `
      select section_key, lang, content_html, content_text
      from core.ipo_narrative
      where offering_id = $1
        and data_version = $2
        and lang = 'zh_hant'
      order by
        case section_key
          when 'business_overview' then 1
          when 'competitive_strengths' then 2
          when 'risk_factors' then 3
          when 'use_of_proceeds' then 4
          else 9
        end,
        section_key asc
    `,
    [offeringId, dataVersion]
  );
  const narratives = result.rows
    .map(ipoNarrativeFromPostgres)
    .filter((section): section is IpoNarrativeSection => section !== undefined);

  if (narratives.length > 0) {
    return narratives;
  }

  return [
    {
      contentHtml: `<p>${escapeHtml(offering.desc)}</p>`,
      contentText: offering.desc,
      lang: "zh_hant",
      sectionKey: "business_overview",
      title: "业务概览 Business Overview"
    }
  ];
}

async function readIpoTimetable(
  client: Client,
  offeringId: string,
  dataVersion: string
): Promise<IpoCalendarEvent[]> {
  const result = await client.query<IpoServingTimetableRow>(
    `
      select offering_id, event_code, event_type, event_date, title_en, title_zh_hant
      from core.ipo_timetable_event
      where offering_id = $1
        and data_version = $2
        and event_date is not null
      order by event_date asc, event_code asc
    `,
    [offeringId, dataVersion]
  );

  return result.rows
    .map(ipoCalendarEventFromPostgres)
    .filter((event): event is IpoCalendarEvent => event !== undefined);
}

async function readIpoCornerstones(
  client: Client,
  offeringId: string,
  dataVersion: string,
  includeSensitiveFields: boolean
): Promise<IpoCornerstoneFact[]> {
  const result = await client.query<IpoServingCornerstoneRow>(
    `
      select
        investor_name_en,
        investor_name_zh_hant,
        invest_currency_code,
        invest_amount,
        offer_share_pct,
        issued_share_pct,
        lockup_period_text
      from core.ipo_cornerstone
      where offering_id = $1
        and data_version = $2
      order by investor_name_zh_hant asc nulls last, investor_name_en asc nulls last
    `,
    [offeringId, dataVersion]
  );

  return result.rows.map((row) => ({
    amountText: includeSensitiveFields
      ? formatIpoAmountText(row.invest_currency_code, row.invest_amount)
      : null,
    investorName:
      row.investor_name_zh_hant ?? row.investor_name_en ?? "Unknown investor",
    lockupPeriod: row.lockup_period_text,
    pct: numberOrNull(row.offer_share_pct ?? row.issued_share_pct),
    redacted: includeSensitiveFields ? false : true
  }));
}

function createNoReleasedIpoScreen(filters: IpoScreenInput): IpoScreenResult {
  return {
    accessPolicy: IPO_ACCESS_POLICY,
    dataVersion: IPO_NO_RELEASED_DATA_VERSION,
    filters,
    liveDataAccess: true,
    methodologyVersion: IPO_PIPELINE_VERSION,
    rows: [],
    status: "no_released_data",
    toolName: "screen_ipos",
    totalRows: 0
  };
}

function createNoReleasedIpoCalendar(): IpoCalendarResult {
  return {
    accessPolicy: IPO_ACCESS_POLICY,
    dataVersion: IPO_NO_RELEASED_DATA_VERSION,
    events: [],
    liveDataAccess: true,
    methodologyVersion: IPO_PIPELINE_VERSION,
    status: "no_released_data",
    toolName: "search_ipo_calendar"
  };
}

function createNoReleasedIpoCompare(): IpoCompareResult {
  return {
    accessPolicy: IPO_ACCESS_POLICY,
    dataVersion: IPO_NO_RELEASED_DATA_VERSION,
    liveDataAccess: true,
    methodologyVersion: IPO_PIPELINE_VERSION,
    rows: [],
    status: "no_released_data",
    toolName: "compare_ipos"
  };
}

function ipoSnapshotReadDataVersion(snapshotRead: IpoSnapshotServingRead | undefined): string {
  if (snapshotRead === undefined) {
    return IPO_NO_RELEASED_DATA_VERSION;
  }

  return snapshotRead.status === "found"
    ? snapshotRead.snapshot.dataVersion
    : snapshotRead.dataVersion;
}

function ipoOfferingFromPostgres(row: IpoServingOfferingRow): IpoOfferingFact {
  const offerPriceMin = numberOrNull(row.offer_price_min);
  const offerPriceMax = numberOrNull(row.offer_price_max);

  return {
    board: normalizeIpoBoard(row.listing_board),
    boardLot: numberOrNull(row.board_lot) ?? 0,
    clawbackType: normalizeIpoClawbackType(row.clawback_type),
    currency: normalizeIpoCurrency(row.currency_code),
    desc: row.business_overview_text ?? row.name_zh_hant ?? row.name_en ?? row.offering_id,
    exchange: "HKEX",
    finalOfferPrice: numberOrNull(row.final_offer_price),
    fundsRaisedText: firstNonEmpty(
      row.funds_raised_text_zh_hant,
      row.funds_raised_text_en,
      row.funds_raised_text_zh_hans,
      "N/A"
    ),
    hkexCode: row.hkex_code,
    id: row.offering_id,
    listingDate: dateString(row.listing_date) ?? "",
    listingType: normalizeIpoListingType(row.listing_type),
    marketCapText: firstNonEmpty(
      row.market_cap_text_zh_hant,
      row.market_cap_text_en,
      row.market_cap_text_zh_hans,
      "N/A"
    ),
    nameEn: row.name_en ?? row.name_zh_hant ?? row.hkex_code,
    nameZhHans: row.name_zh_hans ?? row.name_zh_hant ?? row.name_en ?? row.hkex_code,
    nameZhHant: row.name_zh_hant ?? row.name_en ?? row.hkex_code,
    offerPriceRange:
      offerPriceMin === null && offerPriceMax === null
        ? null
        : [offerPriceMin ?? offerPriceMax ?? 0, offerPriceMax ?? offerPriceMin ?? 0],
    oneLotSuccessRate: numberOrNull(row.one_lot_success_rate),
    overSubscriptionMultiple: numberOrNull(row.over_subscription_multiple),
    sector: normalizeIpoSector(row.sector_code),
    status: normalizeIpoStatus(row.ipo_status),
    ticker: `${row.hkex_code}.HK`
  };
}

function ipoCalendarEventFromPostgres(
  row: IpoServingTimetableRow
): IpoCalendarEvent | undefined {
  const date = dateString(row.event_date);

  if (date === undefined) {
    return undefined;
  }

  return {
    date,
    eventCode: row.event_code,
    eventType: normalizeIpoEventType(row.event_type, row.event_code, row.title_zh_hant),
    offeringId: row.offering_id,
    titleEn: row.title_en ?? row.event_code,
    titleZhHant: row.title_zh_hant ?? row.event_code
  };
}

function ipoNarrativeFromPostgres(
  row: IpoServingNarrativeRow
): IpoNarrativeSection | undefined {
  const section = normalizeIpoNarrativeSection(row.section_key);

  if (section === undefined) {
    return undefined;
  }

  const contentText = row.content_text ?? "";

  return {
    contentHtml: row.content_html ?? `<p>${escapeHtml(contentText)}</p>`,
    contentText,
    lang: "zh_hant",
    sectionKey: section.sectionKey,
    title: section.title
  };
}

function createIpoServingProvenance(
  dataVersion: string,
  sourceRecordId: string
): IpoProvenance[] {
  return [
    {
      data_version: dataVersion,
      methodology_version: IPO_PIPELINE_VERSION,
      source: "postgres-ipo-serving",
      source_record_id: sourceRecordId
    }
  ];
}

function createIpoRouteProvenance(
  dataVersion: string,
  status: "fixture_scaffold" | "no_released_data" | "released_serving",
  source: string,
  sourceRecordId: string
): IpoProvenance[] {
  const provenanceSource = status === "fixture_scaffold" ? source : "postgres-ipo-serving";

  return [
    {
      data_version: dataVersion,
      methodology_version: IPO_PIPELINE_VERSION,
      source: provenanceSource,
      source_record_id:
        status === "released_serving"
          ? `${sourceRecordId}-released`
          : status === "no_released_data"
            ? `${sourceRecordId}-no-released-data`
            : sourceRecordId
    }
  ];
}

function createIpoServingResearchSignal(offering: IpoOfferingFact): IpoResearchSignalBlock {
  return {
    confidence: 50,
    dims: [
      { key: "chip", label: "筹码分布", score: 50 },
      { key: "sponsor", label: "保荐质量", score: 50 },
      { key: "underwriter", label: "承销实力", score: 50 },
      { key: "sector", label: "板块动能", score: 50 },
      { key: "fundamentals", label: "基本面", score: 50 },
      { key: "cornerstone", label: "基石质量", score: 50 }
    ],
    methodologyVersion: IPO_RESEARCH_METHODOLOGY_VERSION,
    note: `${offering.nameZhHant} 已接入 Postgres 事实层；当前研究信号仅为描述性占位，不构成建议。`,
    signal: "neutral",
    source: "aiphabee_research",
    status: "descriptive_signal_not_advice"
  };
}

function matchesIpoScreenFilters(
  offering: IpoOfferingFact,
  hasCornerstone: boolean,
  input: IpoScreenInput
): boolean {
  if (input.status && offering.status !== input.status) return false;
  if (input.board && offering.board !== input.board) return false;
  if (input.sector && offering.sector !== input.sector) return false;
  if (input.listingType && offering.listingType !== input.listingType) return false;
  if (
    input.minOversubscription !== undefined &&
    (offering.overSubscriptionMultiple ?? 0) < input.minOversubscription
  ) {
    return false;
  }
  if (input.hasCornerstone === true && !hasCornerstone) return false;
  if (input.listingDateFrom && offering.listingDate < input.listingDateFrom) return false;
  if (input.listingDateTo && offering.listingDate > input.listingDateTo) return false;
  return true;
}

function ipoOfferingMatchesLookup(offering: IpoOfferingFact, id: string): boolean {
  const lookup = normalizeIpoLookup(id);

  if (lookup === undefined) {
    return false;
  }

  return (
    offering.id.toLowerCase() === lookup.raw.toLowerCase() ||
    offering.hkexCode === lookup.hkexCode ||
    offering.ticker.toLowerCase() === lookup.ticker.toLowerCase()
  );
}

function normalizeIpoLookup(
  ipoId: string | undefined
): { hkexCode: string; raw: string; ticker: string } | undefined {
  if (!ipoId) {
    return undefined;
  }

  const raw = ipoId.trim();

  if (raw.length === 0) {
    return undefined;
  }

  const withoutSuffix = raw.replace(/\.hk$/iu, "");
  const hkexCode = /^\d+$/u.test(withoutSuffix)
    ? withoutSuffix.padStart(4, "0")
    : withoutSuffix;

  return {
    hkexCode,
    raw,
    ticker: `${hkexCode}.HK`
  };
}

function normalizeIpoBoard(value: string | null): IpoOfferingFact["board"] {
  return value === "GEM" || value === "NASQ" ? value : "MAIN";
}

function normalizeIpoCurrency(value: string | null): IpoOfferingFact["currency"] {
  const upper = value?.toUpperCase();

  if (upper === "USD") return "USD";
  if (upper === "RMB" || upper === "CNY") return "RMB";
  return "HKD";
}

function normalizeIpoClawbackType(value: string | null): IpoOfferingFact["clawbackType"] {
  return value === "A" || value === "B" ? value : "NA";
}

function normalizeIpoListingType(value: string | null): IpoOfferingFact["listingType"] {
  return value === "18A" || value === "18C" ? value : "Normal";
}

function normalizeIpoSector(value: string | null): IpoOfferingFact["sector"] {
  if (value === "03") return "energy";
  if (value === "04") return "fintech";
  if (value === "05") return "health";
  if (value === "07") return "tech";
  return "industrial";
}

function normalizeIpoStatus(value: string): IpoOfferingFact["status"] {
  if (value === "listed") return "listed";
  if (value === "withdrawn" || value === "cancelled") return "withdrawn";
  if (value === "suspended") return "priced";
  return "pending";
}

function normalizeIpoScreenStatus(value: unknown): string | undefined {
  const status = normalizeString(value);

  if (status === undefined) {
    return undefined;
  }

  if (status === "upcoming" || status === "pipeline" || status === "in_process") {
    return "pending";
  }

  if (status === "cancelled") {
    return "withdrawn";
  }

  return status;
}

function normalizeIpoQualityState(value: string): IpoQualityState {
  return value === "PASS" || value === "WARN" || value === "REJECT_RAW" ? value : "HOLD";
}

function normalizeIpoEventType(
  value: string,
  eventCode: string,
  titleZhHant: string | null
): IpoCalendarEventType {
  const allowed = new Set<IpoCalendarEventType>([
    "application_start",
    "application_end",
    "pricing",
    "allotment",
    "grey_market",
    "listing",
    "lockup"
  ]);

  if (allowed.has(value as IpoCalendarEventType)) {
    return value as IpoCalendarEventType;
  }

  const title = titleZhHant ?? "";
  if (/暗盤/u.test(title) || eventCode.startsWith("GM_")) return "grey_market";
  if (/上市/u.test(title)) return "listing";
  if (/定價/u.test(title)) return "pricing";
  if (/配發|結果/u.test(title)) return "allotment";
  if (/截止|結束/u.test(title)) return "application_end";
  if (/開始|招股/u.test(title)) return "application_start";
  return "pricing";
}

function normalizeIpoNarrativeSection(
  value: string
):
  | {
      sectionKey: IpoNarrativeSection["sectionKey"];
      title: string;
    }
  | undefined {
  if (value === "business_overview") {
    return {
      sectionKey: "business_overview",
      title: "业务概览 Business Overview"
    };
  }

  if (value === "competitive_strengths") {
    return {
      sectionKey: "competitive_strengths",
      title: "竞争优势 Competitive Strengths"
    };
  }

  if (value === "risk_factors") {
    return {
      sectionKey: "risk_factors",
      title: "风险因素 Risk Factors"
    };
  }

  if (value === "use_of_proceeds") {
    return {
      sectionKey: "use_of_proceeds",
      title: "所得款项用途 Use of Proceeds"
    };
  }

  return undefined;
}

function firstNonEmpty(
  first: string | null | undefined,
  second: string | null | undefined,
  third: string | null | undefined,
  fallback: string
): string {
  return first && first.length > 0
    ? first
    : second && second.length > 0
      ? second
      : third && third.length > 0
        ? third
        : fallback;
}

function dateString(value: Date | string | null): string | undefined {
  if (value === null) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function numberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatIpoAmountText(
  currencyCode: string | null,
  amount: number | string | null
): string | null {
  const numeric = numberOrNull(amount);

  if (numeric === null) {
    return null;
  }

  return `${currencyCode ?? "HKD"} ${numeric.toLocaleString("en-US")}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeIpoCalendarEventTypes(value: unknown): IpoCalendarEventType[] | undefined {
  const rawValues =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value
        : undefined;

  if (rawValues === undefined) {
    return undefined;
  }

  const allowed = new Set<IpoCalendarEventType>([
    "application_start",
    "application_end",
    "pricing",
    "allotment",
    "grey_market",
    "listing",
    "lockup"
  ]);
  const eventTypes = rawValues
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is IpoCalendarEventType =>
      allowed.has(item as IpoCalendarEventType)
    );

  return eventTypes.length > 0 ? [...new Set(eventTypes)] : undefined;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function isEvidenceLiveDbWriteSmokeAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getEvidenceLiveDbWriteSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isHkIpoPublicHeldDbApplySmokeAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getHkIpoPublicHeldDbApplySmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isHkIpoPublicHeldDbApplyAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getHkIpoPublicHeldDbApplyToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isMcpDeveloperConsoleLogStoreSmokeAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getMcpDeveloperConsoleLogStoreSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isAgentModelExecutionAuditSmokeAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getAgentModelExecutionAuditSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isAgentLiveToolLoopSmokeAuthorized(c: Context<{ Bindings: WorkerBindings }>): boolean {
  const token = getAgentLiveToolLoopSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isAgentGeneratedAnswerEvidenceSmokeAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getAgentGeneratedAnswerEvidenceSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isAgentRunLiveWriteSmokeAuthorized(c: Context<{ Bindings: WorkerBindings }>): boolean {
  const token = getAgentRunLiveWriteSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isAgentRunStatePersistenceSmokeAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getAgentRunStatePersistenceSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isAgentBillingPostedLedgerSmokeAuthorized(
  c: Context<{ Bindings: WorkerBindings }>
): boolean {
  const token = getAgentBillingPostedLedgerSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isAgentToolExecutionSmokeAuthorized(c: Context<{ Bindings: WorkerBindings }>): boolean {
  const token = getAgentToolExecutionSmokeToken(c.env ?? {});

  if (token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

function isMcpLiveExecutionSmokeAuthorized(c: Context<{ Bindings: WorkerBindings }>): boolean {
  const token = c.env?.AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN;

  if (typeof token !== "string" || token.length < 16) {
    return false;
  }

  return c.req.header("authorization") === `Bearer ${token}`;
}

async function createAgentModelExecutionAuditSmokeResult(
  modelProviderResult: Awaited<ReturnType<typeof runAiGatewayLiveSmoke>>,
  requestId: string
): Promise<Record<string, unknown>> {
  const inputTokens =
    modelProviderResult.generate_text.input_tokens + modelProviderResult.stream_text.input_tokens;
  const outputTokens =
    modelProviderResult.generate_text.output_tokens + modelProviderResult.stream_text.output_tokens;
  const totalTokens =
    modelProviderResult.generate_text.total_tokens + modelProviderResult.stream_text.total_tokens;
  const latencyMs =
    modelProviderResult.generate_text.latency_ms + modelProviderResult.stream_text.latency_ms;
  const syntheticUserIdHash = await hashRuntimeSmokeString("agent-model-audit-smoke-user");
  const syntheticWorkspaceIdHash = await hashRuntimeSmokeString(
    "agent-model-audit-smoke-workspace"
  );
  const syntheticTokenClientHash = await hashRuntimeSmokeString(
    "agent-model-audit-smoke-token-client"
  );
  const outputHash = await hashRuntimeSmokeString(
    JSON.stringify({
      generate_text: modelProviderResult.generate_text.output_hash,
      stream_text: modelProviderResult.stream_text.output_hash
    })
  );

  return {
    actual_model_execution: modelProviderResult.status === "ok",
    audit_event_preview: {
      cache_hit: "not_verified_without_ai_gateway_read",
      data_version: modelProviderResult.version,
      denied_tools: [],
      error_code: null,
      estimated_cost_status: "ai_gateway_log_permission_required",
      estimated_cost_usd: null,
      event_type: "run.audit",
      fallback_from_model_hash: null,
      fallback_status: "not_triggered_by_smoke",
      fallback_to_model_hash: null,
      human_intervention: false,
      input_summary_hash: modelProviderResult.prompt_hash,
      input_tokens: inputTokens,
      ip_risk_summary: "not_collected_in_smoke",
      latency_ms: latencyMs,
      methodology_version: modelProviderResult.version,
      model_calls: true,
      model_id_hash: modelProviderResult.model_hash,
      model_provider: modelProviderResult.provider,
      model_tier: "main",
      model_version_hash: modelProviderResult.model_hash,
      output_hash: outputHash,
      output_tokens: outputTokens,
      prompt_version_hash: modelProviderResult.prompt_hash,
      rate_limit_status: "not_verified_without_ai_gateway_read",
      request_id: requestId,
      requested_tools: [],
      retry_count: 0,
      token_client_id_hash: syntheticTokenClientHash,
      tool_call_count: 0,
      tool_calls: [],
      total_tokens: totalTokens,
      user_id_hash: syntheticUserIdHash,
      workspace_id_hash: syntheticWorkspaceIdHash
    },
    gateway_log_evidence: {
      ai_gateway_logs_read: false,
      cache_log_verified: false,
      cost_log_verified: false,
      fallback_log_verified: false,
      rate_limit_log_verified: false,
      required_permissions: ["AI Gateway Read", "Account Analytics Read"],
      status: "blocked_external_permission"
    },
    hash_only_response: true,
    http_status: modelProviderResult.http_status,
    http_statuses: modelProviderResult.http_statuses,
    live_model_execution: modelProviderResult.status === "ok",
    live_model_token_streaming: modelProviderResult.stream_text.chunk_count > 0,
    model_calls: true,
    operation_count: modelProviderResult.operation_count,
    persistent_writes: false,
    provider: modelProviderResult.provider,
    raw_model_output_returned: false,
    response_hash: modelProviderResult.response_hash,
    status: modelProviderResult.status === "ok" ? "passed" : "failed",
    token_usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens
    },
    version: modelProviderResult.version
  };
}

async function executeAgentLiveToolLoopSmoke(
  env: WorkerBindings,
  requestId: string
): Promise<Record<string, unknown>> {
  const plan = createToolLoopAgentPlan({
    asOf: "2026-06-22T00:00:00.000Z",
    currency: "HKD",
    methodology: "split_adjusted",
    prompt: "Summarize Tencent 00700.HK quote with evidence.",
    requestedTools: ["get_quote_snapshot"],
    requestId,
    securities: ["00700.HK"],
    securityQuery: "00700.HK Tencent"
  });
  const plannedToolNames = plan.steps.flatMap((step) =>
    step.tool_calls.map((toolCall) => toolCall.name)
  );
  const planBoundToTool =
    plan.status === "planned_no_model" &&
    plannedToolNames.includes("get_quote_snapshot") &&
    plan.run_context.entitlements.allowed_tools.includes("get_quote_snapshot");
  const toolExecutionResult = await executeAgentToolExecutionEvidenceSmoke(requestId);
  const modelProviderResult = await runAiGatewayLiveSmoke({
    accountId: env.CLOUDFLARE_ACCOUNT_ID ?? "",
    apiToken: getAiGatewayLiveSmokeToken(env),
    gatewayId: env.AI_GATEWAY_NAME ?? "",
    model: env.AI_GATEWAY_SMOKE_MODEL ?? ""
  });
  const modelAuditResult = await createAgentModelExecutionAuditSmokeResult(
    modelProviderResult,
    requestId
  );
  const evidenceValidation = isPlainRecord(toolExecutionResult.evidence_binding_validation)
    ? toolExecutionResult.evidence_binding_validation
    : {};
  const unsourcedProbe = isPlainRecord(toolExecutionResult.unsourced_numeric_probe)
    ? toolExecutionResult.unsourced_numeric_probe
    : {};
  const gatewayLogEvidence = isPlainRecord(modelAuditResult.gateway_log_evidence)
    ? modelAuditResult.gateway_log_evidence
    : {};
  const tokenUsage = isPlainRecord(modelAuditResult.token_usage) ? modelAuditResult.token_usage : {};
  const toolExecutionPassed = toolExecutionResult.status === "passed";
  const modelExecutionPassed = modelAuditResult.status === "passed";
  const sourcedNumericAllowed = evidenceValidation.output_allowed === true;
  const unsourcedNumericBlocked =
    unsourcedProbe.output_allowed === false &&
    unsourcedProbe.failure_code === "UNSOURCED_NUMERIC_CLAIM";
  const status =
    planBoundToTool && toolExecutionPassed && modelExecutionPassed && unsourcedNumericBlocked
      ? "passed"
      : "failed";

  return {
    actual_model_execution: modelExecutionPassed,
    actual_tool_execution: toolExecutionPassed,
    frontend: false,
    general_user_tool_loop_execution: false,
    hash_only_response: true,
    live_evidence_writes: false,
    live_tool_loop_execution: status === "passed",
    live_usage_ledger_writes: false,
    model_calls: modelExecutionPassed,
    model_execution_audit: {
      gateway_log_evidence: gatewayLogEvidence,
      operation_count: modelAuditResult.operation_count,
      status: modelAuditResult.status,
      token_usage: tokenUsage
    },
    not_claimed: [
      "arbitrary_tool_execution",
      "user_facing_live_model_streaming",
      "generated_answer_evidence_binding",
      "ai_gateway_logs_read",
      "live_evidence_writes",
      "live_usage_ledger_writes",
      "frontend_ask_rendering"
    ],
    persistent_writes: false,
    plan_summary: {
      planned_step_count: plan.planned_step_count,
      plan_status: plan.status,
      plan_version: plan.version,
      requested_tool_count: plannedToolNames.length,
      run_id_hash: await hashRuntimeSmokeString(plan.run_id),
      tool_loop_plan_bound: planBoundToTool
    },
    raw_model_output_returned: false,
    raw_tool_output_returned: false,
    status,
    tool_execution: {
      evidence_binding_validation: evidenceValidation,
      sample_tool: toolExecutionResult.sample_tool,
      source_record_hash: toolExecutionResult.source_record_hash,
      status: toolExecutionResult.status,
      tool_result: toolExecutionResult.tool_result,
      tool_result_hash: toolExecutionResult.tool_result_hash,
      unsourced_numeric_probe: unsourcedProbe
    },
    validation: {
      ai_gateway_log_evidence_status: gatewayLogEvidence.status ?? "not_checked",
      model_execution_audit_passed: modelExecutionPassed,
      plan_bound_to_registered_tool: planBoundToTool,
      sourced_numeric_claim_allowed: sourcedNumericAllowed,
      tool_execution_passed: toolExecutionPassed,
      unsourced_numeric_probe_blocked: unsourcedNumericBlocked
    },
    version: AGENT_LIVE_TOOL_LOOP_SMOKE_VERSION
  };
}

async function executeMcpToolCallSmoke(
  params: Record<string, unknown>,
  requestId: string
): Promise<Record<string, unknown>> {
  return executeRegisteredWorkerToolRouteSmoke(params, requestId, "tool");
}

async function executeRegisteredWorkerToolRouteSmoke(
  params: Record<string, unknown>,
  requestId: string,
  requestSuffix: string
): Promise<Record<string, unknown>> {
  const toolName = normalizeString(params.name ?? params.tool_name ?? params.toolName);

  if (toolName === undefined) {
    throw new McpRuntimeInputError(
      "TOOL_NAME_REQUIRED",
      "tools/call requires a registered tool name"
    );
  }

  const route = MCP_TOOL_EXECUTION_ROUTE_MAP[toolName];

  if (route === undefined) {
    throw new McpRuntimeInputError("TOOL_NOT_REGISTERED", "tool is not registered", {
      toolName
    });
  }

  const response = await app.request(route, {
    body: JSON.stringify(isPlainRecord(params.arguments) ? params.arguments : {}),
    headers: {
      "content-type": "application/json",
      "x-request-id": `${requestId}:${requestSuffix}`
    },
    method: "POST"
  });
  const body = (await response.json()) as Record<string, unknown>;

  return {
    data: body.data,
    data_version: body.data_version,
    market_status: body.market_status,
    methodology_version: body.methodology_version,
    ok: body.ok === true,
    provenance: Array.isArray(body.provenance) ? body.provenance : [],
    request_id: body.request_id,
    route,
    status_code: response.status,
    usage: isPlainRecord(body.usage)
      ? body.usage
      : {
          cached: false,
          credits: 0,
          rows: 0
      }
  };
}

async function executeAgentToolExecutionEvidenceSmoke(
  requestId: string
): Promise<Record<string, unknown>> {
  const toolCall = {
    arguments: {
      instrument_id: "eq_hk_00700",
      mode: "delayed"
    },
    name: "get_quote_snapshot"
  };
  const toolResult = await executeRegisteredWorkerToolRouteSmoke(
    toolCall,
    requestId,
    "agent-tool"
  );
  const sourceRecord = getFirstSmokeSourceRecord(toolResult.provenance);

  if (sourceRecord === undefined) {
    return {
      actual_tool_execution: toolResult.ok === true && toolResult.status_code === 200,
      failure_code: "missing_tool_provenance",
      hash_only_response: true,
      live_evidence_binding: false,
      model_calls: false,
      persistent_writes: false,
      status: "failed",
      tool_result: createSmokeToolResultSummary(toolResult),
      version: "2026-06-22.phase1.agent-tool-execution-evidence-smoke.v0"
    };
  }

  const evidenceCardId = "agent-tool-execution-smoke-quote-card";
  const claimId = "agent-tool-execution-smoke-sourced-price";
  const sourcedValidation = validatePostGenerationEvidenceBinding({
    answerText: "Tencent quote snapshot returned 382.4 HKD.",
    asOf: "2026-06-22T00:00:00.000Z",
    claims: [
      {
        claimId,
        dataVersion: sourceRecord.dataVersion,
        evidenceCardId,
        label: "fact",
        methodologyVersion: sourceRecord.methodologyVersion,
        sourceRecordId: sourceRecord.sourceRecordId,
        text: "Tencent quote snapshot returned 382.4 HKD."
      }
    ],
    evidenceCards: [
      {
        cardId: evidenceCardId,
        dataVersion: sourceRecord.dataVersion,
        methodologyVersion: sourceRecord.methodologyVersion,
        sourceRecordId: sourceRecord.sourceRecordId
      }
    ],
    requestId: `${requestId}:evidence-binding`
  });
  const unsourcedProbe = validatePostGenerationEvidenceBinding({
    answerText: "Tencent quote snapshot returned 382.4 HKD.",
    asOf: "2026-06-22T00:00:00.000Z",
    claims: [
      {
        claimId: "agent-tool-execution-smoke-unsourced-price",
        label: "fact",
        text: "Tencent quote snapshot returned 382.4 HKD."
      }
    ],
    requestId: `${requestId}:unsourced-probe`
  });
  const actualToolExecution = toolResult.ok === true && toolResult.status_code === 200;
  const sourcedBindingPassed =
    sourcedValidation.output_allowed === true && sourcedValidation.blocked_claim_count === 0;
  const unsourcedProbeBlocked =
    unsourcedProbe.output_allowed === false &&
    unsourcedProbe.failure_code === "UNSOURCED_NUMERIC_CLAIM";
  const toolResultHash = await hashRuntimeSmokeString(JSON.stringify(toolResult.data ?? null));
  const sourceRecordHash = await hashRuntimeSmokeString(sourceRecord.sourceRecordId);

  return {
    actual_tool_execution: actualToolExecution,
    evidence_binding_validation: {
      blocked_claim_count: sourcedValidation.blocked_claim_count,
      failure_code: sourcedValidation.failure_code ?? null,
      numeric_claim_count: sourcedValidation.numeric_claims.length,
      output_allowed: sourcedValidation.output_allowed,
      route: sourcedValidation.route,
      status: sourcedValidation.status,
      version: sourcedValidation.version
    },
    hash_only_response: true,
    live_evidence_binding: false,
    model_calls: false,
    persistent_writes: false,
    sample_tool: {
      name: "get_quote_snapshot",
      request_id: toolResult.request_id,
      route: toolResult.route
    },
    source_record_hash: sourceRecordHash,
    status:
      actualToolExecution && sourcedBindingPassed && unsourcedProbeBlocked ? "passed" : "failed",
    tool_result: createSmokeToolResultSummary(toolResult),
    tool_result_hash: toolResultHash,
    unsourced_numeric_probe: {
      blocked_claim_count: unsourcedProbe.blocked_claim_count,
      failure_code: unsourcedProbe.failure_code ?? null,
      numeric_claim_count: unsourcedProbe.numeric_claims.length,
      output_allowed: unsourcedProbe.output_allowed,
      status: unsourcedProbe.status
    },
    version: "2026-06-22.phase1.agent-tool-execution-evidence-smoke.v0"
  };
}

async function executeAgentGeneratedAnswerEvidenceSmoke(
  requestId: string
): Promise<Record<string, unknown>> {
  const generatedAnswerText = "Tencent quote snapshot returned 382.4 HKD.";
  const toolCall = {
    arguments: {
      instrument_id: "eq_hk_00700",
      mode: "delayed"
    },
    name: "get_quote_snapshot"
  };
  const toolResult = await executeRegisteredWorkerToolRouteSmoke(
    toolCall,
    requestId,
    "generated-answer-tool"
  );
  const generatedAnswerTextHash = await hashRuntimeSmokeString(generatedAnswerText);
  const toolResultHash = await hashRuntimeSmokeString(JSON.stringify(toolResult.data ?? null));
  const sourceRecord = getFirstSmokeSourceRecord(toolResult.provenance);
  const actualToolExecution = toolResult.ok === true && toolResult.status_code === 200;

  if (sourceRecord === undefined) {
    return {
      actual_tool_execution: actualToolExecution,
      answer_text_returned: false,
      failure_code: "missing_tool_provenance",
      frontend: false,
      generated_answer_text_hash: generatedAnswerTextHash,
      generated_answer_validation: false,
      hash_only_response: true,
      live_evidence_binding: false,
      live_evidence_writes: false,
      live_model_output_corpus: false,
      live_usage_ledger_writes: false,
      model_calls: false,
      model_generation_live: false,
      persistent_writes: false,
      raw_tool_output_returned: false,
      status: "failed",
      tool_result: createSmokeToolResultSummary(toolResult),
      tool_result_hash: toolResultHash,
      version: AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_VERSION
    };
  }

  const evidenceCardId = "agent-generated-answer-smoke-quote-card";
  const claimId = "agent-generated-answer-smoke-sourced-price";
  const sourcedValidation = validatePostGenerationEvidenceBinding({
    answerText: generatedAnswerText,
    asOf: "2026-06-22T00:00:00.000Z",
    claims: [
      {
        claimId,
        dataVersion: sourceRecord.dataVersion,
        evidenceCardId,
        label: "fact",
        methodologyVersion: sourceRecord.methodologyVersion,
        sourceRecordId: sourceRecord.sourceRecordId,
        text: generatedAnswerText
      }
    ],
    evidenceCards: [
      {
        cardId: evidenceCardId,
        dataVersion: sourceRecord.dataVersion,
        methodologyVersion: sourceRecord.methodologyVersion,
        sourceRecordId: sourceRecord.sourceRecordId
      }
    ],
    requestId: `${requestId}:generated-answer-sourced`
  });
  const unsourcedGeneratedAnswerProbe = validatePostGenerationEvidenceBinding({
    answerText: generatedAnswerText,
    asOf: "2026-06-22T00:00:00.000Z",
    requestId: `${requestId}:generated-answer-unsourced`
  });
  const sourcedBindingPassed =
    sourcedValidation.output_allowed === true && sourcedValidation.blocked_claim_count === 0;
  const unsourcedGeneratedAnswerBlocked =
    unsourcedGeneratedAnswerProbe.output_allowed === false &&
    unsourcedGeneratedAnswerProbe.failure_code === "UNSOURCED_NUMERIC_CLAIM";
  const sourceRecordHash = await hashRuntimeSmokeString(sourceRecord.sourceRecordId);
  const status =
    actualToolExecution && sourcedBindingPassed && unsourcedGeneratedAnswerBlocked
      ? "passed"
      : "failed";

  return {
    actual_tool_execution: actualToolExecution,
    answer_text_returned: false,
    evidence_binding_validation: {
      blocked_claim_count: sourcedValidation.blocked_claim_count,
      failure_code: sourcedValidation.failure_code ?? null,
      numeric_claim_count: sourcedValidation.numeric_claims.length,
      output_allowed: sourcedValidation.output_allowed,
      route: sourcedValidation.route,
      status: sourcedValidation.status,
      version: sourcedValidation.version
    },
    evidence_card_binding_probe: true,
    frontend: false,
    generated_answer_text_hash: generatedAnswerTextHash,
    generated_answer_validation: true,
    hash_only_response: true,
    live_evidence_binding: false,
    live_evidence_writes: false,
    live_model_output_corpus: false,
    live_usage_ledger_writes: false,
    model_calls: false,
    model_generation_live: false,
    persistent_writes: false,
    raw_tool_output_returned: false,
    sample_tool: {
      name: "get_quote_snapshot",
      request_id: toolResult.request_id,
      route: toolResult.route
    },
    source_record_hash: sourceRecordHash,
    status,
    tool_result: createSmokeToolResultSummary(toolResult),
    tool_result_hash: toolResultHash,
    unsourced_generated_answer_probe: {
      blocked_claim_count: unsourcedGeneratedAnswerProbe.blocked_claim_count,
      failure_code: unsourcedGeneratedAnswerProbe.failure_code ?? null,
      numeric_claim_count: unsourcedGeneratedAnswerProbe.numeric_claims.length,
      output_allowed: unsourcedGeneratedAnswerProbe.output_allowed,
      status: unsourcedGeneratedAnswerProbe.status
    },
    validation: {
      generated_answer_text_bound_to_evidence_card: sourcedBindingPassed,
      unsourced_generated_answer_blocked: unsourcedGeneratedAnswerBlocked
    },
    version: AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_VERSION
  };
}

function createSmokeToolResultSummary(toolResult: Record<string, unknown>): Record<string, unknown> {
  return {
    ok: toolResult.ok === true,
    provenance_count: Array.isArray(toolResult.provenance) ? toolResult.provenance.length : 0,
    route: toolResult.route,
    status_code: toolResult.status_code,
    usage: isPlainRecord(toolResult.usage) ? toolResult.usage : undefined
  };
}

function getFirstSmokeSourceRecord(
  provenance: unknown
): { dataVersion: string; methodologyVersion: string; sourceRecordId: string } | undefined {
  if (!Array.isArray(provenance)) {
    return undefined;
  }

  for (const item of provenance) {
    if (!isPlainRecord(item)) {
      continue;
    }

    const sourceRecordId = normalizeString(item.source_record_id ?? item.sourceRecordId);
    const dataVersion = normalizeString(item.data_version ?? item.dataVersion);
    const methodologyVersion = normalizeString(
      item.methodology_version ?? item.methodologyVersion
    );

    if (
      sourceRecordId !== undefined &&
      dataVersion !== undefined &&
      methodologyVersion !== undefined
    ) {
      return {
        dataVersion,
        methodologyVersion,
        sourceRecordId
      };
    }
  }

  return undefined;
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

function normalizeSavedScreeningCadence(value: unknown): SavedScreeningCadence | undefined {
  return value === "daily" || value === "manual" || value === "weekly" ? value : undefined;
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

function normalizePortfolioPositionInputs(
  value: unknown
): PortfolioAnalyticsPositionInput[] | undefined {
  return Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => isPlainRecord(item))
        .map((item) => ({
          costBasis: normalizeOptionalNumber(item.cost_basis ?? item.costBasis),
          currency: normalizeString(item.currency),
          instrumentId: normalizeString(item.instrument_id ?? item.instrumentId),
          marketValue: normalizeOptionalNumber(item.market_value ?? item.marketValue),
          quantity: normalizeOptionalNumber(item.quantity),
          securityQuery: normalizeString(item.security_query ?? item.securityQuery)
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

function normalizeEnterpriseSsoProtocol(value: unknown): EnterpriseSsoProtocol | undefined {
  return value === "saml" || value === "oidc" ? value : undefined;
}

function normalizePrivateDataConnectorKind(
  value: unknown
): PrivateDataConnectorKind | undefined {
  return value === "customer_warehouse" || value === "managed_bucket" || value === "private_api"
    ? value
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
