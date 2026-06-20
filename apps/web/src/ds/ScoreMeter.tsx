import type { HTMLAttributes, ReactNode } from "react";

/**
 * AiphaBee ScoreMeter — the signature 0–100 signal gauge for market
 * sentiment & analysis scores. Big number, a filled track coloured by
 * `tone`, and optional end labels.
 */

export type ScoreMeterTone =
  | "bullish"
  | "cautious"
  | "neutral"
  | "bearish"
  | "honey"
  | "ai";

export interface ScoreMeterProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: ReactNode;
  tone?: ScoreMeterTone;
  labels?: string[];
  showValue?: boolean;
}

const TONE_COLOR: Record<ScoreMeterTone, string> = {
  bullish: "var(--sentiment-bullish)",
  cautious: "var(--sentiment-cautious)",
  neutral: "var(--sentiment-neutral)",
  bearish: "var(--sentiment-bearish)",
  honey: "var(--honey-500)",
  ai: "var(--violet-500)",
};

export function ScoreMeter({
  value = 0,
  max = 100,
  label,
  tone = "honey",
  labels,
  showValue = true,
  style = {},
  ...rest
}: ScoreMeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = TONE_COLOR[tone] ?? TONE_COLOR.honey;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, ...style }} {...rest}>
      {label || showValue ? (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          {label ? (
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              {label}
            </span>
          ) : (
            <span />
          )}
          {showValue ? (
            <span style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: 700,
                  color,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {value}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
                / {max}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          width: "100%",
          height: 8,
          borderRadius: "var(--radius-pill)",
          background: "var(--surface-muted)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "var(--radius-pill)",
            background: color,
            transition: "width var(--duration-slow) var(--ease-out)",
          }}
        />
      </div>

      {labels && labels.length ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-2xs)",
            color: "var(--text-subtle)",
          }}
        >
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
