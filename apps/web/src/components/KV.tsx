import type { ReactNode } from "react";

/**
 * Compact key/value row for workbench detail panels. `mono` renders the value
 * in the monospace face (used for codes, prices, identifiers).
 */
export interface KVProps {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  trailing?: ReactNode;
}

export function KV({ label, value, mono = false, trailing }: KVProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {label}
      </span>
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text-primary)",
            textAlign: "right",
          }}
        >
          {value}
        </span>
        {trailing}
      </span>
    </div>
  );
}
