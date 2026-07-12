import { describe, expect, it } from "vitest";

import type { SandboxRunTokenClaims } from "@aiphabee/sandbox-run-auth";

import { applyRunGuardClaim } from "./run-guard.js";

function claims(overrides: Partial<SandboxRunTokenClaims> = {}): SandboxRunTokenClaims {
  return {
    exp: 2_000,
    iat: 1_000,
    jti: "run-row10-control",
    max_calls: 8,
    scopes: ["sandbox:create", "sandbox:destroy", "sandbox:exec", "sandbox:status"],
    tenant_hash: "a".repeat(64),
    user_hash: "b".repeat(64),
    v: 1,
    ...overrides
  };
}

describe("RunGuard reissued control tokens", () => {
  it("allows a fresh signed destroy/status token for the same run identity", () => {
    const created = applyRunGuardClaim(undefined, claims(), "create");
    const control = claims({
      exp: 2_100,
      iat: 1_100,
      max_calls: 4,
      scopes: ["sandbox:destroy", "sandbox:status"]
    });
    const status = applyRunGuardClaim(created.state, control, "status");
    expect(status.decision).toMatchObject({ allowed: true, call_count: 1 });
    expect(status.state).toEqual(created.state);
    const destroy = applyRunGuardClaim(status.state, control, "destroy");
    expect(destroy.decision.allowed).toBe(true);
    expect(destroy.state.destroying).toBe(true);
  });

  it("keeps exec/file/create bound to the original exact token state", () => {
    const created = applyRunGuardClaim(undefined, claims(), "create");
    const reissued = claims({ exp: 2_100, iat: 1_100 });
    for (const operation of ["create", "exec", "file"] as const) {
      expect(applyRunGuardClaim(created.state, reissued, operation).decision).toMatchObject({
        allowed: false,
        code: "TOKEN_STATE_MISMATCH"
      });
    }
  });

  it("rejects destroy when tenant or user identity changes", () => {
    const created = applyRunGuardClaim(undefined, claims(), "create");
    const crossTenant = claims({ exp: 2_100, tenant_hash: "c".repeat(64) });
    expect(applyRunGuardClaim(created.state, crossTenant, "destroy").decision).toMatchObject({
      allowed: false,
      code: "TOKEN_STATE_MISMATCH"
    });
  });
});
