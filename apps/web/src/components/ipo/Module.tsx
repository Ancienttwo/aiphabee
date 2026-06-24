import type { ReactNode } from "react";
import { Icon, type IconName } from "../../ds";

export interface ModuleProps {
  icon?: IconName;
  title: ReactNode;
  /** Uppercase English subtitle (中英双标签). */
  en?: ReactNode;
  /** Right-aligned header slot (badge, evidence chip, action). */
  right?: ReactNode;
  children: ReactNode;
  pad?: boolean;
  id?: string;
}

/**
 * Left-column workbench block: a titled card with an optional honey icon, an
 * English subtitle, and a right-aligned header slot. Ported from the prototype
 * `Module` atom.
 */
export function Module({ icon, title, en, right, children, pad = true, id }: ModuleProps) {
  return (
    <section
      id={id}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {icon && (
            <span
              style={{
                display: "inline-flex",
                width: 30,
                height: 30,
                borderRadius: "var(--radius-md)",
                background: "var(--surface-honey)",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={icon} size={16} color="var(--accent-strong)" />
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-base)",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            {en && (
              <div
                style={{
                  fontSize: "var(--text-2xs)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  color: "var(--text-subtle)",
                  marginTop: 2,
                }}
              >
                {en}
              </div>
            )}
          </div>
        </div>
        {right}
      </header>
      <div style={{ padding: pad ? "18px 20px" : 0 }}>{children}</div>
    </section>
  );
}
