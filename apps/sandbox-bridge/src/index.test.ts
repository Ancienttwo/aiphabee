import { describe, expect, it, vi } from "vitest";

vi.mock("@cloudflare/sandbox", () => {
  class Sandbox {
    private static registeredOutbound: unknown;
    private static registeredOutboundHandlers: Record<string, unknown> | undefined;

    static get outbound(): unknown {
      return this.registeredOutbound;
    }

    static set outbound(handler: unknown) {
      this.registeredOutbound = handler;
    }

    static get outboundHandlers(): Record<string, unknown> | undefined {
      return this.registeredOutboundHandlers;
    }

    static set outboundHandlers(handlers: Record<string, unknown>) {
      this.registeredOutboundHandlers = handlers;
    }
  }

  class ContainerProxy {
    protected readonly ctx: { props: Record<string, unknown> };
    protected readonly env: unknown;

    constructor(ctx: { props: Record<string, unknown> }, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }

    async fetch(): Promise<Response> {
      return new Response("Origin is disallowed", { status: 520 });
    }
  }

  return {
    ContainerProxy,
    Sandbox,
    getSandbox: vi.fn()
  };
});

vi.mock("@cloudflare/sandbox/bridge", () => ({
  resolveWorkspacePath: vi.fn(),
  shellQuote: (value: string) => value
}));

import { issueSandboxRunToken, type SandboxRunTokenClaims } from "./token.js";
import {
  createSandboxBridgeHandler,
  type BridgeEnv,
  type SandboxHandle
} from "./bridge.js";
import type {
  RunGuardClient,
  RunGuardDecision,
  RunGuardOperation,
  SandboxExecReceipt
} from "./run-guard.js";
import { applyRunGuardClaim } from "./run-guard.js";
import { AiphaBeeSandbox, ContainerProxy } from "./index.js";

const SECRET = "bridge-test-secret-which-is-at-least-thirty-two-bytes";
const NOW = Date.UTC(2026, 6, 10, 1, 0, 0);

class MemoryGuard implements RunGuardClient {
  private readonly calls = new Map<string, number>();
  private readonly destroying = new Set<string>();
  private readonly receipts = new Map<string, SandboxExecReceipt>();
  private readonly terminal = new Set<string>();

  private key(claims: SandboxRunTokenClaims): string {
    return `${claims.jti}:${claims.tenant_hash}:${claims.user_hash}`;
  }

  async claim(
    claims: SandboxRunTokenClaims,
    operation: RunGuardOperation
  ): Promise<RunGuardDecision> {
    const key = this.key(claims);
    const calls = this.calls.get(key) ?? 0;
    const exec_receipt = this.receipts.get(key);
    if ((operation === "status" || operation === "destroy") && this.terminal.has(key)) {
      return { allowed: true, call_count: calls, exec_receipt, terminal: true };
    }
    if (this.destroying.has(key) || this.terminal.has(key)) {
      return {
        allowed: false,
        call_count: calls,
        code: "DESTROY_IN_PROGRESS",
        exec_receipt,
        terminal: this.terminal.has(key)
      };
    }
    if (operation === "destroy") {
      this.destroying.add(key);
      return { allowed: true, call_count: calls, exec_receipt, terminal: false };
    }
    if (calls >= claims.max_calls) {
      return {
        allowed: false,
        call_count: calls,
        code: "CALL_BUDGET_EXHAUSTED",
        terminal: false
      };
    }
    this.calls.set(key, calls + 1);
    return { allowed: true, call_count: calls + 1, exec_receipt, terminal: false };
  }

  async finishDestroy(claims: SandboxRunTokenClaims): Promise<void> {
    const key = this.key(claims);
    this.destroying.delete(key);
    this.terminal.add(key);
  }

  async abortDestroy(claims: SandboxRunTokenClaims): Promise<void> {
    this.destroying.delete(this.key(claims));
  }

  async recordExec(
    claims: SandboxRunTokenClaims,
    receipt: SandboxExecReceipt
  ): Promise<void> {
    this.receipts.set(this.key(claims), receipt);
  }
}

class FakeSandbox implements SandboxHandle {
  readonly files = new Map<string, string>();
  destroyed = false;
  failNextDestroy = false;
  lastCommand = "";
  ready = true;
  readinessChecks = 0;

