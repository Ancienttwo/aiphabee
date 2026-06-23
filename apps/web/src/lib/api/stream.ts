import type { AgentProgressStreamEvent } from "./types";
import { API_BASE_URL } from "./config";

export interface AgentStreamResult {
  runId: string | null;
  events: AgentProgressStreamEvent[];
}

export interface AgentStreamOptions {
  signal?: AbortSignal;
  onEvent?: (event: AgentProgressStreamEvent) => void;
}

/**
 * Posts a research prompt to `/agent/runs/stream` and parses the
 * `text/event-stream` frames into typed progress events.
 *
 * The worker currently emits the whole stream in one body, but this reader
 * consumes it chunk-by-chunk so it keeps working if the transport becomes
 * truly incremental. Client-only: never call from an SSR loader (it relies on
 * the browser fetch streaming body).
 */
export async function streamAgentRun(
  body: Record<string, unknown>,
  options: AgentStreamOptions = {},
): Promise<AgentStreamResult> {
  const response = await fetch(`${API_BASE_URL}/agent/runs/stream`, {
    method: "POST",
    signal: options.signal,
    headers: {
      "content-type": "application/json",
      "x-request-id": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  // A non-2xx (worker error envelope, proxy 502, etc.) carries no SSE frames;
  // surface it as a failure instead of resolving with an empty "done" stream.
  if (!response.ok) {
    throw new Error(`agent stream request failed with status ${response.status}`);
  }

  const runId = response.headers.get("x-aiphabee-run-id");
  const events: AgentProgressStreamEvent[] = [];
  const emit = (event: AgentProgressStreamEvent) => {
    events.push(event);
    options.onEvent?.(event);
  };

  if (!response.body) {
    for (const event of parseFrames(await response.text())) emit(event);
    return { runId, events };
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    // Frames are separated by a blank line ("\n\n").
    const segments = buffer.split("\n\n");
    buffer = segments.pop() ?? "";
    for (const segment of segments) {
      const event = parseFrame(segment);
      if (event) emit(event);
    }
  }
  const tail = parseFrame(buffer);
  if (tail) emit(tail);
  return { runId, events };
}

function parseFrames(text: string): AgentProgressStreamEvent[] {
  const out: AgentProgressStreamEvent[] = [];
  for (const segment of text.split("\n\n")) {
    const event = parseFrame(segment);
    if (event) out.push(event);
  }
  return out;
}

/** Extracts the JSON `data:` line from one SSE frame. */
function parseFrame(frame: string): AgentProgressStreamEvent | null {
  const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
  if (!dataLine) return null;
  const json = dataLine.slice("data:".length).trim();
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as AgentProgressStreamEvent;
    if (!parsed || typeof parsed.event !== "string" || !parsed.payload) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
