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
  DEMAND_SIGNAL_CFG,
  SENTIMENT_TONE,
  STAGE_BY,
} from "../../data/ipos.fixtures";
import {
  IPO_DEMAND_MESSAGE,
  IPO_LISTING_TYPE_MESSAGE,
  IPO_SECTOR_MESSAGE,
  IPO_SENTIMENT_MESSAGE,
  IPO_STAGE_MESSAGE,
  useIpoLocale,
  type IpoMessageKey,
} from "../../components/ipo/i18n";
import { getIpoSnapshotMock } from "../../lib/api/ipo-mock";
import {
  useEntitlement,
  type EntitlementPlan,
} from "../../lib/context/EntitlementContext";
import { fmtNum } from "../../lib/num";
import { MASCOT_BP, SHELL } from "../../lib/ui";
import type { BadgeTone } from "../../ds";
import type { ResolvedIpoRecord } from "../../lib/api/ipo-types";

export const Route = createFileRoute("/ipos/$ipoId")({
  component: IpoDetail,
});

/** The 8 research-workbench tabs (ported from `detail.jsx` `DETAIL_TABS`). */
const DETAIL_TABS = [
  ["overview", "detailTabOverview"],
  ["timetable", "detailTabTimetable"],
  ["offering", "detailTabOffering"],
  ["pool", "detailTabPool"],
  ["allotment", "detailTabAllotment"],
  ["cornerstone", "detailTabCornerstone"],
  ["corporate", "detailTabCorporate"],
  ["lockup", "detailTabLockup"],
] as const satisfies readonly (readonly [string, IpoMessageKey])[];

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
  const { t } = useIpoLocale();
  const order: EntitlementPlan[] = ["free", "premium", "enterprise"];
  const next = order[(order.indexOf(plan) + 1) % order.length];
  const active = plan !== "free";
  const label = plan === "enterprise" ? "Enterprise" : plan === "premium" ? "Premium" : "Free";
  return (
    <button
      type="button"
      onClick={() => setPlan(next)}
      title={t("planToggleTitle")}
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
      <Icon name={active ? "unlock" : "lock"} size={13} /> {label} {t("plan")}
    </button>
  );
}

/** Persistent top bar: identity, status, evidence, plan toggle + 6 KPIs. */
function TopBar({ ipo }: { ipo: ResolvedIpoRecord }) {
  const { t: translate } = useIpoLocale();
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
              {translate(IPO_STAGE_MESSAGE[ipo.stage])}
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
            <span>{translate(IPO_SECTOR_MESSAGE[ipo.sector])}</span>
            <span>·</span>
            <Badge tone="navy" variant="outline" size="sm">
              {translate(IPO_LISTING_TYPE_MESSAGE[ipo.listingType])}
            </Badge>
            <Badge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>
              {translate(IPO_SENTIMENT_MESSAGE[ipo.sentiment])}
            </Badge>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <EvidenceChip ev={ipo.evidence} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <PlanToggle />
            <Button size="sm" variant="ai" icon={<Icon name="sparkles" size={15} />}>
              {translate("askBee")}
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
          label={translate("metricOffer")}
          value={offerText(t, translate("pending"))}
          sub={t.finalPrice ? translate("finalPrice") : t.priceLow ? translate("priceRange") : ""}
        />
        <TopKpi
          label={translate("metricEntryFee")}
          value={t.entryFee ? `HK$${fmtNum(t.entryFee, 0)}` : "—"}
          sub={`${translate("perLot")} ${fmtNum(t.lotSize, 0)} ${translate("sharesUnit")}`}
        />
        <TopKpi label={translate("offerPeriod")} value={ipo.subPeriod.start} sub={`${translate("to")} ${ipo.subPeriod.end}`} />
        <TopKpi label={translate("listingDate")} value={ipo.listingDate.replace(", 2026", "")} />
        <TopKpi
          label={translate(isAllot ? "metricOneLot" : "publicSubscription")}
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
              ? `${translate("metricClawback")} ${live.clawbackApplied ?? "—"}`
              : live.subPublic != null
                ? translate("live")
                : ""
          }
        />
        <TopKpi label={translate("metricScore")} value={`${ipo.score}`} tone="var(--accent-strong)" sub={`${translate("metricConfidence")} ${ipo.confidence}%`} />
      </div>
    </div>
  );
}

