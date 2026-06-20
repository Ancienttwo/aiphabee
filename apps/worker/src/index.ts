import { Hono } from "hono";
import {
  AgentRuntimeInputError,
  createAgentRunSkeleton,
  getAgentRuntimeCapabilities
} from "@aiphabee/agent-runtime";
import { createErrorEnvelope, createSuccessEnvelope } from "@aiphabee/data-contracts";

interface WorkerBindings {
  APP_ENV?: string;
  APP_VERSION?: string;
}

const app = new Hono<{ Bindings: WorkerBindings }>();

app.get("/health", (c) => {
  c.header("Cache-Control", "no-store");

  return c.json({
    environment: c.env.APP_ENV ?? "local",
    market_data_surfaces: false,
    mcp_redistribution_surfaces: false,
    service: "aiphabee-worker",
    status: "ok",
    version: c.env.APP_VERSION ?? "0.0.0"
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

  c.header("Cache-Control", "no-store");

  try {
    const body = (await c.req.json()) as {
      max_steps?: unknown;
      prompt?: unknown;
      tools?: unknown;
    };
    const skeleton = createAgentRunSkeleton({
      maxSteps: typeof body.max_steps === "number" ? body.max_steps : undefined,
      prompt: typeof body.prompt === "string" ? body.prompt : "",
      requestedTools: Array.isArray(body.tools)
        ? body.tools.filter((tool): tool is string => typeof tool === "string")
        : undefined,
      requestId
    });

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
