import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedOwnershipRequest,
  validateOwnershipInput,
  type AuthenticatedOwnershipBindings,
  type OwnershipSessionReader,
} from "./ownership.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) row
// spot-checked via psql against the local netquity mirror.
const SAMPLE_SHARE_CAPITAL = {
  asOf: "2026-07-07",
  hasSecondaryListing: "N" as const,
  hkShareClass: "OS",
  hkShares: 3830044500,
  isHShare: "N" as const,
  issuedShares: 3830044500,
  issuedSharesChange: 0,
  sharesInCcass: 2555770354,
  sharesOutsideCcass: 1274274146,
};
const SAMPLE_FREE_FLOAT = {
  asOf: "2026-07-06",
  freeFloatPercent: 69.64,
  freeFloatShares: 2667112490,
  issuedShares: 3830044500,
  nonFreeFloatShares: 1162932010,
};
const SAMPLE_HOLDER = {
  asOf: "2025-12-31",
  groupType: "F",
  heldPercent: 30.363,
  heldShares: 1162932010,
  holderId: "ownership_00001_01",
  holderType: "I",
  instrumentId: "hkex_security_00001",
  name: { en: "Li Ka-Shing", zhHans: "李嘉诚", zhHant: "李嘉誠" },
  sourceRecordId: "netquity:listcompheld.data:00001:01",
  sourceType: "AR",
};

