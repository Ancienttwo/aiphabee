import { describe, expect, it } from "vitest";

import {
  SandboxRunTokenError,
  deriveSandboxId,
  issueSandboxRunToken,
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
