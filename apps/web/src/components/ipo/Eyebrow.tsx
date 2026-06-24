import type { CSSProperties, ReactNode } from "react";

export interface EyebrowProps {
  children: ReactNode;
  style?: CSSProperties;
}

/** Small uppercase section eyebrow label. */
export function Eyebrow({ children, style }: EyebrowProps) {
  return (
    <div
      style={{
        fontSize: "var(--text-2xs)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-caps)",
        color: "var(--text-subtle)",
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
