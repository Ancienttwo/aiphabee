import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedSecurityRequest,
  validateSecurityInput,
  type AuthenticatedSecurityBindings,
  type SecuritySessionReader,
} from "./security.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("authenticated Web security server boundary", () => {
  it("accepts only query and market as browser-controlled input", () => {
    expect(validateSecurityInput({ query: " 00001.HK ", market: "HK" })).toEqual({
      input: { query: "00001.HK", market: "HK" },
      valid: true,
    });
    expect(validateSecurityInput({ query: "00001.HK", authSubject: `better-auth:${USER_ID}` })).toEqual({
      valid: false,
    });
    expect(validateSecurityInput({ query: "00001.HK", workspaceId: "workspace_other" })).toEqual({
      valid: false,
    });
    expect(validateSecurityInput({ query: "", market: "HK" })).toEqual({ valid: false });
    expect(validateSecurityInput({ query: "00001.HK", market: "hk" })).toEqual({ valid: false });
  });

  it("denies an absent session before reading the private RPC binding", async () => {
    let bindingReads = 0;
    const bindings = {
      get AIPHABEE_API() {
        bindingReads += 1;
        throw new Error("RPC binding must not be read");
      },
    } as unknown as AuthenticatedSecurityBindings;
    const result = await resolveAuthenticatedSecurityRequest(
      bindings,
      request(),
      { query: "00001.HK" },
      sessionReader(null),
    );

    expect(result.status).toBe(401);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("AUTH_REQUIRED");
    expect(bindingReads).toBe(0);
  });

  it("returns a typed failure when session authority throws before reading RPC", async () => {
    let bindingReads = 0;
    const bindings = {
      get AIPHABEE_API() {
        bindingReads += 1;
        throw new Error("RPC binding must not be read");
      },
    } as unknown as AuthenticatedSecurityBindings;
    const result = await resolveAuthenticatedSecurityRequest(
      bindings,
      request(),
      { query: "00001.HK" },
      vi.fn().mockRejectedValue(new Error("auth database unavailable")),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
    expect(bindingReads).toBe(0);
  });

  it("derives the canonical subject from session and awaits the named RPC", async () => {
    const resolveSecurity = vi.fn().mockResolvedValue(liveRpcResult());
    const result = await resolveAuthenticatedSecurityRequest(
      { AIPHABEE_API: { resolveSecurity } } as unknown as AuthenticatedSecurityBindings,
      request(),
      { market: "HK", query: "00001.HK" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveSecurity).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      market: "HK",
      query: "00001.HK",
      requestId: "request_test",
    });
  });

  it("accepts the authoritative live candidate shape without a synthetic listing id", async () => {
    const resolveSecurity = vi.fn().mockResolvedValue(liveRpcResult());
    const result = await resolveAuthenticatedSecurityRequest(
      { AIPHABEE_API: { resolveSecurity } } as unknown as AuthenticatedSecurityBindings,
      request(),
      { query: "00001.HK" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedSecurityRequest(
      {} as AuthenticatedSecurityBindings,
      request(),
      { query: "00001.HK" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveSecurity =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedSecurityRequest(
      { AIPHABEE_API: { resolveSecurity } } as unknown as AuthenticatedSecurityBindings,
      request(),
      { query: "00001.HK" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each([
    ["synthetic result", { liveDataAccess: false }],
    ["missing provenance", { provenance: [] }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedSecurityRequest(
      { AIPHABEE_API: { resolveSecurity: vi.fn().mockResolvedValue(response) } } as unknown as AuthenticatedSecurityBindings,
      request(),
      { query: "00001.HK" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });
});

function liveRpcResult() {
  const dataVersion = "netquity-basicdata-test.v1";
  const methodologyVersion = "resolve-security-live.v1";
  const provenance = [{
    data_version: dataVersion,
    methodology_version: methodologyVersion,
    source: "netquity-basicdata",
    source_record_id: "netquity:basicdata.stock:00001",
  }];
  const usage = { cached: false, credits: 0, rows: 1 };
  return {
    envelope: createSuccessEnvelope({
      candidates: [{
        currency: "HKD",
        exchange: "HKEX",
        instrumentId: "hkex_security_00001",
        market: "HK",
        matchReason: "canonical_symbol",
        name: { en: "Alpha", zhHans: "阿尔法", zhHant: "阿爾法" },
        status: "listed" as const,
        symbol: "00001.HK",
      }],
      dataVersion,
      liveDataAccess: true as const,
      methodologyVersion,
      normalizedQuery: "00001.hk",
      provenance,
      query: "00001.HK",
      selectedInstrumentId: "hkex_security_00001",
      status: "resolved" as const,
      toolName: "resolve_security" as const,
      usage,
    }, {
      asOf: "2026-07-10T22:00:00.000Z",
      dataVersion,
      methodologyVersion,
      provenance,
      requestId: "request_test",
      usage,
    }),
    status: 200,
  };
}

function request() {
  return new Request("https://aiphabee-web-staging.example.test/_serverFn", {
    headers: { cookie: "session=value", "x-request-id": "request_test" },
    method: "POST",
  });
}

function sessionReader(value: unknown) {
  return vi.fn().mockResolvedValue(value) as unknown as SecuritySessionReader;
}
