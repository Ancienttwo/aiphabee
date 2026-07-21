import { Badge, Icon, type BadgeTone } from "../../ds";
import {
  SENTIMENT_TONE,
  STAGE_BY,
} from "../../data/ipos.fixtures";
import type { IpoRecord } from "../../lib/api/ipo-types";
import { fmtNum } from "../../lib/num";
import { Eyebrow } from "./Eyebrow";
import { Mono } from "./Mono";
import { SubPill } from "./SubPill";
import {
  IPO_LISTING_TYPE_MESSAGE,
  IPO_SECTOR_MESSAGE,
  IPO_SENTIMENT_MESSAGE,
  IPO_STAGE_MESSAGE,
  useIpoLocale,
} from "./i18n";

/** Offer price range / final, or the localized pending label when undisclosed. */
function offerText(t: IpoRecord["terms"], pending: string): string {
  if (t.finalPrice) return `HK$${t.finalPrice.toFixed(2)}`;
  if (t.priceLow && t.priceHigh)
    return `HK$${t.priceLow.toFixed(2)}–${t.priceHigh.toFixed(2)}`;
  return pending;
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
  const { t: translate } = useIpoLocale();
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
            {translate(IPO_STAGE_MESSAGE[ipo.stage])}
          </Badge>
          {ipo.listingType !== "normal" && (
            <Badge tone="navy" variant="outline" size="sm">
              {translate(IPO_LISTING_TYPE_MESSAGE[ipo.listingType])}
            </Badge>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          <Mono size="var(--text-xs)" color="var(--text-body)">
            {ipo.ticker}
          </Mono>
          <span>·</span>
          <span>{translate(IPO_SECTOR_MESSAGE[ipo.sector])}</span>
        </div>
      </div>
      {/* offer */}
      <div>
        <Eyebrow>{translate("offerEntryFee")}</Eyebrow>
        <div style={{ marginTop: 3 }}>
          <Mono>{offerText(t, translate("pending"))}</Mono>
        </div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
          {t.entryFee ? `HK$${fmtNum(t.entryFee, 0)}` : "—"}
        </div>
      </div>
      {/* listing date */}
      <div>
        <Eyebrow>{translate("listingDate")}</Eyebrow>
        <div style={{ marginTop: 3, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)" }}>
          {ipo.listingDate.replace(", 2026", "")}
        </div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          {ipo.listingType !== "intro"
            ? `${translate("rowFundraising")} ${t.raiseHKD}`
            : translate("introListing")}
        </div>
      </div>
      {/* subscription / win rate */}
      <div>
        <Eyebrow>{isAllot ? translate("metricOneLot") : translate("publicSubscription")}</Eyebrow>
        <div style={{ marginTop: 3 }}>
          {isAllot ? (
            <Mono color={oneLot >= 50 ? "var(--green-600)" : "var(--accent-strong)"}>{oneLot}%</Mono>
          ) : (
            <SubPill x={live.subPublic} />
          )}
        </div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          {isAllot
            ? `${translate("rowClawback")} ${live.clawbackApplied ?? "—"}`
            : live.subPublic != null
              ? `${translate("international")} ${live.subIntl ?? "—"}×`
              : "—"}
        </div>
      </div>
      {/* sentiment + score */}
      <div>
        <Eyebrow>{translate("rowSentimentScore")}</Eyebrow>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Badge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>
            {translate(IPO_SENTIMENT_MESSAGE[ipo.sentiment])}
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
        title={translate("addCompare")}
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
