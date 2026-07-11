import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  FastClawSandboxSmokeRunner,
  estimateCloudflareStandard1Cost
} from "./fastclaw-sandbox-smoke.js";
import type { AgentExecutionEvent, AgentExecutionRequest } from "./index.js";

const SECRET = "runner-test-secret-which-is-at-least-thirty-two-bytes";
const ARTIFACT = "AiphaBee FastClaw Cloudflare Sandbox smoke artifact\n";
const ARTIFACT_HASH = createHash("sha256").update(ARTIFACT).digest("hex");
const COMMAND =
  `printf '%s' '${Buffer.from(ARTIFACT).toString("base64")}' | base64 -d > /workspace/aiphabee-smoke.txt` +
  " && sha256sum /workspace/aiphabee-smoke.txt";
const EXEC_ARGV_HASH = createHash("sha256")
  .update(JSON.stringify(["sh", "-lc", COMMAND]))
  .digest("hex");
const EXEC_STDOUT_HASH = createHash("sha256")
  .update(`${ARTIFACT_HASH}  /workspace/aiphabee-smoke.txt\n`)
  .digest("hex");

function request(overrides: Partial<AgentExecutionRequest> = {}): AgentExecutionRequest {
  return {
    allowed_tools: ["exec"],
    budget: {
      max_credits: 1,
      max_parallel_tools: 1,
      max_rows: 10,
      max_steps: 2,
      max_tokens: 1_000,
      max_wall_clock_ms: 30_000
    },
    context_refs: {},
    layer: "research",
    mode: "runner_remote",
    prompt: "Run the deterministic sandbox smoke",
    request_id: "req_20260710_smoke_001",
    run_id: "run_20260710_smoke_001",
    tenant_id: "tenant-1",
    user_id: "user-1",
    ...overrides
  };
}

async function collect(runner: FastClawSandboxSmokeRunner, input: AgentExecutionRequest) {
  const events: AgentExecutionEvent[] = [];
  for await (const event of runner.run(input)) events.push(event);
  return events;
}

function createFetch(options: {
  artifactReadback?: boolean;
  destroyStatus?: number;
  includeHash?: boolean;
} = {}) {
  const calls: Array<{ body: string; headers: Headers; method: string; url: string }> = [];
  let destroyed = false;
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === "string" ? init.body : "";
    calls.push({ body, headers, method: init?.method ?? "GET", url });

    if (url.endsWith("/v1/users")) {
      const externalId = (JSON.parse(body) as { external_id?: unknown }).external_id;
      return Response.json({
        external_id: externalId,
        user_id: "u_smoke"
      });
    }
    if (url.endsWith("/api/users/u_smoke/agents")) {
      return Response.json({ agent: { id: "agt_dedicated" } }, { status: 201 });
    }
    if (url.endsWith("/v1/chat/completions")) {
      const hash = options.includeHash === false ? "missing-hash" : ARTIFACT_HASH;
      const chunk = JSON.stringify({
        choices: [{ delta: { content: `${hash}  /workspace/aiphabee-smoke.txt\nAIPHABEE_SANDBOX_SMOKE_OK` } }]
      });
      return new Response(`data: ${chunk}\n\ndata: [DONE]\n\n`, {
        headers: { "content-type": "text/event-stream" }
      });
    }
    if (url.includes("bridge.test") && (init?.method ?? "GET") === "DELETE") {
      const status = options.destroyStatus ?? 204;
      if (status === 204) destroyed = true;
      return new Response(null, { status });
    }
    if (url.includes("bridge.test") && url.includes("/file/")) {
      if (options.artifactReadback === false) return new Response("not found", { status: 404 });
      return new Response(ARTIFACT);
    }
    if (url.includes("bridge.test") && url.endsWith("/running")) {
      return Response.json({
        exec_receipt: {
          argv_sha256: EXEC_ARGV_HASH,
          exit_code: 0,
          stdout_sha256: EXEC_STDOUT_HASH
        },
        running: !destroyed,
        terminal: destroyed
      });
    }
    return new Response("not found", { status: 404 });
  });
  return { calls, fetchMock: fetchMock as unknown as typeof fetch };
}

