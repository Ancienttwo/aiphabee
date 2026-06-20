export const OBSERVABILITY_EVENT_VERSION = "2026-06-20.phase0.observability.v0";

export type TelemetryEventType = "run.audit" | "run.eval";
export type TelemetryOutcome = "success" | "rejected" | "error";

export interface TelemetryEventBase {
  attributes: Record<string, boolean | number | string>;
  emitted_at: string;
  environment: string;
  event_id: string;
  event_type: TelemetryEventType;
  event_version: typeof OBSERVABILITY_EVENT_VERSION;
  outcome: TelemetryOutcome;
  request_id: string;
  route: string;
  run_id: string;
  service: "aiphabee-worker";
}

export interface AuditTelemetryEvent extends TelemetryEventBase {
  audit: {
    credits: number;
    data_version: string;
    denied_tools: string[];
    methodology_version: string;
    model_calls: boolean;
    model_provider: "not_configured";
    requested_tools: string[];
  };
  event_type: "run.audit";
}

export interface EvalTelemetryEvent extends TelemetryEventBase {
  eval: {
    checks: Array<{
      name: string;
      status: "pass" | "fail" | "not_applicable";
    }>;
    evidence_binding: "not_applicable" | "pending" | "pass" | "fail";
    result: "pass" | "fail" | "not_applicable";
  };
  event_type: "run.eval";
}

export type TelemetryEvent = AuditTelemetryEvent | EvalTelemetryEvent;

export interface AgentDryRunTelemetryInput {
  deniedTools?: string[];
  environment: string;
  maxSteps: number;
  outcome: TelemetryOutcome;
  requestId: string;
  requestedTools: string[];
  route: string;
  runId: string;
}

export interface TelemetrySink {
  record(event: TelemetryEvent): Promise<void> | void;
}

export interface TelemetryLogger {
  info(message: string): void;
}

export function createAgentDryRunTelemetry(
  input: AgentDryRunTelemetryInput
): [AuditTelemetryEvent, EvalTelemetryEvent] {
  const now = new Date().toISOString();
  const deniedTools = input.deniedTools ?? [];
  const base: Omit<TelemetryEventBase, "event_id" | "event_type"> = {
    attributes: {
      "ai.model_provider_configured": false,
      "agent.max_steps": input.maxSteps,
      "agent.model_calls": false,
      "agent.requested_tool_count": input.requestedTools.length,
      "agent.tool_denied_count": deniedTools.length
    },
    emitted_at: now,
    environment: input.environment,
    event_version: OBSERVABILITY_EVENT_VERSION,
    outcome: input.outcome,
    request_id: input.requestId,
    route: input.route,
    run_id: input.runId,
    service: "aiphabee-worker" as const
  };

  return [
    {
      ...base,
      audit: {
        credits: 0,
        data_version: "agent-runtime-scaffold-v0",
        denied_tools: deniedTools,
        methodology_version: "agent-runtime-scaffold-v0",
        model_calls: false,
        model_provider: "not_configured",
        requested_tools: input.requestedTools
      },
      event_id: createTelemetryEventId(input.requestId, "run.audit"),
      event_type: "run.audit"
    },
    {
      ...base,
      eval: {
        checks: [
          {
            name: "registered_tool_allowlist",
            status: deniedTools.length === 0 ? "pass" : "fail"
          },
          {
            name: "model_call_blocked",
            status: "pass"
          },
          {
            name: "evidence_binding",
            status: "not_applicable"
          }
        ],
        evidence_binding: "not_applicable",
        result: input.outcome === "success" ? "pass" : "fail"
      },
      event_id: createTelemetryEventId(input.requestId, "run.eval"),
      event_type: "run.eval"
    }
  ];
}

export async function recordTelemetryEvents(
  sink: TelemetrySink,
  events: TelemetryEvent[]
): Promise<void> {
  for (const event of events) {
    await sink.record(event);
  }
}

export function createConsoleTelemetrySink(logger: TelemetryLogger): TelemetrySink {
  return {
    record(event) {
      logger.info(JSON.stringify(event));
    }
  };
}

export function createInMemoryTelemetrySink() {
  const events: TelemetryEvent[] = [];

  return {
    events,
    sink: {
      record(event: TelemetryEvent) {
        events.push(event);
      }
    } satisfies TelemetrySink
  };
}

export function createTelemetryEventId(
  requestId: string,
  eventType: TelemetryEventType
): string {
  return `${requestId}:${eventType}`;
}