describe("authenticated Web ownership server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateOwnershipInput({ instrumentId: " hkex_security_00001 " })).toEqual({
      input: { instrumentId: "hkex_security_00001" },
      valid: true,
    });
    expect(
      validateOwnershipInput({ instrumentId: "hkex_security_00001", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateOwnershipInput({ instrumentId: "hkex_security_00001", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateOwnershipInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateOwnershipInput({ instrumentId: "eq_hk_00001" })).toEqual({ valid: false });
    expect(validateOwnershipInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("denies an absent session before reading the private RPC binding", async () => {
    let bindingReads = 0;
    const bindings = {
      get AIPHABEE_API() {
        bindingReads += 1;
        throw new Error("RPC binding must not be read");
      },
    } as unknown as AuthenticatedOwnershipBindings;
    const result = await resolveAuthenticatedOwnershipRequest(
      bindings,
      request(),
      { instrumentId: "hkex_security_00001" },
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
    } as unknown as AuthenticatedOwnershipBindings;
    const result = await resolveAuthenticatedOwnershipRequest(
      bindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      vi.fn().mockRejectedValue(new Error("auth database unavailable")),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
    expect(bindingReads).toBe(0);
  });

  it("derives the canonical subject from session and awaits the named RPC", async () => {
    const resolveOwnership = vi.fn().mockResolvedValue(liveOwnershipRpcResult());
    const result = await resolveAuthenticatedOwnershipRequest(
      { AIPHABEE_API: { resolveOwnership } } as unknown as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveOwnership).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });
  });

  it("accepts a zero-coverage unavailable response with all 3 buckets absent", async () => {
    const response = liveOwnershipRpcResult({
      coverage: {
        reason:
          "no share capital, free float, or substantial-shareholder/cross-holding record found in nq_issueshare.issueshare, nq_freefloatshare2.freefloatshare, or nq_listcompheld.data for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
      freeFloat: undefined,
      holders: undefined,
      instrumentId: "hkex_security_09999",
      shareCapital: undefined,
    });
    const result = await resolveAuthenticatedOwnershipRequest(
      {
        AIPHABEE_API: { resolveOwnership: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_09999" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.shareCapital).toBeUndefined();
      expect(result.envelope.data.freeFloat).toBeUndefined();
      expect(result.envelope.data.holders).toBeUndefined();
    }
  });

  it("accepts an available result carrying only shareCapital (freeFloat/holders both absent)", async () => {
    const response = liveOwnershipRpcResult({ freeFloat: undefined, holders: undefined });
    const result = await resolveAuthenticatedOwnershipRequest(
      {
        AIPHABEE_API: { resolveOwnership: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.shareCapital).toBeDefined();
      expect(result.envelope.data.freeFloat).toBeUndefined();
      expect(result.envelope.data.holders).toBeUndefined();
    }
  });

  it("accepts a holder carrying a crossHolding to another HKEX-listed instrument", async () => {
    const response = liveOwnershipRpcResult({
      holders: [
        {
          ...SAMPLE_HOLDER,
          crossHolding: { instrumentId: "hkex_security_01038" },
          holderId: "ownership_00001_03",
          holderType: "L",
          sourceRecordId: "netquity:listcompheld.data:00001:03",
        },
      ],
    });
    const result = await resolveAuthenticatedOwnershipRequest(
      {
        AIPHABEE_API: { resolveOwnership: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.holders?.[0]?.crossHolding).toEqual({ instrumentId: "hkex_security_01038" });
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedOwnershipRequest(
      {} as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveOwnership =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedOwnershipRequest(
      { AIPHABEE_API: { resolveOwnership } } as unknown as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each([
    ["synthetic result", { liveDataAccess: false }],
    ["missing provenance", { provenance: [] }],
    ["not_found status leaking through a success envelope", { status: "not_found", coverage: undefined, freeFloat: undefined, holders: undefined, shareCapital: undefined }],
    ["unavailable coverage that still carries shareCapital", { coverage: { reason: "x", status: "unavailable" }, shareCapital: SAMPLE_SHARE_CAPITAL }],
    ["available coverage carrying none of the 3 buckets", { freeFloat: undefined, holders: undefined, shareCapital: undefined }],
    ["a shareCapital with an invalid isHShare vocabulary value", { shareCapital: { ...SAMPLE_SHARE_CAPITAL, isHShare: "maybe" } }],
    ["a freeFloat missing a required field", { freeFloat: { ...SAMPLE_FREE_FLOAT, freeFloatPercent: undefined } }],
    ["a holder with an incomplete name", { holders: [{ ...SAMPLE_HOLDER, name: { en: "Li Ka-Shing" } }] }],
    ["a holder with a negative heldPercent", { holders: [{ ...SAMPLE_HOLDER, heldPercent: -1 }] }],
    ["a holder with a malformed crossHolding", { holders: [{ ...SAMPLE_HOLDER, crossHolding: { instrumentId: "" } }] }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveOwnershipRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedOwnershipRequest(
      {
        AIPHABEE_API: { resolveOwnership: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it("passes through a well-formed NOT_FOUND error envelope from the private RPC", async () => {
    const notFound = {
      envelope: {
        asOf: "2026-07-16T00:00:00.000Z",
        error: { code: "NOT_FOUND" as const, message: "ownership records were not found" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 404,
    };
    const result = await resolveAuthenticatedOwnershipRequest(
      {
        AIPHABEE_API: { resolveOwnership: vi.fn().mockResolvedValue(notFound) },
      } as unknown as AuthenticatedOwnershipBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("NOT_FOUND");
  });
});

function liveOwnershipRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion = "netquity-ownership-test.v1";
  const methodologyVersion = "get-ownership-live.v1";
  const provenance = [
    {
      data_version: dataVersion,
      methodology_version: methodologyVersion,
      source: "netquity-ownership",
      source_record_id: "netquity:listcompheld.data:00001:01",
    },
  ];
  const usage = { cached: false, credits: 0, rows: 1 };
  return {
    envelope: createSuccessEnvelope({
      coverage: { status: "available" as const },
      dataVersion,
      freeFloat: SAMPLE_FREE_FLOAT,
      holders: [SAMPLE_HOLDER],
      instrumentId: "hkex_security_00001",
      liveDataAccess: true as const,
      methodologyVersion,
      provenance,
      shareCapital: SAMPLE_SHARE_CAPITAL,
      status: "found" as const,
      usage,
      ...overrides,
    }, {
      asOf: "2026-07-16T00:00:00.000Z",
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
  return vi.fn().mockResolvedValue(value) as unknown as OwnershipSessionReader;
}
