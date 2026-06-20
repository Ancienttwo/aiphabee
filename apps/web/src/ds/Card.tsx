import { useState } from "react";
import type { HTMLAttributes } from "react";

/**
 * AiphaBee Card — white surface, 12px radius, hairline border, soft
 * navy-tinted shadow. Sub-parts mirror the ShadCN-style card.
 * `interactive` adds a hover lift + honey border for clickable cards.
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

export function Card({
  interactive = false,
  padded = false,
  children,
  style = {},
  ...rest
}: CardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm)",
        borderColor: hover ? "var(--honey-300)" : "var(--border-subtle)",
        transition:
          "box-shadow var(--duration-base) var(--ease-standard), border-color var(--duration-base) var(--ease-standard)",
        overflow: "hidden",
        ...(padded ? { padding: "var(--space-6)" } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  style = {},
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ padding: "var(--space-6) var(--space-6) var(--space-4)", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  style = {},
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontSize: "var(--text-lg)",
        fontWeight: 600,
        color: "var(--text-primary)",
        letterSpacing: "var(--tracking-tight)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  style = {},
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      style={{
        margin: "4px 0 0",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm)",
        color: "var(--text-muted)",
        lineHeight: "var(--leading-normal)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  style = {},
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ padding: "0 var(--space-6) var(--space-6)", ...style }} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  style = {},
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-4) var(--space-6)",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--surface-sunken)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