  async exec(command: string): Promise<{ exitCode: number; stderr: string; stdout: string }> {
    this.lastCommand = command;
    return { exitCode: 0, stderr: "", stdout: "bridge-exec-ok\n" };
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async readFile(path: string): Promise<{ content: string }> {
    return { content: this.files.get(path) ?? "" };
  }

  async listFiles(path: string): Promise<{ files: unknown[] }> {
    return { files: [...this.files.keys()].filter((file) => file.startsWith(path)) };
  }

  async isRunning(): Promise<boolean> {
    this.readinessChecks += 1;
    return this.ready && !this.destroyed;
  }

  async destroy(): Promise<void> {
    if (this.failNextDestroy) {
      this.failNextDestroy = false;
      throw new Error("provider destroy failed");
    }
    this.destroyed = true;
  }
}

async function issue(runId: string, maxCalls = 8) {
  return issueSandboxRunToken({
    maxCalls,
    nowMs: NOW,
    runId,
    scopes: [
      "sandbox:create",
      "sandbox:destroy",
      "sandbox:exec",
      "sandbox:file",
      "sandbox:status"
    ],
    secret: SECRET,
    tenantId: "tenant-1",
    ttlSeconds: 300,
    userId: "user-1"
  });
}

function request(url: string, token: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return new Request(url, { ...init, headers });
}

function harness(options: { sandboxReady?: boolean } = {}) {
  const guard = new MemoryGuard();
  const sandboxes = new Map<string, FakeSandbox>();
  const handler = createSandboxBridgeHandler({
    getRunGuard: () => guard,
    getSandbox: (_env, sandboxId) => {
      const existing = sandboxes.get(sandboxId);
      if (existing !== undefined) return existing;
      const created = new FakeSandbox();
      created.ready = options.sandboxReady ?? true;
      sandboxes.set(sandboxId, created);
      return created;
    },
    nowMs: () => NOW + 1_000,
    resolveWorkspacePath: (value) => {
      const prefixed = value.startsWith("/") ? value : `/${value}`;
      const normalized = prefixed.replace(/\/+/gu, "/");
      if (!normalized.startsWith("/workspace") || normalized.includes("..")) return null;
      return normalized;
    },
    shellQuote: (argument) => `'${argument.replace(/'/gu, `'\\''`)}'`
  });
  const env = { SANDBOX_RUN_HMAC_KEY: SECRET } as BridgeEnv;
  return { env, guard, handler, sandboxes };
}

describe("AiphaBee sandbox bridge", () => {
  it("registers inherited outbound setters and dispatches Tool Gateway in the proxy isolate", async () => {
    expect(typeof AiphaBeeSandbox.outbound).toBe("function");
    expect(typeof AiphaBeeSandbox.outboundHandlers?.toolGateway).toBe("function");

    const forwarded: Request[] = [];
    const proxy = new ContainerProxy(
      {
        props: {
          className: "AiphaBeeSandbox",
          containerId: "container-row4",
          enableInternet: false,
          interceptAll: true,
          outboundByHostOverrides: {
            "tool-gateway.internal": {
              method: "toolGateway",
              params: {
                lease_id: "lease-row4",
                run_id: "run-row4",
                tenant_id: "tenant-row4",
                token: "signed-token.signature",
                user_id: "user-row4"
              }
            }
          }
        }
      } as never,
      {
        TOOL_GATEWAY: {
          fetch: async (request: Request) => {
            forwarded.push(request);
            return new Response(null, { status: 204 });
          }
        }
      } as never
    );
    const response = await proxy.fetch(
      new Request("https://tool-gateway.internal/v1/tools/call", {
        body: JSON.stringify({ arguments: {}, tool_name: "get_quote_snapshot" }),
        headers: { "content-type": "application/json" },
        method: "POST"
      })
    );
    expect(response.status).toBe(204);
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0]?.headers.get("authorization")).toBe(
      "Bearer signed-token.signature"
    );

    const denied = await proxy.fetch(
      new Request("https://example.com/v1/tools/call", {
        body: "{}",
        headers: { "content-type": "application/json" },
        method: "POST"
      })
    );
    expect([403, 520]).toContain(denied.status);
    expect(forwarded).toHaveLength(1);
  });

  it("fails closed when create cannot prove sandbox readiness", async () => {
    const { env, handler } = harness({ sandboxReady: false });
    const issued = await issue("run_20260710_bridge_not_ready");

    const response = await handler(
      request("https://bridge.test/v1/sandbox", issued.token, { method: "POST" }),
      env
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: {
        code: "SANDBOX_START_FAILED",
        message: "sandbox failed its readiness probe"
      }
    });
  });

  it("runs a bounded file/exec lifecycle and proves terminal destroy", async () => {
    const { env, handler, sandboxes } = harness();
    const issued = await issue("run_20260710_bridge_001");

    const create = await handler(
      request("https://bridge.test/v1/sandbox", issued.token, { method: "POST" }),
      env
    );
    expect(create.status).toBe(201);
    expect(await create.json()).toEqual({ id: issued.sandbox_id });
    expect(sandboxes.get(issued.sandbox_id)?.readinessChecks).toBe(1);

    const fileUrl = `https://bridge.test/v1/sandbox/${issued.sandbox_id}/file/workspace/smoke.txt`;
    expect(
      (
        await handler(request(fileUrl, issued.token, { body: "artifact", method: "PUT" }), env)
      ).status
    ).toBe(204);
    expect(await (await handler(request(fileUrl, issued.token), env)).text()).toBe("artifact");
    expect(sandboxes.get(issued.sandbox_id)?.files.has("/workspace/smoke.txt")).toBe(true);

    const exec = await handler(
      request(`https://bridge.test/v1/sandbox/${issued.sandbox_id}/exec`, issued.token, {
        body: JSON.stringify({ argv: ["sh", "-lc", "sha256sum /workspace/smoke.txt"], timeout_ms: 5_000 }),
        headers: { "content-type": "application/json" },
        method: "POST"
      }),
      env
    );
    expect(exec.headers.get("content-type")).toContain("text/event-stream");
    expect(await exec.text()).toContain("event: exit");
    expect(sandboxes.get(issued.sandbox_id)?.lastCommand).toContain("sha256sum");

    const destroyed = await handler(
      request(`https://bridge.test/v1/sandbox/${issued.sandbox_id}`, issued.token, {
        method: "DELETE"
      }),
      env
    );
    expect(destroyed.status).toBe(204);
    const status = await handler(
      request(`https://bridge.test/v1/sandbox/${issued.sandbox_id}/running`, issued.token),
      env
    );
    expect(await status.json()).toMatchObject({
      exec_receipt: {
        argv_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
        exit_code: 0,
        stdout_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u)
      },
      running: false,
      terminal: true
    });
  });

