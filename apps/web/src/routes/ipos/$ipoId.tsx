import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Badge, BeeNote, Button, Icon, MascotState, RatingStars } from "../../ds";
import { Disclaimer } from "../../components/Disclaimer";
import {
  EvidenceChip,
  Mono,
  Provenance,
} from "../../components/ipo";
import {
  AppTiers,
  Allotment,
  Cornerstones,
  CompanyTable,
  Lockup,
  Panel,
  PoolClawback,
  Proceeds,
  RiskRow,
  TermsGrid,
  Timeline,
  TopKpi,
  demandTone,
  offerText,
} from "../../components/ipo/panels";
import {
  LISTING_TYPE,
  DEMAND_SIGNAL_CFG,
  SECTOR_LABEL,
  SENTIMENT_LABEL,
  SENTIMENT_TONE,
  STAGE_BY,
} from "../../data/ipos.fixtures";
import { getIpoSnapshotMock } from "../../lib/api/ipo-mock";
import {
  useEntitlement,
  type EntitlementPlan,
} from "../../lib/context/EntitlementContext";
import { fmtNum } from "../../lib/num";
import { MASCOT_BP, SHELL } from "../../lib/ui";
import type { BadgeTone } from "../../ds";
import type { IpoRecord } from "../../lib/api/ipo-types";

export const Route = createFileRoute("/ipos/$ipoId")({
  component: IpoDetail,
});

/** The 8 research-workbench tabs (ported from `detail.jsx` `DETAIL_TABS`). */
const DETAIL_TABS = [
  ["overview", "概览", "Overview"],
  ["timetable", "时间表", "Timetable"],
  ["offering", "发售详情", "Offering"],
  ["pool", "认购与回拨", "Pool & Clawback"],
  ["allotment", "配售结果", "Allotment"],
  ["cornerstone", "基石", "Cornerstone"],
  ["corporate", "公司资料", "Corporate"],
  ["lockup", "解禁", "Lock-up"],
] as const;

type TabKey = (typeof DETAIL_TABS)[number][0];

const ST_TONE: Record<string, BadgeTone> = {
  honey: "honey",
  bullish: "bullish",
  info: "info",
  bearish: "bearish",
  neutral: "neutral",
};

/** Plan toggle (free ⇄ premium ⇄ enterprise) — makes default-deny demonstrable. */
function PlanToggle() {
  const { plan, setPlan } = useEntitlement();
  const order: EntitlementPlan[] = ["free", "premium", "enterprise"];
  const next = order[(order.indexOf(plan) + 1) % order.length];
  const active = plan !== "free";
  const label = plan === "enterprise" ? "Enterprise" : plan === "premium" ? "Premium" : "Free";
  return (
    <button
      type="button"
      onClick={() => setPlan(next)}
      title="切换权限等级（演示字段默认拒绝）"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        padding: "5px 11px",
        borderRadius: "var(--radius-pill)",
        border: "1px solid " + (active ? "var(--violet-500)" : "var(--border-default)"),
        background: active ? "var(--violet-50)" : "var(--surface-card)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-xs)",
        fontWeight: 700,
        color: active ? "var(--violet-600)" : "var(--text-muted)",
      }}
    >
      <Icon name={active ? "unlock" : "lock"} size={13} /> {label} plan
    </button>
  );
}

/** Persistent top bar: identity, status, evidence, plan toggle + 6 KPIs. */
function TopBar({ ipo }: { ipo: IpoRecord }) {
  const st = STAGE_BY[ipo.stage];
  const t = ipo.terms;
  const live = ipo.live;
  const isAllot = ipo.stage === "allotted";
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-sm)",
        padding: "22px 24px",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-3xl)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              {ipo.name}
            </h1>
            <span style={{ fontSize: "var(--text-lg)", color: "var(--text-muted)" }}>{ipo.cn}</span>
            <Badge tone={ST_TONE[st.tone]} variant="solid" dot dotShape="hex">
              {st.label} {st.en}
            </Badge>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
              flexWrap: "wrap",
            }}
          >
            <Mono size="var(--text-sm)" color="var(--text-body)">
              {ipo.ticker}
            </Mono>
            <span>·</span>
            <span>{ipo.board}</span>
            <span>·</span>
            <span>{SECTOR_LABEL[ipo.sector]}</span>
            <span>·</span>
            <Badge tone="navy" variant="outline" size="sm">
              {LISTING_TYPE[ipo.listingType]}
            </Badge>
            <Badge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>
              {SENTIMENT_LABEL[ipo.sentiment]}
            </Badge>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <EvidenceChip ev={ipo.evidence} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <PlanToggle />
            <Button size="sm" variant="ai" icon={<Icon name="sparkles" size={15} />}>
              问问工蜂
            </Button>
          </div>
        </div>
      </div>
      <div
        className="ab-grid-6"
        style={{
          gap: 18,
          paddingTop: 18,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <TopKpi
          label="招股价 Offer"
          value={offerText(t)}
          sub={t.finalPrice ? "最终定价" : t.priceLow ? "区间" : ""}
        />
        <TopKpi
          label="入场费 Entry"
          value={t.entryFee ? `HK$${fmtNum(t.entryFee, 0)}` : "—"}
          sub={`每手 ${fmtNum(t.lotSize, 0)} 股`}
        />
        <TopKpi label="招股期 Period" value={ipo.subPeriod.start} sub={`至 ${ipo.subPeriod.end}`} />
        <TopKpi label="上市日 Listing" value={ipo.listingDate.replace(", 2026", "")} />
        <TopKpi
          label={isAllot ? "一手中签率" : "公开认购 Sub"}
          value={
            isAllot
              ? `${live.oneLotRate}%`
              : live.subPublic != null
                ? `${fmtNum(live.subPublic, Number.isInteger(live.subPublic) ? 0 : 1)}×`
                : "—"
          }
          tone={
            isAllot
              ? (live.oneLotRate ?? 0) >= 50
                ? "var(--green-600)"
                : "var(--accent-strong)"
              : demandTone(live.subPublic)
          }
          sub={
            isAllot
              ? `回拨 ${live.clawbackApplied ?? "—"}`
              : live.subPublic != null
                ? "实时 Live"
                : ""
          }
        />
        <TopKpi label="研究评分 Score" value={`${ipo.score}`} tone="var(--accent-strong)" sub={`置信度 ${ipo.confidence}%`} />
      </div>
    </div>
  );
}

