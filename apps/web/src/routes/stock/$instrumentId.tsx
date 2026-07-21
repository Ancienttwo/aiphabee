import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone, Icon } from "../../ds";
import {
  CorporateActionsPanel,
  DerivedPanel,
  DirectorsPanel,
  FinancialsPanel,
  OwnershipPanel,
  QuotePanel,
  RelatedWarrantsPanel,
  SdiDisclosurePanel,
} from "../../components/workbench/panels";
import { Disclaimer } from "../../components/Disclaimer";
import { presentError, resolveSecurityProfile } from "../../lib/api";
import type { AiphaBeeErrorCode } from "../../lib/api";
import { SHELL } from "../../lib/ui";
import { formatHkSymbol } from "../../lib/format";
import { useLocale, type MessageKey } from "../../i18n/locale";

export const Route = createFileRoute("/stock/$instrumentId")({
  component: StockWorkbench,
});

// Every tab below runs its own independent, entitlement-gated live RPC
// query keyed by instrumentId (see QuotePanel/FinancialsPanel/DerivedPanel/
// CorporateActionsPanel/SdiDisclosurePanel/DirectorsPanel/OwnershipPanel/
// RelatedWarrantsPanel in ../../components/workbench/panels.tsx). There is
// no page-level synthetic snapshot anymore, so the tab bar carries no
// found/not-found status dot -- each panel renders its own loading/denied/
// empty state once mounted.
//
// `profile` (security_profile), `announcements` (announcement_search), and
// `price` (price_history) are deliberately absent from this list:
// CompanyHeader below already renders the live profile identity (name/
// symbol/exchange/market/currency/listing status) unconditionally, and
// neither announcements nor price-history has a live-wired panel to swap in
// for the removed synthetic snapshot (no resolveAnnouncements /
// resolvePriceHistory RPC exists yet). Rather than render synthetic data or
// promise an undated roadmap item via a placeholder tab, the tabs are
// dropped; re-add them the same way the eight tabs below were each added,
// commit by commit, once a live panel exists for that domain.
const TABS = [
  { key: "quote", label: "tabQuote" },
  { key: "financials", label: "tabFinancials" },
  { key: "derived", label: "tabDerived" },
  { key: "actions", label: "tabActions" },
  { key: "sdi", label: "tabSdi" },
  { key: "directorate", label: "tabDirectorate" },
  { key: "ownership", label: "tabOwnership" },
  { key: "warrants", label: "tabWarrants" },
] as const satisfies ReadonlyArray<{ key: string; label: MessageKey }>;

type TabKey = (typeof TABS)[number]["key"];

function StockWorkbench() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { instrumentId } = Route.useParams();
  const [tab, setTab] = useState<TabKey>("quote");

  return (
    <main style={{ ...SHELL, paddingTop: 24, paddingBottom: 72 }}>
      <button
        type="button"
        onClick={() => navigate({ to: "/stock" })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-sans)",
          marginBottom: 14,
        }}
      >
        <Icon name="arrow-left" size={16} /> {t("backToSearch")}
      </button>

      <CompanyHeader instrumentId={instrumentId} />

      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginBottom: 18 }}>
        {instrumentId}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18, overflowX: "auto" }}>
        {TABS.map((tabItem) => {
          const active = tab === tabItem.key;
          return (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: "1px solid " + (active ? "var(--honey-500)" : "var(--border-subtle)"),
                background: active ? "var(--honey-500)" : "var(--surface-card)",
                color: active ? "var(--text-on-honey)" : "var(--text-body)",
              }}
            >
              {t(tabItem.label)}
            </button>
          );
        })}
      </div>

      {/* Active panel -- each mounts unconditionally and owns its own live
          query plus loading/denied/empty state; there is no page-level gate. */}
      {tab === "quote" ? <QuotePanel instrumentId={instrumentId} /> : null}
      {tab === "financials" ? <FinancialsPanel instrumentId={instrumentId} /> : null}
      {tab === "derived" ? <DerivedPanel instrumentId={instrumentId} /> : null}
      {tab === "actions" ? <CorporateActionsPanel instrumentId={instrumentId} /> : null}
      {tab === "sdi" ? <SdiDisclosurePanel instrumentId={instrumentId} /> : null}
      {tab === "directorate" ? <DirectorsPanel instrumentId={instrumentId} /> : null}
      {tab === "ownership" ? <OwnershipPanel instrumentId={instrumentId} /> : null}
      {tab === "warrants" ? <RelatedWarrantsPanel instrumentId={instrumentId} /> : null}

      <Disclaimer style={{ marginTop: 24 }} />
    </main>
  );
}

