import { useEffect, useState } from "react";
import { streamAgentRun, type AgentProgressStreamEvent } from "./api";

export type StreamStatus = "idle" | "streaming" | "done" | "error";

export interface UseAgentStream {
  events: AgentProgressStreamEvent[];
  status: StreamStatus;
  runId: string | null;
}

export function agentStreamExecutionKey({
  executionId,
  prompt,
}: {
  executionId: string;
  locale: string;
  prompt: string | undefined;
}): string | null {
  return prompt ? JSON.stringify([executionId, prompt]) : null;
}

/**
 * Drives `/agent/runs/stream` for a prompt. Client-only (runs inside an
 * effect), so it never executes during SSR. Re-runs whenever the prompt
 * changes; aborts the in-flight request on unmount or prompt change.
 */
export function useAgentStream(
  prompt: string | undefined,
  locale: string,
  executionId: string,
): UseAgentStream {
  const [events, setEvents] = useState<AgentProgressStreamEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const executionKey = agentStreamExecutionKey({ executionId, locale, prompt });

  useEffect(() => {
    if (!prompt) {
      setStatus("idle");
      setEvents([]);
      setRunId(null);
      return;
    }
    let active = true;
    const controller = new AbortController();
    setEvents([]);
    setRunId(null);
    setStatus("streaming");

    streamAgentRun(
      { locale, prompt },
      {
        signal: controller.signal,
        onEvent: (event) => {
          if (active) setEvents((prev) => [...prev, event]);
        },
      },
    )
      .then((result) => {
        if (!active) return;
        setRunId(result.runId);
        setStatus("done");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
      controller.abort();
    };
    // Locale is intentionally excluded: changing presentation language must
    // not abort and re-execute an Agent run with a new backend identity.
  }, [executionKey]);

  return { events, status, runId };
}
