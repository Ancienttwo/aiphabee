import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, BeeNote, Icon } from "../../ds";
import { Disclaimer } from "../../components/Disclaimer";
import { compareIposMock } from "../../lib/api/ipo-mock";
import { useIpoCompare, IPO_COMPARE_MAX } from "../../lib/context/IpoCompareContext";
import {
  DEMAND_SIGNAL_CFG,
  SENTIMENT_TONE,
  getIpos,
} from "../../data/ipos.fixtures";
import type { ResolvedIpoRecord } from "../../lib/api/ipo-types";
import { Eyebrow, Mono } from "../../components/ipo";
import { fmtNum } from "../../lib/num";
import { MASCOT_BP, SHELL } from "../../lib/ui";
import {
  IPO_DEMAND_MESSAGE,
  IPO_LISTING_TYPE_MESSAGE,
  IPO_SECTOR_MESSAGE,
  IPO_SENTIMENT_MESSAGE,
  useIpoLocale,
  type IpoMessageKey,
} from "../../components/ipo/i18n";

export const Route = createFileRoute("/ipos/compare")({
  component: CompareView,
});

const COMPARE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
];
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

function offerText(t: ResolvedIpoRecord["terms"], pending: string): string {
  if (t.finalPrice) return `HK$${t.finalPrice.toFixed(2)}`;
  if (t.priceLow && t.priceHigh) return `HK$${t.priceLow.toFixed(2)}–${t.priceHigh.toFixed(2)}`;
  return pending;
}

interface Metric {
  label: IpoMessageKey;
  get: (i: ResolvedIpoRecord) => number | string | null;
  fmt: (
    v: number | string | null,
    i: ResolvedIpoRecord,
    t: (key: IpoMessageKey) => string,
  ) => string;
  best: "max" | "min" | null;
  sentiment?: boolean;
  rec?: boolean;
}

/** Metric rows: value extractor + win direction. Signal stays a research signal (non-advice). */
const METRICS: Metric[] = [
  { label: "metricScore", get: (i) => i.score, fmt: (v) => String(v), best: "max" },
  { label: "metricConfidence", get: (i) => i.confidence, fmt: (v) => `${v}%`, best: "max" },
  { label: "metricSubscription", get: (i) => i.live.subPublic, fmt: (v) => (v == null ? "—" : `${v}×`), best: "max" },
  { label: "metricOffer", get: (i) => i.terms.finalPrice ?? i.terms.priceHigh, fmt: (_v, i, t) => offerText(i.terms, t("pending")), best: null },
  { label: "metricEntryFee", get: (i) => i.terms.entryFee, fmt: (v) => (v ? `HK$${fmtNum(v as number, 0)}` : "—"), best: "min" },
  { label: "metricRaise", get: (i) => parseFloat(i.terms.raiseHKD) || null, fmt: (_v, i) => i.terms.raiseHKD, best: "max" },
  { label: "metricMarketCap", get: (i) => parseFloat(i.terms.mcapHKD) || null, fmt: (_v, i) => i.terms.mcapHKD, best: null },
  { label: "metricPe", get: (i) => parseFloat(i.terms.pe) || null, fmt: (_v, i) => i.terms.pe, best: "min" },
  { label: "metricCornerstoneCount", get: (i) => i.cornerstones?.length ?? 0, fmt: (v, _i, t) => `${v} ${t("peopleUnit")}`, best: "max" },
  {
    label: "metricCornerstonePercent",
    get: (i) => (i.cornerstones ?? []).reduce((s, c) => s + (c.pct || 0), 0),
    fmt: (v) => (v ? `${(v as number).toFixed(1)}%` : "—"),
    best: "max",
  },
  { label: "metricOneLot", get: (i) => i.live.oneLotRate, fmt: (v, _i, t) => (v == null ? t("pendingPublication") : `${v}%`), best: null },
  { label: "metricBoard", get: (i) => i.board, fmt: (_v, i) => i.board, best: null },
  { label: "metricSector", get: (i) => i.sector, fmt: (_v, i, t) => t(IPO_SECTOR_MESSAGE[i.sector]), best: null },
  { label: "metricType", get: (i) => i.listingType, fmt: (_v, i, t) => t(IPO_LISTING_TYPE_MESSAGE[i.listingType]), best: null },
  { label: "metricClawback", get: (i) => (i.clawback ? 1 : 0), fmt: (_v, i, t) => (i.clawback ? t("standardClawback") : t("noClawback")), best: null },
  { label: "metricSentiment", get: (i) => i.sentiment, fmt: () => "", best: null, sentiment: true },
  { label: "metricDemandSignal", get: (i) => i.demandSignal, fmt: () => "", best: null, rec: true },
];

function bestIndex(m: Metric, ipos: ResolvedIpoRecord[]): number {
  if (!m.best) return -1;
  let bi = -1;
  let bv = m.best === "max" ? -Infinity : Infinity;
  ipos.forEach((i, idx) => {
    const raw = m.get(i);
    const v = typeof raw === "number" ? raw : Number(raw);
    if (raw == null || Number.isNaN(v)) return;
    if (m.best === "max" ? v > bv : v < bv) {
      bv = v;
      bi = idx;
    }
  });
  return bi;
}

