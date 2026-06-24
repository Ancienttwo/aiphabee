import { Badge, Icon, type BadgeTone } from "../../ds";
import {
  LISTING_TYPE,
  SECTOR_LABEL,
  SENTIMENT_LABEL,
  SENTIMENT_TONE,
  STAGE_BY,
} from "../../data/ipos.fixtures";
import type { IpoRecord } from "../../lib/api/ipo-types";
import { fmtNum } from "../../lib/num";
import { Eyebrow } from "./Eyebrow";
import { Mono } from "./Mono";
import { SubPill } from "./SubPill";

/** Offer price range / final, or 待定 when undisclosed. */
function offerText(t: IpoRecord["terms"]): string {
  if (t.finalPrice) return `HK$${t.finalPrice.toFixed(2)}`;
  if (t.priceLow && t.priceHigh)
    return `HK$${t.priceLow.toFixed(2)}–${t.priceHigh.toFixed(2)}`;
  return "待定";
}

const ST_TONE: Record<string, BadgeTone> = {
  honey: "honey",
  bullish: "bullish",
  info: "info",
  bearish: "bearish",
  neutral: "neutral",
};

export interface IpoRowProps {
  ipo: IpoRecord;
  onOpen: () => void;
  inCompare: boolean;
  toggleCompare: (id: string) => void;
}

/** One dense IPO pipeline row. */
export function IpoRow({ ipo, onOpen, inCompare, toggleCompare }: IpoRowProps) {
  const st = STAGE_BY[ipo.stage];
  const t = ipo.terms;
  const live = ipo.live;
  const isAllot = ipo.stage === "allotted";
  const oneLot = live.oneLotRate ?? 0;
  return (
    <div
      onClick={onOpen}
      className="ipo-row"
      style={{
        padding: "14px 18px",
        cursor: "pointer",
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-honey)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface-card)";
      }}
    >
      {/* name */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-primary)" }}>
            {ipo.name}
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{ipo.cn}</span>
          <Badge tone={ST_TONE[st.tone]} size="sm" dot dotShape="hex">
            {st.label}
          </Badge>
          {ipo.listingType !== "normal" && (
            <Badge tone="navy" variant="outline" size="sm">
              {LISTING_TYPE[ipo.listingType].split(" ")[0]}
            </Badge>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          <Mono size="var(--text-xs)" color="var(--text-body)">
            {ipo.ticker}
          </Mono>
          <span>·</span>
          <span>{SECTOR_LABEL[ipo.sector]}</span>
        </div>
      </div>
      {/* offer */}
      <div>
        <Eyebrow>Offer · 入场费</Eyebrow>
        <div style={{ marginTop: 3 }}>
          <Mono>{offerText(t)}</Mono>
        </div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
          {t.entryFee ? `HK$${fmtNum(t.entryFee, 0)}` : "—"}
        </div>
      </div>
      {/* listing date */}
      <div>
        <Eyebrow>Listing 上市日</Eyebrow>
        <div style={{ marginTop: 3, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)" }}>
          {ipo.listingDate.replace(", 2026", "")}
        </div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          {t.raiseHKD !== "不适用（无新股发行）" ? `集资 ${t.raiseHKD}` : "介绍上市"}
        </div>
      </div>
      {/* subscription / win rate */}
      <div>
        <Eyebrow>{isAllot ? "一手中签率" : "公开认购"}</Eyebrow>
        <div style={{ marginTop: 3 }}>
          {isAllot ? (
            <Mono color={oneLot >= 50 ? "var(--green-600)" : "var(--accent-strong)"}>{oneLot}%</Mono>
          ) : (
            <SubPill x={live.subPublic} />
          )}
        </div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          {isAllot
            ? `回拨 ${live.clawbackApplied ?? "—"}`
            : live.subPublic != null
              ? `国际 ${live.subIntl ?? "—"}×`
              : "—"}
        </div>
      </div>
      {/* sentiment + score */}
      <div>
        <Eyebrow>情绪 · 评分</Eyebrow>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Badge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>
            {SENTIMENT_LABEL[ipo.sentiment].split(" ")[0]}
          </Badge>
          <Mono color="var(--accent-strong)">{ipo.score}</Mono>
        </div>
      </div>
      {/* compare toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleCompare(ipo.id);
        }}
        title="加入对比"
        style={{
          justifySelf: "center",
          width: 30,
          height: 30,
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          border: "1px solid " + (inCompare ? "var(--violet-500)" : "var(--border-default)"),
          background: inCompare ? "var(--violet-50)" : "var(--surface-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={inCompare ? "check" : "git-compare"}
          size={15}
          color={inCompare ? "var(--violet-600)" : "var(--text-subtle)"}
        />
      </button>
      <Icon name="chevron-right" size={18} style={{ justifySelf: "end", color: "var(--text-subtle)" }} />
    </div>
  );
}
