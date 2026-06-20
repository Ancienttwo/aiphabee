import { describe, expect, it } from "vitest";
import {
  createAgentDryRunTelemetry,
  createInMemoryTelemetrySink,
  createTelemetryEventId,
  recordTelemetryEvents
} from "./index";

describe("observability scaffold", () => {
  it("creates audit and eval events without prompt content", () => {
    const events = createAgentDryRunTelemetry({
      environment: "test",
      maxSteps: 4,
      outcome: "success",
      requestId: "req-obs-1",
      requestedTools: ["resolve_security"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-1"
    });

    expect(events).toHaveLength(2);
    expect(events[0]?.event_type).toBe("run.audit");
    expect(events[1]?.event_type).toBe("run.eval");
    expect(JSON.stringify(events)).not.toContain("Explain 00700.HK");
    expect(events[0]?.attributes["agent.max_steps"]).toBe(4);
  });

  it("marks eval failure when a tool is denied", () => {
    const [, evalEvent] = createAgentDryRunTelemetry({
      deniedTools: ["sql.query"],
      environment: "test",
      maxSteps: 6,
      outcome: "rejected",
      requestId: "req-obs-2",
      requestedTools: ["sql.query"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-2"
    });

    expect(evalEvent.eval.result).toBe("fail");
    expect(evalEvent.eval.checks[0]).toMatchObject({
      name: "registered_tool_allowlist",
      status: "fail"
    });
  });

  it("records events into an in-memory sink", async () => {
    const { events, sink } = createInMemoryTelemetrySink();
    const telemetry = createAgentDryRunTelemetry({
      environment: "test",
      maxSteps: 6,
      outcome: "success",
      requestId: "req-obs-3",
      requestedTools: ["resolve_security"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-3"
    });

    await recordTelemetryEvents(sink, telemetry);

    expect(events).toHaveLength(2);
    expect(events[0]?.event_id).toBe("req-obs-3:run.audit");
  });

  it("creates stable event ids", () => {
    expect(createTelemetryEventId("req-obs-4", "run.eval")).toBe(
      "req-obs-4:run.eval"
    );
  });
});
