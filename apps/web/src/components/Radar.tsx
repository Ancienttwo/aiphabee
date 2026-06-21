import type { TierDimension } from "../data/ipos";

/**
 * 6-dimension tier-analysis radar chart (SVG). Ported from the UI kit.
 * Pure geometry — SSR-safe.
 */

export interface RadarProps {
  dims: TierDimension[];
  size?: number;
  color?: string;
}

export function Radar({ dims, size = 260, color = "var(--chart-1)" }: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const n = dims.length;
  const pt = (i: number, rad: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPoly = (f: number) => dims.map((_, i) => pt(i, r * f).join(",")).join(" ");
  const dataPoly = dims.map((d, i) => pt(i, r * (d.score / 100)).join(",")).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", margin: "0 auto" }}
      role="img"
      aria-label="6-dimension tier analysis radar"
    >
      {rings.map((f, i) => (
        <polygon key={i} points={gridPoly(f)} fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
      ))}
      {dims.map((_, i) => {
        const [x, y] = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />;
      })}
      <polygon
        points={dataPoly}
        fill={color}
        fillOpacity="0.28"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {dims.map((d, i) => {
        const [x, y] = pt(i, r * (d.score / 100));
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
      })}
      {dims.map((d, i) => {
        const [x, y] = pt(i, r + 18);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-sans)"
            fontSize="11"
            fontWeight="600"
            fill="var(--text-muted)"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
