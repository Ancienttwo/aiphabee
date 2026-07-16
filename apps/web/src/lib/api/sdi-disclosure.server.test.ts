import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import { AuthConfigurationError, PUBLIC_ANONYMOUS_AUTH_SUBJECT } from "../auth.server";
import {
  resolveAuthenticatedSdiDisclosureRequest,
  validateSdiDisclosureInput,
  type AuthenticatedSdiDisclosureBindings,
  type SdiDisclosureSessionReader,
} from "./sdi-disclosure.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) row
// spot-checked via psql against the local netquity mirror.
const SAMPLE_DISCLOSURE = {
  disclosureId: "sdi_disclosure_00001_2_2606260526",
  formType: "2",
  holderName: { en: "BlackRock, Inc.", zhHans: "贝莱德", zhHant: "貝萊德" },
  instrumentId: "hkex_security_00001",
  positions: [
    {
      currency: "HKD",
      eventCode: "1004",
      positionType: "long",
      presentBalancePercent: 5.17,
      presentBalanceShares: 197978928,
      previousBalancePercent: 4.91,
      previousBalanceShares: 188109983,
      shares: 9868945,
    },
    {
      positionType: "short",
      presentBalancePercent: 0.06,
      presentBalanceShares: 2385750,
      previousBalancePercent: 0.06,
      previousBalanceShares: 2327250,
    },
  ],
  referenceNo: "CS20260626E00526",
  reportDate: "2026-06-26",
  shareClass: "O",
  sourceRecordId: "netquity:sdidata.sdi:00001:2:2606260526",
  transactionDate: "2026-06-23",
};

describe("authenticated Web sdi disclosure server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateSdiDisclosureInput({ instrumentId: " hkex_security_00001 " })).toEqual({
      input: { instrumentId: "hkex_security_00001" },
      valid: true,
    });
    expect(
      validateSdiDisclosureInput({ instrumentId: "hkex_security_00001", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateSdiDisclosureInput({ instrumentId: "hkex_security_00001", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateSdiDisclosureInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateSdiDisclosureInput({ instrumentId: "eq_hk_00001" })).toEqual({ valid: false });
    expect(validateSdiDisclosureInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("resolves the RPC using the public anonymous sentinel subject when no session is present", async () => {
    const resolveSdiDisclosure = vi.fn().mockResolvedValue(liveSdiDisclosureRpcResult());
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      { AIPHABEE_API: { resolveSdiDisclosure } } as unknown as AuthenticatedSdiDisclosureBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader(null),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveSdiDisclosure).toHaveBeenCalledWith({
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
    } as unknown as AuthenticatedSdiDisclosureBindings;
    const result = await resolveAuthenticatedSdiDisclosureRequest(
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

  it("resolves the public anonymous sentinel when the session reader throws AUTH_OAUTH_CONFIG_MISSING", async () => {
    const resolveSdiDisclosure = vi.fn().mockResolvedValue(liveSdiDisclosureRpcResult());
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      { AIPHABEE_API: { resolveSdiDisclosure } } as unknown as AuthenticatedSdiDisclosureBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      vi.fn().mockRejectedValue(new AuthConfigurationError("AUTH_OAUTH_CONFIG_MISSING")),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveSdiDisclosure).toHaveBeenCalledWith({
      authSubject: PUBLIC_ANONYMOUS_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });
  });

  it("derives the canonical subject from session and awaits the named RPC", async () => {
    const resolveSdiDisclosure = vi.fn().mockResolvedValue(liveSdiDisclosureRpcResult());
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      { AIPHABEE_API: { resolveSdiDisclosure } } as unknown as AuthenticatedSdiDisclosureBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveSdiDisclosure).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });
  });

  it("accepts a zero-filing unavailable-coverage response with an empty disclosures array", async () => {
    const response = liveSdiDisclosureRpcResult({
      coverage: {
        reason:
          "no substantial-shareholder or director/chief-executive disclosure-of-interests filing found in nq_sdidata.sdi for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
      disclosures: [],
      instrumentId: "hkex_security_00007",
    });
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      {
        AIPHABEE_API: { resolveSdiDisclosure: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedSdiDisclosureBindings,
      request(),
      { instrumentId: "hkex_security_00007" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.disclosures).toEqual([]);
    }
  });

  it("accepts an available result with a long-only filing carrying no short/pool positions", async () => {
    const response = liveSdiDisclosureRpcResult({
      disclosures: [
        {
          ...SAMPLE_DISCLOSURE,
          positions: [SAMPLE_DISCLOSURE.positions[0]],
        },
      ],
    });
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      {
        AIPHABEE_API: { resolveSdiDisclosure: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedSdiDisclosureBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.disclosures?.[0]?.positions).toHaveLength(1);
      expect(result.envelope.data.disclosures?.[0]?.positions[0]?.positionType).toBe("long");
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      {} as AuthenticatedSdiDisclosureBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveSdiDisclosure =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      { AIPHABEE_API: { resolveSdiDisclosure } } as unknown as AuthenticatedSdiDisclosureBindings,
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
    ["not_found status leaking through a success envelope", { status: "not_found", coverage: undefined, disclosures: undefined }],
    ["unavailable coverage that still carries disclosures", { coverage: { reason: "x", status: "unavailable" }, disclosures: [SAMPLE_DISCLOSURE] }],
    ["a disclosure with an unpromoted formType", { disclosures: [{ ...SAMPLE_DISCLOSURE, formType: "4" }] }],
    ["a disclosure with an incomplete holderName", { disclosures: [{ ...SAMPLE_DISCLOSURE, holderName: { en: "BlackRock, Inc." } }] }],
    ["a disclosure with an empty positions array", { disclosures: [{ ...SAMPLE_DISCLOSURE, positions: [] }] }],
    ["a disclosure with a malformed reportDate", { disclosures: [{ ...SAMPLE_DISCLOSURE, reportDate: "2026/06/26" }] }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveSdiDisclosureRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      {
        AIPHABEE_API: { resolveSdiDisclosure: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedSdiDisclosureBindings,
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
        asOf: "2026-07-15T00:00:00.000Z",
        error: { code: "NOT_FOUND" as const, message: "sdi disclosures were not found" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 404,
    };
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      {
        AIPHABEE_API: { resolveSdiDisclosure: vi.fn().mockResolvedValue(notFound) },
      } as unknown as AuthenticatedSdiDisclosureBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("NOT_FOUND");
  });
});

function liveSdiDisclosureRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion = "netquity-sdi-disclosure-test.v1";
  const methodologyVersion = "get-sdi-disclosures-live.v1";
  const provenance = [
    {
      data_version: dataVersion,
      methodology_version: methodologyVersion,
      source: "netquity-sdi-disclosure",
      source_record_id: "netquity:sdidata.sdi:00001:2:2606260526",
    },
  ];
  const usage = { cached: false, credits: 0, rows: 1 };
  return {
    envelope: createSuccessEnvelope({
      coverage: { status: "available" as const },
      dataVersion,
      disclosures: [SAMPLE_DISCLOSURE],
      instrumentId: "hkex_security_00001",
      liveDataAccess: true as const,
      methodologyVersion,
      provenance,
      status: "found" as const,
      usage,
      ...overrides,
    }, {
      asOf: "2026-07-15T00:00:00.000Z",
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
  return vi.fn().mockResolvedValue(value) as unknown as SdiDisclosureSessionReader;
}
