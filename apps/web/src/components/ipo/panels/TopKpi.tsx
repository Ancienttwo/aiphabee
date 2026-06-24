import type { ReactNode } from "react";
import { Eyebrow } from "../Eyebrow";
import { Mono } from "../Mono";

export interface TopKpiProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: string;
}

/** One cell of the persistent top-of-detail KPI bar (ported from `detail.jsx`). */
export function TopKpi({ label, value, sub, tone }: TopKpiProps) {
  return (
    <div style={{ minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ marginTop: 4 }}>
        <Mono size="var(--text-lg)" color={tone || "var(--text-primary)"}>
          {value}
        </Mono>
      </div>
      {sub && (
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
