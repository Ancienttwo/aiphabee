import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, Icon, MascotState } from "../../ds";
import { EvidenceCard } from "../../components/evidence";
import {
  AnnouncementsPanel,
  CorporateActionsPanel,
  DerivedPanel,
  FinancialsPanel,
  PricePanel,
  ProfilePanel,
  QuotePanel,
} from "../../components/workbench/panels";
import { Disclaimer } from "../../components/Disclaimer";
import { getStockSnapshot, presentError } from "../../lib/api";
import { MASCOT_BP, SHELL } from "../../lib/ui";

export const Route = createFileRoute("/stock/$instrumentId")({
  component: StockWorkbench,
});

const TABS = [
  { key: "profile", label: "档案", statusKey: "security_profile" },
  { key: "quote", label: "行情", statusKey: "quote_snapshot" },
  { key: "financials", label: "财务", statusKey: "financial_facts" },
  { key: "price", label: "价格", statusKey: "price_history" },
  { key: "derived", label: "指标", statusKey: "derived_metrics" },
  { key: "announcements", label: "公告", statusKey: "announcement_search" },
  { key: "actions", label: "公司行动", statusKey: "corporate_actions" },
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
          const profile = snap.security_profile.profile;
          const ready = Object.values(snap.data_quality.section_statuses).filter(
            (s) => s === "found",
          ).length;
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile ? profile.company.name.zhHant || profile.company.name.en : instrumentId}
                </h1>
                {profile ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-lg)", color: "var(--text-muted)" }}>
                    {profile.symbol}
                  </span>
                ) : null}
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
                  const found = snap.data_quality.section_statuses[t.statusKey] === "found";
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
              {tab === "quote" ? <QuotePanel section={snap.quote_snapshot} /> : null}
              {tab === "financials" ? <FinancialsPanel section={snap.financial_facts} /> : null}
              {tab === "price" ? <PricePanel section={snap.price_history} /> : null}
              {tab === "derived" ? <DerivedPanel section={snap.derived_metrics} /> : null}
              {tab === "announcements" ? <AnnouncementsPanel section={snap.announcement_search} /> : null}
              {tab === "actions" ? <CorporateActionsPanel section={snap.corporate_actions} /> : null}

              {/* Aggregate snapshot evidence */}
              <div style={{ marginTop: 20 }}>
                <EvidenceCard
                  asOf={env.as_of}
                  dataVersion={env.data_version}
                  methodologyVersion={env.methodology_version}
                  provenance={env.provenance}
                  usage={env.usage}
                  label="查看本次快照的聚合证据来源"
                />
              </div>

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
