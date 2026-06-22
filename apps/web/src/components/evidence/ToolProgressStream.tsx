import { Icon } from "../../ds";
import type { AgentProgressStreamEvent } from "../../lib/api";

/**
 * Tool-progress stream (PRD AGT-01). Shows the user *what the agent is doing*
 * ("looking up quotes", "reading filings") via each event's public label only —
 * the internal chain of thought and raw tool names are never exposed.
 */
const FRIENDLY: Record<string, string> = {
  "run.started": "开始研究",
  "run.completed": "研究完成",
  "tool.step.planned": "规划查询步骤",
  "tool.call.started": "正在调用数据工具",
  "tool.call.completed": "数据工具已返回",
  "tool.call.failed": "数据工具调用失败",
  "run.stopped": "研究已停止",
};

function labelFor(event: AgentProgressStreamEvent): string {
  return event.payload.public_label ?? FRIENDLY[event.event] ?? "处理中";
}

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
  if (events.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {streaming ? "正在准备研究…" : "暂无工具进度。"}
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
