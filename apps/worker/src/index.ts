import { Hono } from "hono";
import {
  ACCOUNT_LOGIN_METHODS,
  ACCOUNT_PLAN_CODES,
  createAccountSessionPlan,
  getAccountRuntimeCapabilities,
  type AccountLoginMethod,
  type AccountPlanCode,
  type AccountRole,
  type AccountSessionAction
} from "@aiphabee/account-runtime";
import {
  AgentRuntimeInputError,
  AGENT_RUNTIME_LIMITS,
  createAgentRunSkeleton,
  createPreToolCallResolution,
  createToolLoopAgentPlan,
  getAgentRuntimeCapabilities,
  type AgentRunSkeletonInput
} from "@aiphabee/agent-runtime";
import {
  CorporateActionsInputError,
  getCorporateActions,
  getCorporateActionAdjustmentCapabilities,
  getCorporateActionsCapabilities
} from "@aiphabee/corporate-actions";
import {
  DATA_ACCESS_GATEWAY_VERSION,
  DEFAULT_DATA_ACCESS_POLICY,
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
  getServingStoreExecutionAdapterCapabilities,
  getServingStoreQueryPlannerCapabilities,
  getServingStoreQualityReleaseCapabilities,
  getServingStoreReadCapabilities,
  getServingStoreSqlDescriptorCapabilities,
  getServingStoreSqlTextCompilerCapabilities
} from "@aiphabee/serving-store";
import {
  GetSecurityProfileInputError,
  ResolveSecurityInputError,
  getSecurityProfile,
  getSecurityProfileCapabilities,
  getResolveSecurityCapabilities,
  resolveSecurity
} from "@aiphabee/security-tools";
import { getToolRegistryCapabilities } from "@aiphabee/tool-registry";
import {
  USAGE_QUOTA_CHANNELS,
  USAGE_QUOTA_PLAN_CODES,
  createUsageQuotaDisplayPlan,
  getUsageLedgerEventWriterCapabilities,
  getUsageQuotaDisplayCapabilities,
  type UsageQuotaChannel,
  type UsageQuotaPlanCode
} from "@aiphabee/usage-ledger";
import {
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
  model_tier?: unknown;
  modelTier?: unknown;
  plan?: unknown;
  prompt?: unknown;
  securities?: unknown;
  security_query?: unknown;
  securityQuery?: unknown;
  time_range?: unknown;
  timeRange?: unknown;
  tools?: unknown;
  user_id?: unknown;
  userId?: unknown;
  workspace_id?: unknown;
  workspaceId?: unknown;
}

const app = new Hono<{ Bindings: WorkerBindings }>();

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

app.get("/account/runtime", (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  return c.json(
    createSuccessEnvelope(getAccountRuntimeCapabilities(), {
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
    })
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
    createSuccessEnvelope(getUsageQuotaDisplayCapabilities(), {
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
    snapshot.corporate_actions.usage.rows;
  const credits =
    snapshot.security_profile.usage.credits +
    snapshot.quote_snapshot.usage.credits +
    snapshot.price_history.usage.credits +
    snapshot.financial_facts.usage.credits +
    snapshot.derived_metrics.usage.credits +
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
    methodology: typeof body.methodology === "string" ? body.methodology : undefined,
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

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
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
