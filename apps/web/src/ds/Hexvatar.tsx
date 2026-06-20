import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

/**
 * AiphaBee Hexvatar — the signature honeycomb-hexagon container for
 * avatars and icon chips. Layers a hex "border" behind a hex "fill"
 * (clip-path can't stroke), then centers an image or icon on top.
 */

export type HexvatarTone =
  | "honey"
  | "navy"
  | "green"
  | "violet"
  | "red"
  | "neutral";

export interface HexvatarProps extends HTMLAttributes<HTMLDivElement> {
  imgSrc?: string;
  alt?: string;
  icon?: ReactNode;
  size?: number;
  tone?: HexvatarTone;
  variant?: "fill" | "soft" | "outline";
  clip?: boolean;
}

const TONE: Record<
  HexvatarTone,
  { solid: string; soft: string; line: string; on: string }
> = {
  honey: { solid: "var(--honey-500)", soft: "var(--honey-100)", line: "var(--honey-500)", on: "var(--ink-800)" },
  navy: { solid: "var(--ink-800)", soft: "var(--neutral-100)", line: "var(--ink-800)", on: "var(--honey-400)" },
  green: { solid: "var(--green-500)", soft: "var(--green-50)", line: "var(--green-500)", on: "#fff" },
  violet: { solid: "var(--violet-500)", soft: "var(--violet-50)", line: "var(--violet-500)", on: "#fff" },
  red: { solid: "var(--red-500)", soft: "var(--red-50)", line: "var(--red-500)", on: "#fff" },
  neutral: { solid: "var(--neutral-200)", soft: "var(--neutral-100)", line: "var(--neutral-300)", on: "var(--ink-800)" },
};
const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function Hexvatar({
  imgSrc,
  alt = "",
  icon,
  size = 56,
  tone = "honey",
  variant = "soft",
  clip = false,
  children,
  style = {},
  ...rest
}: HexvatarProps) {
  const t = TONE[tone] ?? TONE.honey;
  const border = Math.max(2, Math.round(size * 0.045));

  let fill: string;
  let lineColor: string;
  let content: string;
  if (variant === "fill") {
    fill = t.solid;
    lineColor = t.solid;
    content = t.on;
  } else if (variant === "outline") {
    fill = "var(--surface-card)";
    lineColor = t.line;
    content = t.line;
  } else {
    fill = t.soft;
    lineColor = t.line;
    content = t.on === "#fff" ? t.solid : t.on;
  }

  const media: ReactNode = imgSrc ? (
    <img
      src={imgSrc}
      alt={alt}
      style={{
        width: clip ? "100%" : "74%",
        height: clip ? "100%" : "74%",
        objectFit: clip ? "cover" : "contain",
        clipPath: clip ? HEX : "none",
      }}
    />
  ) : icon ? (
    <span style={{ display: "inline-flex", color: content }}>{icon}</span>
  ) : (
    children
  );

  const wrap: CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    flexShrink: 0,
    ...style,
  };

  return (
    <div style={wrap} {...rest}>
      <div style={{ position: "absolute", inset: 0, background: lineColor, clipPath: HEX }} />
      <div
        style={{
          position: "absolute",
          inset: border,
          background: fill,
          clipPath: HEX,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {media}
      </div>
    </div>
  );
}
