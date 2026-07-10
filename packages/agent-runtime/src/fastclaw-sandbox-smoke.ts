import {
  issueSandboxRunToken
} from "@aiphabee/sandbox-run-auth";

import type {
  AgentExecutionEvent,
  AgentExecutionRequest,
  AgentRunner
} from "./index.js";

const MAX_RESPONSE_BYTES = 1_048_576;
const MAX_RUN_WALL_CLOCK_MS = 540_000;
const DEFAULT_TOKEN_MAX_CALLS = 12;
const DEFAULT_ARTIFACT_CONTENT = "AiphaBee FastClaw Cloudflare Sandbox smoke artifact\n";

export interface FastClawSandboxSmokeRunnerConfig {
  apiKey: string;
  artifactContent?: string;
  baseUrl: string;
  fetch?: typeof fetch;
  sandboxBridgeUrl: string;
  templateAgentId: string;
  tokenSecret: string;
}

export interface CloudflareStandard1CostEstimate {
  actual_bill: false;
  active_vcpu_seconds_high: number;
  active_vcpu_seconds_low: 0;
  billable_seconds: number;
  cost_usd_high: number;
  cost_usd_low: number;
  disk_gb_seconds: number;
  excluded_costs: readonly string[];
  included_usage_applied: false;
  instance_type: "standard-1";
  memory_gib_seconds: number;
  measurement: "orchestrator_wall_clock_upper_bound";
  pricing_basis: "cloudflare_public_list_price_2026-07-10";
}

export type FastClawSandboxSmokeErrorCode =
  | "ARTIFACT_HASH_MISMATCH"
  | "ARTIFACT_READBACK_FAILED"
  | "FASTCLAW_HTTP_ERROR"
  | "FASTCLAW_RESPONSE_INVALID"
  | "INVALID_CONFIG"
  | "INVALID_REQUEST"
  | "RUN_TIMEOUT"
  | "SANDBOX_EXEC_RECEIPT_INVALID"
  | "SANDBOX_DESTROY_FAILED"
  | "SANDBOX_DESTROY_READBACK_FAILED";

export class FastClawSandboxSmokeError extends Error {
  readonly code: FastClawSandboxSmokeErrorCode;

  constructor(code: FastClawSandboxSmokeErrorCode, message: string) {
    super(message);
    this.name = "FastClawSandboxSmokeError";
    this.code = code;
  }
}

interface FastClawProvisionedUser {
  external_id: string;
  user_id: string;
}

interface FastClawProvisionedAgent {
  agent: {
    id: string;
  };
}

function assertBaseUrl(value: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new FastClawSandboxSmokeError("INVALID_CONFIG", `${label} must be an absolute URL`);
  }
  const loopback = ["127.0.0.1", "::1", "localhost"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) {
    throw new FastClawSandboxSmokeError(
      "INVALID_CONFIG",
      `${label} must use https; http is allowed only for loopback smoke servers`
    );
  }
  return value.replace(/\/+$/gu, "");
}

function assertConfig(config: FastClawSandboxSmokeRunnerConfig) {
  if (
    config.apiKey.trim().length === 0 ||
    config.templateAgentId.trim().length === 0 ||
    config.tokenSecret.length < 32
  ) {
    throw new FastClawSandboxSmokeError(
      "INVALID_CONFIG",
      "api key, template agent id, and a 32-byte token secret are required"
    );
  }
  return {
    actual_bill: false,
    ...config,
    baseUrl: assertBaseUrl(config.baseUrl, "FastClaw base URL"),
    sandboxBridgeUrl: assertBaseUrl(config.sandboxBridgeUrl, "sandbox bridge URL")
  };
}

async function boundedText(response: Response): Promise<string> {
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
    throw new FastClawSandboxSmokeError(
      "FASTCLAW_RESPONSE_INVALID",
      "upstream response exceeded the smoke evidence limit"
    );
  }
  return text;
}

