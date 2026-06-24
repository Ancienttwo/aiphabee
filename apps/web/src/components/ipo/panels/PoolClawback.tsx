import { Icon } from "../../../ds";
import { Eyebrow } from "../Eyebrow";
import { Mono } from "../Mono";
import { Badge } from "../../../ds";
import { LISTING_TYPE } from "../../../data/ipos.fixtures";
import type { IpoRecord } from "../../../lib/api/ipo-types";

/**
 * Public-offer pool + clawback ladder (vendor fact), ported from
 * `detail-parts.jsx`. By-Introduction / not-yet-open offers (`pools` null)
 * render an explanatory notice rather than crashing.
 */
export function PoolClawback({ ipo }: { ipo: IpoRecord }) {
  if (ipo.listingType === "intro" || !ipo.pools) {
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
        <Icon name="info" size={18} color="var(--text-muted)" />
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.55 }}>
          <strong>{LISTING_TYPE[ipo.listingType].split(" ")[0]}</strong>：本次
          {ipo.listingType === "intro"
            ? "以介绍方式上市，无公开发售、无 Pool A/B、无回拨机制"
            : "尚未启动公开发售，Pool 与回拨待招股时公布"}
          。
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="ab-grid-2" style={{ gap: 12, marginBottom: 18 }}>
        {ipo.pools.map((p) => (
          <div
            key={p.name}
            style={{
              padding: "14px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                {p.name}
              </span>
              <Badge tone="neutral" size="sm">
                {p.desc}
              </Badge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <div>
                <Eyebrow>可认购 Lots</Eyebrow>
                <div style={{ marginTop: 2 }}>
                  <Mono>{p.lots}</Mono>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Eyebrow>有效申请</Eyebrow>
                <div style={{ marginTop: 2 }}>
                  <Mono color="var(--text-body)">{p.apps ?? "招股中"}</Mono>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ipo.clawback && (
        <>
          <Eyebrow style={{ marginBottom: 8 }}>回拨机制 Clawback</Eyebrow>
          <div
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {ipo.clawback.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderTop: i ? "1px solid var(--border-subtle)" : "none",
                  background: c.active ? "var(--surface-honey)" : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--text-body)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {c.active && <Icon name="arrow-right" size={13} color="var(--accent-strong)" />}
                  公开认购 {c.trigger}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mono color={c.active ? "var(--accent-strong)" : "var(--text-primary)"}>
                    公开占 {c.publicPct}
                  </Mono>
                  {c.active && (
                    <Badge tone="honey" size="sm">
                      已触发
                    </Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
