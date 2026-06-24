import type { ReactNode } from "react";
import { Icon, type IconName } from "../../../ds";

export interface PanelProps {
  icon?: IconName;
  title: ReactNode;
  /** Uppercase English subtitle (中英双标签). */
  en?: ReactNode;
  /** Right-aligned header slot (badge, provenance tag, action). */
  right?: ReactNode;
  /** Header icon colour (default honey). */
  accent?: string;
  children: ReactNode;
}

/**
 * Detail-workbench section card, ported verbatim from the prototype `Panel`
 * atom (`detail.jsx`). Flat-icon header (distinct from the honey-square
 * `Module`), an English subtitle, and a right-aligned header slot.
 */
export function Panel({ icon, title, en, right, accent, children }: PanelProps) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {icon && <Icon name={icon} size={15} color={accent || "var(--accent-strong)"} />}
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
          {title}
        </span>
        {en && (
          <span
            style={{
              fontSize: "var(--text-2xs)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-caps)",
              color: "var(--text-subtle)",
            }}
          >
            {en}
          </span>
        )}
        {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}
