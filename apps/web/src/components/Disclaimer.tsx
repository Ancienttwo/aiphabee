import type { CSSProperties } from "react";

/**
 * Gate-0 compliance disclaimer: illustrative mock data + non-advice notice.
 * Shown persistently in the footer and beside the research-insight block.
 */

const base: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-2xs)",
  lineHeight: "var(--leading-normal)",
  color: "var(--text-subtle)",
};

export function Disclaimer({ style }: { style?: CSSProperties }) {
  return (
    <p style={{ ...base, ...style }}>
      插图用模拟数据，非真实行情；本平台提供研究、分析与数据解读，不构成个性化投资建议或买入/卖出/持有建议，投资决策与风险由用户自行承担。
      {" · "}
      Illustrative mock data, not live market data. AiphaBee provides research
      and data-interpretation tools and does not give personalized investment
      advice or buy/sell/hold recommendations.
    </p>
  );
}