const HEADER_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const HEADER_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, MessageKey>> = {
  AUTH_REQUIRED: "authRequired",
  DATA_NOT_LICENSED: "dataNotLicensed",
  DATA_QUALITY_HOLD: "dataQualityHold",
  NOT_FOUND: "notFound",
};

/**
 * Company-header identity block: name, symbol, listing status. Sourced from
 * the live, entitlement-gated resolveProfile RPC — independent of every tab
 * panel below it (each one runs its own gated live RPC query keyed by
 * instrumentId), so a denied/held/absent live profile never falls back to
 * synthesized identity data. There is no longer a page-level synthetic
 * workbench snapshot gating this route at all: CompanyHeader and every
 * mounted tab panel are each independently live-backed and render
 * unconditionally.
 */
function CompanyHeader({ instrumentId }: { instrumentId: string }) {
  const { locale, t } = useLocale();
  const { data: profileEnv, isLoading } = useQuery({
    queryKey: ["security-profile-live", instrumentId],
    queryFn: () => resolveSecurityProfile(instrumentId),
  });

  const headerRowStyle = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const, marginBottom: 4 };
  const titleStyle = {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-3xl)",
    fontWeight: 700,
    color: "var(--text-primary)",
  };

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: 4 }}>
        {t("loadingProfile")}
      </p>
    );
  }

  if (!profileEnv || !profileEnv.ok) {
    const code = profileEnv?.error.code;
    const tone: BadgeTone = (code && HEADER_STATE_TONE[code]) ?? "bearish";
    const label = code && HEADER_STATE_LABEL[code] ? t(HEADER_STATE_LABEL[code]) : t("temporarilyUnavailable");
    const detail = profileEnv ? presentError(profileEnv).detail : t("profileUnavailable");
    return (
      <div style={headerRowStyle}>
        <h1 style={titleStyle}>{instrumentId}</h1>
        <Badge tone={tone} variant="soft" size="sm" dot>
          {label}
        </Badge>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>{detail}</span>
      </div>
    );
  }

  const { profile } = profileEnv.data;
  if (!profile) {
    return (
      <div style={headerRowStyle}>
        <h1 style={titleStyle}>{instrumentId}</h1>
        <Badge tone="neutral" variant="soft" size="sm" dot>
          {t("notFound")}
        </Badge>
      </div>
    );
  }

  return (
    <div style={headerRowStyle}>
      <h1 style={titleStyle}>{locale === "en" ? profile.name.en || profile.name.zhHant : locale === "zh-Hans" ? profile.name.zhHans || profile.name.zhHant : profile.name.zhHant || profile.name.en}</h1>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-lg)", color: "var(--text-muted)" }}>
        {formatHkSymbol(profile.symbol)}
      </span>
      <Badge
        tone={profile.listingStatus === "listed" ? "bullish" : profile.listingStatus === "suspended" ? "warning" : "bearish"}
        variant="soft"
        size="sm"
      >
        {profile.listingStatus === "listed" ? t("listed") : profile.listingStatus === "suspended" ? t("suspended") : t("delisted")}
      </Badge>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>
        {profile.exchange} · {profile.market} · {profile.currency}
      </span>
    </div>
  );
}
