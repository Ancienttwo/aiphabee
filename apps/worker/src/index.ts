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
