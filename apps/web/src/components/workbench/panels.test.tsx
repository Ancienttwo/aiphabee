import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfilePanel } from "./panels";
import type {
  SecurityProfileSection,
} from "../../lib/api";

// FinancialsPanel, QuotePanel, CorporateActionsPanel, SdiDisclosurePanel and
// DirectorsPanel are intentionally not covered here: they each do their own
// live useQuery against an entitlement-gated RPC (resolveFinancialFacts /
// resolveQuoteSnapshot / resolveCorporateActions / resolveSdiDisclosure /
// resolveDirectorate respectively -- CompanyHeader decoupling pattern,
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
// which also has no direct render test.
// AnnouncementsPanel remains synthetic (unchanged, still prop-driven).

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
