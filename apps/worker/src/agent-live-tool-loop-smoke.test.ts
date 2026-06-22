import { afterEach, describe, expect, it, vi } from "vitest";

import app from "./index";

const SMOKE_TOKEN = "agent-live-tool-loop-smoke-token-000000";
const SMOKE_ROUTE = "/agent/runs/live-tool-loop-smoke";

interface OpenAiCompatibleMockCall {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  url: string;
}

interface AgentLiveToolLoopSmokeBody {
  agent_live_tool_loop_result?: {
    actual_model_execution?: boolean;
    actual_tool_execution?: boolean;
    frontend?: boolean;
    general_user_tool_loop_execution?: boolean;
    hash_only_response?: boolean;
    live_evidence_writes?: boolean;
    live_tool_loop_execution?: boolean;
    live_usage_ledger_writes?: boolean;
    model_calls?: boolean;
    model_execution_audit?: {
      gateway_log_evidence?: {
        ai_gateway_logs_read?: boolean;
        status?: string;
      };
      operation_count?: number;
      status?: string;
      token_usage?: {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
      };
    };
    persistent_writes?: boolean;
    plan_summary?: {
      plan_status?: string;
      planned_step_count?: number;
      requested_tool_count?: number;
      run_id_hash?: string;
      tool_loop_plan_bound?: boolean;
    };
    raw_model_output_returned?: boolean;
    raw_tool_output_returned?: boolean;
    status?: string;
    tool_execution?: {
      evidence_binding_validation?: {
        output_allowed?: boolean;
        status?: string;
      };
      sample_tool?: {
        name?: string;
        route?: string;
      };
      status?: string;
      tool_result?: {
        ok?: boolean;
        route?: string;
        status_code?: number;
      };
      unsourced_numeric_probe?: {
        failure_code?: string;
        output_allowed?: boolean;
      };
    };
    validation?: {
      ai_gateway_log_evidence_status?: string;
      model_execution_audit_passed?: boolean;
      plan_bound_to_registered_tool?: boolean;
      sourced_numeric_claim_allowed?: boolean;
      tool_execution_passed?: boolean;
      unsourced_numeric_probe_blocked?: boolean;
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

describe("Agent live ToolLoop smoke", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-agent-live-loop-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentLiveToolLoopSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-agent-live-loop-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/runs/live-tool-loop-smoke",
      status: "forbidden"
    });
  });

  it("reports missing smoke and AI Gateway env before live orchestration", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "agent-live-tool-loop-v1",
        "x-request-id": "req-agent-live-loop-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentLiveToolLoopSmokeBody;

    expect(response.status).toBe(424);
    expect(body.missing_env).toEqual([
      "AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN or AI_GATEWAY_LIVE_SMOKE_TOKEN",
      "AI_GATEWAY_NAME",
      "AI_GATEWAY_SMOKE_MODEL"
    ]);
    expect(body.response_hash).toMatch(/^sha256:/u);
  });

  it("requires bearer authorization before tool or model execution", async () => {
    const { calls, fetch } = createOpenAiCompatibleMockFetch();
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "agent-live-tool-loop-v1",
          "x-request-id": "req-agent-live-loop-auth-denied"
        },
        method: "POST"
      },
      createLiveToolLoopSmokeEnv()
    );
    const body = (await response.json()) as AgentLiveToolLoopSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN",
      route: "POST /agent/runs/live-tool-loop-smoke",
      status: "forbidden"
    });
    expect(calls).toHaveLength(0);
  });

  it("orchestrates the fixed tool route, evidence probe, and model audit smoke", async () => {
    const { calls, fetch } = createOpenAiCompatibleMockFetch();
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "agent-live-tool-loop-v1",
          "x-request-id": "req-agent-live-loop-ok"
        },
        method: "POST"
      },
      createLiveToolLoopSmokeEnv()
    );
    const body = (await response.json()) as AgentLiveToolLoopSmokeBody;
    const serialized = JSON.stringify(body);
    const result = body.agent_live_tool_loop_result;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(result).toMatchObject({
      actual_model_execution: true,
      actual_tool_execution: true,
      frontend: false,
      general_user_tool_loop_execution: false,
      hash_only_response: true,
      live_evidence_writes: false,
      live_tool_loop_execution: true,
      live_usage_ledger_writes: false,
      model_calls: true,
      persistent_writes: false,
      raw_model_output_returned: false,
      raw_tool_output_returned: false,
      status: "passed"
    });
    expect(result?.plan_summary).toMatchObject({
      plan_status: "planned_no_model",
      planned_step_count: 2,
      requested_tool_count: 1,
      tool_loop_plan_bound: true
    });
    expect(result?.plan_summary?.run_id_hash).toMatch(/^sha256:/u);
    expect(result?.tool_execution).toMatchObject({
      evidence_binding_validation: {
        output_allowed: true,
        status: "passed"
      },
      sample_tool: {
        name: "get_quote_snapshot",
        route: "/tools/get-quote-snapshot"
      },
      status: "passed",
      tool_result: {
        ok: true,
        route: "/tools/get-quote-snapshot",
        status_code: 200
      },
      unsourced_numeric_probe: {
        failure_code: "UNSOURCED_NUMERIC_CLAIM",
        output_allowed: false
      }
    });
    expect(result?.model_execution_audit).toMatchObject({
      gateway_log_evidence: {
        ai_gateway_logs_read: false,
        status: "blocked_external_permission"
      },
      operation_count: 2,
      status: "passed",
      token_usage: {
        input_tokens: 4,
        output_tokens: 6,
        total_tokens: 10
      }
    });
    expect(result?.validation).toEqual({
      ai_gateway_log_evidence_status: "blocked_external_permission",
      model_execution_audit_passed: true,
      plan_bound_to_registered_tool: true,
      sourced_numeric_claim_allowed: true,
      tool_execution_passed: true,
      unsourced_numeric_probe_blocked: true
    });
    expect(calls).toHaveLength(2);
    expect(calls.map((call) => call.body.stream)).toEqual([undefined, true]);
    expect(serialized).not.toContain(SMOKE_TOKEN);
    expect(serialized).not.toContain("synthetic-smoke-token");
    expect(serialized).not.toContain("synthetic-account-id");
    expect(serialized).not.toContain("@cf/aiphabee/synthetic-model");
    expect(serialized).not.toContain("AIPHABEE_AI_GATEWAY_SMOKE_OK");
    expect(serialized).not.toContain("382.4");
    expect(serialized).not.toContain("eq_hk_00700");
    expect(serialized).not.toContain("Summarize Tencent");
  });
});

function createLiveToolLoopSmokeEnv() {
  return {
    AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN: SMOKE_TOKEN,
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
