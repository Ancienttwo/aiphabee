import { demandColor } from "../../lib/format";
import { fmtNum } from "../../lib/num";
import { Mono } from "./Mono";

export interface SubPillProps {
  /** Subscription multiple; `null` renders an em-dash. */
  x: number | null;
  suffix?: string;
  label?: string;
}

/**
 * Subscription-multiple pill coloured by demand intensity. Uses the locale-free
 * `fmtNum` (not `toLocaleString`) to avoid SSR hydration drift.
 */
export function SubPill({ x, suffix = "×", label }: SubPillProps) {
  if (x == null) {
    return (
      <span
        style={{
          color: "var(--text-subtle)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
        }}
      >
        —
      </span>
    );
  }
  const tone = demandColor(x);
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
      <Mono color={tone} weight={700}>
        {fmtNum(x, Number.isInteger(x) ? 0 : 1)}
        {suffix}
      </Mono>
      {label && (
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>{label}</span>
      )}
    </span>
  );
}
