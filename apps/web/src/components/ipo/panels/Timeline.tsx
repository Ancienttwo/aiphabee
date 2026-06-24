import { Badge } from "../../../ds";
import type { IpoTimetableEvent } from "../../../lib/api/ipo-types";

/** Vertical timetable timeline (vendor fact), ported from `detail-parts.jsx`. */
export function Timeline({ events }: { events: IpoTimetableEvent[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: 4 }}>
      {events.map((e, i) => {
        const last = i === events.length - 1;
        const color = e.danger
          ? "var(--red-500)"
          : e.done
            ? "var(--green-500)"
            : e.active
              ? "var(--honey-500)"
              : "var(--neutral-300)";
        return (
          <div
            key={i}
            style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 14, position: "relative" }}
          >
            {/* node + line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: e.active ? 4 : "50%",
                  flexShrink: 0,
                  background: e.done || e.active || e.danger ? color : "var(--surface-card)",
                  border: "2px solid " + color,
                  marginTop: 2,
                  boxShadow: e.active ? "var(--ring-glow)" : "none",
                  transform: e.active ? "rotate(45deg)" : "none",
                }}
              />
              {!last && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 26,
                    background: e.done ? "var(--green-500)" : "var(--border-subtle)",
                    marginTop: 2,
                    marginBottom: 2,
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: last ? 0 : 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    lineHeight: 1.35,
                    fontWeight: e.active ? 700 : 600,
                    color: e.danger
                      ? "var(--red-600)"
                      : e.done || e.active
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {e.title}
                </span>
                {e.active && (
                  <Badge tone="honey" size="sm">
                    进行中 Now
                  </Badge>
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: e.done || e.active ? "var(--text-body)" : "var(--text-subtle)",
                  marginTop: 2,
                }}
              >
                {e.at}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
