import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import { AuthConfigurationError, PUBLIC_ANONYMOUS_AUTH_SUBJECT } from "../auth.server";
import {
  resolveAuthenticatedDirectorateRequest,
  validateDirectorateInput,
  type AuthenticatedDirectorateBindings,
  type DirectorateSessionReader,
} from "./directorate.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) row
// spot-checked via psql against the local netquity mirror.
const SAMPLE_DIRECTOR = {
  age: 61,
  biography: {
    en: "LI Tzar Kuoi, Victor aged 61, has been a Director of the Company since December 2014.",
    zhHans: "李泽巨61岁，自2014年12月起出任本公司董事。",
    zhHant: "李澤鉅61歲，自2014年12月起出任本公司董事。"
  },
  capacity: "D" as const,
  instrumentId: "hkex_security_00001",
  name: { en: "LI Tzar Kuoi, Victor", zhHans: "李泽巨", zhHant: "李澤鉅" },
  profileId: "directorate_00001_001",
  remuneration: {
    currency: "HKD",
    currentAmount: 53180000,
    currentYearEnd: "2025-12-31",
    previousAmount: 51660000,
    previousYearEnd: "2024-12-31"
  },
  sourceRecordId: "netquity:biography.biography:00001:001",
  title: { en: "Chairman and Executive Director", zhHans: "主席兼执行董事", zhHant: "主席兼執行董事" }
};

