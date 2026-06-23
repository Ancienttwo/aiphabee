import type { ReactNode } from "react";

/**
 * Small metric tile: a label, a prominent value, and an optional sub line.
 * Used in workbench grids and result cards.
 */
export interface MetricProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "up" | "down";
}

const VALUE_COLOR: Record<NonNullable<MetricProps["tone"]>, string> = {
  default: "var(--text-primary)",
  up: "var(--green-600)",
  down: "var(--red-600)",
};

export function Metric({ label, value, sub, tone = "default" }: MetricProps) {
  return (
    <div
      style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-sunken)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: 600,
          letterSpacing: "var(--tracking-wide)",
          color: "var(--text-muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          fontWeight: 700,
          color: VALUE_COLOR[tone],
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ marginTop: 2, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}
