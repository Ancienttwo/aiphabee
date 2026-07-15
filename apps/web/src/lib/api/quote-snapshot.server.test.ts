import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedQuoteSnapshotRequest,
  validateQuoteSnapshotInput,
  type AuthenticatedQuoteSnapshotBindings,
  type QuoteSnapshotSessionReader,
} from "./quote-snapshot.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
const SAMPLE_QUOTE = {
  close: 461.2,
  currency: "HKD",
  high: 465,
  instrumentId: "hkex_security_00700",
  low: 458.4,
  open: 460,
  sharesOutstanding: 9092370719,
  tradeDate: "2026-07-07",
  turnover: 25937523114,
  volume: 55418434,
};

describe("authenticated Web quote snapshot server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateQuoteSnapshotInput({ instrumentId: " hkex_security_00700 " })).toEqual({
      input: { instrumentId: "hkex_security_00700" },
      valid: true,
    });
    expect(
      validateQuoteSnapshotInput({ instrumentId: "hkex_security_00700", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateQuoteSnapshotInput({ instrumentId: "hkex_security_00700", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateQuoteSnapshotInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateQuoteSnapshotInput({ instrumentId: "eq_hk_00700" })).toEqual({ valid: false });
    expect(validateQuoteSnapshotInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("denies an absent session before reading the private RPC binding", async () => {
    let bindingReads = 0;
    const bindings = {
      get AIPHABEE_API() {
        bindingReads += 1;
        throw new Error("RPC binding must not be read");
      },
    } as unknown as AuthenticatedQuoteSnapshotBindings;
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
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
    } as unknown as AuthenticatedQuoteSnapshotBindings;
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
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
    const resolveQuoteSnapshot = vi.fn().mockResolvedValue(liveQuoteSnapshotRpcResult());
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      { AIPHABEE_API: { resolveQuoteSnapshot } } as unknown as AuthenticatedQuoteSnapshotBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveQuoteSnapshot).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00700",
      requestId: "request_test",
    });
  });

  it("accepts a no-daily-row unavailable-coverage response with an absent quote", async () => {
    const response = liveQuoteSnapshotRpcResult({
      coverage: {
        reason:
          "no EOD price row exists in nq_unadjprice2.daily for this instrument as of the mirrored snapshot date; nq_unadjprice2.daily does not encode a reason (delisting, an instrument type outside this price feed's coverage, or a vendor coverage gap are all possible and indistinguishable from this table alone)",
        status: "unavailable",
      },
      instrumentId: "hkex_security_09999",
      quote: undefined,
    });
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      {
        AIPHABEE_API: { resolveQuoteSnapshot: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedQuoteSnapshotBindings,
      request(),
      { instrumentId: "hkex_security_09999" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.quote).toBeUndefined();
    }
  });

  it("accepts an available quote with independently-absent optional fields", async () => {
    const response = liveQuoteSnapshotRpcResult({
      quote: {
        close: 461.2,
        currency: "HKD",
        instrumentId: "hkex_security_00700",
        tradeDate: "2026-07-07",
      },
    });
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      {
        AIPHABEE_API: { resolveQuoteSnapshot: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedQuoteSnapshotBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.quote?.close).toBe(461.2);
      expect(result.envelope.data.quote?.open).toBeUndefined();
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      {} as AuthenticatedQuoteSnapshotBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveQuoteSnapshot =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      { AIPHABEE_API: { resolveQuoteSnapshot } } as unknown as AuthenticatedQuoteSnapshotBindings,
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
    ["not_found status leaking through a success envelope", { status: "not_found", coverage: undefined, quote: undefined }],
    ["unavailable coverage that still carries a quote", { coverage: { reason: "x", status: "unavailable" }, quote: SAMPLE_QUOTE }],
    ["non-numeric optional field", { quote: { ...SAMPLE_QUOTE, close: "461.2" } }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveQuoteSnapshotRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      {
        AIPHABEE_API: { resolveQuoteSnapshot: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedQuoteSnapshotBindings,
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
        error: { code: "NOT_FOUND" as const, message: "quote snapshot was not found" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 404,
    };
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      {
        AIPHABEE_API: { resolveQuoteSnapshot: vi.fn().mockResolvedValue(notFound) },
      } as unknown as AuthenticatedQuoteSnapshotBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("NOT_FOUND");
  });
});

function liveQuoteSnapshotRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion = "netquity-quote-snapshot-test.v1";
  const methodologyVersion = "get-quote-snapshot-live.v1";
  const provenance = [{
    data_version: dataVersion,
    methodology_version: methodologyVersion,
    source: "netquity-unadjprice2-daily",
    source_record_id: "netquity:unadjprice2.daily:00700",
  }];
  const usage = { cached: false, credits: 0, rows: 1 };
  return {
    envelope: createSuccessEnvelope({
      coverage: { status: "available" as const },
      dataVersion,
      instrumentId: "hkex_security_00700",
      liveDataAccess: true as const,
      methodologyVersion,
      provenance,
      quote: SAMPLE_QUOTE,
      status: "found" as const,
      toolName: "get_quote_snapshot" as const,
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
  return vi.fn().mockResolvedValue(value) as unknown as QuoteSnapshotSessionReader;
}
