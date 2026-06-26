import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, BeeNote, Icon } from "../../ds";
import { Disclaimer } from "../../components/Disclaimer";
import { compareIposMock } from "../../lib/api/ipo-mock";
import { useIpoCompare, IPO_COMPARE_MAX } from "../../lib/context/IpoCompareContext";
import {
  IPOS,
  LISTING_TYPE,
  DEMAND_SIGNAL_CFG,
  SECTOR_LABEL,
  SENTIMENT_LABEL,
  SENTIMENT_TONE,
} from "../../data/ipos.fixtures";
import type { IpoRecord, IpoTerms } from "../../lib/api/ipo-types";
import { Eyebrow, Mono } from "../../components/ipo";
import { fmtNum } from "../../lib/num";
import { MASCOT_BP, SHELL } from "../../lib/ui";

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

function offerText(t: IpoTerms): string {
  if (t.finalPrice) return `HK$${t.finalPrice.toFixed(2)}`;
  if (t.priceLow && t.priceHigh) return `HK$${t.priceLow.toFixed(2)}–${t.priceHigh.toFixed(2)}`;
  return "待定";
}

interface Metric {
  label: string;
  get: (i: IpoRecord) => number | string | null;
  fmt: (v: number | string | null, i: IpoRecord) => string;
  best: "max" | "min" | null;
  sentiment?: boolean;
  rec?: boolean;
}

/** Metric rows: value extractor + win direction. Signal stays a research signal (non-advice). */
const METRICS: Metric[] = [
  { label: "综合评分 Score", get: (i) => i.score, fmt: (v) => String(v), best: "max" },
  { label: "置信度 Confidence", get: (i) => i.confidence, fmt: (v) => `${v}%`, best: "max" },
  { label: "公开认购 Subscription", get: (i) => i.live.subPublic, fmt: (v) => (v == null ? "—" : `${v}×`), best: "max" },
  { label: "招股价 Offer", get: (i) => i.terms.finalPrice ?? i.terms.priceHigh, fmt: (_v, i) => offerText(i.terms), best: null },
  { label: "入场费 Entry Fee", get: (i) => i.terms.entryFee, fmt: (v) => (v ? `HK$${fmtNum(v as number, 0)}` : "—"), best: "min" },
  { label: "集资额 Raise", get: (i) => parseFloat(i.terms.raiseHKD) || null, fmt: (_v, i) => i.terms.raiseHKD, best: "max" },
  { label: "市值 Market Cap", get: (i) => parseFloat(i.terms.mcapHKD) || null, fmt: (_v, i) => i.terms.mcapHKD, best: null },
  { label: "市盈率 P/E", get: (i) => parseFloat(i.terms.pe) || null, fmt: (_v, i) => i.terms.pe, best: "min" },
  { label: "基石数量 Cornerstones", get: (i) => i.cornerstones?.length ?? 0, fmt: (v) => `${v} 名`, best: "max" },
  {
    label: "基石合计占比 CS %",
    get: (i) => (i.cornerstones ?? []).reduce((s, c) => s + (c.pct || 0), 0),
    fmt: (v) => (v ? `${(v as number).toFixed(1)}%` : "—"),
    best: "max",
  },
  { label: "一手中签率 One-lot", get: (i) => i.live.oneLotRate, fmt: (v) => (v == null ? "待公布" : `${v}%`), best: null },
  { label: "上市板 Board", get: (i) => i.board, fmt: (_v, i) => i.board, best: null },
  { label: "行业 Sector", get: (i) => i.sector, fmt: (_v, i) => SECTOR_LABEL[i.sector], best: null },
  { label: "上市方式 Type", get: (i) => i.listingType, fmt: (_v, i) => LISTING_TYPE[i.listingType].split(" ")[0], best: null },
  { label: "回拨 Clawback", get: (i) => (i.clawback ? 1 : 0), fmt: (_v, i) => (i.clawback ? "标准回拨" : "无 / NA"), best: null },
  { label: "市场情绪 Sentiment", get: (i) => i.sentiment, fmt: () => "", best: null, sentiment: true },
  { label: "研究信号 Signal", get: (i) => i.demandSignal, fmt: () => "", best: null, rec: true },
];

function bestIndex(m: Metric, ipos: IpoRecord[]): number {
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
  const { ids, toggle, has } = useIpoCompare();
  const res = compareIposMock(ids);
  const selected = res.ok ? res.data.rows : [];
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
        <Icon name="arrow-left" size={16} /> 返回 Pipeline
      </button>

      <Eyebrow style={{ marginBottom: 8 }}>横向比较 · Head-to-head</Eyebrow>
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
        IPO 横向比较
      </h1>
      <p style={{ margin: "0 0 22px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        选择 2–{IPO_COMPARE_MAX} 个标的，逐指标对比；获胜单元格高亮，工蜂给出描述性裁决（非投资建议）。
      </p>

      {/* selector chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {IPOS.map((i) => {
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
            请至少选择 2 个标的进行比较（上方点选，或回到 Pipeline 逐行加入）。
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
                    <Eyebrow>指标 Metric</Eyebrow>
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
                          title="移除"
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
                        {m.label}
                      </td>
                      {selected.map((i, idx) => {
                        const win = idx === bi;
                        let content;
                        if (m.sentiment) {
                          content = (
                            <Badge tone={SENTIMENT_TONE[i.sentiment]} size="sm" dot>
                              {SENTIMENT_LABEL[i.sentiment].split(" ")[0]}
                            </Badge>
                          );
                        } else if (m.rec) {
                          content = (
                            <Badge tone={DEMAND_SIGNAL_CFG[i.demandSignal].tone} variant="solid" size="sm">
                              {DEMAND_SIGNAL_CFG[i.demandSignal].label.split(" ")[0]}
                            </Badge>
                          );
                        } else {
                          content = (
                            <Mono size="var(--text-sm)" color={win ? "var(--green-700)" : "var(--text-primary)"}>
                              {m.fmt(m.get(i), i)}
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
            const sig = DEMAND_SIGNAL_CFG[winner.demandSignal].label.split(" ")[0];
            return (
              <>
                <BeeNote
                  basePath={MASCOT_BP}
                  pose="insight"
                  tone="navy"
                  title="工蜂裁决 · Bee Verdict"
                  action={
                    <Badge tone={DEMAND_SIGNAL_CFG[winner.demandSignal].tone} variant="solid" size="sm">
                      {sig}
                    </Badge>
                  }
                >
                  从研究评分与需求强度看，{winner.name}（{winner.ticker}）的综合研究信号在所选
                  {cols} 个标的中相对更强（评分 {winner.score} · 信号 {sig}）。以上为描述性研究信号，
                  非投资建议；请结合各自风险摘要与数据版本独立判断。
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
