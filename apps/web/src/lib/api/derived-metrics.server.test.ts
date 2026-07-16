import { describe, expect, it, vi } from "vitest";
import { createSuccessEnvelope } from "@aiphabee/data-contracts";
import { AuthConfigurationError, PUBLIC_ANONYMOUS_AUTH_SUBJECT } from "../auth.server";
import {
  resolveAuthenticatedDerivedMetricsRequest,
  validateDerivedMetricsInput,
  type AuthenticatedDerivedMetricsBindings,
  type DerivedMetricsSessionReader,
} from "./derived-metrics.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
const COMPUTED_METRIC = {
  anomaly_flags: [] as string[],
  category: "profitability" as const,
  inputs: { net_income: 200_000, revenue: 1_000_000 },
  metric_id: "net_margin",
  period_end: "2025-12-31",
  source_record_ids: [
    "netquity:finreport.pla_nb.net_prof:00700:2025-12-31:F",
    "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F",
  ],
  status: "computed" as const,
  unit: "ratio" as const,
  value: 0.2,
};
const BLOCKED_METRIC = {
  anomaly_flags: [] as string[],
  blocked_reason: "shares_outstanding_unavailable",
  category: "valuation" as const,
  inputs: { net_income: 200_000, quote_close: 461.2 },
  metric_id: "price_to_earnings",
  period_end: "2025-12-31",
  source_record_ids: [
    "netquity:finreport.pla_nb.net_prof:00700:2025-12-31:F",
    "netquity:unadjprice2.daily:00700",
  ],
  status: "blocked" as const,
  unit: "multiple" as const,
};
const DEFINITIONS = [
  { category: "profitability", formula: "net_income / revenue", label: "Net margin", metric_id: "net_margin", unit: "ratio" },
  { category: "valuation", formula: "market_cap / net_income", label: "Price to earnings", metric_id: "price_to_earnings", unit: "multiple" },
];

