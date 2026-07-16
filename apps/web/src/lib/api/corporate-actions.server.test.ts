import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import { PUBLIC_ANONYMOUS_AUTH_SUBJECT } from "../auth.server";
import {
  resolveAuthenticatedCorporateActionsRequest,
  validateCorporateActionsInput,
  type AuthenticatedCorporateActionsBindings,
  type CorporateActionsSessionReader,
} from "./corporate-actions.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
const SAMPLE_DIVIDEND = {
  actionId: "corp_action_dividend_00697_135063_sd",
  actionType: "dividend",
  announcementDate: "2026-03-27",
  effectiveDate: "2026-12-10",
  exDate: "2026-12-10",
  instrumentId: "hkex_security_00697",
  paymentDate: "2026-12-29",
  sourceRecordId: "netquity:dividendinfo.dividendinfo:00697:135063:sd",
  summary: "Special Dividend: HKD 0.0284",
  terms: { cashAmount: 0.0284, currency: "HKD" },
};
const SAMPLE_BUYBACK = {
  actionId: "corp_action_buyback_00697_20260707",
  actionType: "buyback",
  announcementDate: "2026-07-07",
  effectiveDate: "2026-07-07",
  instrumentId: "hkex_security_00697",
  sourceRecordId: "netquity:sharebuyback.daily_data:00697:2026-07-07",
  terms: { buybackValue: 1566857.44, currency: "HKD", shares: 1000000 },
};

describe("authenticated Web corporate actions server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateCorporateActionsInput({ instrumentId: " hkex_security_00697 " })).toEqual({
      input: { instrumentId: "hkex_security_00697" },
      valid: true,
    });
    expect(
      validateCorporateActionsInput({ instrumentId: "hkex_security_00697", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateCorporateActionsInput({ instrumentId: "hkex_security_00697", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateCorporateActionsInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateCorporateActionsInput({ instrumentId: "eq_hk_00697" })).toEqual({ valid: false });
    expect(validateCorporateActionsInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("resolves the RPC using the public anonymous sentinel subject when no session is present", async () => {
    const resolveCorporateActions = vi.fn().mockResolvedValue(liveCorporateActionsRpcResult());
    const result = await resolveAuthenticatedCorporateActionsRequest(
      { AIPHABEE_API: { resolveCorporateActions } } as unknown as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_00697" },
      sessionReader(null),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveCorporateActions).toHaveBeenCalledWith({
      authSubject: PUBLIC_ANONYMOUS_AUTH_SUBJECT,
      instrumentId: "hkex_security_00697",
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
    } as unknown as AuthenticatedCorporateActionsBindings;
    const result = await resolveAuthenticatedCorporateActionsRequest(
      bindings,
      request(),
      { instrumentId: "hkex_security_00697" },
      vi.fn().mockRejectedValue(new Error("auth database unavailable")),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
    expect(bindingReads).toBe(0);
  });

  it("derives the canonical subject from session and awaits the named RPC", async () => {
    const resolveCorporateActions = vi.fn().mockResolvedValue(liveCorporateActionsRpcResult());
    const result = await resolveAuthenticatedCorporateActionsRequest(
      { AIPHABEE_API: { resolveCorporateActions } } as unknown as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_00697" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveCorporateActions).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00697",
      requestId: "request_test",
    });
  });

  it("accepts a zero-event unavailable-coverage response with an empty actions array", async () => {
    const response = liveCorporateActionsRpcResult({
      actions: [],
      coverage: {
        reason:
          "no dividend, buyback, split, or consolidation event found in nq_dividendinfo/nq_sharebuyback/nq_corpact for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
      instrumentId: "hkex_security_00007",
    });
    const result = await resolveAuthenticatedCorporateActionsRequest(
      {
        AIPHABEE_API: { resolveCorporateActions: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_00007" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.actions).toEqual([]);
    }
  });

  it("accepts an available result with a split action carrying no terms", async () => {
    const response = liveCorporateActionsRpcResult({
      actions: [
        {
          actionId: "corp_action_split_02525_20260527",
          actionType: "split",
          announcementDate: "2026-05-27",
          effectiveDate: "2026-07-10",
          exDate: "2026-07-10",
          instrumentId: "hkex_security_02525",
          sourceRecordId: "netquity:corpact.stocksplit:02525:2026-05-27",
          summary: "Share Split: 8 - for - 1",
        },
      ],
      instrumentId: "hkex_security_02525",
    });
    const result = await resolveAuthenticatedCorporateActionsRequest(
      {
        AIPHABEE_API: { resolveCorporateActions: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_02525" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.actions?.[0]?.terms).toBeUndefined();
      expect(result.envelope.data.actions?.[0]?.summary).toBe("Share Split: 8 - for - 1");
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedCorporateActionsRequest(
      {} as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_00697" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveCorporateActions =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedCorporateActionsRequest(
      { AIPHABEE_API: { resolveCorporateActions } } as unknown as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_00697" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each([
    ["synthetic result", { liveDataAccess: false }],
    ["missing provenance", { provenance: [] }],
    ["not_found status leaking through a success envelope", { status: "not_found", coverage: undefined, actions: undefined }],
    ["unavailable coverage that still carries actions", { coverage: { reason: "x", status: "unavailable" }, actions: [SAMPLE_DIVIDEND] }],
    ["an action with an unpromoted actionType", { actions: [{ ...SAMPLE_DIVIDEND, actionType: "rights" }] }],
    ["a dividend action missing terms.cashAmount", { actions: [{ ...SAMPLE_DIVIDEND, terms: { currency: "HKD" } }] }],
    ["an action with a malformed effectiveDate", { actions: [{ ...SAMPLE_BUYBACK, effectiveDate: "2026/07/07" }] }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveCorporateActionsRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedCorporateActionsRequest(
      {
        AIPHABEE_API: { resolveCorporateActions: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_00697" },
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
        error: { code: "NOT_FOUND" as const, message: "corporate actions were not found" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 404,
    };
    const result = await resolveAuthenticatedCorporateActionsRequest(
      {
        AIPHABEE_API: { resolveCorporateActions: vi.fn().mockResolvedValue(notFound) },
      } as unknown as AuthenticatedCorporateActionsBindings,
      request(),
      { instrumentId: "hkex_security_00697" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("NOT_FOUND");
  });
});

function liveCorporateActionsRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion = "netquity-corporate-actions-test.v1";
  const methodologyVersion = "get-corporate-actions-live.v1";
  const provenance = [
    {
      data_version: dataVersion,
      methodology_version: methodologyVersion,
      source: "netquity-corporate-actions",
      source_record_id: "netquity:dividendinfo.dividendinfo:00697:135063:sd",
    },
    {
      data_version: dataVersion,
      methodology_version: methodologyVersion,
      source: "netquity-corporate-actions",
      source_record_id: "netquity:sharebuyback.daily_data:00697:2026-07-07",
    },
  ];
  const usage = { cached: false, credits: 0, rows: 2 };
  return {
    envelope: createSuccessEnvelope({
      actions: [SAMPLE_DIVIDEND, SAMPLE_BUYBACK],
      coverage: { status: "available" as const },
      dataVersion,
      instrumentId: "hkex_security_00697",
      liveDataAccess: true as const,
      methodologyVersion,
      provenance,
      status: "found" as const,
      toolName: "get_corporate_actions" as const,
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
  return vi.fn().mockResolvedValue(value) as unknown as CorporateActionsSessionReader;
}