async function hashArtifact(content: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content))
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function textToBase64(content: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function parseFastClawSse(body: string): string {
  let completion = "";
  let done = false;
  for (const line of body.split(/\r?\n/gu)) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6);
    if (data === "[DONE]") {
      done = true;
      continue;
    }
    let chunk: unknown;
    try {
      chunk = JSON.parse(data);
    } catch {
      throw new FastClawSandboxSmokeError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw returned malformed SSE JSON"
      );
    }
    const content = (chunk as { choices?: Array<{ delta?: { content?: unknown } }> }).choices?.[0]?.delta
      ?.content;
    if (typeof content === "string") completion += content;
  }
  if (!done) {
    throw new FastClawSandboxSmokeError(
      "FASTCLAW_RESPONSE_INVALID",
      "FastClaw SSE stream did not contain a terminal marker"
    );
  }
  return completion;
}

export function estimateCloudflareStandard1Cost(wallClockMs: number): CloudflareStandard1CostEstimate {
  const seconds = Math.max(0.01, Math.ceil(wallClockMs / 10) / 100);
  const memoryGiBSeconds = seconds * 4;
  const diskGBSeconds = seconds * 8;
  const activeVcpuSecondsHigh = seconds * 0.5;
  const nonCpuCost = memoryGiBSeconds * 0.0000025 + diskGBSeconds * 0.00000007;
  const highCost = nonCpuCost + activeVcpuSecondsHigh * 0.00002;
  return {
    actual_bill: false,
    active_vcpu_seconds_high: activeVcpuSecondsHigh,
    active_vcpu_seconds_low: 0,
    billable_seconds: seconds,
    cost_usd_high: Number(highCost.toFixed(10)),
    cost_usd_low: Number(nonCpuCost.toFixed(10)),
    disk_gb_seconds: diskGBSeconds,
    excluded_costs: [
      "monthly included usage",
      "Workers",
      "Durable Objects",
      "logs and observability",
      "egress",
      "FastClaw control plane",
      "LLM and tool providers"
    ],
    included_usage_applied: false,
    instance_type: "standard-1",
    memory_gib_seconds: memoryGiBSeconds,
    measurement: "orchestrator_wall_clock_upper_bound",
    pricing_basis: "cloudflare_public_list_price_2026-07-10"
  };
}

