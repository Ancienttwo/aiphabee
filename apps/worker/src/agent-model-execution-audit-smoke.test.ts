import { afterEach, describe, expect, it, vi } from "vitest";

import app from "./index";

const SMOKE_TOKEN = "agent-model-audit-smoke-token-000000";
const SMOKE_ROUTE = "/agent/runs/model-execution-audit-smoke";

interface OpenAiCompatibleMockCall {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  url: string;
}

interface AgentModelExecutionAuditSmokeBody {
  agent_model_execution_audit_result?: {
    actual_model_execution?: boolean;
    audit_event_preview?: {
      cache_hit?: string;
      estimated_cost_status?: string;
      event_type?: string;
      input_tokens?: number;
      model_calls?: boolean;
      model_provider?: string;
      output_tokens?: number;
      rate_limit_status?: string;
      total_tokens?: number;
    };
    gateway_log_evidence?: {
      ai_gateway_logs_read?: boolean;
      cache_log_verified?: boolean;
      cost_log_verified?: boolean;
      fallback_log_verified?: boolean;
      rate_limit_log_verified?: boolean;
      status?: string;
    };
    hash_only_response?: boolean;
    live_model_execution?: boolean;
    live_model_token_streaming?: boolean;
    model_calls?: boolean;
    operation_count?: number;
    persistent_writes?: boolean;
    raw_model_output_returned?: boolean;
    status?: string;
    token_usage?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };
  missing_env?: string[];
  request_id?: string;
  required_authorization?: string;
  required_header?: string;
  response_hash?: string;
  route?: string;
  status?: string;
}

describe("Agent model execution audit smoke", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-agent-model-audit-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentModelExecutionAuditSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-agent-model-audit-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/runs/model-execution-audit-smoke",
      status: "forbidden"
    });
  });

  it("reports missing smoke and AI Gateway env before model execution", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "agent-model-execution-audit-v1",
        "x-request-id": "req-agent-model-audit-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentModelExecutionAuditSmokeBody;

    expect(response.status).toBe(424);
    expect(body.missing_env).toEqual([
      "AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN or AI_GATEWAY_LIVE_SMOKE_TOKEN",
      "AI_GATEWAY_NAME",
      "AI_GATEWAY_SMOKE_MODEL"
    ]);
    expect(body.response_hash).toMatch(/^sha256:/u);
  });

  it("requires bearer authorization before model execution", async () => {
    const { calls, fetch } = createOpenAiCompatibleMockFetch();
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "agent-model-execution-audit-v1",
          "x-request-id": "req-agent-model-audit-auth-denied"
        },
        method: "POST"
      },
      createModelAuditSmokeEnv()
    );
    const body = (await response.json()) as AgentModelExecutionAuditSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN",
      route: "POST /agent/runs/model-execution-audit-smoke",
      status: "forbidden"
    });
    expect(calls).toHaveLength(0);
  });

  it("executes generateText and streamText and returns a redacted run.audit preview", async () => {
    const { calls, fetch } = createOpenAiCompatibleMockFetch();
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "agent-model-execution-audit-v1",
          "x-request-id": "req-agent-model-audit-ok"
        },
        method: "POST"
      },
      createModelAuditSmokeEnv()
    );
    const body = (await response.json()) as AgentModelExecutionAuditSmokeBody;
    const serialized = JSON.stringify(body);
    const result = body.agent_model_execution_audit_result;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(result).toMatchObject({
      actual_model_execution: true,
      hash_only_response: true,
      live_model_execution: true,
      live_model_token_streaming: true,
      model_calls: true,
      operation_count: 2,
      persistent_writes: false,
      raw_model_output_returned: false,
      status: "passed"
    });
    expect(result?.token_usage).toEqual({
      input_tokens: 4,
      output_tokens: 6,
      total_tokens: 10
    });
    expect(result?.audit_event_preview).toMatchObject({
      cache_hit: "not_verified_without_ai_gateway_read",
      estimated_cost_status: "ai_gateway_log_permission_required",
      event_type: "run.audit",
      input_tokens: 4,
      model_calls: true,
      model_provider: "cloudflare_ai_gateway",
      output_tokens: 6,
      rate_limit_status: "not_verified_without_ai_gateway_read",
      total_tokens: 10
    });
    expect(result?.gateway_log_evidence).toMatchObject({
      ai_gateway_logs_read: false,
      cache_log_verified: false,
      cost_log_verified: false,
      fallback_log_verified: false,
      rate_limit_log_verified: false,
      status: "blocked_external_permission"
    });
    expect(calls).toHaveLength(2);
    expect(calls.every((call) => call.url.endsWith("/ai/v1/chat/completions"))).toBe(true);
    expect(calls.every((call) => call.headers["cf-aig-gateway-id"] === "default")).toBe(true);
    expect(calls.map((call) => call.body.stream)).toEqual([undefined, true]);
    expect(serialized).not.toContain(SMOKE_TOKEN);
    expect(serialized).not.toContain("synthetic-smoke-token");
    expect(serialized).not.toContain("synthetic-account-id");
    expect(serialized).not.toContain("@cf/aiphabee/synthetic-model");
    expect(serialized).not.toContain("AIPHABEE_AI_GATEWAY_SMOKE_OK");
  });
});

