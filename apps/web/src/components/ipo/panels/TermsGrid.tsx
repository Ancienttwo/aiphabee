import { Mono } from "../Mono";
import { fmtNum } from "../../../lib/num";
import type { ResolvedIpoRecord } from "../../../lib/api/ipo-types";
import { useIpoLocale } from "../i18n";

/** Offer-terms grid (vendor fact), ported from `detail-parts.jsx` `TermsGrid`. */
export function TermsGrid({ ipo }: { ipo: ResolvedIpoRecord }) {
  const { t: translate } = useIpoLocale();
  const t = ipo.terms;
  const items: [string, string][] = [
    [
      translate("priceRange"),
      t.priceLow && t.priceHigh
        ? `HK$${t.priceLow.toFixed(2)} – ${t.priceHigh.toFixed(2)}`
        : translate("pending"),
    ],
    [
      translate("finalPrice"),
      t.finalPrice
        ? `HK$${t.finalPrice.toFixed(2)}`
        : ipo.stage === "subscribing"
          ? translate("subscribing")
          : "—",
    ],
    [translate("metricEntryFee"), t.entryFee ? `HK$${fmtNum(t.entryFee, 0)}` : "—"],
    [translate("lotSize"), `${fmtNum(t.lotSize, 0)} ${translate("sharesUnit")}`],
    [translate("sharesOffered"), t.sharesOffered],
    [translate("publicInternationalSplit"), t.publicPct ? `${t.publicPct}% / ${t.intlPct}%` : translate("notApplicable")],
    [translate("metricRaise"), t.raiseHKD],
    [translate("metricMarketCap"), t.mcapHKD],
    [translate("metricNta"), t.nta],
    [translate("metricPe"), t.pe],
    [translate("metricPb"), t.pb],
    [translate("greenshoe"), t.greenshoe],
  ];
  return (
    <div
      className="ab-grid-3"
      style={{
        gap: 0,
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {items.map(([k, v], i) => (
        <div
          key={k}
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            borderRight: i % 3 !== 2 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginBottom: 4 }}>
            {k}
          </div>
          <Mono size="var(--text-sm)">{v}</Mono>
        </div>
      ))}
    </div>
  );
}
