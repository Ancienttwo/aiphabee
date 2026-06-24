import { Mono } from "../Mono";
import { fmtNum } from "../../../lib/num";
import type { IpoRecord } from "../../../lib/api/ipo-types";

/** Offer-terms grid (vendor fact), ported from `detail-parts.jsx` `TermsGrid`. */
export function TermsGrid({ ipo }: { ipo: IpoRecord }) {
  const t = ipo.terms;
  const items: [string, string][] = [
    [
      "招股价区间 Price Range",
      t.priceLow && t.priceHigh
        ? `HK$${t.priceLow.toFixed(2)} – ${t.priceHigh.toFixed(2)}`
        : "待定",
    ],
    [
      "最终定价 Final Price",
      t.finalPrice
        ? `HK$${t.finalPrice.toFixed(2)}`
        : ipo.stage === "subscribing"
          ? "招股中"
          : "—",
    ],
    ["入场费 Entry Fee", t.entryFee ? `HK$${fmtNum(t.entryFee, 0)}` : "—"],
    ["每手股数 Lot Size", `${fmtNum(t.lotSize, 0)} 股`],
    ["发行股数 Shares Offered", t.sharesOffered],
    ["公开 / 国际 Split", t.publicPct ? `${t.publicPct}% / ${t.intlPct}%` : "不适用"],
    ["集资额 Total Raise", t.raiseHKD],
    ["市值 Market Cap", t.mcapHKD],
    ["每股 NTA", t.nta],
    ["市盈率 P/E", t.pe],
    ["市净率 P/B", t.pb],
    ["超额配股权 Greenshoe", t.greenshoe],
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
