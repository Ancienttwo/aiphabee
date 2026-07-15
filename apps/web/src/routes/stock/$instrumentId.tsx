import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone, Button, Card, Icon, MascotState } from "../../ds";
import {
  AnnouncementsPanel,
  CorporateActionsPanel,
  DerivedPanel,
  DirectorsPanel,
  FinancialsPanel,
  PricePanel,
  ProfilePanel,
  QuotePanel,
  SdiDisclosurePanel,
} from "../../components/workbench/panels";
import { Disclaimer } from "../../components/Disclaimer";
import { getStockSnapshot, presentError, resolveSecurityProfile } from "../../lib/api";
import type { AiphaBeeErrorCode } from "../../lib/api";
import { MASCOT_BP, SHELL } from "../../lib/ui";

export const Route = createFileRoute("/stock/$instrumentId")({
  component: StockWorkbench,
});

// `sdi`/`directorate`'s statusKey is deliberately undefined: unlike the
// other seven tabs (each backed by a packages/workbench synthetic section
// that predates its live cutover), SDI and directorate never had a
// synthetic scaffold anywhere, so there is no StockWorkbenchSection key for
// their dot to read. The dot stays neutral rather than fabricating a
// found/not-found state from a key that was never emitted.
const TABS = [
  { key: "profile", label: "档案", statusKey: "security_profile" },
  { key: "quote", label: "行情", statusKey: "quote_snapshot" },
  { key: "financials", label: "财务", statusKey: "financial_facts" },
  { key: "price", label: "价格", statusKey: "price_history" },
  { key: "derived", label: "指标", statusKey: "derived_metrics" },
  { key: "announcements", label: "公告", statusKey: "announcement_search" },
  { key: "actions", label: "公司行动", statusKey: "corporate_actions" },
  { key: "sdi", label: "权益披露", statusKey: undefined },
  { key: "directorate", label: "董事高管", statusKey: undefined },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function StockWorkbench() {
  const navigate = useNavigate();
  const { instrumentId } = Route.useParams();
  const [tab, setTab] = useState<TabKey>("profile");
  const { data: env, isLoading } = useQuery({
    queryKey: ["stock-snapshot", instrumentId],
    queryFn: () => getStockSnapshot({ instrumentId }),
  });

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
        <Icon name="arrow-left" size={16} /> 返回搜索
      </button>

      <CompanyHeader instrumentId={instrumentId} />

      {isLoading ? (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载工作台快照…</p>
      ) : null}

      {env && !env.ok ? (
        <Card padded>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>
            {presentError(env).detail}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            若后端未启动，请在仓库根运行 <code>npm run dev:worker</code>（端口 8787）。
          </p>
        </Card>
      ) : null}

      {env && env.ok ? (
        (() => {
          const snap = env.data;
          const ready = Object.values(snap.data_quality.section_statuses).filter(
            (s) => s === "found",
          ).length;
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                <Badge
                  tone={snap.status === "ready" ? "bullish" : snap.status === "partial" ? "warning" : "bearish"}
                  variant="soft"
                  size="sm"
                  dot
                >
                  {snap.status === "ready" ? "数据就绪" : snap.status === "partial" ? "部分就绪" : "未解析"}
                </Badge>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>{ready}/7 区块 · 证据 {snap.evidence.provenance_count}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginBottom: 18 }}>
                {instrumentId}
              </div>

              {/* Tab bar */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18, overflowX: "auto" }}>
                {TABS.map((t) => {
                  const active = tab === t.key;
                  const found = t.statusKey !== undefined && snap.data_quality.section_statuses[t.statusKey] === "found";
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
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
                      <span
                        aria-hidden="true"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: found ? "var(--green-500)" : "var(--neutral-300)",
                        }}
                      />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Active panel */}
              {tab === "profile" ? <ProfilePanel section={snap.security_profile} /> : null}
              {tab === "quote" ? <QuotePanel instrumentId={instrumentId} /> : null}
              {tab === "financials" ? <FinancialsPanel instrumentId={instrumentId} /> : null}
              {tab === "price" ? <PricePanel section={snap.price_history} /> : null}
              {tab === "derived" ? <DerivedPanel section={snap.derived_metrics} /> : null}
              {tab === "announcements" ? <AnnouncementsPanel section={snap.announcement_search} /> : null}
              {tab === "actions" ? <CorporateActionsPanel instrumentId={instrumentId} /> : null}
              {tab === "sdi" ? <SdiDisclosurePanel instrumentId={instrumentId} /> : null}
              {tab === "directorate" ? <DirectorsPanel instrumentId={instrumentId} /> : null}

              <Disclaimer style={{ marginTop: 24 }} />
            </>
          );
        })()
      ) : null}

      {!isLoading && !env ? (
        <MascotState basePath={MASCOT_BP} pose="empty" title="暂无数据" description="未能加载该证券的工作台快照。" />
      ) : null}
    </main>
  );
}

const HEADER_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const HEADER_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
};

/**
 * Company-header identity block: name, symbol, listing status. Sourced from
 * the live, entitlement-gated resolveProfile RPC — independent of the
 * synthetic workbench snapshot below it, so a denied/held/absent live
 * profile never falls back to synthesized identity data. Only this block is
 * live-backed in this cut; the tab panels below remain synthetic.
 */
function CompanyHeader({ instrumentId }: { instrumentId: string }) {
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
        正在加载公司档案…
      </p>
    );
  }

  if (!profileEnv || !profileEnv.ok) {
    const code = profileEnv?.error.code;
    const tone: BadgeTone = (code && HEADER_STATE_TONE[code]) ?? "bearish";
    const label = (code && HEADER_STATE_LABEL[code]) ?? "暂不可用";
    const detail = profileEnv ? presentError(profileEnv).detail : "公司档案服务暂不可用。";
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
          未找到
        </Badge>
      </div>
    );
  }

  return (
    <div style={headerRowStyle}>
      <h1 style={titleStyle}>{profile.name.zhHant || profile.name.en}</h1>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-lg)", color: "var(--text-muted)" }}>
        {profile.symbol}
      </span>
      <Badge
        tone={profile.listingStatus === "listed" ? "bullish" : profile.listingStatus === "suspended" ? "warning" : "bearish"}
        variant="soft"
        size="sm"
      >
        {profile.listingStatus === "listed" ? "上市" : profile.listingStatus === "suspended" ? "停牌" : "退市"}
      </Badge>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>
        {profile.exchange} · {profile.market} · {profile.currency}
      </span>
    </div>
  );
}