describe("authenticated Web directorate server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateDirectorateInput({ instrumentId: " hkex_security_00001 " })).toEqual({
      input: { instrumentId: "hkex_security_00001" },
      valid: true,
    });
    expect(
      validateDirectorateInput({ instrumentId: "hkex_security_00001", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateDirectorateInput({ instrumentId: "hkex_security_00001", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateDirectorateInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateDirectorateInput({ instrumentId: "eq_hk_00001" })).toEqual({ valid: false });
    expect(validateDirectorateInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("resolves the RPC using the public anonymous sentinel subject when no session is present", async () => {
    const resolveDirectorate = vi.fn().mockResolvedValue(liveDirectorateRpcResult());
    const result = await resolveAuthenticatedDirectorateRequest(
      { AIPHABEE_API: { resolveDirectorate } } as unknown as AuthenticatedDirectorateBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader(null),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveDirectorate).toHaveBeenCalledWith({
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
    } as unknown as AuthenticatedDirectorateBindings;
    const result = await resolveAuthenticatedDirectorateRequest(
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
    const resolveDirectorate = vi.fn().mockResolvedValue(liveDirectorateRpcResult());
    const result = await resolveAuthenticatedDirectorateRequest(
      { AIPHABEE_API: { resolveDirectorate } } as unknown as AuthenticatedDirectorateBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      vi.fn().mockRejectedValue(new AuthConfigurationError("AUTH_OAUTH_CONFIG_MISSING")),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveDirectorate).toHaveBeenCalledWith({
      authSubject: PUBLIC_ANONYMOUS_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });
  });

  it("derives the canonical subject from session and awaits the named RPC", async () => {
    const resolveDirectorate = vi.fn().mockResolvedValue(liveDirectorateRpcResult());
    const result = await resolveAuthenticatedDirectorateRequest(
      { AIPHABEE_API: { resolveDirectorate } } as unknown as AuthenticatedDirectorateBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveDirectorate).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });
  });

  it("accepts a zero-biography unavailable-coverage response with an empty directors array", async () => {
    const response = liveDirectorateRpcResult({
      coverage: {
        reason:
          "no director or senior-management biography record found in nq_biography.biography for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
      directors: [],
      instrumentId: "hkex_security_01687",
    });
    const result = await resolveAuthenticatedDirectorateRequest(
      {
        AIPHABEE_API: { resolveDirectorate: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDirectorateBindings,
      request(),
      { instrumentId: "hkex_security_01687" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.directors).toEqual([]);
    }
  });

  it("accepts an available result with a senior-management entry carrying no age/biography/remuneration", async () => {
    const response = liveDirectorateRpcResult({
      directors: [
        {
          capacity: "S" as const,
          instrumentId: "hkex_security_00001",
          name: { en: "CHEUNG Kwan Hoi", zhHans: "张钧海", zhHant: "張鈞海" },
          profileId: "directorate_00001_002",
          sourceRecordId: "netquity:biography.biography:00001:002",
          title: { en: "Group Chief Financial Officer", zhHans: "集团首席财务官", zhHant: "集團首席財務官" },
        },
      ],
    });
    const result = await resolveAuthenticatedDirectorateRequest(
      {
        AIPHABEE_API: { resolveDirectorate: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDirectorateBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.directors?.[0]?.age).toBeUndefined();
      expect(result.envelope.data.directors?.[0]?.biography).toBeUndefined();
      expect(result.envelope.data.directors?.[0]?.remuneration).toBeUndefined();
      expect(result.envelope.data.directors?.[0]?.capacity).toBe("S");
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedDirectorateRequest(
      {} as AuthenticatedDirectorateBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveDirectorate =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedDirectorateRequest(
      { AIPHABEE_API: { resolveDirectorate } } as unknown as AuthenticatedDirectorateBindings,
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
    ["not_found status leaking through a success envelope", { status: "not_found", coverage: undefined, directors: undefined }],
    ["unavailable coverage that still carries directors", { coverage: { reason: "x", status: "unavailable" }, directors: [SAMPLE_DIRECTOR] }],
    ["a director with an unpromoted capacity", { directors: [{ ...SAMPLE_DIRECTOR, capacity: "E" }] }],
    ["a director with an incomplete name", { directors: [{ ...SAMPLE_DIRECTOR, name: { en: "LI Tzar Kuoi, Victor" } }] }],
    ["a director with a title missing zhHant/zhHans", { directors: [{ ...SAMPLE_DIRECTOR, title: { en: "Chairman" } }] }],
    ["a director with a negative age", { directors: [{ ...SAMPLE_DIRECTOR, age: -1 }] }],
    ["a director with a negative remuneration amount", { directors: [{ ...SAMPLE_DIRECTOR, remuneration: { ...SAMPLE_DIRECTOR.remuneration, currentAmount: -1 } }] }],
    ["a director with a malformed remuneration date", { directors: [{ ...SAMPLE_DIRECTOR, remuneration: { ...SAMPLE_DIRECTOR.remuneration, currentYearEnd: "2025/12/31" } }] }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveDirectorateRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedDirectorateRequest(
      {
        AIPHABEE_API: { resolveDirectorate: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDirectorateBindings,
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
        error: { code: "NOT_FOUND" as const, message: "directorate records were not found" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 404,
    };
    const result = await resolveAuthenticatedDirectorateRequest(
      {
        AIPHABEE_API: { resolveDirectorate: vi.fn().mockResolvedValue(notFound) },
      } as unknown as AuthenticatedDirectorateBindings,
      request(),
      { instrumentId: "hkex_security_00001" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("NOT_FOUND");
  });
});

function liveDirectorateRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion = "netquity-directorate-test.v1";
  const methodologyVersion = "get-directorate-live.v1";
  const provenance = [
    {
      data_version: dataVersion,
      methodology_version: methodologyVersion,
      source: "netquity-directorate",
      source_record_id: "netquity:biography.biography:00001:001",
    },
  ];
  const usage = { cached: false, credits: 0, rows: 1 };
  return {
    envelope: createSuccessEnvelope({
      coverage: { status: "available" as const },
      dataVersion,
      directors: [SAMPLE_DIRECTOR],
      instrumentId: "hkex_security_00001",
      liveDataAccess: true as const,
      methodologyVersion,
      provenance,
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
  return vi.fn().mockResolvedValue(value) as unknown as DirectorateSessionReader;
}
