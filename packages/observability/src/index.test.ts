import { describe, expect, it } from "vitest";
import {
  createAgentDryRunTelemetry,
  createEvalStoreRecord,
  createEvalStoreTelemetrySink,
  createInMemoryEvalStore,
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

  it("projects run.eval events into eval store records", () => {
    const [, evalEvent] = createAgentDryRunTelemetry({
      environment: "test",
      maxSteps: 6,
      outcome: "success",
      requestId: "req-obs-4",
      requestedTools: ["resolve_security"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-4"
    });
    const record = createEvalStoreRecord(evalEvent);

    expect(record.schema_version).toBe("2026-06-20.phase0.eval-store.v0");
    expect(record.event_id).toBe("req-obs-4:run.eval");
    expect(record.check_count).toBe(3);
    expect(record.failed_check_count).toBe(0);
    expect(JSON.stringify(record)).not.toContain("Explain 00700.HK");
  });

  it("writes only run.eval events to the eval store sink", async () => {
    const { records, store } = createInMemoryEvalStore();
    const telemetry = createAgentDryRunTelemetry({
      deniedTools: ["sql.query"],
      environment: "test",
      maxSteps: 6,
      outcome: "rejected",
      requestId: "req-obs-5",
      requestedTools: ["sql.query"],
      route: "/agent/runs/dry-run",
      runId: "dry_req-obs-5"
    });

    await recordTelemetryEvents(createEvalStoreTelemetrySink(store), telemetry);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      event_id: "req-obs-5:run.eval",
      failed_check_count: 1,
      result: "fail"
    });
  });

  it("creates stable event ids", () => {
    expect(createTelemetryEventId("req-obs-6", "run.eval")).toBe(
      "req-obs-6:run.eval"
    );
  });
});
