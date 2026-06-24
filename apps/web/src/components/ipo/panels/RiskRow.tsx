import type { IpoRisk, IpoRiskLevel } from "../../../lib/api/ipo-types";

const CFG: Record<IpoRiskLevel, [string, string, string]> = {
  high: ["var(--red-500)", "var(--red-50)", "高 High"],
  mid: ["var(--orange-500)", "var(--orange-50)", "中 Mid"],
  low: ["var(--green-600)", "var(--green-50)", "低 Low"],
};

/** One risk-summary line (analysis layer), ported from `detail.jsx` `RiskRow`. */
export function RiskRow({ r }: { r: IpoRisk }) {
  const [color, bg, label] = CFG[r.level];
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
        {label}
      </span>
      <span style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--text-body)" }}>
        {r.text}
      </span>
    </div>
  );
}
