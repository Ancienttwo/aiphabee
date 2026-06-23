import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FinancialsPanel, ProfilePanel, QuotePanel } from "./panels";
import type {
  FinancialFactsSection,
  QuoteSection,
  SecurityProfileSection,
} from "../../lib/api";

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

const QUOTE: QuoteSection = {
  status: "found",
  usage: USAGE,
  provenance: [],
  quote: {
    asOf: "2026-01-07T16:15:00+08:00",
    currency: "HKD",
    delay: { minutes: 15, type: "delayed" },
    exchange: "HKEX",
    fields: { lastPrice: 448.2, previousClose: 445, change: 3.2, changePercent: 0.72, volume: 12000000, turnover: 5_400_000_000 },
    marketStatus: "closed",
    qualityState: "PASS",
    symbol: "00700.HK",
  },
};

const FINANCIALS: FinancialFactsSection = {
  status: "found",
  usage: USAGE,
  provenance: [],
  facts: {
    accountingStandard: "IFRS",
    currency: "HKD",
    unit: "thousand",
    rowCount: 1,
    totalRows: 1,
    facts: [
      {
        currency: "HKD",
        metricId: "revenue",
        periodEnd: "2024-12-31",
        periodType: "FY",
        qualityState: "PASS",
        scale: 1000,
        sourceRecordId: "src",
        statementType: "income_statement",
        unit: "thousand",
        value: 600000,
        versionStatus: "latest",
      },
    ],
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

  it("QuotePanel formats price fields and the delay badge", () => {
    const html = renderToStaticMarkup(<QuotePanel section={QUOTE} />);
    expect(html).toContain("448.20");
    expect(html).toContain("延迟 15 分钟");
  });

  it("FinancialsPanel maps metric ids to labels and groups thousands", () => {
    const html = renderToStaticMarkup(<FinancialsPanel section={FINANCIALS} />);
    expect(html).toContain("营业收入");
    expect(html).toContain("600,000");
  });
});
