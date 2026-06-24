import { useState, type ReactNode } from "react";
import { Icon } from "../../ds";
import type { ProvenanceRef, UsageSummary } from "../../lib/api";

/**
 * Evidence card (PRD AGT-07). Collapsed by default; expanding reveals the full
 * provenance behind a number — source record id, data version, as-of time and
 * delay, methodology, usage, and any warnings. Every financial figure in the
 * product should be wrappable in one of these.
 */
export interface EvidenceCardProps {
  asOf: string;
  dataVersion?: string;
  methodologyVersion?: string;
  provenance?: ProvenanceRef[];
  usage?: UsageSummary;
  warnings?: string[];
  label?: string;
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <span
        style={{
          minWidth: 150,
          flexShrink: 0,
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-2xs)",
          fontWeight: 600,
          color: "var(--text-muted)",
        }}
      >
        {k}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: "var(--text-body)",
          wordBreak: "break-all",
        }}
      >
        {v}
      </span>
    </div>
  );
}

// Computed only on the client (card opens via interaction), so there is no
// SSR/hydration time skew.
function formatDelay(asOf: string): string {
  const ms = Date.now() - new Date(asOf).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} 分钟`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr} 小时`;
  return `${Math.round(hr / 24)} 天`;
}

export function EvidenceCard({
  asOf,
  dataVersion,
  methodologyVersion,
  provenance = [],
  usage,
  warnings = [],
  label = "查看证据来源",
}: EvidenceCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-sunken)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--accent-strong)",
        }}
      >
        <Icon name="layers" size={14} color="var(--accent-strong)" />
        {label}
        <span
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            transition: "transform var(--duration-fast) var(--ease-standard)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <Icon name="chevron-down" size={14} color="var(--text-muted)" />
        </span>
      </button>
      {open ? (
        <div
          style={{
            display: "grid",
            gap: 8,
            padding: "10px 12px 12px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <Row k="数据时间 as_of" v={asOf} />
          <Row k="数据延迟" v={formatDelay(asOf)} />
          {dataVersion ? <Row k="数据版本 data_version" v={dataVersion} /> : null}
          {methodologyVersion ? (
            <Row k="方法论 methodology" v={methodologyVersion} />
          ) : null}
          {usage ? (
            <Row
              k="用量 usage"
              v={`${usage.rows} 行 · ${usage.credits} credits${usage.cached ? " · 缓存" : ""}`}
            />
          ) : null}
          {provenance.map((p, i) => (
            <Row
              key={`${p.source_record_id}-${i}`}
              k={`来源 ${p.source}`}
              v={`${p.source_record_id} · ${p.data_version}`}
            />
          ))}
          {warnings.length > 0 ? (
            <div style={{ display: "grid", gap: 4, marginTop: 2 }}>
              {warnings.map((w, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-2xs)",
                    color: "var(--red-600)",
                  }}
                >
                  <Icon name="alert-circle" size={12} color="var(--red-500)" />
                  {w}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
