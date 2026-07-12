import {
  FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION,
  type FastClawCompliantTransport,
  type FastClawTransportResult,
  type FastClawTransportToolCall
} from "@aiphabee/agent-runtime/fastclaw-agent-runner";

const CALLBACK_CONTRACT_HEADER = "X-AiphaBee-Tool-Callback-Contract";
const RUN_ID_HEADER = "X-AiphaBee-Run-Id";
const SANDBOX_AUTHORIZATION_HEADER = "X-AiphaBee-Sandbox-Authorization";
const VPS_SHARED_TOKEN_HEADER = "Authorization";
const MAX_STREAM_BYTES = 2 << 20;
const MAX_LINE_BYTES = 1 << 20;
const OPAQUE_ID = /^[A-Za-z0-9._:-]{1,200}$/u;

export interface FastClawServiceBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export function createFastClawVpsControlService(input: {
  base_url: string;
  fetch?: typeof fetch;
  shared_token: string;
}): FastClawServiceBinding {
  const baseUrl = validateBaseUrl(input.base_url);
  if (
    input.shared_token.length < 32 ||
    input.shared_token !== input.shared_token.trim()
  ) {
    throw new FastClawServiceTransportError("FASTCLAW_VPS_TOKEN_INVALID");
  }
  const fetchImpl = input.fetch ?? globalThis.fetch;
  return Object.freeze({
    async fetch(requestInput: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const request = new Request(requestInput, init);
      if (new URL(request.url).origin !== new URL(baseUrl).origin) {
        throw new FastClawServiceTransportError("FASTCLAW_VPS_ORIGIN_MISMATCH");
      }
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(VPS_SHARED_TOKEN_HEADER, `Bearer ${input.shared_token}`);
      return fetchImpl(new Request(request, { headers: requestHeaders }));
    }
  });
}

type FastClawCallbackEvent =
  | { run_id: string; type: "heartbeat" }
  | { run_id: string; type: "remote_accepted" }
  | { code: string; run_id: string; type: "error" }
  | { call: FastClawTransportToolCall; run_id: string; type: "tool_call" }
  | {
      raw_answer: string;
      run_id: string;
      type: "final";
      usage: { input_tokens: number; output_tokens: number; steps: number };
    };

export class FastClawServiceTransportError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "FastClawServiceTransportError";
    this.code = code;
  }
}

function validId(value: string): boolean {
  return OPAQUE_ID.test(value) && value !== "." && value !== "..";
}

function safeCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseEvent(line: string, expectedRunId: string): FastClawCallbackEvent {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_EVENT_INVALID");
  }
  if (typeof value !== "object" || value === null) {
    throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_EVENT_INVALID");
  }
  const event = value as Record<string, unknown>;
  if (event.run_id !== expectedRunId) {
    throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_RUN_MISMATCH");
  }
  if (event.type === "remote_accepted") {
    return { run_id: expectedRunId, type: "remote_accepted" };
  }
  if (event.type === "heartbeat") {
    return { run_id: expectedRunId, type: "heartbeat" };
  }
  if (event.type === "error") {
    if (event.code !== "AIPHABEE_TOOL_PROPOSAL_INVALID") {
      throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_EVENT_INVALID");
    }
    return { code: event.code, run_id: expectedRunId, type: "error" };
  }
  if (event.type === "tool_call") {
    const call = event.call;
    if (
      typeof call !== "object" ||
      call === null ||
      !validId(String((call as Record<string, unknown>).call_id ?? "")) ||
      !validId(String((call as Record<string, unknown>).name ?? "")) ||
      !("input" in call)
    ) {
      throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_TOOL_CALL_INVALID");
    }
    return {
      call: {
        call_id: String((call as Record<string, unknown>).call_id),
        input: (call as Record<string, unknown>).input,
        name: String((call as Record<string, unknown>).name)
      },
      run_id: expectedRunId,
      type: "tool_call"
    };
  }
  if (event.type === "final") {
    const usage = event.usage;
    if (
      typeof event.raw_answer !== "string" ||
      typeof usage !== "object" ||
      usage === null ||
      !safeCount((usage as Record<string, unknown>).input_tokens) ||
      !safeCount((usage as Record<string, unknown>).output_tokens) ||
      !safeCount((usage as Record<string, unknown>).steps)
    ) {
      throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_FINAL_INVALID");
    }
    return {
      raw_answer: event.raw_answer,
      run_id: expectedRunId,
      type: "final",
      usage: {
        input_tokens: (usage as Record<string, number>).input_tokens,
        output_tokens: (usage as Record<string, number>).output_tokens,
        steps: (usage as Record<string, number>).steps
      }
    };
  }
  throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_EVENT_INVALID");
}

