import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createErrorEnvelope, createSuccessEnvelope } from "@aiphabee/data-contracts";
import { DerivedPanel, ProfilePanel } from "./panels";
import type {
  DerivedMetricDefinition,
  DerivedMetricValue,
  GetLiveDerivedMetricsData,
  ResponseEnvelope,
  SecurityProfileSection,
} from "../../lib/api";

// FinancialsPanel, QuotePanel, CorporateActionsPanel, SdiDisclosurePanel,
// DirectorsPanel, OwnershipPanel, and RelatedWarrantsPanel are intentionally
// not covered here: they each do their own live useQuery against an
// entitlement-gated RPC (resolveFinancialFacts / resolveQuoteSnapshot /
// resolveCorporateActions / resolveSdiDisclosure / resolveDirectorate /
// resolveOwnership / resolveRelatedWarrants respectively -- CompanyHeader
// decoupling pattern,
// apps/web/src/routes/stock/$instrumentId.tsx), so none of them can be
// exercised by prop-driven renderToStaticMarkup like the other
// synthetic-snapshot panels below. FinancialsPanel's behavior is covered by
// packages/financial-facts (mapping/validation),
// apps/worker/src/authenticated-netquity-web-resolver.test.ts (RPC
// authorization chain), and apps/web/src/lib/api/financial-facts.server.test.ts
// (server-fn boundary). QuotePanel's behavior is covered the same way by
// packages/market-data, the same worker resolver test file, and
// apps/web/src/lib/api/quote-snapshot.server.test.ts. CorporateActionsPanel's
// behavior is covered the same way by packages/corporate-actions, the same
// worker resolver test file, and
// apps/web/src/lib/api/corporate-actions.server.test.ts. SdiDisclosurePanel's
// behavior is covered the same way by packages/sdi-disclosure, the same
// worker resolver test file, and apps/web/src/lib/api/sdi-disclosure.server.test.ts.
// DirectorsPanel's behavior is covered the same way by packages/directorate,
// the same worker resolver test file, and
// apps/web/src/lib/api/directorate.server.test.ts -- matching CompanyHeader,
// which also has no direct render test. OwnershipPanel's behavior is covered
// the same way by packages/ownership, the same worker resolver test file,
// and apps/web/src/lib/api/ownership.server.test.ts. RelatedWarrantsPanel's
// behavior is covered the same way by packages/related-warrants, the same
// worker resolver test file, and
// apps/web/src/lib/api/related-warrants.server.test.ts.
// AnnouncementsPanel remains synthetic (unchanged, still prop-driven).
//
// DerivedPanel runs the same kind of live useQuery against an
// entitlement-gated RPC (resolveDerivedMetrics) as the panels above, but is
// covered directly below instead of being added to that list: its two-tier
// status handling carries a data-safety invariant -- an envelope-level
// DATA_NOT_LICENSED must render "未获授权" while a per-metric blocked_reason
// (e.g. shares_outstanding_unavailable) must render its own honest copy and
// never "未获授权" -- that neither
// apps/web/src/lib/api/derived-metrics.server.test.ts nor
// apps/worker/src/authenticated-netquity-web-resolver.test.ts exercises,
// since neither boundary renders DERIVED_METRIC_BLOCKED_REASON_LABEL. The
// tests below seed a QueryClient's cache directly via
// queryClient.setQueryData under the same ["derived-metrics-live",
// instrumentId] key DerivedPanel's useQuery reads, so renderToStaticMarkup
// can assert the resolved markup synchronously -- no network boundary, no
// waiting on effects (react-dom/server never runs them).

const USAGE = { cached: false, credits: 0, rows: 1 };

const PROFILE: SecurityProfileSection = {
  status: "found",
  usage: USAGE,
  provenance: [],
  asOf: "2026-01-07T16:15:00+08:00",
  dataVersion: "security-profile-synthetic-v0",
  methodologyVersion: "m-v0",
  profile: {
    company: { companyId: "co_tencent", country: "CN", name: { en: "Tencent Holdings Ltd.", zhHans: "腾讯控股有限公司", zhHant: "騰訊控股有限公司" } },
    currency: "HKD",
    exchange: "HKEX",
    industry: { classificationSystem: "synthetic", industry: "Interactive Media & Services", sector: "Communication Services" },
    instrumentId: "eq_hk_00700",
    lifecycle: { listedAt: "2004-06-16" },
    listingId: "listing_hk_00700",
    listingStatus: "listed",
    market: "HK",
    symbol: "00700.HK",
  },
};

