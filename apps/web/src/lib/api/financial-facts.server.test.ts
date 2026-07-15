import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedFinancialFactsRequest,
  validateFinancialFactsInput,
  type AuthenticatedFinancialFactsBindings,
  type FinancialFactsSessionReader,
} from "./financial-facts.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
const SAMPLE_FACT = {
  currency: "RMB",
  instrumentId: "hkex_security_00700",
  metricId: "revenue",
  periodEnd: "2025-12-31",
  periodType: "FY" as const,
  publishedAt: "2026-03-18T00:00:00+08:00",
  qualityState: "PASS" as const,
  scale: 1,
  sourceRecordId: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F",
  statementId: "netquity:finreport.stmt:00700:2025-12-31:F",
  statementType: "income_statement",
  unit: "unit",
  value: 751766000000,
};

describe("authenticated Web financial facts server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateFinancialFactsInput({ instrumentId: " hkex_security_00700 " })).toEqual({
      input: { instrumentId: "hkex_security_00700" },
      valid: true,
    });
    expect(
      validateFinancialFactsInput({ instrumentId: "hkex_security_00700", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateFinancialFactsInput({ instrumentId: "hkex_security_00700", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateFinancialFactsInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateFinancialFactsInput({ instrumentId: "eq_hk_00700" })).toEqual({ valid: false });
    expect(validateFinancialFactsInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("denies an absent session before reading the private RPC binding", async () => {
    let bindingReads = 0;
    const bindings = {
      get AIPHABEE_API() {
        bindingReads += 1;
        throw new Error("RPC binding must not be read");
      },
    } as unknown as AuthenticatedFinancialFactsBindings;
    const result = await resolveAuthenticatedFinancialFactsRequest(
      bindings,
      request(),
      { instrumentId: "hkex_security_00700" },
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
    } as unknown as AuthenticatedFinancialFactsBindings;
    const result = await resolveAuthenticatedFinancialFactsRequest(
      bindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      vi.fn().mockRejectedValue(new Error("auth database unavailable")),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
    expect(bindingReads).toBe(0);
  });

  it("derives the canonical subject from session and awaits the named RPC", async () => {
    const resolveFinancialFacts = vi.fn().mockResolvedValue(liveFinancialFactsRpcResult());
    const result = await resolveAuthenticatedFinancialFactsRequest(
      { AIPHABEE_API: { resolveFinancialFacts } } as unknown as AuthenticatedFinancialFactsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveFinancialFacts).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00700",
      requestId: "request_test",
    });
  });

  it("accepts a bank/insurance unavailable-coverage response with an empty facts array", async () => {
    const response = liveFinancialFactsRpcResult({
      coverage: {
        reason: "reports under the bank/insurance statement schema (pla_b/pla_i/bal_b/bal_i), which is not rights-pinned by this promotion",
        status: "unavailable",
      },
      facts: [],
      instrumentId: "hkex_security_00005",
    });
    const result = await resolveAuthenticatedFinancialFactsRequest(
      {
        AIPHABEE_API: { resolveFinancialFacts: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedFinancialFactsBindings,
      request(),
      { instrumentId: "hkex_security_00005" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.facts).toEqual([]);
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedFinancialFactsRequest(
      {} as AuthenticatedFinancialFactsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveFinancialFacts =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedFinancialFactsRequest(
      { AIPHABEE_API: { resolveFinancialFacts } } as unknown as AuthenticatedFinancialFactsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each([
    ["synthetic result", { liveDataAccess: false }],
    ["missing provenance", { provenance: [] }],
    ["not_found status leaking through a success envelope", { status: "not_found", coverage: undefined, facts: undefined }],
    ["unavailable coverage that still carries fact rows", { coverage: { reason: "x", status: "unavailable" }, facts: [SAMPLE_FACT] }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveFinancialFactsRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedFinancialFactsRequest(
      {
        AIPHABEE_API: { resolveFinancialFacts: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedFinancialFactsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
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
        error: { code: "NOT_FOUND" as const, message: "financial facts were not found" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 404,
    };
    const result = await resolveAuthenticatedFinancialFactsRequest(
      {
        AIPHABEE_API: { resolveFinancialFacts: vi.fn().mockResolvedValue(notFound) },
      } as unknown as AuthenticatedFinancialFactsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("NOT_FOUND");
  });
});

function liveFinancialFactsRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion = "netquity-financial-facts-test.v1";
  const methodologyVersion = "get-financial-facts-live.v1";
  const provenance = [{
    data_version: dataVersion,
    methodology_version: methodologyVersion,
    source: "netquity-finreport-nb",
    source_record_id: SAMPLE_FACT.sourceRecordId,
  }];
  const usage = { cached: false, credits: 0, rows: 1 };
  return {
    envelope: createSuccessEnvelope({
      coverage: { status: "available" as const },
      dataVersion,
      facts: [SAMPLE_FACT],
      instrumentId: "hkex_security_00700",
      liveDataAccess: true as const,
      methodologyVersion,
      provenance,
      status: "found" as const,
      toolName: "get_financial_facts" as const,
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
  return vi.fn().mockResolvedValue(value) as unknown as FinancialFactsSessionReader;
}
