import { Eyebrow } from "../Eyebrow";
import { Mono } from "../Mono";
import { Badge } from "../../../ds";
import { fmtNum } from "../../../lib/num";
import type { ResolvedIpoRecord } from "../../../lib/api/ipo-types";
import { useIpoLocale } from "../i18n";

/**
 * Company-profile section renderers (vendor fact), ported from
 * `detail-parts.jsx` (`Proceeds`, `CompanyTable`, `AppTiers`). The overview /
 * risks / advantages prose lists are rendered inline by the workbench shell to
 * mirror the prototype's `DetailView` overview tab.
 */

/** Use-of-proceeds horizontal bars. */
export function Proceeds({ ipo }: { ipo: ResolvedIpoRecord }) {
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
export function CompanyTable({ ipo }: { ipo: ResolvedIpoRecord }) {
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
export function AppTiers({ ipo }: { ipo: ResolvedIpoRecord }) {
  const { t } = useIpoLocale();
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
        {t("applicationTiersPending")}
      </div>
    );
  }
  return (
    <div className="ab-table-scroll" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
      <div style={{ minWidth: 440 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 1fr", padding: "8px 14px", background: "var(--surface-muted)" }}>
        {[t("applicationLots"), t("shares"), t("entryAmount"), ipo.allotment ? t("successRate") : ""].map((h, i) => (
          <Eyebrow key={i}>{h}</Eyebrow>
        ))}
      </div>
      {ipo.applicationTiers.map((tier, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1.2fr 1fr",
            padding: "10px 14px",
            borderTop: "1px solid var(--border-subtle)",
            alignItems: "center",
            background: tier.hot ? "var(--surface-honey)" : "transparent",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Mono>{tier.lots}</Mono>
            {tier.hot && (
              <Badge tone="honey" size="sm">
                {t("hottest")}
              </Badge>
            )}
          </span>
          <Mono color="var(--text-body)">{fmtNum(tier.shares, 0)}</Mono>
          <Mono color="var(--text-body)">{fmtNum(tier.amount, 0)}</Mono>
          <Mono color="var(--accent-strong)">{tier.rate || "—"}</Mono>
        </div>
      ))}
      </div>
    </div>
  );
}
