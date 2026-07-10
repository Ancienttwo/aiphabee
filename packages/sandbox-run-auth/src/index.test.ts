import { describe, expect, it } from "vitest";

import {
  SandboxRunTokenError,
  deriveSandboxId,
  issueSandboxToolGatewayToken,
  issueSandboxRunToken,
  verifySandboxToolGatewayToken,
  verifySandboxRunToken
} from "./index.js";

const SECRET = "test-secret-which-is-at-least-thirty-two-bytes-long";
const NOW = Date.UTC(2026, 6, 10, 0, 0, 0);

async function issue() {
  return issueSandboxRunToken({
    maxCalls: 8,
    nowMs: NOW,
    runId: "run_20260710_smoke_001",
    scopes: [
      "sandbox:status",
      "sandbox:create",
      "sandbox:file",
      "sandbox:exec",
      "sandbox:destroy"
    ],
    secret: SECRET,
    tenantId: "tenant-sensitive",
    ttlSeconds: 120,
    userId: "user-sensitive"
  });
}

describe("sandbox run token", () => {
  it("signs canonical hashed claims and derives a stable sandbox id", async () => {
    const issued = await issue();
    const claims = await verifySandboxRunToken(issued.token, SECRET, {
      nowMs: NOW + 1_000,
      requiredScope: "sandbox:exec"
    });

    expect(claims.jti).toBe("run_20260710_smoke_001");
    expect(claims.scopes).toEqual([
      "sandbox:create",
      "sandbox:destroy",
      "sandbox:exec",
      "sandbox:file",
      "sandbox:status"
    ]);
    expect(claims.tenant_hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(claims.user_hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(issued.token).not.toContain("tenant-sensitive");
    expect(issued.token).not.toContain("user-sensitive");
    expect(issued.sandbox_id).toBe(await deriveSandboxId(claims));
  });

  it("fails closed on tamper, expiry, missing scope, and weak secrets", async () => {
    const issued = await issue();
    const tampered = `${issued.token.slice(0, 10)}${issued.token[10] === "a" ? "b" : "a"}${issued.token.slice(11)}`;

    await expect(verifySandboxRunToken(tampered, SECRET, { nowMs: NOW })).rejects.toMatchObject({
      code: "INVALID_SIGNATURE"
    });
    await expect(
      verifySandboxRunToken(issued.token, SECRET, { nowMs: NOW + 121_000 })
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    await expect(
      verifySandboxRunToken(issued.token, SECRET, {
        nowMs: NOW,
        requiredScope: "sandbox:exec"
      })
    ).resolves.toBeDefined();
    await expect(
      issueSandboxRunToken({
        maxCalls: 1,
        nowMs: NOW,
        runId: "run_20260710_smoke_002",
        scopes: ["sandbox:create"],
        secret: "too-short",
        tenantId: "tenant",
        ttlSeconds: 60,
        userId: "user"
      })
    ).rejects.toBeInstanceOf(SandboxRunTokenError);
  });

  it("rejects TTL and call budgets outside the bounded contract", async () => {
    await expect(
      issueSandboxRunToken({
        maxCalls: 65,
        nowMs: NOW,
        runId: "run_20260710_smoke_003",
        scopes: ["sandbox:create"],
        secret: SECRET,
        tenantId: "tenant",
        ttlSeconds: 601,
        userId: "user"
      })
    ).rejects.toMatchObject({ code: "INVALID_CLAIMS" });
  });

  it("derives different sandbox ids when two identities reuse the same run id", async () => {
    const first = await issue();
    const second = await issueSandboxRunToken({
      maxCalls: 8,
      nowMs: NOW,
      runId: first.claims.jti,
      scopes: first.claims.scopes,
      secret: SECRET,
      tenantId: "different-tenant",
      ttlSeconds: 120,
      userId: "different-user"
    });

    expect(second.sandbox_id).not.toBe(first.sandbox_id);
  });
});

describe("sandbox Tool Gateway token", () => {
  const input = {
    leaseId: "lease-row4-001",
    nowMs: NOW,
    runId: "run-row4-001",
    secret: SECRET,
    tenantId: "tenant-1",
    tokenId: "call-row4-001",
    toolName: "get_quote_snapshot",
    ttlSeconds: 120,
    userId: "user-1"
  } as const;

  it("binds one canonical token to tenant, user, run, lease, tool and expiry", async () => {
    const issued = await issueSandboxToolGatewayToken(input);
    const claims = await verifySandboxToolGatewayToken(issued.token, SECRET, {
      nowMs: NOW + 1_000,
      requiredToolName: "get_quote_snapshot"
    });

    expect(claims).toEqual({
      aud: "aiphabee:sandbox-tool-gateway",
      exp: Math.floor(NOW / 1_000) + 120,
      iat: Math.floor(NOW / 1_000),
      jti: "call-row4-001",
      lease_id: "lease-row4-001",
      run_id: "run-row4-001",
      tenant_id: "tenant-1",
      tool_name: "get_quote_snapshot",
      user_id: "user-1",
      v: 1
    });
  });

  it("fails closed before use on tamper, expiry and cross-tool reuse", async () => {
    const issued = await issueSandboxToolGatewayToken(input);
    const tamperIndex = issued.token.indexOf(".") + 2;
    const tampered = `${issued.token.slice(0, tamperIndex)}${
      issued.token[tamperIndex] === "a" ? "b" : "a"
    }${issued.token.slice(tamperIndex + 1)}`;

    await expect(
      verifySandboxToolGatewayToken(tampered, SECRET, { nowMs: NOW + 1_000 })
    ).rejects.toMatchObject({ code: "INVALID_SIGNATURE" });
    await expect(
      verifySandboxToolGatewayToken(issued.token, SECRET, { nowMs: NOW + 120_000 })
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    await expect(
      verifySandboxToolGatewayToken(issued.token, SECRET, {
        nowMs: NOW + 1_000,
        requiredToolName: "get_price_history"
      })
    ).rejects.toMatchObject({ code: "INVALID_SCOPE" });
  });

  it("rejects overlong TTL, weak secrets and malformed identity/tool claims", async () => {
    await expect(
      issueSandboxToolGatewayToken({ ...input, ttlSeconds: 601 })
    ).rejects.toMatchObject({ code: "INVALID_CLAIMS" });
    await expect(
      issueSandboxToolGatewayToken({ ...input, secret: "too-short" })
    ).rejects.toMatchObject({ code: "INVALID_SECRET" });
    await expect(
      issueSandboxToolGatewayToken({ ...input, tenantId: " tenant with leading space" })
    ).rejects.toMatchObject({ code: "INVALID_CLAIMS" });
    await expect(
      issueSandboxToolGatewayToken({ ...input, toolName: "GET /arbitrary" })
    ).rejects.toMatchObject({ code: "INVALID_SCOPE" });
  });
});
