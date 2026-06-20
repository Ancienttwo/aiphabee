import { Hono } from "hono";
import {
  AgentRuntimeInputError,
  AGENT_RUNTIME_LIMITS,
  createAgentRunSkeleton,
  getAgentRuntimeCapabilities
} from "@aiphabee/agent-runtime";
import {
  DATA_ACCESS_GATEWAY_VERSION,
  DEFAULT_DATA_ACCESS_POLICY,
  evaluateDataAccessRequest
} from "@aiphabee/data-access-gateway";
import { createErrorEnvelope, createSuccessEnvelope } from "@aiphabee/data-contracts";
import {
  EVAL_STORE_SCHEMA_VERSION,
  OBSERVABILITY_EVENT_VERSION,
  createAgentDryRunTelemetry,
  createConsoleTelemetrySink,
  recordTelemetryEvents
} from "@aiphabee/observability";

interface WorkerBindings {
  AIPHABEE_EVAL_STORE?: unknown;
  AIPHABEE_HYPERDRIVE?: unknown;
  APP_ENV?: string;
  APP_VERSION?: string;
  OTLP_EXPORTER_OTLP_ENDPOINT?: string;
  OTLP_EXPORTER_OTLP_HEADERS?: string;
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
        corporate_actions: {
          adjustment_types: ["raw", "split_adjusted", "total_return_adjusted"],
          closed_open_intervals: true,
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
        source_batches: {
          rights_default_state: "default_deny",
          table: "core.raw_source_batch"
        }
      },
      {
        asOf: new Date().toISOString(),
        methodologyVersion: "corporate-action-adjustment-scaffold-v0",
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
        cache_key_fields: [
          "dataset",
          "channel",
          "plan",
          "allowed_fields",
          "data_version",
          "rights_policy_version",
          "methodology_version",
          "time_range"
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
          "row_limit",
          "time_range_limit",
          "quality_hold",
          "cache_key_versioning",
          "provenance_required",
          "usage_preview"
        ],
        limits: {
          max_rows: DEFAULT_DATA_ACCESS_POLICY.maxRows,
          max_window_days: DEFAULT_DATA_ACCESS_POLICY.maxWindowDays
        },
        live_data_access: false,
        market_data_surfaces: false,
        methodology_version: DEFAULT_DATA_ACCESS_POLICY.methodologyVersion,
        mcp_redistribution_surfaces: false,
        rights_policy_version: DEFAULT_DATA_ACCESS_POLICY.rightsPolicyVersion,
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

app.post("/gateway/access-check", async (c) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.header("Cache-Control", "no-store");

  const body = (await c.req.json().catch(() => ({}))) as {
    channel?: unknown;
    dataset?: unknown;
    fields?: unknown;
    plan?: unknown;
    quality_state?: unknown;
    requested_rows?: unknown;
    time_range?: unknown;
  };
  const requestedFields = Array.isArray(body.fields)
    ? body.fields.filter((field): field is string => typeof field === "string")
    : ["quote.close"];
  const decision = evaluateDataAccessRequest({
    channel: isDataAccessChannel(body.channel) ? body.channel : "mcp",
    dataset: typeof body.dataset === "string" ? body.dataset : "hk_equity_quote",
    plan: typeof body.plan === "string" ? body.plan : "free",
    qualityState: isQualityState(body.quality_state) ? body.quality_state : "PASS",
    requestedFields,
    requestedRows: typeof body.requested_rows === "number" ? body.requested_rows : 1,
    timeRange: isTimeRange(body.time_range) ? body.time_range : undefined
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
      max_steps?: unknown;
      prompt?: unknown;
      tools?: unknown;
    };
    const requestedTools = Array.isArray(body.tools)
      ? body.tools.filter((tool): tool is string => typeof tool === "string")
      : undefined;

    requestedToolsForTelemetry = requestedTools ?? [];
    maxStepsForTelemetry =
      typeof body.max_steps === "number" ? body.max_steps : AGENT_RUNTIME_LIMITS.maxSteps;

    const skeleton = createAgentRunSkeleton({
      maxSteps: maxStepsForTelemetry,
      prompt: typeof body.prompt === "string" ? body.prompt : "",
      requestedTools,
      requestId
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

export default app;

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
