import { Hono } from "hono";
import {
  AgentRuntimeInputError,
  AGENT_RUNTIME_LIMITS,
  createAgentRunSkeleton,
  getAgentRuntimeCapabilities
} from "@aiphabee/agent-runtime";
import { createErrorEnvelope, createSuccessEnvelope } from "@aiphabee/data-contracts";
import {
  createAgentDryRunTelemetry,
  createConsoleTelemetrySink,
  recordTelemetryEvents
} from "@aiphabee/observability";

interface WorkerBindings {
  AIPHABEE_HYPERDRIVE?: unknown;
  APP_ENV?: string;
  APP_VERSION?: string;
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
