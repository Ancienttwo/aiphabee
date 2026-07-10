import { describe, expect, it, vi } from "vitest";

import {
  denySandboxOutbound,
  forwardSandboxToolGatewayRequest
} from "./tool-gateway-egress.js";

const TOKEN = "signed_job_token.signature";
const TRUSTED_PARAMS = {
  lease_id: "lease-row4",
  run_id: "run-row4",
  tenant_id: "tenant-row4",
  token: TOKEN,
  user_id: "user-row4"
} as const;

function request(url = "https://tool-gateway.internal/v1/tools/call", init: RequestInit = {}) {
  return new Request(url, {
    body: JSON.stringify({ arguments: {}, tool_name: "get_quote_snapshot" }),
    headers: {
      authorization: "Bearer sandbox-controlled-token",
      "cf-access-jwt-assertion": "sandbox-controlled-cf-token",
      "content-type": "application/json",
      cookie: "sandbox-cookie=secret",
      "x-aiphabee-sandbox-lease-id": "sandbox-spoofed-lease",
      "x-aiphabee-sandbox-run-id": "sandbox-spoofed-run",
      "x-aiphabee-tenant-id": "sandbox-spoofed-tenant",
      "x-aiphabee-user-id": "sandbox-spoofed-user",
      "x-forwarded-for": "127.0.0.1",
      ...Object.fromEntries(new Headers(init.headers))
    },
    method: "POST",
    ...init
  });
}

describe("Cloudflare sandbox Tool Gateway egress", () => {
  it("forwards only the fixed HTTPS request and replaces every sandbox authority header", async () => {
    let forwarded: Request | undefined;
    const fetch = vi.fn(async (input: Request) => {
      forwarded = input;
      return Response.json({ ok: true });
    });
    const response = await forwardSandboxToolGatewayRequest(
      request(),
      { TOOL_GATEWAY: { fetch } },
      { params: TRUSTED_PARAMS }
    );

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(forwarded?.url).toBe("https://tool-gateway.internal/v1/tools/call");
    expect(forwarded?.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(forwarded?.headers.get("cookie")).toBeNull();
    expect(forwarded?.headers.get("cf-access-jwt-assertion")).toBeNull();
    expect(forwarded?.headers.get("x-forwarded-for")).toBeNull();
    expect(forwarded?.headers.get("x-aiphabee-sandbox-lease-id")).toBe("lease-row4");
    expect(forwarded?.headers.get("x-aiphabee-sandbox-run-id")).toBe("run-row4");
    expect(forwarded?.headers.get("x-aiphabee-tenant-id")).toBe("tenant-row4");
    expect(forwarded?.headers.get("x-aiphabee-user-id")).toBe("user-row4");
    expect([...forwarded!.headers.keys()].sort()).toEqual([
      "authorization",
      "content-type",
      "x-aiphabee-sandbox-lease-id",
      "x-aiphabee-sandbox-run-id",
      "x-aiphabee-tenant-id",
      "x-aiphabee-user-id"
    ]);
  });

  it("denies arbitrary DNS names, IPs, URLs, ports, methods, paths and queries", async () => {
    const fetch = vi.fn(async () => Response.json({ ok: true }));
    const deniedRequests = [
      request("https://example.com/v1/tools/call"),
      request("https://127.0.0.1/v1/tools/call"),
      request("https://[::1]/v1/tools/call"),
      request("http://tool-gateway.internal/v1/tools/call"),
      request("https://tool-gateway.internal:8443/v1/tools/call"),
      request("https://tool-gateway.internal/v1/other"),
      request("https://tool-gateway.internal/v1/tools/call?target=https://example.com"),
      request("https://tool-gateway.internal/v1/tools/call", { body: undefined, method: "GET" })
    ];

    for (const deniedRequest of deniedRequests) {
      const response = await forwardSandboxToolGatewayRequest(
        deniedRequest,
        { TOOL_GATEWAY: { fetch } },
        { params: TRUSTED_PARAMS }
      );
      expect(response.status).toBe(403);
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(denySandboxOutbound().status).toBe(403);
  });

  it("fails closed on missing binding, untrusted params and oversized bodies", async () => {
    const missingBinding = await forwardSandboxToolGatewayRequest(
      request(),
      {},
      { params: TRUSTED_PARAMS }
    );
    const missingToken = await forwardSandboxToolGatewayRequest(
      request(),
      { TOOL_GATEWAY: { fetch: vi.fn() } },
      { params: { ...TRUSTED_PARAMS, target: "https://example.com" } }
    );
    const oversized = await forwardSandboxToolGatewayRequest(
      request(undefined, {
        body: JSON.stringify({ value: "x".repeat(65_536) })
      }),
      { TOOL_GATEWAY: { fetch: vi.fn() } },
      { params: TRUSTED_PARAMS }
    );
    const failedBinding = await forwardSandboxToolGatewayRequest(
      request(),
      {
        TOOL_GATEWAY: {
          fetch: async () => {
            throw new Error("service binding unavailable");
          }
        }
      },
      { params: TRUSTED_PARAMS }
    );

    expect(missingBinding.status).toBe(503);
    expect(missingToken.status).toBe(503);
    expect(oversized.status).toBe(400);
    expect(failedBinding.status).toBe(502);
  });
});
