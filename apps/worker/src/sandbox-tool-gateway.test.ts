import { describe, expect, it, vi } from "vitest";

import { issueSandboxToolGatewayToken } from "@aiphabee/sandbox-run-auth";
import {
  handleSandboxToolGatewayRequest,
  type SandboxToolGatewayExecutionInput
} from "./sandbox-tool-gateway.js";
import app, { SandboxToolGateway } from "./index.js";

const SECRET = "tool-gateway-test-secret-at-least-thirty-two-bytes";
const NOW = Date.UTC(2026, 6, 11, 0, 0, 0);

async function token(input: { toolName?: string; ttlSeconds?: number } = {}) {
  return (
    await issueSandboxToolGatewayToken({
      leaseId: "lease-row4-worker",
      nowMs: NOW,
      runId: "run-row4-worker",
      secret: SECRET,
      tenantId: "tenant-row4",
      tokenId: "call-row4-worker",
      toolName: input.toolName ?? "get_quote_snapshot",
      ttlSeconds: input.ttlSeconds ?? 120,
      userId: "user-row4"
    })
  ).token;
}

function request(bearer: string, toolName = "get_quote_snapshot", body: unknown = {}) {
  return new Request("https://named-entrypoint.internal/v1/tools/call", {
    body: JSON.stringify({ arguments: body, tool_name: toolName }),
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json",
      "x-aiphabee-sandbox-lease-id": "lease-row4-worker",
      "x-aiphabee-sandbox-run-id": "run-row4-worker",
      "x-aiphabee-tenant-id": "tenant-row4",
      "x-aiphabee-user-id": "user-row4"
    },
    method: "POST"
  });
}

describe("private sandbox Tool Gateway", () => {
  it("is private and keeps real tool execution disabled until Tool Registry activation", async () => {
    const issued = await issueSandboxToolGatewayToken({
      leaseId: "lease-row4-worker",
      runId: "run-row4-worker",
      secret: SECRET,
      tenantId: "tenant-row4",
      tokenId: "call-row4-entrypoint",
      toolName: "get_ipo_profile",
      ttlSeconds: 120,
      userId: "user-row4"
    });
    const gatewayRequest = request(issued.token, "get_ipo_profile", {
      include_sensitive_fields: true,
      stock_code: "09999"
    });
    const entrypoint = new SandboxToolGateway({} as unknown as ExecutionContext, {
      AIPHABEE_SANDBOX_TOOL_GATEWAY_HMAC_KEY: SECRET
    });
    const privateResponse = await entrypoint.fetch(gatewayRequest.clone());
    const publicResponse = await app.request(gatewayRequest);

    expect(privateResponse.status).toBe(403);
    expect(await privateResponse.json()).toEqual({
      error: { code: "TOOL_GATEWAY_TOOL_DENIED" },
      ok: false
    });
    expect(privateResponse.headers.get("cache-control")).toBe("no-store");
    expect(publicResponse.status).toBe(404);
  });

  it("derives execution identity only from verified claims and strips unsafe response headers", async () => {
    const execute = vi.fn(async (_input: SandboxToolGatewayExecutionInput) =>
      Response.json(
        { ok: true },
        {
          headers: {
            location: "https://example.com/leak",
            "set-cookie": "secret=value",
            "x-request-id": "req-tool-gateway",
            "x-worker-secret": "not-forwarded"
          }
        }
      )
    );
    const response = await handleSandboxToolGatewayRequest(request(await token()), {
      execute,
      isToolExecutable: (toolName) => toolName === "get_quote_snapshot",
      nowMs: () => NOW + 1_000,
      secret: SECRET
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBe("req-tool-gateway");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-worker-secret")).toBeNull();
    expect(execute).toHaveBeenCalledWith({
      arguments: {},
      claims: expect.objectContaining({
        lease_id: "lease-row4-worker",
        run_id: "run-row4-worker",
        tenant_id: "tenant-row4",
        tool_name: "get_quote_snapshot",
        user_id: "user-row4"
      }),
      tool_name: "get_quote_snapshot"
    });
  });

  it("rejects missing, expired, cross-tool and unavailable-tool tokens before execution", async () => {
    const execute = vi.fn(async () => Response.json({ ok: true }));
    const valid = await token();
    const crossTenant = request(valid);
    crossTenant.headers.set("x-aiphabee-tenant-id", "tenant-other");
    const cases: Array<{
      executable?: boolean;
      nowMs?: number;
      request: Request;
      status: number;
    }> = [
      {
        request: new Request("https://named-entrypoint.internal/v1/tools/call", {
          body: JSON.stringify({ arguments: {}, tool_name: "get_quote_snapshot" }),
          headers: { "content-type": "application/json" },
          method: "POST"
        }),
        status: 401
      },
      { nowMs: NOW + 121_000, request: request(valid), status: 401 },
      { request: request(valid, "get_price_history"), status: 401 },
      { request: crossTenant, status: 401 },
      { executable: false, request: request(valid), status: 403 }
    ];

    for (const testCase of cases) {
      const response = await handleSandboxToolGatewayRequest(testCase.request, {
        execute,
        isToolExecutable: () => testCase.executable ?? true,
        nowMs: () => testCase.nowMs ?? NOW + 1_000,
        secret: SECRET
      });
      expect(response.status).toBe(testCase.status);
    }
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects missing server authority and malformed or oversized requests before execution", async () => {
    const execute = vi.fn(async () => Response.json({ ok: true }));
    const valid = await token();
    const missingSecret = await handleSandboxToolGatewayRequest(request(valid), {
      execute,
      isToolExecutable: () => true
    });
    const wrongMethod = await handleSandboxToolGatewayRequest(
      new Request("https://named-entrypoint.internal/v1/tools/call", { method: "GET" }),
      { execute, isToolExecutable: () => true, secret: SECRET }
    );
    const oversized = await handleSandboxToolGatewayRequest(
      request(valid, "get_quote_snapshot", { value: "x".repeat(65_536) }),
      { execute, isToolExecutable: () => true, secret: SECRET }
    );
    const executionFailure = await handleSandboxToolGatewayRequest(request(valid), {
      execute: async () => {
        throw new Error("tool route failed");
      },
      isToolExecutable: () => true,
      nowMs: () => NOW + 1_000,
      secret: SECRET
    });

    expect(missingSecret.status).toBe(503);
    expect(wrongMethod.status).toBe(404);
    expect(oversized.status).toBe(400);
    expect(executionFailure.status).toBe(502);
    expect(execute).not.toHaveBeenCalled();
  });
});
