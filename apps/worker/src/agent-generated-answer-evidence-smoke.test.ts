import { describe, expect, it } from "vitest";

import app from "./index";

const SMOKE_TOKEN = "agent-generated-answer-smoke-token-000000";
const SMOKE_ROUTE = "/agent/runs/generated-answer-evidence-smoke";

interface AgentGeneratedAnswerEvidenceSmokeBody {
  agent_generated_answer_evidence_result?: {
    actual_tool_execution?: boolean;
    answer_text_returned?: boolean;
    evidence_binding_validation?: {
      blocked_claim_count?: number;
      numeric_claim_count?: number;
      output_allowed?: boolean;
      route?: string;
      status?: string;
    };
    evidence_card_binding_probe?: boolean;
    frontend?: boolean;
    generated_answer_text_hash?: string;
    generated_answer_validation?: boolean;
    hash_only_response?: boolean;
    live_evidence_binding?: boolean;
    live_evidence_writes?: boolean;
    live_model_output_corpus?: boolean;
    live_usage_ledger_writes?: boolean;
    model_calls?: boolean;
    model_generation_live?: boolean;
    persistent_writes?: boolean;
    raw_tool_output_returned?: boolean;
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
    unsourced_generated_answer_probe?: {
      blocked_claim_count?: number;
      failure_code?: string;
      numeric_claim_count?: number;
      output_allowed?: boolean;
      status?: string;
    };
    validation?: {
      generated_answer_text_bound_to_evidence_card?: boolean;
      unsourced_generated_answer_blocked?: boolean;
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

describe("Agent generated answer evidence smoke", () => {
  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-agent-generated-answer-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentGeneratedAnswerEvidenceSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-agent-generated-answer-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/runs/generated-answer-evidence-smoke",
      status: "forbidden"
    });
  });

  it("reports missing smoke token before validation", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "agent-generated-answer-evidence-v1",
        "x-request-id": "req-agent-generated-answer-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentGeneratedAnswerEvidenceSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN"]);
    expect(body.response_hash).toMatch(/^sha256:/u);
  });

  it("requires the smoke token before tool execution or answer validation", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "agent-generated-answer-evidence-v1",
          "x-request-id": "req-agent-generated-answer-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentGeneratedAnswerEvidenceSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN",
      route: "POST /agent/runs/generated-answer-evidence-smoke",
      status: "forbidden"
    });
  });

  it("binds generated answer numbers to evidence cards and blocks the unsourced answer", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "agent-generated-answer-evidence-v1",
          "x-request-id": "req-agent-generated-answer-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentGeneratedAnswerEvidenceSmokeBody;
    const serialized = JSON.stringify(body);
    const result = body.agent_generated_answer_evidence_result;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(result).toMatchObject({
      actual_tool_execution: true,
      answer_text_returned: false,
      evidence_card_binding_probe: true,
      frontend: false,
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
      status: "passed"
    });
    expect(result?.generated_answer_text_hash).toMatch(/^sha256:/u);
    expect(result?.sample_tool).toMatchObject({
      name: "get_quote_snapshot",
      request_id: "req-agent-generated-answer-ok:generated-answer-tool",
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
    expect(result?.unsourced_generated_answer_probe).toMatchObject({
      blocked_claim_count: 1,
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      numeric_claim_count: 1,
      output_allowed: false,
      status: "blocked_unsourced_numeric_claim"
    });
    expect(result?.validation).toEqual({
      generated_answer_text_bound_to_evidence_card: true,
      unsourced_generated_answer_blocked: true
    });
    expect(serialized).not.toContain("382.4");
    expect(serialized).not.toContain("eq_hk_00700");
    expect(serialized).not.toContain("source_record_id");
    expect(serialized).not.toContain("Tencent quote snapshot returned");
    expect(serialized).not.toContain(SMOKE_TOKEN);
  });
});
