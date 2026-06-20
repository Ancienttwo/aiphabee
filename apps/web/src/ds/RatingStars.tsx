import type { HTMLAttributes } from "react";

/**
 * AiphaBee RatingStars — institution / quality rating on a 5-star scale.
 * Honey-filled stars with fractional support, optional numeric value.
 */

export interface RatingStarsProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  reviews?: number;
  color?: string;
  emptyColor?: string;
}

export function RatingStars({
  value = 0,
  count = 5,
  size = 16,
  showValue = false,
  reviews,
  color = "var(--honey-500)",
  emptyColor = "var(--neutral-300)",
  style = {},
  ...rest
}: RatingStarsProps) {
  const pct = Math.max(0, Math.min(100, (value / count) * 100));
  const stars = "★".repeat(count);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...style }} {...rest}>
      <div style={{ position: "relative", display: "inline-block", lineHeight: 1 }}>
        <span style={{ fontSize: size, letterSpacing: 2, color: emptyColor, fontFamily: "var(--font-sans)" }}>
          {stars}
        </span>
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${pct}%`,
            overflow: "hidden",
            whiteSpace: "nowrap",
            fontSize: size,
            letterSpacing: 2,
            color,
            fontFamily: "var(--font-sans)",
          }}
        >
          {stars}
        </span>
      </div>
      {showValue ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {value.toFixed(1)}
        </span>
      ) : null}
      {reviews != null ? (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          ({reviews})
        </span>
      ) : null}
    </div>
  );
}