  it("rejects tampered tokens, cross-run ids, path escape, and exhausted call budgets", async () => {
    const { env, handler } = harness();
    const issued = await issue("run_20260710_bridge_002");
    const tampered = `${issued.token.slice(0, 10)}${issued.token[10] === "a" ? "b" : "a"}${issued.token.slice(11)}`;

    expect(
      (
        await handler(request("https://bridge.test/v1/sandbox", tampered, { method: "POST" }), env)
      ).status
    ).toBe(401);
    expect(
      (
        await handler(
          request("https://bridge.test/v1/sandbox/ab-not-this-run/running", issued.token),
          env
        )
      ).status
    ).toBe(403);
    expect(
      (
        await handler(request("https://bridge.test/v1/sandbox", issued.token, { method: "POST" }), env)
      ).status
    ).toBe(201);
    expect(
      (
        await handler(
          request(
            `https://bridge.test/v1/sandbox/${issued.sandbox_id}/file/workspace/..%2Fsecret`,
            issued.token
          ),
          env
        )
      ).status
    ).toBe(400);

    const bounded = await issue("run_20260710_bridge_004", 1);
    expect(
      (
        await handler(request("https://bridge.test/v1/sandbox", bounded.token, { method: "POST" }), env)
      ).status
    ).toBe(201);
    expect(
      (
        await handler(
          request(`https://bridge.test/v1/sandbox/${bounded.sandbox_id}/exec`, bounded.token, {
            body: JSON.stringify({ argv: ["true"], timeout_ms: 1_000 }),
            headers: { "content-type": "application/json" },
            method: "POST"
          }),
          env
        )
      ).status
    ).toBe(429);
  });

  it("does not mark a failed destroy terminal and permits one cleanup retry", async () => {
    const { env, handler, sandboxes } = harness();
    const issued = await issue("run_20260710_bridge_003");
    await handler(request("https://bridge.test/v1/sandbox", issued.token, { method: "POST" }), env);
    const sandbox = sandboxes.get(issued.sandbox_id) ?? new FakeSandbox();
    sandboxes.set(issued.sandbox_id, sandbox);
    sandbox.failNextDestroy = true;
    const url = `https://bridge.test/v1/sandbox/${issued.sandbox_id}`;

    expect((await handler(request(url, issued.token, { method: "DELETE" }), env)).status).toBe(502);
    expect((await handler(request(url, issued.token, { method: "DELETE" }), env)).status).toBe(204);
  });

  it("rejects reissued claims that change identity within one guard state", async () => {
    const first = await issue("run_20260710_bridge_005");
    const second = await issueSandboxRunToken({
      maxCalls: first.claims.max_calls,
      nowMs: NOW,
      runId: first.claims.jti,
      scopes: first.claims.scopes,
      secret: SECRET,
      tenantId: "tenant-2",
      ttlSeconds: 300,
      userId: "user-2"
    });
    const initialized = applyRunGuardClaim(undefined, first.claims, "create");
    const rejected = applyRunGuardClaim(initialized.state, second.claims, "exec");

    expect(rejected.decision).toMatchObject({
      allowed: false,
      code: "TOKEN_STATE_MISMATCH"
    });
  });
});