describe("FastClawSandboxSmokeRunner", () => {
  it("provisions a dedicated agent, streams existing events, and destroys the sandbox", async () => {
    const { calls, fetchMock } = createFetch();
    const runner = new FastClawSandboxSmokeRunner({
      apiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock,
      sandboxBridgeUrl: "https://bridge.test",
      templateAgentId: "agt_template",
      tokenSecret: SECRET
    });

    const events = await collect(runner, request());
    expect(events.map((event) => event.event_type)).toEqual([
      "run.requested",
      "run.started",
      "run.completed"
    ]);
    expect(events.map((event) => event.event_index)).toEqual([0, 1, 2]);
    expect(events[2]?.payload).toMatchObject({
      agent_id: "agt_dedicated",
      artifact_sha256: ARTIFACT_HASH,
      dedicated_agent: true,
      sandbox_destroyed: true
    });

    const chat = calls.find((call) => call.url.endsWith("/v1/chat/completions"));
    expect(chat?.headers.get("x-aiphabee-sandbox-authorization")).toBeTruthy();
    expect(chat?.body).not.toContain("sandbox_authorization");
    expect(chat?.body).not.toContain(SECRET);
    expect(JSON.parse(chat?.body ?? "{}")).not.toHaveProperty("params");
    expect(calls.some((call) => call.method === "DELETE" && call.url.includes("bridge.test"))).toBe(
      true
    );
  });

  it("fails on missing artifact evidence but still destroys the sandbox", async () => {
    const { calls, fetchMock } = createFetch({ includeHash: false });
    const runner = new FastClawSandboxSmokeRunner({
      apiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock,
      sandboxBridgeUrl: "https://bridge.test",
      templateAgentId: "agt_template",
      tokenSecret: SECRET
    });

    const events = await collect(runner, request());
    expect(events.at(-1)?.event_type).toBe("run.failed");
    expect(events.at(-1)?.payload).toMatchObject({
      code: "ARTIFACT_HASH_MISMATCH",
      leak_candidate: false
    });
    expect(calls.some((call) => call.method === "DELETE")).toBe(true);
  });

  it("rejects a model echo when Bridge has no artifact readback", async () => {
    const { calls, fetchMock } = createFetch({ artifactReadback: false });
    const runner = new FastClawSandboxSmokeRunner({
      apiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock,
      sandboxBridgeUrl: "https://bridge.test",
      templateAgentId: "agt_template",
      tokenSecret: SECRET
    });

    const events = await collect(runner, request());
    expect(events.at(-1)?.payload).toMatchObject({
      code: "ARTIFACT_READBACK_FAILED",
      leak_candidate: false
    });
    expect(calls.some((call) => call.method === "DELETE")).toBe(true);
  });

  it("reports destroy failure as a leak candidate", async () => {
    const { fetchMock } = createFetch({ destroyStatus: 502 });
    const runner = new FastClawSandboxSmokeRunner({
      apiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock,
      sandboxBridgeUrl: "https://bridge.test",
      templateAgentId: "agt_template",
      tokenSecret: SECRET
    });

    const events = await collect(runner, request());
    expect(events.at(-1)?.payload).toMatchObject({
      code: "SANDBOX_DESTROY_FAILED",
      leak_candidate: true
    });
  });

  it("does not call remote services for the wrong layer or mode", async () => {
    const { fetchMock } = createFetch();
    const runner = new FastClawSandboxSmokeRunner({
      apiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock,
      sandboxBridgeUrl: "https://bridge.test",
      templateAgentId: "agt_template",
      tokenSecret: SECRET
    });

    const events = await collect(runner, request({ mode: "dry_run" }));
    expect(events.map((event) => event.event_type)).toEqual(["run.requested", "run.failed"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts FastClaw network work at the request wall-clock budget and still cleans up", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("bridge.test") && init?.method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      if (url.includes("bridge.test") && url.endsWith("/running")) {
        return Response.json({ running: false, terminal: true });
      }
      return new Promise<Response>((_resolve, reject) => {
        if (init?.signal?.aborted) {
          reject(new DOMException("aborted", "AbortError"));
          return;
        }
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), {
          once: true
        });
      });
    }) as unknown as typeof fetch;
    const runner = new FastClawSandboxSmokeRunner({
      apiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock,
      sandboxBridgeUrl: "https://bridge.test",
      templateAgentId: "agt_template",
      tokenSecret: SECRET
    });

    const events = await collect(runner, request({
      budget: { ...request().budget, max_wall_clock_ms: 5 }
    }));
    expect(events.at(-1)?.payload).toMatchObject({ code: "RUN_TIMEOUT", leak_candidate: false });
  });
});

describe("Cloudflare standard-1 cost estimate", () => {
  it("rechecks the 60-second low/high arithmetic", () => {
    expect(estimateCloudflareStandard1Cost(60_000)).toMatchObject({
      active_vcpu_seconds_high: 30,
      billable_seconds: 60,
      cost_usd_high: 0.0012336,
      cost_usd_low: 0.0006336,
      disk_gb_seconds: 480,
      memory_gib_seconds: 240
    });
  });
});
