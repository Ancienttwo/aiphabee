import type { HTMLAttributes, ReactNode } from "react";

/**
 * AiphaBee StatCard — the dashboard quick-stat tile. Big tabular number,
 * caption, an icon chip tinted by `tone`, and an optional delta.
 */

export type StatCardTone = "honey" | "navy" | "green" | "violet" | "blue" | "red";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatCardTone;
  delta?: ReactNode;
  deltaDirection?: "up" | "down" | "flat";
}

const TONE_BG: Record<StatCardTone, string> = {
  honey: "var(--honey-50)",
  navy: "var(--neutral-100)",
  green: "var(--green-50)",
  violet: "var(--violet-50)",
  blue: "var(--blue-50)",
  red: "var(--red-50)",
};
const TONE_FG: Record<StatCardTone, string> = {
  honey: "var(--honey-700)",
  navy: "var(--ink-800)",
  green: "var(--green-600)",
  violet: "var(--violet-600)",
  blue: "var(--blue-500)",
  red: "var(--red-500)",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "honey",
  delta,
  deltaDirection = "up",
  style = {},
  ...rest
}: StatCardProps) {
  const deltaColor =
    deltaDirection === "up"
      ? "var(--green-600)"
      : deltaDirection === "down"
        ? "var(--red-500)"
        : "var(--text-muted)";

  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "var(--space-5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        ...style,
      }}
      {...rest}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--text-muted)",
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-4xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "var(--tracking-tight)",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {delta != null ? (
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: deltaColor,
            }}
          >
            {deltaDirection === "up" ? "▲" : deltaDirection === "down" ? "▼" : ""}{" "}
            {delta}
          </p>
        ) : null}
      </div>

      {icon ? (
        <div
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: "var(--radius-md)",
            background: TONE_BG[tone] ?? TONE_BG.honey,
            color: TONE_FG[tone] ?? TONE_FG.honey,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      ) : null}
    </div>
  );
}
