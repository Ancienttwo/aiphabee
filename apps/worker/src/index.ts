import { Hono, type Context } from "hono";
import {
  ACCOUNT_LOGIN_METHODS,
  ACCOUNT_PLAN_CODES,
  AUTHORIZED_SESSION_MEMORY_ACTIONS,
  createAccountSessionPlan,
  createAuthorizedSessionMemoryPlan,
  createSubscriptionLifecyclePlan,
  getAccountRuntimeCapabilities,
  getPackagePricingCatalog,
  getPackagePricingCapabilities,
  getSubscriptionLifecycleCapabilities,
  type AccountLoginMethod,
  type AccountPlanCode,
  type AccountRole,
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
  createToolLoopAgentPlan,
  createWorkflowTaskPlan,
  getAgentWorkflowTaskCapabilities,
  getAgentRuntimeCapabilities,
  type AgentWorkflowNotificationChannel,
  type AgentWorkflowTaskKind,
  type AgentRunSkeletonInput
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
  createRestrictedExportPlan,
  getRestrictedExportCapabilities,
  evaluateDataAccessRequest,
  getEntitlementPolicySourceCapabilities,
  getServingResultEnvelopeCapabilities
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
  createMcpCompatibilityStatusPlan,
  createMcpApiKeyCreatePlan,
  createMcpApiKeyRevokePlan,
  createMcpApiKeyRotatePlan,
  createMcpOAuthAuthorizePlan,
  createMcpOAuthRevokePlan,
  createMcpOAuthTokenPlan,
  createMcpProtocolPlan,
  createMcpRevocationEnforcementPlan,
  getMcpApiKeyCapabilities,
  getMcpCompatibilityStatusCapabilities,
  getMcpOAuthCapabilities,
  getMcpRevocationEnforcementCapabilities,
  getMcpRuntimeCapabilities,
  getMcpRuntimeStandardError,
  getMcpStandardErrorDefinition,
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
  getEvalV1Capabilities,
  type EvalV1MetricInput,
  type WvroHighIntentAction,
  recordTelemetryEvents
} from "@aiphabee/observability";
import {
  getPublicDocsManifest,
  getPublicOperationsCapabilities,
  getPublicStatusPage
} from "@aiphabee/public-ops";
import {
  createDeepReportWorkflowPlan,
  ResearchRunInputError,
  createDataCorrectionNotificationPlan,
  createResearchRunReplayPlan,
  createResearchRunSavePlan,
  createStaticReportPlan,
  getDataCorrectionNotificationCapabilities,
  getDeepReportWorkflowCapabilities,
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
  createPrivateShareLinkPlan,
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
import { getToolRegistryCapabilities } from "@aiphabee/tool-registry";
import {
  USAGE_QUOTA_CHANNELS,
  USAGE_QUOTA_PLAN_CODES,
  createHighCostUsageReservationPlan,
  createUsageBillingReconciliationPlan,
  createUsageQuotaDisplayPlan,
  getHighCostUsageReservationCapabilities,
  getUsageBillingReconciliationCapabilities,
  getUsageLedgerEventWriterCapabilities,
  getUsageQuotaDisplayCapabilities,
  type HighCostUsageExecutionStatus,
  type UsageBillingLedgerEntryInput,
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
  AIPHABEE_EVAL_STORE?: unknown;
  AIPHABEE_HYPERDRIVE?: unknown;
  APP_ENV?: string;
  APP_VERSION?: string;
  OTLP_EXPORTER_OTLP_ENDPOINT?: string;
  OTLP_EXPORTER_OTLP_HEADERS?: string;
}

interface AgentRunRequestBody {
  as_of?: unknown;
  asOf?: unknown;
  channel?: unknown;
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

app.get("/account/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...getAccountRuntimeCapabilities(),
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

app.get("/usage/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(
      {
        ...getUsageQuotaDisplayCapabilities(),
        billing_reconciliation: getUsageBillingReconciliationCapabilities(),
        high_cost_reservation: getHighCostUsageReservationCapabilities()
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
      clientName: normalizeString(params.client_name ?? params.clientName),
      clientVersion: normalizeString(params.client_version ?? params.clientVersion),
      connectionId: normalizeString(params.connection_id ?? params.connectionId),
      credentialKind: normalizeString(params.credential_kind ?? params.credentialKind),
      credentialStatus: normalizeString(params.credential_status ?? params.credentialStatus),
      grantedScopes: [],
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
      outcome: "success",
      requestId,
      requestedTools: skeleton.tool_policy.requested_tools,
      route: "/agent/runs/dry-run",
      runId: skeleton.run_id
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
        outcome: "rejected",
        requestId,
        requestedTools: requestedToolsForTelemetry,
        route: "/agent/runs/dry-run",
        runId
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
      outcome: "error",
      requestId,
      requestedTools: requestedToolsForTelemetry,
      route: "/agent/runs/dry-run",
      runId
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

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as AgentRunRequestBody;
    const requestedTools = Array.isArray(body.tools)
      ? body.tools.filter((tool): tool is string => typeof tool === "string")
      : undefined;

    requestedToolsForTelemetry = requestedTools ?? [];
    maxStepsForTelemetry =
      typeof body.max_steps === "number" ? body.max_steps : AGENT_RUNTIME_LIMITS.maxSteps;

    const plan = createToolLoopAgentPlan(createAgentRunInput(body, requestId));
    const telemetryEvents = createAgentDryRunTelemetry({
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: plan.budget.max_steps,
      outcome: "success",
      requestId,
      requestedTools: plan.run_context.entitlements.allowed_tools,
      route: "/agent/runs/plan",
      runId: plan.run_id
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
        outcome: "rejected",
        requestId,
        requestedTools: requestedToolsForTelemetry,
        route: "/agent/runs/plan",
        runId
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
      outcome: "error",
      requestId,
      requestedTools: requestedToolsForTelemetry,
      route: "/agent/runs/plan",
      runId
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

app.post("/agent/workflows/tasks/plan", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  let requestedToolsForTelemetry: string[] = [];
  let maxStepsForTelemetry: number = AGENT_RUNTIME_LIMITS.maxSteps;

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as AgentRunRequestBody;
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
      environment: c.env?.APP_ENV ?? "local",
      maxSteps: plan.tool_loop_plan.budget.max_steps,
      outcome: "success",
      requestId,
      requestedTools: plan.tool_loop_plan.run_context.entitlements.allowed_tools,
      route: "/agent/workflows/tasks/plan",
      runId: plan.tool_loop_plan.run_id
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
        outcome: "rejected",
        requestId,
        requestedTools: requestedToolsForTelemetry,
        route: "/agent/workflows/tasks/plan",
        runId
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
      outcome: "error",
      requestId,
      requestedTools: requestedToolsForTelemetry,
      route: "/agent/workflows/tasks/plan",
      runId
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
            : undefined,
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

export default app;

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
