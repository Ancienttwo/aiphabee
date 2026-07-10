import { describe, expect, it, vi } from "vitest";

import {
  FastClawLifecycleClient,
  FastClawLifecycleError,
  deriveFastClawExternalIdentity,
  hashLifecycleReference
} from "./fastclaw-lifecycle.js";

describe("FastClaw dedicated Agent lifecycle contract", () => {
  it("derives a stable workspace/account identity without embedding either raw id", async () => {
    const first = await deriveFastClawExternalIdentity("workspace-sensitive", "account-sensitive");
    const repeat = await deriveFastClawExternalIdentity("workspace-sensitive", "account-sensitive");
    const otherWorkspace = await deriveFastClawExternalIdentity("workspace-other", "account-sensitive");

    expect(first).toBe(repeat);
    expect(first).toMatch(/^aiphabee:v1:[a-f0-9]{64}$/u);
    expect(first).not.toContain("workspace-sensitive");
    expect(first).not.toContain("account-sensitive");
    expect(otherWorkspace).not.toBe(first);
  });

  it("uses the FastClaw idempotency contract for user and Agent provisioning", async () => {
    const calls: Array<{ body: unknown; method: string; url: string }> = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ body, method: init?.method ?? "GET", url });
      if (url.endsWith("/v1/users")) {
        return Response.json({ external_id: "aiphabee:v1:abc", user_id: "u_dedicated" });
      }
      if (url.endsWith("/api/users/u_dedicated/agents")) {
        return Response.json(
          {
            agent: { externalId: "aiphabee-agent:v1:abc", id: "agt_dedicated" },
            created: false
          },
          { status: 200 }
        );
      }
      return new Response("not found", { status: 404 });
    });
    const client = new FastClawLifecycleClient({
      adminApiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock as unknown as typeof fetch,
      templateAgentId: "agt_template"
    });

    const user = await client.provisionUser("aiphabee:v1:abc");
    const agent = await client.provisionAgent(user.user_id, "aiphabee-agent:v1:abc");

    expect(agent).toEqual({ agent_id: "agt_dedicated", created: false });
    expect(calls).toEqual([
      {
        body: { display_name: "AiphaBee Research Agent", external_id: "aiphabee:v1:abc" },
        method: "POST",
        url: "https://fastclaw.test/v1/users"
      },
      {
        body: {
          description: "Dedicated AiphaBee research Agent",
          externalId: "aiphabee-agent:v1:abc",
          forkFrom: "agt_template",
          name: "AiphaBee Research Agent"
        },
        method: "POST",
        url: "https://fastclaw.test/api/users/u_dedicated/agents"
      }
    ]);
  });

  it("drives explicit disable/reactivate and idempotent remote absence", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (init?.method === "PUT") {
        const status = (JSON.parse(String(init.body)) as { status: string }).status;
        return Response.json({ user: { id: "u_dedicated", status } });
      }
      if (init?.method === "DELETE") {
        return Response.json({ deleted: false, ok: true });
      }
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    const client = new FastClawLifecycleClient({
      adminApiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: fetchMock as unknown as typeof fetch,
      templateAgentId: "agt_template"
    });

    await expect(client.setUserStatus("u_dedicated", "disabled")).resolves.toEqual({
      status: "disabled"
    });
    await expect(client.setUserStatus("u_dedicated", "active")).resolves.toEqual({
      status: "active"
    });
    await expect(client.removeUser("u_dedicated")).resolves.toEqual({ already_absent: true });
  });

  it("maps upstream failures to stable errors without exposing response bodies", async () => {
    const client = new FastClawLifecycleClient({
      adminApiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: vi.fn(async () => new Response("sensitive upstream body", { status: 429 })) as unknown as typeof fetch,
      templateAgentId: "agt_template"
    });

    const error = await client.provisionUser("aiphabee:v1:abc").catch((value: unknown) => value);
    expect(error).toBeInstanceOf(FastClawLifecycleError);
    expect(error).toMatchObject({ code: "FASTCLAW_RATE_LIMITED", retryable: true });
    expect(String(error)).not.toContain("sensitive upstream body");
  });

  it("rejects an oversized upstream response while reading the body", async () => {
    const client = new FastClawLifecycleClient({
      adminApiKey: "fastclaw-admin-key",
      baseUrl: "https://fastclaw.test",
      fetch: vi.fn(async () => new Response("x".repeat(1_048_577))) as unknown as typeof fetch,
      templateAgentId: "agt_template"
    });

    await expect(client.provisionUser("aiphabee:v1:abc")).rejects.toMatchObject({
      code: "FASTCLAW_RESPONSE_INVALID"
    });
  });

  it("hashes audit references without accepting empty authority values", async () => {
    await expect(hashLifecycleReference("agt_123")).resolves.toMatch(/^[a-f0-9]{64}$/u);
    await expect(hashLifecycleReference("")).rejects.toMatchObject({ code: "INVALID_LIFECYCLE_INPUT" });
    await expect(deriveFastClawExternalIdentity("", "account")).rejects.toMatchObject({
      code: "INVALID_LIFECYCLE_INPUT"
    });
  });
});
