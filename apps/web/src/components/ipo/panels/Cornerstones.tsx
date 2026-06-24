import { Icon } from "../../../ds";
import { Mono } from "../Mono";
import { LockedValue } from "../LockedValue";
import type { IpoRecord } from "../../../lib/api/ipo-types";

/**
 * Cornerstone investors (vendor fact), ported from `detail-parts.jsx`. Empty
 * cornerstone list → weak-demand notice (not a crash). `amount` is gated
 * enterprise (DAT-05 default-deny).
 */
export function Cornerstones({ ipo }: { ipo: IpoRecord }) {
  if (!ipo.cornerstones || !ipo.cornerstones.length) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px",
          background: "var(--surface-muted)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)",
          color: "var(--text-muted)",
        }}
      >
        <Icon name="user-x" size={16} /> 该 IPO 未引入基石投资者，需求支撑较弱。
      </div>
    );
  }
  return (
    <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      {ipo.cornerstones.map((c, i) => (
        <div
          key={c.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderTop: i ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
              {c.name}
            </div>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
              禁售 Lock-up {c.lockup}
            </div>
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <LockedValue tier="enterprise">
              <Mono size="var(--text-sm)">{c.amount}</Mono>
            </LockedValue>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
              {c.pct}% of offer
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
