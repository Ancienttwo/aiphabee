import type { CSSProperties, ReactNode } from "react";

export interface MonoProps {
  children: ReactNode;
  size?: string;
  color?: string;
  weight?: number;
}

/** Tabular mono numeric — locale-stable, aligned digits for stat values. */
export function Mono({
  children,
  size = "var(--text-sm)",
  color = "var(--text-primary)",
  weight = 700,
}: MonoProps) {
  const style: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: size,
    fontWeight: weight,
    color,
    fontVariantNumeric: "tabular-nums",
  };
  return <span style={style}>{children}</span>;
}