describe("workbench panels render (SSR)", () => {
  it("ProfilePanel renders company name and symbol", () => {
    const html = renderToStaticMarkup(<ProfilePanel section={PROFILE} />);
    expect(html).toContain("騰訊控股有限公司");
    expect(html).toContain("00700.HK");
    expect(html).toContain("Communication Services");
  });

  it("ProfilePanel degrades gracefully when the profile is absent", () => {
    const html = renderToStaticMarkup(
      <ProfilePanel section={{ status: "not_found", usage: USAGE, provenance: [] }} />,
    );
    expect(html).toContain("暂无公司档案");
  });
});

// --- DerivedPanel: cache-seeded live-query rendering ----------------------

const DERIVED_INSTRUMENT_ID = "hkex_security_00700";
const DERIVED_META = { asOf: "2026-01-07T16:15:00+08:00", requestId: "req-derived-test" };

const NET_MARGIN_DEFINITION: DerivedMetricDefinition = {
  category: "profitability",
  formula: "net_income / revenue",
  label: "净利率",
  metric_id: "net_margin",
  unit: "ratio",
};
const PE_DEFINITION: DerivedMetricDefinition = {
  category: "valuation",
  formula: "market_cap / net_income",
  label: "市盈率",
  metric_id: "price_to_earnings",
  unit: "multiple",
};

function computedMetric(
  metricId: string,
  value: number,
  unit: DerivedMetricValue["unit"],
): DerivedMetricValue {
  return {
    anomaly_flags: [],
    category: "valuation",
    inputs: {},
    metric_id: metricId,
    source_record_ids: ["netquity:test:record"],
    status: "computed",
    unit,
    value,
  };
}

function blockedMetric(
  metricId: string,
  blockedReason: string,
  unit: DerivedMetricValue["unit"] = "multiple",
): DerivedMetricValue {
  return {
    anomaly_flags: [],
    blocked_reason: blockedReason,
    category: "valuation",
    inputs: {},
    metric_id: metricId,
    source_record_ids: [],
    status: "blocked",
    unit,
  };
}

function derivedSection(metrics: DerivedMetricValue[]): GetLiveDerivedMetricsData {
  return {
    data_version: "derived-metrics-test-v0",
    definitions: [NET_MARGIN_DEFINITION, PE_DEFINITION],
    live_data_access: true,
    methodology_version: "m-v0",
    metrics,
    provenance: [],
    status: "computed",
    usage: USAGE,
  };
}

/**
 * Seeds a fresh QueryClient's cache under the exact ["derived-metrics-live",
 * instrumentId] key DerivedPanel's own useQuery reads, then renders
 * synchronously. No queryFn ever runs: react-dom/server's static renderer
 * never executes effects, so the observer's mount-time (re)fetch -- which
 * TanStack Query wires through a useEffect subscription -- never fires, and
 * the cache-seeded envelope is exactly what reaches the markup.
 */
function renderDerivedPanel(envelope: ResponseEnvelope<GetLiveDerivedMetricsData>): string {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(["derived-metrics-live", DERIVED_INSTRUMENT_ID], envelope);
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <DerivedPanel instrumentId={DERIVED_INSTRUMENT_ID} />
    </QueryClientProvider>,
  );
}

describe("DerivedPanel two-tier rendering (SSR, cache-seeded)", () => {
  it("shows 未获授权 for an envelope-level DATA_NOT_LICENSED denial", () => {
    const envelope = createErrorEnvelope(
      "DATA_NOT_LICENSED",
      "financial_facts and quote_snapshot are not licensed",
      DERIVED_META,
    );
    const html = renderDerivedPanel(envelope);
    expect(html).toContain("未获授权");
  });

  it("shows the shares_outstanding_unavailable copy for a per-metric gap, and never 未获授权", () => {
    const envelope = createSuccessEnvelope(
      derivedSection([blockedMetric("price_to_earnings", "shares_outstanding_unavailable")]),
      DERIVED_META,
    );
    const html = renderDerivedPanel(envelope);
    expect(html).toContain("该证券暂未披露流通股本，无法计算市值型指标");
    expect(html).not.toContain("未获授权");
  });

  it("shows the zero/negative denominator copy for the corresponding blocked_reason", () => {
    const envelope = createSuccessEnvelope(
      derivedSection([
        blockedMetric("price_to_earnings", "zero_denominator"),
        blockedMetric("price_to_book", "negative_denominator"),
      ]),
      DERIVED_META,
    );
    const html = renderDerivedPanel(envelope);
    expect(html).toContain("分母为零，无法计算");
    expect(html).toContain("分母为负，结果不具参考意义");
  });

  it("renders the computed numeric value for a computed metric", () => {
    const envelope = createSuccessEnvelope(
      derivedSection([
        computedMetric("net_margin", 0.5, "ratio"),
        computedMetric("price_to_earnings", 8, "multiple"),
      ]),
      DERIVED_META,
    );
    const html = renderDerivedPanel(envelope);
    expect(html).toContain("50.0%");
    expect(html).toContain("8.00×");
  });
});