function validateBaseUrl(value: string): string {
  const url = new URL(value);
  const loopback = url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "::1";
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
    url.search !== "" ||
    url.hash !== "" ||
    !url.pathname.endsWith("/")
  ) {
    throw new FastClawServiceTransportError("FASTCLAW_SERVICE_URL_INVALID");
  }
  return url.href.replace(/\/$/u, "");
}

function headers(input: {
  adminApiKey: string;
  authorization: string;
  fastclawUserId: string;
  runId: string;
}): Headers {
  const result = new Headers({
    Accept: "application/x-ndjson",
    Authorization: `Bearer ${input.adminApiKey}`,
    "Content-Type": "application/json",
    "X-AiphaBee-FastClaw-User-Id": input.fastclawUserId,
    [CALLBACK_CONTRACT_HEADER]: FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION,
    [RUN_ID_HEADER]: input.runId,
    [SANDBOX_AUTHORIZATION_HEADER]: input.authorization
  });
  return result;
}

async function postToolResult(input: {
  adminApiKey: string;
  authorization: string;
  baseUrl: string;
  call: FastClawTransportToolCall;
  fetch: FastClawServiceBinding["fetch"];
  fastclawUserId: string;
  output: unknown;
  runId: string;
  signal: AbortSignal;
}): Promise<void> {
  if (input.output === undefined) {
    throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_OUTPUT_INVALID");
  }
  let body: string;
  try {
    body = JSON.stringify({ output: input.output });
  } catch {
    throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_OUTPUT_INVALID");
  }
  if (body === undefined) {
    throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_OUTPUT_INVALID");
  }
  const url = `${input.baseUrl}/v1/chat/completions/${encodeURIComponent(input.runId)}/tool-results/${encodeURIComponent(input.call.call_id)}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await input.fetch(url, {
        body,
        headers: headers({
          adminApiKey: input.adminApiKey,
          authorization: input.authorization,
          fastclawUserId: input.fastclawUserId,
          runId: input.runId
        }),
        method: "POST",
        signal: input.signal
      });
      if (!response.ok) {
        const status = response.status;
        await response.body?.cancel().catch(() => undefined);
        throw new FastClawServiceTransportError(
          `FASTCLAW_CALLBACK_RESULT_REJECTED_${status}`
        );
      }
      const readbackText = await response.text();
      if (new TextEncoder().encode(readbackText).byteLength > 65_536) {
        throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_RESULT_INVALID");
      }
      let readback: unknown;
      try {
        readback = JSON.parse(readbackText);
      } catch {
        throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_RESULT_INVALID");
      }
      const replayed = (readback as Record<string, unknown> | null)?.replayed;
      if (
        typeof readback !== "object" ||
        readback === null ||
        (readback as Record<string, unknown>).status !== "accepted" ||
        (readback as Record<string, unknown>).run_id !== input.runId ||
        (readback as Record<string, unknown>).call_id !== input.call.call_id ||
        (replayed !== false && (attempt === 0 || replayed !== true))
      ) {
        throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_RESULT_INVALID");
      }
      return;
    } catch (error) {
      if (!(error instanceof TypeError) || attempt === 1 || input.signal.aborted) {
        throw error;
      }
    }
  }
}

export class ServiceBindingFastClawCompliantTransport implements FastClawCompliantTransport {
  readonly contract_version = FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION;
  readonly tool_interception = "callback_before_execution" as const;

  private readonly adminApiKey: string;
  private readonly baseUrl: string;
  private readonly fetch: FastClawServiceBinding["fetch"];
  private readonly onError?: (code: string) => void;

  constructor(input: {
    admin_api_key: string;
    base_url: string;
    on_error?: (code: string) => void;
    service: FastClawServiceBinding;
  }) {
    if (input.admin_api_key.trim() === "" || input.admin_api_key !== input.admin_api_key.trim()) {
      throw new FastClawServiceTransportError("FASTCLAW_SERVICE_CONFIG_INVALID");
    }
    this.adminApiKey = input.admin_api_key;
    this.baseUrl = validateBaseUrl(input.base_url);
    this.fetch = input.service.fetch.bind(input.service);
    this.onError = input.on_error;
  }

  async run(
    input: Parameters<FastClawCompliantTransport["run"]>[0],
    callbacks: Parameters<FastClawCompliantTransport["run"]>[1]
  ): Promise<FastClawTransportResult> {
    if (input.signal.aborted) {
      throw new FastClawServiceTransportError("FASTCLAW_SERVICE_ABORTED");
    }
    if (
      !validId(input.run_id) ||
      !validId(input.fastclaw_agent_id) ||
      !validId(input.fastclaw_user_id) ||
      input.external_user_identity.trim() === "" ||
      input.prompt.trim() === "" ||
      input.sandbox_authorization.trim() === ""
    ) {
      throw new FastClawServiceTransportError("FASTCLAW_SERVICE_INPUT_INVALID");
    }
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    input.signal.addEventListener("abort", onAbort, { once: true });
    const seenCalls = new Set<string>();
    let accepted = false;
    let final: FastClawTransportResult | undefined;
    let totalBytes = 0;
    let buffer = "";
    let applicationCallbackError: unknown;
    let transportPhase = "RUN_REQUEST";
    try {
      const response = await this.fetch(`${this.baseUrl}/v1/chat/completions`, {
        body: JSON.stringify({
          agent_id: input.fastclaw_agent_id,
          messages: [{ content: input.prompt, role: "user" }],
          stream: false,
          user: input.external_user_identity
        }),
        headers: headers({
          adminApiKey: this.adminApiKey,
          authorization: input.sandbox_authorization,
          fastclawUserId: input.fastclaw_user_id,
          runId: input.run_id
        }),
        method: "POST",
        signal: controller.signal
      });
      if (!response.ok || response.body === null) {
        this.onError?.(`FASTCLAW_SERVICE_RUN_REJECTED_${response.status}`);
        await response.body?.cancel().catch(() => undefined);
        throw new FastClawServiceTransportError("FASTCLAW_SERVICE_RUN_REJECTED");
      }
      if (!response.headers.get("content-type")?.toLowerCase().startsWith("application/x-ndjson")) {
        await response.body.cancel().catch(() => undefined);
        throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_CONTENT_TYPE_INVALID");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      transportPhase = "STREAM_READ";
      while (true) {
        const { done, value } = await reader.read();
        if (value !== undefined) {
          totalBytes += value.byteLength;
          if (totalBytes > MAX_STREAM_BYTES) {
            throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_STREAM_TOO_LARGE");
          }
          buffer += decoder.decode(value, { stream: !done });
        }
        if (done) buffer += decoder.decode();
        let newline = buffer.indexOf("\n");
        while (newline >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          if (new TextEncoder().encode(line).byteLength > MAX_LINE_BYTES) {
            throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_LINE_TOO_LARGE");
          }
          if (line.trim() !== "") {
            const event = parseEvent(line, input.run_id);
            if (event.type === "remote_accepted") {
              if (accepted || seenCalls.size > 0 || final !== undefined) {
                throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_ORDER_INVALID");
              }
              accepted = true;
              try {
                transportPhase = "APPLICATION_CALLBACK";
                callbacks.onProgress("remote_accepted");
              } catch (error) {
                applicationCallbackError = error;
                throw error;
              }
            } else if (event.type === "heartbeat") {
              if (!accepted || final !== undefined) {
                throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_ORDER_INVALID");
              }
            } else if (event.type === "error") {
              throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_TOOL_CALL_INVALID");
            } else if (event.type === "tool_call") {
              if (!accepted || final !== undefined || seenCalls.has(event.call.call_id)) {
                throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_ORDER_INVALID");
              }
              seenCalls.add(event.call.call_id);
              let output: unknown;
              try {
                transportPhase = "APPLICATION_CALLBACK";
                output = await callbacks.onToolCall(event.call);
              } catch (error) {
                applicationCallbackError = error;
                throw error;
              }
              transportPhase = "CALLBACK_RESULT";
              await postToolResult({
                adminApiKey: this.adminApiKey,
                authorization: input.sandbox_authorization,
                baseUrl: this.baseUrl,
                call: event.call,
                fastclawUserId: input.fastclaw_user_id,
                fetch: this.fetch,
                output,
                runId: input.run_id,
                signal: controller.signal
              });
              transportPhase = "STREAM_READ";
            } else {
              if (!accepted || final !== undefined || event.usage.steps !== seenCalls.size) {
                throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_FINAL_INVALID");
              }
              final = {
                raw_answer: event.raw_answer,
                usage: event.usage
              };
            }
          }
          newline = buffer.indexOf("\n");
        }
        if (done) break;
      }
      if (buffer.trim() !== "" || final === undefined) {
        throw new FastClawServiceTransportError("FASTCLAW_CALLBACK_TERMINAL_MISSING");
      }
      return final;
    } catch (error) {
      controller.abort();
      if (error === applicationCallbackError) throw error;
      if (error instanceof FastClawServiceTransportError) {
        this.onError?.(error.code);
        throw error;
      }
      const runtimeCode =
        error instanceof DOMException && error.name === "AbortError"
          ? `FASTCLAW_TRANSPORT_RUNTIME_${transportPhase}_ABORTED`
          : error instanceof Error && /^[A-Za-z]{1,40}$/u.test(error.name)
            ? `FASTCLAW_TRANSPORT_RUNTIME_${transportPhase}_${error.name.toUpperCase()}`
            : `FASTCLAW_TRANSPORT_RUNTIME_${transportPhase}_UNKNOWN`;
      this.onError?.(runtimeCode);
      throw new FastClawServiceTransportError(runtimeCode);
    } finally {
      input.signal.removeEventListener("abort", onAbort);
      controller.abort();
    }
  }
}