/** Overview right rail: AI signal → risk summary → sponsors → evidence. */
function RightRail({ ipo }: { ipo: IpoRecord }) {
  const signal = DEMAND_SIGNAL_CFG[ipo.demandSignal];
  const pose =
    ipo.demandSignal === "weak" ? "risk" : ipo.demandSignal === "strong" ? "success" : "insight";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, position: "sticky", top: 24 }}>
      <BeeNote
        basePath={MASCOT_BP}
        pose={pose}
        tone="navy"
        title="AiphaBee 研究信号"
        action={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Badge tone={signal.tone} variant="solid" size="sm">
              {signal.label}
            </Badge>
            <Badge tone="navy" variant="outline" size="sm">
              置信度 {ipo.confidence}%
            </Badge>
          </div>
        }
      >
        {ipo.aiNote}
      </BeeNote>

      {/* Research signal: NOT investment advice (Gate-0). */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 9,
          padding: "11px 14px",
          background: "var(--surface-muted)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Icon name="shield" size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: "var(--text-2xs)", lineHeight: 1.55, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-body)" }}>研究信号 · 非投资建议</strong> 描述性信号由
          AiphaBee 模型基于已披露事实生成，不构成买卖或持有建议。{" "}
          <Provenance source="research" methodology={ipo.evidence.methodology} />
        </div>
      </div>
      <Disclaimer />

      <Panel icon="shield-alert" title="风险摘要" en="Risk" accent="var(--red-500)">
        {ipo.riskSummary.map((r, i) => (
          <RiskRow key={i} r={r} />
        ))}
      </Panel>

      <Panel icon="users" title="保荐人 / 主要参与方" en="Parties">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ipo.sponsors.map((s, i) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 0",
                borderTop: i ? "1px solid var(--surface-muted)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                  {s.name}
                </div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>{s.role}</div>
              </div>
              <RatingStars value={s.rating} size={14} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel icon="database" title="证据与数据版本" en="Evidence">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(
            [
              ["as_of", ipo.evidence.asOf],
              ["data_version", ipo.evidence.dataVersion],
              ["methodology", ipo.evidence.methodology],
              ["source", ipo.evidence.source],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                {k}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-body)",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {v}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 2 }}>
            <Provenance source="vendor" />
          </div>
        </div>
      </Panel>
    </div>
  );
}

/** Bullet list for overview advantages / risks. */
function BulletList({ items, icon, color }: { items: string[]; icon: "check-circle-2" | "alert-triangle"; color: string }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 11 }}>
      {items.map((r, i) => (
        <li
          key={i}
          style={{ display: "flex", gap: 9, fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--text-body)" }}
        >
          <Icon name={icon} size={15} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
          {r}
        </li>
      ))}
    </ul>
  );
}

/** Overview tab: left business/advantages/risks/proceeds + analysis right rail. */
function OverviewTab({ ipo }: { ipo: IpoRecord }) {
  const p = ipo.profile;
  return (
    <div
      className="ab-split"
      style={{
        gap: 22,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Panel icon="building-2" title="业务概览" en="Business" right={<Provenance source="vendor" />}>
          <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.75, color: "var(--text-body)" }}>
            {p.overview}
          </p>
        </Panel>
        <div className="ab-grid-2" style={{ gap: 22 }}>
          <Panel icon="trophy" title="竞争优势" en="Advantages" accent="var(--green-600)">
            <BulletList items={p.advantages} icon="check-circle-2" color="var(--green-600)" />
          </Panel>
          <Panel icon="alert-triangle" title="风险因素" en="Risks" accent="var(--orange-500)">
            <BulletList items={p.risks} icon="alert-triangle" color="var(--orange-500)" />
          </Panel>
        </div>
        <Panel icon="pie-chart" title="所得款项用途" en="Use of Proceeds" right={<Provenance source="vendor" />}>
          <div style={{ maxWidth: 560 }}>
            <Proceeds ipo={ipo} />
          </div>
        </Panel>
      </div>
      <RightRail ipo={ipo} />
    </div>
  );
}