function CompareView() {
  const navigate = useNavigate();
  const { locale, t } = useIpoLocale();
  const { ids, toggle, has } = useIpoCompare();
  const res = compareIposMock(locale, ids);
  const selected = res.ok ? res.data.rows : [];
  const ipos = getIpos(locale);
  const cols = selected.length;

  return (
    <main style={{ ...SHELL, padding: "32px var(--content-gutter) 80px" }}>
      <button
        type="button"
        onClick={() => navigate({ to: "/ipos" })}
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

      <Eyebrow style={{ marginBottom: 8 }}>{t("compareEyebrow")}</Eyebrow>
      <h1
        style={{
          margin: "0 0 8px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-4xl)",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "var(--tracking-tight)",
        }}
      >
        {t("compareTitle")}
      </h1>
      <p style={{ margin: "0 0 22px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        {t("compareDescription")}
      </p>

      {/* selector chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {ipos.map((i) => {
          const on = has(i.id);
          const full = !on && cols >= IPO_COMPARE_MAX;
          return (
            <button
              key={i.id}
              type="button"
              disabled={full}
              onClick={() => toggle(i.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 13px",
                borderRadius: "var(--radius-pill)",
                cursor: full ? "not-allowed" : "pointer",
                border: "1px solid " + (on ? "var(--violet-500)" : "var(--border-default)"),
                background: on ? "var(--violet-50)" : "var(--surface-card)",
                opacity: full ? 0.45 : 1,
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: on ? "var(--violet-600)" : "var(--text-body)",
              }}
            >
              <Icon name={on ? "check" : "plus"} size={14} />
              {i.name}{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                {i.ticker}
              </span>
            </button>
          );
        })}
      </div>

      {cols < 2 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            color: "var(--text-muted)",
          }}
        >
          <Icon name="git-compare" size={30} color="var(--text-subtle)" />
          <p style={{ margin: "12px 0 0", fontSize: "var(--text-sm)" }}>
            {t("compareEmpty")}
          </p>
        </div>
      ) : (
        <>
          {/* comparison table */}
          <div
            style={{
              overflowX: "auto",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
              background: "var(--surface-card)",
              marginBottom: 24,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 120 + cols * 180 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      position: "sticky",
                      left: 0,
                      background: "var(--surface-card)",
                      minWidth: 150,
                    }}
                  >
                    <Eyebrow>{t("compareMetric")}</Eyebrow>
                  </th>
                  {selected.map((i, idx) => (
                    <th
                      key={i.id}
                      style={{
                        padding: "16px 18px",
                        textAlign: "left",
                        borderLeft: "1px solid var(--border-subtle)",
                        minWidth: 170,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                        <span style={{ width: 10, height: 10, background: COMPARE_COLORS[idx], clipPath: HEX_CLIP, flexShrink: 0 }} />
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/ipos/$ipoId", params: { ipoId: i.id } })}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "var(--font-display)",
                            fontSize: "var(--text-base)",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {i.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(i.id)}
                          title={t("remove")}
                          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-subtle)", lineHeight: 0 }}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
                        {i.ticker} · {i.cn}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m, ri) => {
                  const bi = bestIndex(m, selected);
                  return (
                    <tr key={ri} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td
                        style={{
                          padding: "12px 18px",
                          position: "sticky",
                          left: 0,
                          background: "var(--surface-card)",
                          fontSize: "var(--text-sm)",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                        }}
                      >
                        {t(m.label)}
                      </td>
                      {selected.map((i, idx) => {
                        const win = idx === bi;
                        let content;
                        if (m.sentiment) {
                          content = (
                            <Badge tone={SENTIMENT_TONE[i.sentiment]} size="sm" dot>
                              {t(IPO_SENTIMENT_MESSAGE[i.sentiment])}
                            </Badge>
                          );
                        } else if (m.rec) {
                          content = (
                            <Badge tone={DEMAND_SIGNAL_CFG[i.demandSignal].tone} variant="solid" size="sm">
                              {t(IPO_DEMAND_MESSAGE[i.demandSignal])}
                            </Badge>
                          );
                        } else {
                          content = (
                            <Mono size="var(--text-sm)" color={win ? "var(--green-700)" : "var(--text-primary)"}>
                              {m.fmt(m.get(i), i, t)}
                            </Mono>
                          );
                        }
                        return (
                          <td
                            key={i.id}
                            style={{
                              padding: "12px 18px",
                              borderLeft: "1px solid var(--border-subtle)",
                              background: win ? "var(--green-50)" : "transparent",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              {content}
                              {win && <Icon name="crown" size={13} color="var(--green-600)" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bee verdict — descriptive research signal, NOT investment advice (Gate-0 / PRD §14.2) */}
          {(() => {
            const winner = selected.reduce((w, x) => (x.score > w.score ? x : w), selected[0]);
            const sig = t(IPO_DEMAND_MESSAGE[winner.demandSignal]);
            return (
              <>
                <BeeNote
                  basePath={MASCOT_BP}
                  pose="insight"
                  tone="navy"
                  title={t("verdictTitle")}
                  action={
                    <Badge tone={DEMAND_SIGNAL_CFG[winner.demandSignal].tone} variant="solid" size="sm">
                      {sig}
                    </Badge>
                  }
                >
                  {locale === "en"
                    ? `${t("verdictFrom")}, ${winner.name} (${winner.ticker}) ${t("verdictBodyBeforeCount")} ${cols} ${t("verdictBodyAfterCount")} (${t("verdictScore")} ${winner.score} · ${t("verdictSignal")} ${sig}). ${t("verdictDisclaimer")}`
                    : `${t("verdictFrom")}，${winner.name}（${winner.ticker}）${t("verdictBodyBeforeCount")} ${cols} ${t("verdictBodyAfterCount")}（${t("verdictScore")} ${winner.score} · ${t("verdictSignal")} ${sig}）。${t("verdictDisclaimer")}`}
                </BeeNote>
                <Disclaimer style={{ marginTop: 10 }} />
              </>
            );
          })()}
        </>
      )}
    </main>
  );
}
