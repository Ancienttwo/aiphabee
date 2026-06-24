import { Icon, type IconName } from "../../ds";
import { IPOS, STAGES } from "../../data/ipos.fixtures";
import type { IpoStage } from "../../lib/api/ipo-types";
import { Eyebrow } from "./Eyebrow";
import { Mono } from "./Mono";

export type StageFilter = IpoStage | "all";

const TONE_COLOR: Record<string, string> = {
  honey: "var(--honey-600)",
  bullish: "var(--green-600)",
  info: "var(--blue-500)",
  bearish: "var(--red-500)",
  neutral: "var(--neutral-500)",
};

export interface StageRailProps {
  active: StageFilter;
  setActive: (s: StageFilter) => void;
}

/** IPO lifecycle lanes with per-stage counts (the pipeline kanban header). */
export function StageRail({ active, setActive }: StageRailProps) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => setActive("all")}
        style={{
          cursor: "pointer",
          padding: "14px 18px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid " + (active === "all" ? "var(--honey-500)" : "var(--border-subtle)"),
          background: active === "all" ? "var(--ink-800)" : "var(--surface-card)",
          minWidth: 120,
          textAlign: "left",
        }}
      >
        <Eyebrow style={{ color: active === "all" ? "rgba(255,255,255,0.6)" : undefined }}>
          All Pipeline
        </Eyebrow>
        <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 6 }}>
          <Mono
            size="var(--text-2xl)"
            weight={800}
            color={active === "all" ? "#fff" : "var(--text-primary)"}
          >
            {IPOS.length}
          </Mono>
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: active === "all" ? "rgba(255,255,255,0.6)" : "var(--text-subtle)",
            }}
          >
            个标的
          </span>
        </div>
      </button>
      {STAGES.map((s) => {
        const on = active === s.key;
        const count = IPOS.filter((i) => i.stage === s.key).length;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(on ? "all" : (s.key as IpoStage))}
            style={{
              flex: 1,
              minWidth: 144,
              textAlign: "left",
              cursor: "pointer",
              padding: "14px 16px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid " + (on ? "var(--honey-500)" : "var(--border-subtle)"),
              background: on ? "var(--surface-honey)" : "var(--surface-card)",
              boxShadow: on ? "var(--shadow-sm)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Icon name={s.icon as IconName} size={15} color={TONE_COLOR[s.tone]} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                {s.label}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <Eyebrow>{s.en}</Eyebrow>
              <Mono
                size="var(--text-2xl)"
                weight={800}
                color={on ? "var(--honey-700)" : "var(--text-primary)"}
              >
                {count}
              </Mono>
            </div>
          </button>
        );
      })}
    </div>
  );
}