/** Renders the active tab body. */
function TabBody({ tab, ipo }: { tab: TabKey; ipo: IpoRecord }) {
  const isAllot = ipo.stage === "allotted";
  switch (tab) {
    case "overview":
      return <OverviewTab ipo={ipo} />;
    case "timetable":
      return (
        <Panel icon="route" title="时间表" en="Timetable" right={<Provenance source="vendor" />}>
          <Timeline events={ipo.timetable} />
        </Panel>
      );
    case "offering":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Panel icon="file-text" title="发行条款" en="Offer Terms" right={<Provenance source="vendor" />}>
            <TermsGrid ipo={ipo} />
          </Panel>
          <Panel icon="list-ordered" title="申请档位" en="Application Tiers">
            <AppTiers ipo={ipo} />
          </Panel>
        </div>
      );
    case "pool":
      return (
        <Panel icon="layers" title="公开发售 Pool 与回拨" en="Pool & Clawback" right={<Provenance source="vendor" />}>
          <PoolClawback ipo={ipo} />
        </Panel>
      );
    case "allotment":
      return (
        <Panel
          icon="check-check"
          title="配售结果"
          en="Allotment Result"
          right={
            isAllot ? (
              <Badge tone="bullish" size="sm">
                已公布
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                待公布
              </Badge>
            )
          }
        >
          <Allotment ipo={ipo} />
        </Panel>
      );
    case "cornerstone":
      return (
        <Panel
          icon="gem"
          title="基石投资者"
          en="Cornerstone"
          right={
            ipo.cornerstones && ipo.cornerstones.length ? (
              <Badge tone="neutral" size="sm">
                敏感字段 · 金额受权限保护
              </Badge>
            ) : undefined
          }
        >
          <Cornerstones ipo={ipo} />
        </Panel>
      );
    case "corporate":
      return (
        <div className="ab-grid-2" style={{ gap: 22, alignItems: "start" }}>
          <Panel icon="building" title="公司资料" en="Company Info">
            <CompanyTable ipo={ipo} />
          </Panel>
          <Panel icon="users" title="保荐人 / 主要参与方" en="Parties">
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ipo.sponsors.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderTop: i ? "1px solid var(--surface-muted)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>{s.role}</div>
                  </div>
                  <RatingStars value={s.rating} size={14} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      );
    case "lockup":
      return (
        <Panel icon="lock" title="禁售期" en="Lock-up" right={<Provenance source="vendor" />}>
          <Lockup ipo={ipo} />
        </Panel>
      );
    default:
      return null;
  }
}

function BackButton({ onClick }: { onClick: () => void }): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
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
        marginBottom: 16,
      }}
    >
      <Icon name="arrow-left" size={16} /> 返回 Pipeline
    </button>
  );
}

/**
 * IPO research workbench — the 8-tab detail view, ported from the design
 * prototype's `DetailView`. Backed by the `getIpoSnapshotMock` envelope (swaps
 * to Codex's `/workbench/ipo/snapshot` later). Fact layer (vendor, provenance ·
 * netquity_hk_ipo) and analysis layer (aiphabee_research, descriptive non-advice)
 * stay visibly separate; sensitive fields are default-deny via `LockedValue`.
 */
function IpoDetail() {
  const navigate = useNavigate();
  const { ipoId } = Route.useParams();
  const [tab, setTab] = useState<TabKey>("overview");
  const env = getIpoSnapshotMock(ipoId);

  if (!env.ok) {
    return (
      <main style={{ ...SHELL, padding: "48px 24px 96px" }}>
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <MascotState
            basePath={MASCOT_BP}
            pose="empty"
            title="未找到该标的 · IPO not found"
            description={`没有 id 为 “${ipoId}” 的 IPO。返回 Pipeline 继续探索其他标的。`}
          >
            <Button variant="outline" onClick={() => navigate({ to: "/ipos" })}>
              返回 Pipeline
            </Button>
          </MascotState>
        </div>
      </main>
    );
  }

  const ipo = env.data;

  return (
    <main style={{ ...SHELL, padding: "20px 24px 80px" }}>
      <BackButton onClick={() => navigate({ to: "/ipos" })} />

      <TopBar ipo={ipo} />

      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 22,
          overflowX: "auto",
        }}
      >
        {DETAIL_TABS.map(([k, cn, en]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              cursor: "pointer",
              border: "none",
              background: "none",
              padding: "12px 16px",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: tab === k ? "var(--text-primary)" : "var(--text-muted)",
              borderBottom: "2px solid " + (tab === k ? "var(--honey-500)" : "transparent"),
              marginBottom: -1,
            }}
          >
            {cn}{" "}
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", fontWeight: 500 }}>
              {en}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <TabBody tab={tab} ipo={ipo} />
    </main>
  );
}