/** Overview right rail: AI signal → risk summary → sponsors → evidence. */
function RightRail({ ipo }: { ipo: ResolvedIpoRecord }) {
  const { t } = useIpoLocale();
  const signal = DEMAND_SIGNAL_CFG[ipo.demandSignal];
  const pose =
    ipo.demandSignal === "weak" ? "risk" : ipo.demandSignal === "strong" ? "success" : "insight";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, position: "sticky", top: 24 }}>
      <BeeNote
        basePath={MASCOT_BP}
        pose={pose}
        tone="honey"
        title={t("researchSignal")}
        action={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Badge tone={signal.tone} variant="solid" size="sm">
              {t(IPO_DEMAND_MESSAGE[ipo.demandSignal])}
            </Badge>
            <Badge tone="navy" variant="outline" size="sm">
              {t("metricConfidence")} {ipo.confidence}%
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
          <strong style={{ color: "var(--text-body)" }}>{t("researchSignalDisclaimerTitle")}</strong>{" "}
          {t("researchSignalDisclaimerBody")} {" "}
          <Provenance source="research" methodology={ipo.evidence.methodology} />
        </div>
      </div>
      <Disclaimer />

      <Panel icon="shield-alert" title={t("riskSummary")} accent="var(--red-500)">
        {ipo.riskSummary.map((r, i) => (
          <RiskRow key={i} r={r} />
        ))}
      </Panel>

      <Panel icon="users" title={t("parties")}>
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

      <Panel icon="database" title={t("evidenceTitle")}>
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
function OverviewTab({ ipo }: { ipo: ResolvedIpoRecord }) {
  const { t } = useIpoLocale();
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
        <Panel icon="building-2" title={t("businessOverview")} right={<Provenance source="vendor" />}>
          <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.75, color: "var(--text-body)" }}>
            {p.overview}
          </p>
        </Panel>
        <div className="ab-grid-2" style={{ gap: 22 }}>
          <Panel icon="trophy" title={t("competitiveAdvantages")} accent="var(--green-600)">
            <BulletList items={p.advantages} icon="check-circle-2" color="var(--green-600)" />
          </Panel>
          <Panel icon="alert-triangle" title={t("riskFactors")} accent="var(--orange-500)">
            <BulletList items={p.risks} icon="alert-triangle" color="var(--orange-500)" />
          </Panel>
        </div>
        <Panel icon="pie-chart" title={t("useOfProceeds")} right={<Provenance source="vendor" />}>
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
function TabBody({ tab, ipo }: { tab: TabKey; ipo: ResolvedIpoRecord }) {
  const { t } = useIpoLocale();
  const isAllot = ipo.stage === "allotted";
  switch (tab) {
    case "overview":
      return <OverviewTab ipo={ipo} />;
    case "timetable":
      return (
        <Panel icon="route" title={t("timetable")} right={<Provenance source="vendor" />}>
          <Timeline events={ipo.timetable} />
        </Panel>
      );
    case "offering":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Panel icon="file-text" title={t("offerTerms")} right={<Provenance source="vendor" />}>
            <TermsGrid ipo={ipo} />
          </Panel>
          <Panel icon="list-ordered" title={t("applicationTiers")}>
            <AppTiers ipo={ipo} />
          </Panel>
        </div>
      );
    case "pool":
      return (
        <Panel icon="layers" title={t("poolAndClawback")} right={<Provenance source="vendor" />}>
          <PoolClawback ipo={ipo} />
        </Panel>
      );
    case "allotment":
      return (
        <Panel
          icon="check-check"
          title={t("allotmentResult")}
          right={
            isAllot ? (
              <Badge tone="bullish" size="sm">
                {t("published")}
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                {t("pendingPublication")}
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
          title={t("cornerstoneInvestors")}
          right={
            ipo.cornerstones && ipo.cornerstones.length ? (
              <Badge tone="neutral" size="sm">
                {t("sensitiveAmountProtected")}
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
          <Panel icon="building" title={t("companyInfo")}>
            <CompanyTable ipo={ipo} />
          </Panel>
          <Panel icon="users" title={t("parties")}>
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
        <Panel icon="lock" title={t("lockupPeriod")} right={<Provenance source="vendor" />}>
          <Lockup ipo={ipo} />
        </Panel>
      );
    default:
      return null;
  }
}

function BackButton({ onClick }: { onClick: () => void }): ReactNode {
  const { t } = useIpoLocale();
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
      <Icon name="arrow-left" size={16} /> {t("backPipeline")}
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
  const { locale, t } = useIpoLocale();
  const { ipoId } = Route.useParams();
  const [tab, setTab] = useState<TabKey>("overview");
  const env = getIpoSnapshotMock(ipoId, locale);

  if (!env.ok) {
    return (
      <main style={{ ...SHELL, padding: "48px var(--content-gutter) 96px" }}>
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
            title={t("ipoNotFoundTitle")}
            description={`${t("ipoNotFoundDescriptionBefore")} “${ipoId}” ${t("ipoNotFoundDescriptionAfter")}`}
          >
            <Button variant="outline" onClick={() => navigate({ to: "/ipos" })}>
              {t("backPipeline")}
            </Button>
          </MascotState>
        </div>
      </main>
    );
  }

  const ipo = env.data;

  return (
    <main style={{ ...SHELL, padding: "20px var(--content-gutter) 80px" }}>
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
        {DETAIL_TABS.map(([k, labelKey]) => (
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
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <TabBody tab={tab} ipo={ipo} />
    </main>
  );
}
