import { describe, expect, it } from "vitest";

import app from "./index";

const SMOKE_TOKEN = "agent-tool-execution-smoke-token-000000";
const SMOKE_ROUTE = "/agent/runs/tool-execution-evidence-smoke";

interface AgentToolExecutionEvidenceSmokeBody {
  agent_tool_execution_evidence_result?: {
    actual_tool_execution?: boolean;
    evidence_binding_validation?: {
      blocked_claim_count?: number;
      numeric_claim_count?: number;
      output_allowed?: boolean;
      route?: string;
      status?: string;
    };
    hash_only_response?: boolean;
    live_evidence_binding?: boolean;
    model_calls?: boolean;
    persistent_writes?: boolean;
    sample_tool?: {
      name?: string;
      request_id?: string;
      route?: string;
    };
    source_record_hash?: string;
    status?: string;
    tool_result?: {
      ok?: boolean;
      provenance_count?: number;
      route?: string;
      status_code?: number;
    };
    tool_result_hash?: string;
    unsourced_numeric_probe?: {
      blocked_claim_count?: number;
      failure_code?: string;
      numeric_claim_count?: number;
      output_allowed?: boolean;
      status?: string;
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

describe("Agent tool execution evidence smoke", () => {
  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-agent-tool-smoke-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentToolExecutionEvidenceSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-agent-tool-smoke-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/runs/tool-execution-evidence-smoke",
      status: "forbidden"
    });
  });

  it("reports missing smoke token before tool execution", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "agent-tool-execution-evidence-v1",
        "x-request-id": "req-agent-tool-smoke-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentToolExecutionEvidenceSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN"]);
    expect(body.response_hash).toMatch(/^sha256:/u);
  });

  it("requires the smoke token before tool execution", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "agent-tool-execution-evidence-v1",
          "x-request-id": "req-agent-tool-smoke-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentToolExecutionEvidenceSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN",
      route: "POST /agent/runs/tool-execution-evidence-smoke",
      status: "forbidden"
    });
  });

  it("executes the registered quote route and binds its provenance to an evidence card", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "agent-tool-execution-evidence-v1",
          "x-request-id": "req-agent-tool-smoke-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentToolExecutionEvidenceSmokeBody;
    const serialized = JSON.stringify(body);
    const result = body.agent_tool_execution_evidence_result;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(result).toMatchObject({
      actual_tool_execution: true,
      hash_only_response: true,
      live_evidence_binding: false,
      model_calls: false,
      persistent_writes: false,
      status: "passed"
    });
    expect(result?.sample_tool).toMatchObject({
      name: "get_quote_snapshot",
      request_id: "req-agent-tool-smoke-ok:agent-tool",
      route: "/tools/get-quote-snapshot"
    });
    expect(result?.tool_result).toMatchObject({
      ok: true,
      route: "/tools/get-quote-snapshot",
      status_code: 200
    });
    expect(result?.tool_result?.provenance_count).toBeGreaterThan(0);
    expect(result?.tool_result_hash).toMatch(/^sha256:/u);
    expect(result?.source_record_hash).toMatch(/^sha256:/u);
    expect(result?.evidence_binding_validation).toMatchObject({
      blocked_claim_count: 0,
      numeric_claim_count: 1,
      output_allowed: true,
      route: "POST /agent/runs/validate-answer",
      status: "passed"
    });
    expect(result?.unsourced_numeric_probe).toMatchObject({
      blocked_claim_count: 1,
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      numeric_claim_count: 1,
      output_allowed: false,
      status: "blocked_unsourced_numeric_claim"
    });
    expect(serialized).not.toContain("382.4");
    expect(serialized).not.toContain("eq_hk_00700");
    expect(serialized).not.toContain("source_record_id");
    expect(serialized).not.toContain(SMOKE_TOKEN);
  });
});
