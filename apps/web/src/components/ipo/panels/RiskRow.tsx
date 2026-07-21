import type { IpoRisk, IpoRiskLevel } from "../../../lib/api/ipo-types";
import { useIpoLocale, type IpoMessageKey } from "../i18n";

const CFG: Record<IpoRiskLevel, [string, string, IpoMessageKey]> = {
  high: ["var(--red-500)", "var(--red-50)", "riskHigh"],
  mid: ["var(--orange-500)", "var(--orange-50)", "riskMedium"],
  low: ["var(--green-600)", "var(--green-50)", "riskLow"],
};

/** One risk-summary line (analysis layer), ported from `detail.jsx` `RiskRow`. */
export function RiskRow({ r }: { r: IpoRisk }) {
  const { t } = useIpoLocale();
  const [color, bg, labelKey] = CFG[r.level];
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 0",
        borderTop: "1px solid var(--surface-muted)",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          alignSelf: "flex-start",
          marginTop: 1,
          padding: "1px 8px",
          borderRadius: "var(--radius-pill)",
          background: bg,
          color,
          fontSize: "var(--text-2xs)",
          fontWeight: 700,
        }}
      >
        {t(labelKey)}
      </span>
      <span style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--text-body)" }}>
        {r.text}
      </span>
    </div>
  );
}
