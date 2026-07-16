import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import { PUBLIC_ANONYMOUS_AUTH_SUBJECT } from "../auth.server";
import {
  resolveAuthenticatedRelatedWarrantsRequest,
  validateRelatedWarrantsInput,
  type AuthenticatedRelatedWarrantsBindings,
  type RelatedWarrantsSessionReader,
} from "./related-warrants.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) row spot-
// checked via psql against the local netquity mirror: 2 of its 20 related
// warrants (dp_warrant code 14662, dc_warrant code 24792).
const SAMPLE_WARRANT_DP = {
  category: "dp_warrant" as const,
  instrumentId: "hkex_security_14662",
  name: { en: "CI-CK Hutchison@EP2612A", zhHans: "长和信证EP2612A", zhHant: "長和信證EP2612A" },
  sourceRecordId: "netquity:relatedcode.dp_warrant:00001:14662",
};
const SAMPLE_WARRANT_DC = {
  category: "dc_warrant" as const,
  instrumentId: "hkex_security_24792",
  name: { en: "MB-CK Hutchison@EC2610A", zhHans: "长和麦银EC2610A", zhHant: "長和麥銀EC2610A" },
  sourceRecordId: "netquity:relatedcode.dc_warrant:00001:24792",
};

describe("authenticated Web related-warrants server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateRelatedWarrantsInput({ instrumentId: " hkex_security_00001 " })).toEqual({
      input: { instrumentId: "hkex_security_00001" },
      valid: true,
    });
    expect(
      validateRelatedWarrantsInput({ instrumentId: "hkex_security_00001", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateRelatedWarrantsInput({ instrumentId: "hkex_security_00001", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateRelatedWarrantsInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateRelatedWarrantsInput({ instrumentId: "eq_hk_00001" })).toEqual({ valid: false });
    expect(validateRelatedWarrantsInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("resolves the RPC using the public anonymous sentinel subject when no session is present", async () => {
    const resolveRelatedWarrants = vi.fn().mockResolvedValue(liveRelatedWarrantsRpcResult());
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      { AIPHABEE_API: { resolveRelatedWarrants } } as unknown as AuthenticatedRelatedWarrantsBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader(null),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveRelatedWarrants).toHaveBeenCalledWith({
      authSubject: PUBLIC_ANONYMOUS_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });
  });

  it("returns a typed failure when session authority throws before reading RPC", async () => {
    let bindingReads = 0;
    const bindings = {
      get AIPHABEE_API() {
        bindingReads += 1;
        throw new Error("RPC binding must not be read");
      },
    } as unknown as AuthenticatedRelatedWarrantsBindings;
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
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
    const resolveRelatedWarrants = vi.fn().mockResolvedValue(liveRelatedWarrantsRpcResult());
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      { AIPHABEE_API: { resolveRelatedWarrants } } as unknown as AuthenticatedRelatedWarrantsBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveRelatedWarrants).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });
  });

  it("accepts a zero-coverage unavailable response with warrants absent", async () => {
    const response = liveRelatedWarrantsRpcResult({
      coverage: {
        reason:
          "no derivative warrant or CBBC code is associated with this instrument in nq_basicdata.relatedcode in the current mirrored snapshot",
        status: "unavailable",
      },
      instrumentId: "hkex_security_00007",
      warrants: undefined,
    });
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      {
        AIPHABEE_API: { resolveRelatedWarrants: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedRelatedWarrantsBindings,
      request(),
      { instrumentId: "hkex_security_00007" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.warrants).toBeUndefined();
    }
  });

  it("accepts an available result carrying warrants across different categories", async () => {
    const response = liveRelatedWarrantsRpcResult();
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      {
        AIPHABEE_API: { resolveRelatedWarrants: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedRelatedWarrantsBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.warrants).toHaveLength(2);
      expect(result.envelope.data.warrants?.map((w) => w.category)).toEqual(["dp_warrant", "dc_warrant"]);
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      {} as AuthenticatedRelatedWarrantsBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveRelatedWarrants =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      { AIPHABEE_API: { resolveRelatedWarrants } } as unknown as AuthenticatedRelatedWarrantsBindings,
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
    ["not_found status leaking through a success envelope", { status: "not_found", coverage: undefined, warrants: undefined }],
    ["unavailable coverage that still carries warrants", { coverage: { reason: "x", status: "unavailable" }, warrants: [SAMPLE_WARRANT_DP] }],
    ["available coverage carrying no warrants", { warrants: undefined }],
    ["a warrant with an unrecognized category", { warrants: [{ ...SAMPLE_WARRANT_DP, category: "call" }] }],
    ["a warrant with an incomplete name", { warrants: [{ ...SAMPLE_WARRANT_DP, name: { en: "CI-CK Hutchison@EP2612A" } }] }],
    ["a warrant with an empty instrumentId", { warrants: [{ ...SAMPLE_WARRANT_DP, instrumentId: "" }] }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveRelatedWarrantsRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      {
        AIPHABEE_API: { resolveRelatedWarrants: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedRelatedWarrantsBindings,
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
        error: { code: "NOT_FOUND" as const, message: "related-warrants records were not found" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 404,
    };
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      {
        AIPHABEE_API: { resolveRelatedWarrants: vi.fn().mockResolvedValue(notFound) },
      } as unknown as AuthenticatedRelatedWarrantsBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("NOT_FOUND");
  });
});

function liveRelatedWarrantsRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion = "netquity-related-warrants-test.v1";
  const methodologyVersion = "get-related-warrants-live.v1";
  const provenance = [
    {
      data_version: dataVersion,
      methodology_version: methodologyVersion,
      source: "netquity-related-warrants",
      source_record_id: "netquity:relatedcode.dp_warrant:00001:14662",
    },
    {
      data_version: dataVersion,
      methodology_version: methodologyVersion,
      source: "netquity-related-warrants",
      source_record_id: "netquity:relatedcode.dc_warrant:00001:24792",
    },
  ];
  const usage = { cached: false, credits: 0, rows: 2 };
  return {
    envelope: createSuccessEnvelope({
      coverage: { status: "available" as const },
      dataVersion,
      instrumentId: "hkex_security_00001",
      liveDataAccess: true as const,
      methodologyVersion,
      provenance,
      status: "found" as const,
      usage,
      warrants: [SAMPLE_WARRANT_DP, SAMPLE_WARRANT_DC],
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
  return vi.fn().mockResolvedValue(value) as unknown as RelatedWarrantsSessionReader;
}