class FastClawSmokeHttpClient {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly signal: AbortSignal,
    fetchImpl?: typeof fetch
  ) {
    this.fetchImpl = fetchImpl ?? fetch;
  }

  private async json<T>(path: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${this.apiKey}`);
    headers.set("content-type", "application/json");
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      signal: this.signal
    });
    if (!response.ok) {
      throw new FastClawSandboxSmokeError(
        "FASTCLAW_HTTP_ERROR",
        `FastClaw request failed with HTTP ${response.status}`
      );
    }
    try {
      return JSON.parse(await boundedText(response)) as T;
    } catch (error) {
      if (error instanceof FastClawSandboxSmokeError) throw error;
      throw new FastClawSandboxSmokeError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw returned malformed JSON"
      );
    }
  }

  async provisionUser(externalId: string): Promise<FastClawProvisionedUser> {
    const result = await this.json<FastClawProvisionedUser>("/v1/users", {
      body: JSON.stringify({ display_name: "AiphaBee Sandbox Smoke", external_id: externalId }),
      method: "POST"
    });
    if (
      typeof result.user_id !== "string" ||
      result.user_id.length === 0 ||
      result.external_id !== externalId
    ) {
      throw new FastClawSandboxSmokeError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw provisioned-user response did not match the requested identity"
      );
    }
    return result;
  }

  async provisionAgent(
    userId: string,
    templateAgentId: string,
    runId: string
  ): Promise<FastClawProvisionedAgent> {
    const result = await this.json<FastClawProvisionedAgent>(
      `/api/users/${encodeURIComponent(userId)}/agents`,
      {
        body: JSON.stringify({
          description: "Ephemeral AiphaBee Cloudflare Sandbox smoke agent",
          forkFrom: templateAgentId,
          name: `aiphabee-smoke-${runId}`
        }),
        method: "POST"
      }
    );
    if (typeof result.agent?.id !== "string" || result.agent.id.length === 0) {
      throw new FastClawSandboxSmokeError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw provisioned-agent response is missing agent id"
      );
    }
    return result;
  }

  async runAgent(input: {
    agentId: string;
    externalUserId: string;
    prompt: string;
    runId: string;
    sandboxAuthorization: string;
  }): Promise<string> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/chat/completions`, {
      body: JSON.stringify({
        agent_id: input.agentId,
        messages: [{ content: input.prompt, role: "user" }],
        model: "aiphabee-smoke",
        stream: true,
        user: input.externalUserId
      }),
      headers: {
        "authorization": `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        "x-aiphabee-sandbox-authorization": input.sandboxAuthorization,
        "x-fastclaw-agent-id": input.agentId,
        "x-fastclaw-session-key": input.runId
      },
      method: "POST",
      signal: this.signal
    });
    if (!response.ok) {
      throw new FastClawSandboxSmokeError(
        "FASTCLAW_HTTP_ERROR",
        `FastClaw chat failed with HTTP ${response.status}`
      );
    }
    return parseFastClawSse(await boundedText(response));
  }
}

async function destroySandbox(input: {
  bridgeUrl: string;
  fetchImpl: typeof fetch;
  sandboxId: string;
  token: string;
}): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const headers = { authorization: `Bearer ${input.token}` };
  const url = `${input.bridgeUrl}/v1/sandbox/${encodeURIComponent(input.sandboxId)}`;
  try {
    const destroyed = await input.fetchImpl(url, {
      headers,
      method: "DELETE",
      signal: controller.signal
    });
    if (destroyed.status !== 204) {
      throw new FastClawSandboxSmokeError(
        "SANDBOX_DESTROY_FAILED",
        `sandbox destroy failed with HTTP ${destroyed.status}`
      );
    }
    const status = await input.fetchImpl(`${url}/running`, { headers, signal: controller.signal });
    if (!status.ok) {
      throw new FastClawSandboxSmokeError(
        "SANDBOX_DESTROY_READBACK_FAILED",
        `sandbox destroy readback failed with HTTP ${status.status}`
      );
    }
    let readback: { running?: unknown; terminal?: unknown };
    try {
      readback = JSON.parse(await boundedText(status)) as {
        running?: unknown;
        terminal?: unknown;
      };
    } catch {
      throw new FastClawSandboxSmokeError(
        "SANDBOX_DESTROY_READBACK_FAILED",
        "sandbox destroy readback was malformed"
      );
    }
    if (readback.running !== false || readback.terminal !== true) {
      throw new FastClawSandboxSmokeError(
        "SANDBOX_DESTROY_READBACK_FAILED",
        "sandbox destroy readback was not terminal"
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function verifySandboxEvidence(input: {
  artifactHash: string;
  bridgeUrl: string;
  fetchImpl: typeof fetch;
  sandboxId: string;
  command: string;
  signal: AbortSignal;
  token: string;
}): Promise<void> {
  const headers = { authorization: `Bearer ${input.token}` };
  const sandboxUrl = `${input.bridgeUrl}/v1/sandbox/${encodeURIComponent(input.sandboxId)}`;
  const status = await input.fetchImpl(`${sandboxUrl}/running`, {
    headers,
    signal: input.signal
  });
  if (!status.ok) {
    throw new FastClawSandboxSmokeError(
      "SANDBOX_EXEC_RECEIPT_INVALID",
      `sandbox exec receipt readback failed with HTTP ${status.status}`
    );
  }
  let readback: {
    exec_receipt?: {
      argv_sha256?: unknown;
      exit_code?: unknown;
      stdout_sha256?: unknown;
    };
    terminal?: unknown;
  };
  try {
    readback = JSON.parse(await boundedText(status)) as typeof readback;
  } catch {
    throw new FastClawSandboxSmokeError(
      "SANDBOX_EXEC_RECEIPT_INVALID",
      "sandbox exec receipt readback was malformed"
    );
  }
  const expectedStdoutHash = await hashArtifact(
    `${input.artifactHash}  /workspace/aiphabee-smoke.txt\n`
  );
  const expectedArgvHash = await hashArtifact(
    JSON.stringify(["sh", "-lc", input.command])
  );
  if (
    readback.terminal !== false ||
    readback.exec_receipt?.argv_sha256 !== expectedArgvHash ||
    readback.exec_receipt?.exit_code !== 0 ||
    readback.exec_receipt.stdout_sha256 !== expectedStdoutHash
  ) {
    throw new FastClawSandboxSmokeError(
      "SANDBOX_EXEC_RECEIPT_INVALID",
      "sandbox exec receipt did not match the artifact command"
    );
  }

  const artifact = await input.fetchImpl(
    `${sandboxUrl}/file/workspace/aiphabee-smoke.txt`,
    { headers, signal: input.signal }
  );
  if (!artifact.ok) {
    throw new FastClawSandboxSmokeError(
      "ARTIFACT_READBACK_FAILED",
      `sandbox artifact readback failed with HTTP ${artifact.status}`
    );
  }
  const content = await boundedText(artifact);
  if ((await hashArtifact(content)) !== input.artifactHash) {
    throw new FastClawSandboxSmokeError(
      "ARTIFACT_HASH_MISMATCH",
      "sandbox artifact readback did not match the expected hash"
    );
  }
}

function createEvent(
  request: AgentExecutionRequest,
  eventIndex: number,
  eventType: AgentExecutionEvent["event_type"],
  payload: Readonly<Record<string, unknown>>,
  visibleToUser: boolean
): AgentExecutionEvent {
  return {
    created_at: new Date().toISOString(),
    event_index: eventIndex,
    event_type: eventType,
    layer: request.layer,
    payload,
    run_id: request.run_id,
    visible_to_user: visibleToUser
  };
}

export class FastClawSandboxSmokeRunner implements AgentRunner {
  readonly layer = "research" as const;
  readonly runner_id = "fastclaw-cloudflare-sandbox-smoke-v1";
  readonly supported_modes = ["runner_remote"] as const;
  private readonly config: ReturnType<typeof assertConfig>;
  private readonly fetchImpl: typeof fetch;

  constructor(config: FastClawSandboxSmokeRunnerConfig) {
    this.config = assertConfig(config);
    this.fetchImpl = config.fetch ?? fetch;
  }

  async *run(request: AgentExecutionRequest): AsyncIterable<AgentExecutionEvent> {
    yield createEvent(
      request,
      0,
      "run.requested",
      { mode: request.mode, runner_id: this.runner_id },
      false
    );
    if (
      request.layer !== "research" ||
      request.mode !== "runner_remote" ||
      !request.allowed_tools.includes("exec") ||
      !Number.isSafeInteger(request.budget.max_wall_clock_ms) ||
      request.budget.max_wall_clock_ms < 1 ||
      request.budget.max_wall_clock_ms > MAX_RUN_WALL_CLOCK_MS
    ) {
      yield createEvent(
        request,
        1,
        "run.failed",
        {
          code: "INVALID_REQUEST",
          message: "smoke runner requires research/runner_remote, exec permission, and a 1..540000ms budget"
        },
        true
      );
      return;
    }

    yield createEvent(request, 1, "run.started", { runner_id: this.runner_id }, false);
    const startedAt = Date.now();
    const artifactContent = this.config.artifactContent ?? DEFAULT_ARTIFACT_CONTENT;
    const artifactHash = await hashArtifact(artifactContent);
    let externalUserId: string | undefined;
    let issued:
      | Awaited<ReturnType<typeof issueSandboxRunToken>>
      | undefined;
    let agentId: string | undefined;
    let runError: FastClawSandboxSmokeError | undefined;
    const controller = new AbortController();
    const runTimeout = setTimeout(() => controller.abort(), request.budget.max_wall_clock_ms);

    try {
      issued = await issueSandboxRunToken({
        maxCalls: DEFAULT_TOKEN_MAX_CALLS,
        runId: request.run_id,
        scopes: [
          "sandbox:create",
          "sandbox:destroy",
          "sandbox:exec",
          "sandbox:file",
          "sandbox:status"
        ],
        secret: this.config.tokenSecret,
        tenantId: request.tenant_id,
        ttlSeconds: Math.min(
          600,
          Math.max(60, Math.ceil(request.budget.max_wall_clock_ms / 1_000) + 60)
        ),
        userId: request.user_id
      });
      externalUserId = `aiphabee:v1:${issued.claims.tenant_hash}:${issued.claims.user_hash}`;
      const client = new FastClawSmokeHttpClient(
        this.config.baseUrl,
        this.config.apiKey,
        controller.signal,
        this.fetchImpl
      );
      const user = await client.provisionUser(externalUserId);
      const agent = await client.provisionAgent(
        user.user_id,
        this.config.templateAgentId,
        request.run_id
      );
      agentId = agent.agent.id;
      const encodedArtifact = textToBase64(artifactContent);
      const command =
        `printf '%s' '${encodedArtifact}' | base64 -d > /workspace/aiphabee-smoke.txt` +
        " && sha256sum /workspace/aiphabee-smoke.txt";
      const completion = await client.runAgent({
        agentId,
        externalUserId,
        prompt:
          "This is a deterministic sandbox acceptance run. Call the exec tool exactly once with this command, " +
          `then return the complete tool output and marker AIPHABEE_SANDBOX_SMOKE_OK. Command: ${command}`,
        runId: request.run_id,
        sandboxAuthorization: issued.token
      });
      if (!completion.includes("AIPHABEE_SANDBOX_SMOKE_OK") || !completion.includes(artifactHash)) {
        throw new FastClawSandboxSmokeError(
          "ARTIFACT_HASH_MISMATCH",
          "FastClaw completion did not contain the expected artifact hash and marker"
        );
      }
      await verifySandboxEvidence({
        artifactHash,
        bridgeUrl: this.config.sandboxBridgeUrl,
        command,
        fetchImpl: this.fetchImpl,
        sandboxId: issued.sandbox_id,
        signal: controller.signal,
        token: issued.token
      });
    } catch (error) {
      runError =
        controller.signal.aborted
          ? new FastClawSandboxSmokeError("RUN_TIMEOUT", "FastClaw smoke run exceeded its budget")
          : error instanceof FastClawSandboxSmokeError
          ? error
          : new FastClawSandboxSmokeError("FASTCLAW_HTTP_ERROR", "FastClaw smoke run failed");
    } finally {
      clearTimeout(runTimeout);
      if (issued !== undefined) {
        try {
          await destroySandbox({
            bridgeUrl: this.config.sandboxBridgeUrl,
            fetchImpl: this.fetchImpl,
            sandboxId: issued.sandbox_id,
            token: issued.token
          });
        } catch (error) {
          const cleanupError =
            error instanceof FastClawSandboxSmokeError
              ? error
              : new FastClawSandboxSmokeError(
                  "SANDBOX_DESTROY_FAILED",
                  "sandbox destroy failed"
                );
          runError = cleanupError;
        }
      }
    }

    if (runError !== undefined) {
      yield createEvent(
        request,
        2,
        "run.failed",
        {
          agent_id: agentId ?? null,
          code: runError.code,
          leak_candidate:
            runError.code === "SANDBOX_DESTROY_FAILED" ||
            runError.code === "SANDBOX_DESTROY_READBACK_FAILED",
          message: runError.message
        },
        true
      );
      return;
    }

    yield createEvent(
      request,
      2,
      "run.completed",
      {
        agent_id: agentId,
        artifact_sha256: artifactHash,
        cost_estimate: estimateCloudflareStandard1Cost(Date.now() - startedAt),
        dedicated_agent: true,
        sandbox_destroyed: true,
        sandbox_id: issued?.sandbox_id,
        orchestrator_wall_clock_ms: Date.now() - startedAt
      },
      true
    );
  }
}
