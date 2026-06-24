import { useState } from "react";
import { Icon } from "../../ds";
import type { IpoEvidence } from "../../lib/api/ipo-types";

export interface EvidenceChipProps {
  ev: IpoEvidence;
  compact?: boolean;
}

/**
 * Recurring as_of / data_version / methodology / source disclosure chip. Every
 * number on the workbench is reachable to its evidence; sensitive fields stay
 * default-deny.
 */
export function EvidenceChip({ ev, compact }: EvidenceChipProps) {
  const [open, setOpen] = useState(false);
  const rows: [string, string][] = [
    ["as_of", ev.asOf],
    ["data_version", ev.dataVersion],
    ["methodology", ev.methodology],
    ["source", ev.source],
  ];
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          padding: compact ? "3px 8px" : "5px 10px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-card)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        <Icon name="shield-check" size={12} color="var(--green-600)" />
        as of {ev.asOf.split(" ").slice(0, 3).join(" ")}
        <Icon name="chevron-down" size={11} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            zIndex: "var(--z-dropdown)" as unknown as number,
            width: 280,
            padding: 14,
            borderRadius: "var(--radius-lg)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-lg)",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-2xs)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-caps)",
              color: "var(--text-subtle)",
              marginBottom: 10,
            }}
          >
            证据与数据版本 Evidence
          </div>
          {rows.map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "5px 0",
                borderTop: "1px solid var(--surface-muted)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-subtle)",
                }}
              >
                {k}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-body)",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {v}
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 10,
              fontSize: "var(--text-2xs)",
              color: "var(--text-subtle)",
              lineHeight: 1.5,
            }}
          >
            所有数字均带来源与版本，default-deny；未授权字段不展示。
          </div>
        </div>
      )}
    </span>
  );
}
