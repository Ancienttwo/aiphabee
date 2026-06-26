import { Eyebrow } from "../Eyebrow";
import { Mono } from "../Mono";
import { Badge } from "../../../ds";
import { fmtNum } from "../../../lib/num";
import type { IpoRecord } from "../../../lib/api/ipo-types";

/**
 * Company-profile section renderers (vendor fact), ported from
 * `detail-parts.jsx` (`Proceeds`, `CompanyTable`, `AppTiers`). The overview /
 * risks / advantages prose lists are rendered inline by the workbench shell to
 * mirror the prototype's `DetailView` overview tab.
 */

/** Use-of-proceeds horizontal bars. */
export function Proceeds({ ipo }: { ipo: IpoRecord }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {ipo.profile.useOfProceeds.map((u, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: "var(--text-sm)" }}>
            <span style={{ color: "var(--text-body)", fontWeight: 500 }}>{u.label}</span>
            <Mono>{u.pct}%</Mono>
          </div>
          <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "var(--surface-muted)", overflow: "hidden" }}>
            <div
              style={{
                width: u.pct + "%",
                height: "100%",
                borderRadius: "var(--radius-pill)",
                background: `var(--chart-${(i % 6) + 1})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Company-info key/value table. */
export function CompanyTable({ ipo }: { ipo: IpoRecord }) {
  return (
    <div
      className="ab-grid-2"
      style={{
        gap: 0,
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {ipo.profile.company.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            borderRight: i % 2 === 0 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{c.k}</span>
          <Mono size="var(--text-sm)" color="var(--text-body)">
            {c.v}
          </Mono>
        </div>
      ))}
    </div>
  );
}

/**
 * Application-amount tiers. `null` (not yet published) → notice. The per-tier
 * applicant count (`applied`) is sensitive; the prototype's tier table shows
 * the amount + rate publicly, so no count is rendered here.
 */
export function AppTiers({ ipo }: { ipo: IpoRecord }) {
  if (!ipo.applicationTiers) {
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
        申请档位将在招股启动后公布。
      </div>
    );
  }
  return (
    <div className="ab-table-scroll" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
      <div style={{ minWidth: 440 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 1fr", padding: "8px 14px", background: "var(--surface-muted)" }}>
        {["手数 Lots", "股数 Shares", "入场金额 HK$", ipo.allotment ? "中签率" : ""].map((h, i) => (
          <Eyebrow key={i}>{h}</Eyebrow>
        ))}
      </div>
      {ipo.applicationTiers.map((t, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1.2fr 1fr",
            padding: "10px 14px",
            borderTop: "1px solid var(--border-subtle)",
            alignItems: "center",
            background: t.hot ? "var(--surface-honey)" : "transparent",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Mono>{t.lots}</Mono>
            {t.hot && (
              <Badge tone="honey" size="sm">
                最热
              </Badge>
            )}
          </span>
          <Mono color="var(--text-body)">{fmtNum(t.shares, 0)}</Mono>
          <Mono color="var(--text-body)">{fmtNum(t.amount, 0)}</Mono>
          <Mono color="var(--accent-strong)">{t.rate || "—"}</Mono>
        </div>
      ))}
      </div>
    </div>
  );
}