function createModelAuditSmokeEnv() {
  return {
    AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN: SMOKE_TOKEN,
    AI_GATEWAY_LIVE_SMOKE_TOKEN: "synthetic-smoke-token",
    AI_GATEWAY_NAME: "default",
    AI_GATEWAY_SMOKE_MODEL: "@cf/aiphabee/synthetic-model",
    CLOUDFLARE_ACCOUNT_ID: "synthetic-account-id"
  };
}

function createOpenAiCompatibleMockFetch(): {
  calls: OpenAiCompatibleMockCall[];
  fetch: typeof fetch;
} {
  const calls: OpenAiCompatibleMockCall[] = [];
  const fetchMock = (async (resource: Parameters<typeof fetch>[0], options?: RequestInit) => {
    const body = parseMockRequestBody(options?.body);
    const headers = Object.fromEntries(new Headers(options?.headers).entries());
    calls.push({
      body,
      headers,
      url: String(resource)
    });

    if (body.stream === true) {
      return new Response(
        [
          `data: ${JSON.stringify({
            choices: [
              {
                delta: {
                  content: "AIPHABEE_AI_GATEWAY_SMOKE_OK",
                  role: "assistant"
                },
                finish_reason: null,
                index: 0
              }
            ],
            created: 0,
            id: "chatcmpl-synthetic-stream",
            model: "synthetic-model",
            object: "chat.completion.chunk"
          })}`,
          "",
          `data: ${JSON.stringify({
            choices: [
              {
                delta: {},
                finish_reason: "stop",
                index: 0
              }
            ],
            created: 0,
            id: "chatcmpl-synthetic-stream",
            model: "synthetic-model",
            object: "chat.completion.chunk",
            usage: {
              completion_tokens: 3,
              prompt_tokens: 2,
              total_tokens: 5
            }
          })}`,
          "",
          "data: [DONE]",
          ""
        ].join("\n"),
        {
          headers: {
            "content-type": "text/event-stream"
          },
          status: 200
        }
      );
    }

    return Response.json(
      {
        choices: [
          {
            finish_reason: "stop",
            index: 0,
            message: {
              content: "AIPHABEE_AI_GATEWAY_SMOKE_OK",
              role: "assistant"
            }
          }
        ],
        created: 0,
        id: "chatcmpl-synthetic",
        model: "synthetic-model",
        object: "chat.completion",
        usage: {
          completion_tokens: 3,
          prompt_tokens: 2,
          total_tokens: 5
        }
      },
      {
        status: 200
      }
    );
  }) as typeof fetch;

  return {
    calls,
    fetch: fetchMock
  };
}

function parseMockRequestBody(value: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof value !== "string") {
    return {};
  }

  return JSON.parse(value) as Record<string, unknown>;
}
