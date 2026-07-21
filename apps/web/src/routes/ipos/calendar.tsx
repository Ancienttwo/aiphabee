import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Icon, MascotState, type IconName } from "../../ds";
import { getIpoCalendarMock } from "../../lib/api/ipo-mock";
import type { IpoCalendarEvent } from "../../lib/api/ipo-types";
import { Eyebrow, Mono } from "../../components/ipo";
import { MASCOT_BP, SHELL } from "../../lib/ui";
import { useIpoLocale, type IpoMessageKey } from "../../components/ipo/i18n";

export const Route = createFileRoute("/ipos/calendar")({
  component: CalendarView,
});

interface EventCfg {
  label: IpoMessageKey;
  icon: IconName;
  tone: string;
}

/** Milestone type → label / icon / tone. Covers every `timetable.type` value. */
const EVENT_CFG: Record<string, EventCfg> = {
  open: { label: "eventOpen", icon: "play", tone: "honey" },
  close: { label: "eventClose", icon: "flag", tone: "honey" },
  price: { label: "eventPrice", icon: "tag", tone: "info" },
  allot: { label: "eventAllot", icon: "check-check", tone: "bullish" },
  grey: { label: "eventGrey", icon: "activity", tone: "info" },
  list: { label: "eventList", icon: "rocket", tone: "bullish" },
  file: { label: "eventFile", icon: "file-text", tone: "neutral" },
  hearing: { label: "eventHearing", icon: "gavel", tone: "neutral" },
  roadshow: { label: "eventRoadshow", icon: "presentation", tone: "neutral" },
  ref: { label: "eventRef", icon: "tag", tone: "info" },
  withdraw: { label: "eventWithdraw", icon: "x-circle", tone: "bearish" },
};

const TONE_COLOR: Record<string, string> = {
  honey: "var(--honey-600)",
  info: "var(--blue-500)",
  bullish: "var(--green-600)",
  bearish: "var(--red-500)",
  neutral: "var(--neutral-500)",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ParsedAt {
  key: string;
  sort: number;
  day: string;
  mon: string;
  time: string | null;
}

/** "Jun 18 09:00" → { key:'Jun 18', sort: 618, day:'18', mon:'Jun', time:'09:00' }. */
function parseAt(at: string): ParsedAt | null {
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/.exec(at);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[1]);
  return {
    key: `${m[1]} ${m[2]}`,
    sort: (mi + 1) * 100 + parseInt(m[2]),
    day: m[2],
    mon: m[1],
    time: m[3] || null,
  };
}

interface DatedEvent {
  e: IpoCalendarEvent;
  d: ParsedAt;
}

function CalendarView() {
  const navigate = useNavigate();
  const { t } = useIpoLocale();
  const [filter, setFilter] = useState("all");

  const res = getIpoCalendarMock();
  const events = res.ok ? res.data.events : [];

  const all: DatedEvent[] = [];
  for (const e of events) {
    const d = parseAt(e.at);
    if (d) all.push({ e, d });
  }
  const shown = all.filter((x) => filter === "all" || x.e.type === filter);

  const groups: Record<string, { sort: number; items: DatedEvent[] }> = {};
  for (const x of shown) {
    (groups[x.d.key] ??= { sort: x.d.sort, items: [] }).items.push(x);
  }
  const orderedKeys = Object.keys(groups).sort((a, b) => groups[a].sort - groups[b].sort);
  const types = ["all", ...Array.from(new Set(all.map((x) => x.e.type)))];

  return (
    <main style={{ ...SHELL, padding: "32px var(--content-gutter) 80px" }}>
      <Eyebrow style={{ marginBottom: 8 }}>{t("calendarEyebrow")}</Eyebrow>
      <h1
        style={{
          margin: "0 0 8px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-4xl)",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "var(--tracking-tight)",
        }}
      >
        {t("calendarTitle")}
      </h1>
      <p style={{ margin: "0 0 22px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        {t("calendarDescription")}{" "}
        <Mono size="var(--text-xs)" color="var(--text-body)">
          ipo_timetable_event
        </Mono>
        。
      </p>

      {/* type filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }}>
        {types.map((ty) => {
          const on = filter === ty;
          const cfg = ty === "all" ? null : EVENT_CFG[ty];
          return (
            <button
              key={ty}
              type="button"
              onClick={() => setFilter(ty)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: "var(--radius-pill)",
                cursor: "pointer",
                border: "1px solid " + (on ? "var(--honey-500)" : "var(--border-default)"),
                background: on ? "var(--honey-500)" : "var(--surface-card)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: on ? "var(--ink-800)" : "var(--text-body)",
              }}
            >
              {cfg && (
                <Icon name={cfg.icon} size={13} color={on ? "var(--ink-800)" : TONE_COLOR[cfg.tone]} />
              )}
              {ty === "all" ? t("allMilestones") : cfg ? t(cfg.label) : ty}
            </button>
          );
        })}
      </div>

      {/* agenda */}
      {orderedKeys.length === 0 ? (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <MascotState
            basePath={MASCOT_BP}
            pose="empty"
            title={t("calendarEmptyTitle")}
            description={t("calendarEmptyDescription")}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orderedKeys.map((key) => {
            const g = groups[key];
            const [mon, day] = key.split(" ");
            return (
              <div key={key} style={{ display: "grid", gridTemplateColumns: "88px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
                {/* date rail */}
                <div
                  style={{
                    position: "sticky",
                    top: 24,
                    textAlign: "center",
                    padding: "12px 0",
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-2xs)",
                      textTransform: "uppercase",
                      letterSpacing: "var(--tracking-caps)",
                      color: "var(--accent-strong)",
                      fontWeight: 700,
                    }}
                  >
                    {mon}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-3xl)",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      lineHeight: 1.1,
                    }}
                  >
                    {day}
                  </div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                    {g.items.length} {t("eventCount")}
                  </div>
                </div>
                {/* events */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {g.items
                    .slice()
                    .sort((a, b) => (a.d.time || "").localeCompare(b.d.time || ""))
                    .map((x, i) => {
                      const cfg = EVENT_CFG[x.e.type] ?? EVENT_CFG.file;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => navigate({ to: "/ipos/$ipoId", params: { ipoId: x.e.ipoId } })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            width: "100%",
                            textAlign: "left",
                            cursor: "pointer",
                            padding: "14px 18px",
                            background: "var(--surface-card)",
                            border: "1px solid var(--border-subtle)",
                            borderLeft: "3px solid " + TONE_COLOR[cfg.tone],
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              width: 36,
                              height: 36,
                              borderRadius: "var(--radius-md)",
                              background: "var(--surface-muted)",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon name={cfg.icon} size={17} color={TONE_COLOR[cfg.tone]} />
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                                {t(cfg.label)}
                              </span>
                            </div>
                            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: 2 }}>
                              {x.e.name} <span style={{ color: "var(--text-subtle)" }}>{x.e.cn}</span> ·{" "}
                              <Mono size="var(--text-xs)" color="var(--text-body)">
                                {x.e.ticker}
                              </Mono>
                            </div>
                          </div>
                          {x.d.time && (
                            <Mono size="var(--text-sm)" color="var(--text-body)">
                              {x.d.time}
                            </Mono>
                          )}
                          <Icon name="chevron-right" size={16} style={{ color: "var(--text-subtle)" }} />
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