describe("authenticated Web derived metrics server boundary", () => {
  it("accepts only instrumentId as browser-controlled input", () => {
    expect(validateDerivedMetricsInput({ instrumentId: " hkex_security_00700 " })).toEqual({
      input: { instrumentId: "hkex_security_00700" },
      valid: true,
    });
    expect(
      validateDerivedMetricsInput({ instrumentId: "hkex_security_00700", authSubject: `better-auth:${USER_ID}` }),
    ).toEqual({ valid: false });
    expect(
      validateDerivedMetricsInput({ instrumentId: "hkex_security_00700", workspaceId: "workspace_other" }),
    ).toEqual({ valid: false });
    expect(validateDerivedMetricsInput({ instrumentId: "" })).toEqual({ valid: false });
    expect(validateDerivedMetricsInput({ instrumentId: "eq_hk_00700" })).toEqual({ valid: false });
    expect(validateDerivedMetricsInput({ instrumentId: "hkex_security_1" })).toEqual({ valid: false });
  });

  it("resolves the RPC using the public anonymous sentinel subject when no session is present", async () => {
    const resolveDerivedMetrics = vi.fn().mockResolvedValue(liveDerivedMetricsRpcResult());
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      { AIPHABEE_API: { resolveDerivedMetrics } } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader(null),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveDerivedMetrics).toHaveBeenCalledWith({
      authSubject: PUBLIC_ANONYMOUS_AUTH_SUBJECT,
      instrumentId: "hkex_security_00700",
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
    } as unknown as AuthenticatedDerivedMetricsBindings;
    const result = await resolveAuthenticatedDerivedMetricsRequest(
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

  it("resolves the public anonymous sentinel when the session reader throws AUTH_OAUTH_CONFIG_MISSING", async () => {
    const resolveDerivedMetrics = vi.fn().mockResolvedValue(liveDerivedMetricsRpcResult());
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      { AIPHABEE_API: { resolveDerivedMetrics } } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      vi.fn().mockRejectedValue(new AuthConfigurationError("AUTH_OAUTH_CONFIG_MISSING")),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveDerivedMetrics).toHaveBeenCalledWith({
      authSubject: PUBLIC_ANONYMOUS_AUTH_SUBJECT,
      instrumentId: "hkex_security_00700",
      requestId: "request_test",
    });
  });

  it("derives the canonical subject from session and awaits the named RPC", async () => {
    const resolveDerivedMetrics = vi.fn().mockResolvedValue(liveDerivedMetricsRpcResult());
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      { AIPHABEE_API: { resolveDerivedMetrics } } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect(resolveDerivedMetrics).toHaveBeenCalledWith({
      authSubject: `better-auth:${USER_ID}`,
      instrumentId: "hkex_security_00700",
      requestId: "request_test",
    });
  });

  it("accepts a partial response with a mix of computed and blocked metrics, without relabeling the blocked reason as unauthorized", async () => {
    const response = liveDerivedMetricsRpcResult();
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      {
        AIPHABEE_API: { resolveDerivedMetrics: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.status).toBe("partial");
      expect(result.envelope.data.metrics.find((m) => m.metric_id === "net_margin")?.status).toBe("computed");
      const blocked = result.envelope.data.metrics.find((m) => m.metric_id === "price_to_earnings");
      expect(blocked?.status).toBe("blocked");
      expect(blocked?.blocked_reason).toBe("shares_outstanding_unavailable");
    }
  });

  it("accepts a fully blocked response when both live datasets are absent, without a fabricated market cap", async () => {
    // "" (not this helper's usual composite string) is the honest
    // "nothing was read" data_version -- built inline, not via
    // liveDerivedMetricsRpcResult(), since that helper's dataVersion feeds
    // both the data payload and the envelope meta from one shared constant,
    // and this case needs both to consistently read "".
    const usage = { cached: false, credits: 0, rows: 2 };
    const response = {
      envelope: createSuccessEnvelope(
        {
          data_version: "",
          definitions: DEFINITIONS,
          financial_facts_as_of: undefined,
          financial_period_end: undefined,
          live_data_access: true as const,
          methodology_version: "2026-07-16.stock-workbench-derived-metrics-live.v1",
          metrics: [
            { ...COMPUTED_METRIC, anomaly_flags: [], blocked_reason: "financial_facts_not_found", inputs: {}, source_record_ids: [], status: "blocked" as const, value: undefined },
            { ...BLOCKED_METRIC, anomaly_flags: [], blocked_reason: "financial_facts_not_found", inputs: {}, source_record_ids: [] },
          ],
          provenance: [],
          quote_as_of: undefined,
          status: "blocked" as const,
          usage,
        },
        {
          asOf: "2026-07-15T00:00:00.000Z",
          dataVersion: "",
          methodologyVersion: "2026-07-16.stock-workbench-derived-metrics-live.v1",
          provenance: [],
          requestId: "request_test",
          usage,
        },
      ),
      status: 200,
    };
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      {
        AIPHABEE_API: { resolveDerivedMetrics: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.status).toBe("blocked");
      expect(result.envelope.data.provenance).toEqual([]);
      expect(result.envelope.data.metrics.every((m) => m.value === undefined)).toBe(true);
    }
  });

  it("fails closed when the service binding is missing", async () => {
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      {} as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(424);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each(["throws", "malformed"])("fails closed when private RPC %s", async (mode) => {
    const resolveDerivedMetrics =
      mode === "throws"
        ? vi.fn().mockRejectedValue(new Error("RPC failed"))
        : vi.fn().mockResolvedValue({ status: 200, envelope: { data: {} } });
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      { AIPHABEE_API: { resolveDerivedMetrics } } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it.each([
    ["synthetic result", { live_data_access: false }],
    ["non-string methodology_version", { methodology_version: "" }],
    ["invalid top-level status", { status: "unknown" }],
    ["a provenance entry from an unknown source", { provenance: [{ data_version: "v1", methodology_version: "v1", source: "made-up-source", source_record_id: "x" }] }],
    ["mismatched envelope/data data_version", { data_version: "different-from-envelope-meta" }],
  ])("fails closed for a %s from the private RPC", async (_label, override) => {
    const response = liveDerivedMetricsRpcResult();
    if (response.envelope.ok) Object.assign(response.envelope.data, override);
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      {
        AIPHABEE_API: { resolveDerivedMetrics: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it("fails closed when a blocked metric carries no blocked_reason", async () => {
    const response = liveDerivedMetricsRpcResult();
    if (response.envelope.ok) {
      response.envelope.data.metrics = [
        { ...BLOCKED_METRIC, blocked_reason: undefined } as unknown as (typeof BLOCKED_METRIC),
      ];
    }
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      {
        AIPHABEE_API: { resolveDerivedMetrics: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it("fails closed when a computed metric carries no numeric value", async () => {
    const response = liveDerivedMetricsRpcResult();
    if (response.envelope.ok) {
      response.envelope.data.metrics = [
        { ...COMPUTED_METRIC, value: undefined } as unknown as (typeof COMPUTED_METRIC),
      ];
    }
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      {
        AIPHABEE_API: { resolveDerivedMetrics: vi.fn().mockResolvedValue(response) },
      } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(502);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("INTERNAL_ERROR");
  });

  it("passes through a well-formed DATA_QUALITY_HOLD error envelope from the private RPC (either Serving snapshot entirely unreleased)", async () => {
    const qualityHold = {
      envelope: {
        asOf: "2026-07-15T00:00:00.000Z",
        error: { code: "DATA_QUALITY_HOLD" as const, message: "no released quote_snapshot snapshot is available" },
        ok: false as const,
        request_id: "request_test",
      },
      status: 409,
    };
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      {
        AIPHABEE_API: { resolveDerivedMetrics: vi.fn().mockResolvedValue(qualityHold) },
      } as unknown as AuthenticatedDerivedMetricsBindings,
      request(),
      { instrumentId: "hkex_security_00700" },
      sessionReader({ user: { id: USER_ID } }),
    );

    expect(result.status).toBe(409);
    expect(result.envelope.ok).toBe(false);
    if (!result.envelope.ok) expect(result.envelope.error.code).toBe("DATA_QUALITY_HOLD");
  });
});

function liveDerivedMetricsRpcResult(overrides: Record<string, unknown> = {}) {
  const dataVersion =
    "financial_facts:netquity-financial-facts-test.v1|quote_snapshot:netquity-quote-snapshot-test.v1";
  const methodologyVersion = "2026-07-16.stock-workbench-derived-metrics-live.v1";
  const provenance = [
    {
      data_version: "netquity-financial-facts-test.v1",
      methodology_version: "2026-07-15.netquity-financial-facts-live.v1",
      source: "netquity-finreport-nb",
      source_record_id: "netquity:finreport.nb:00700",
    },
    {
      data_version: "netquity-quote-snapshot-test.v1",
      methodology_version: "2026-07-15.netquity-quote-snapshot-live.v1",
      source: "netquity-unadjprice2-daily",
      source_record_id: "netquity:unadjprice2.daily:00700",
    },
  ];
  const usage = { cached: false, credits: 1, rows: 8 };
  return {
    envelope: createSuccessEnvelope({
      data_version: dataVersion,
      definitions: DEFINITIONS,
      financial_facts_as_of: "2026-07-14T00:00:00.000Z",
      financial_period_end: "2025-12-31",
      live_data_access: true as const,
      methodology_version: methodologyVersion,
      metrics: [COMPUTED_METRIC, BLOCKED_METRIC],
      provenance,
      quote_as_of: "2026-07-15T00:00:00.000Z",
      status: "partial" as const,
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
  return vi.fn().mockResolvedValue(value) as unknown as DerivedMetricsSessionReader;
}
