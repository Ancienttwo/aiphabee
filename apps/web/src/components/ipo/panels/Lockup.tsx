import { Icon } from "../../../ds";
import { Mono } from "../Mono";
import type { IpoRecord } from "../../../lib/api/ipo-types";

/**
 * Lock-up (禁售期) cohorts (vendor fact), ported from `detail-parts.jsx`.
 * Empty list → "无适用禁售期信息" notice (e.g. withdrawn offers).
 */
export function Lockup({ ipo }: { ipo: IpoRecord }) {
  if (!ipo.lockup || !ipo.lockup.length) {
    return (
      <div
        style={{
          padding: "14px",
          background: "var(--surface-muted)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)",
          color: "var(--text-muted)",
        }}
      >
        无适用禁售期信息。
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ipo.lockup.map((l, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="lock" size={15} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                {l.type}
              </div>
              <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                解禁 Unlock · {l.endDate}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Mono size="var(--text-sm)">{l.pct}</Mono>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{l.shares}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
