import { Icon } from "../../ds";
import type { AgentProgressStreamEvent } from "../../lib/api";
import { useLocale, type MessageKey } from "../../i18n/locale";

/**
 * Tool-progress stream (PRD AGT-01). Shows the user *what the agent is doing*
 * ("looking up quotes", "reading filings") via each event's public label only —
 * the internal chain of thought and raw tool names are never exposed.
 */
const FRIENDLY: Record<string, MessageKey> = {
  "run.started": "streamRunStarted",
  "run.completed": "streamRunCompleted",
  "tool.step.planned": "streamStepPlanned",
  "tool.call.started": "streamToolStarted",
  "tool.call.completed": "streamToolCompleted",
  "tool.call.failed": "streamToolFailed",
  "run.stopped": "streamRunStopped",
};

function StatusGlyph({ status }: { status: AgentProgressStreamEvent["payload"]["status"] }) {
  if (status === "completed") {
    return <Icon name="check" size={14} color="var(--green-600)" />;
  }
  if (status === "stopped") {
    return <Icon name="x" size={14} color="var(--red-500)" />;
  }
  // planned / started -> small honey dot
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: status === "started" ? "var(--honey-500)" : "var(--neutral-300)",
      }}
    />
  );
}

export function ToolProgressStream({
  events,
  streaming = false,
}: {
  events: AgentProgressStreamEvent[];
  streaming?: boolean;
}) {
  const { t } = useLocale();
  const labelFor = (event: AgentProgressStreamEvent) =>
    event.payload.public_label ?? (FRIENDLY[event.event] ? t(FRIENDLY[event.event]) : t("processing"));
  if (events.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {streaming ? t("preparingResearch") : t("noToolProgress")}
      </p>
    );
  }
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
      {events.map((event, index) => (
        <li
          key={`${event.event}-${event.event_index ?? index}`}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              flexShrink: 0,
            }}
          >
            <StatusGlyph status={event.payload.status} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              color: "var(--text-body)",
            }}
          >
            {labelFor(event)}
          </span>
        </li>
      ))}
    </ol>
  );
}
