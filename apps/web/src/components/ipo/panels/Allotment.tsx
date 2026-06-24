import { Icon } from "../../../ds";
import { Eyebrow } from "../Eyebrow";
import { Mono } from "../Mono";
import { LockedValue } from "../LockedValue";
import type { IpoRecord } from "../../../lib/api/ipo-types";

/**
 * Published allotment result (vendor fact), ported from `detail-parts.jsx`.
 * `allotment` null → pending notice (招股 / 处理中) instead of an error.
 * Sensitive fields gated premium: 頂頭槌 (maximum subscription) + per-tier applicant
 * counts (DAT-05 default-deny).
 */
export function Allotment({ ipo }: { ipo: IpoRecord }) {
  if (!ipo.allotment) {
    const pending = ipo.stage === "subscribing" || ipo.stage === "processing";
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px",
          background: "var(--surface-muted)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Icon name={pending ? "clock" : "minus-circle"} size={18} color="var(--text-muted)" />
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
          {pending
            ? "分配结果尚未公布（招股 / 处理中），结果公布后将显示一手中签率、回拨比例与各档中签率。"
            : "本次未产生分配结果（介绍上市 / 已撤回）。"}
        </div>
      </div>
    );
  }
  const a = ipo.allotment;
  const kpis: [string, string, string, boolean][] = [
    [
      "一手中签率 One-lot",
      `${a.oneLotRate}%`,
      a.oneLotRate >= 50 ? "var(--green-600)" : "var(--accent-strong)",
      false,
    ],
    ["有效申请 Valid Apps", a.validApps, "var(--text-primary)", false],
    ["顶头槌 Max Subscription", a.headHammer, "var(--text-primary)", true],
    ["回拨 Clawback", a.clawbackApplied, "var(--text-primary)", false],
  ];
  return (
    <div>
      <div className="ab-grid-4" style={{ gap: 12, marginBottom: 16 }}>
        {kpis.map(([k, v, c, gated]) => (
          <div key={k} style={{ padding: "12px 14px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginBottom: 5 }}>{k}</div>
            {gated ? (
              <LockedValue tier="premium">
                <Mono size="var(--text-lg)" color={c}>
                  {v}
                </Mono>
              </LockedValue>
            ) : (
              <Mono size="var(--text-lg)" color={c}>
                {v}
              </Mono>
            )}
          </div>
        ))}
      </div>
      <Eyebrow style={{ marginBottom: 8 }}>各档中签率 Allotment by Tier</Eyebrow>
      <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr 1.6fr",
            gap: 0,
            padding: "8px 14px",
            background: "var(--surface-muted)",
          }}
        >
          {["申请手数", "申请人数", "中签率 Rate"].map((h) => (
            <Eyebrow key={h}>{h}</Eyebrow>
          ))}
        </div>
        {a.result.map((r, i) => {
          const rate = parseInt(r.rate);
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.4fr 1.6fr",
                gap: 0,
                padding: "10px 14px",
                borderTop: "1px solid var(--border-subtle)",
                alignItems: "center",
              }}
            >
              <Mono>{r.lots} 手</Mono>
              <LockedValue tier="premium">
                <Mono color="var(--text-body)" weight={600}>
                  {r.applied}
                </Mono>
              </LockedValue>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: "var(--radius-pill)",
                    background: "var(--surface-muted)",
                    overflow: "hidden",
                    maxWidth: 90,
                  }}
                >
                  <div
                    style={{
                      width: rate + "%",
                      height: "100%",
                      background: rate >= 100 ? "var(--green-500)" : "var(--honey-500)",
                      borderRadius: "var(--radius-pill)",
                    }}
                  />
                </div>
                <Mono color={rate >= 100 ? "var(--green-600)" : "var(--accent-strong)"}>{r.rate}</Mono>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
