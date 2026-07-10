const MAX_FASTCLAW_RESPONSE_BYTES = 1_048_576;
const DEFAULT_FASTCLAW_CONTROL_TIMEOUT_MS = 20_000;

export const RESEARCH_AGENT_ENTITLEMENT = "research_agent_enabled";
export const RESEARCH_AGENT_LIFECYCLE_INTENTS = ["activate", "disable", "delete"] as const;
export const RESEARCH_AGENT_DESIRED_STATES = ["active", "disabled", "deleted"] as const;
export const RESEARCH_AGENT_LIFECYCLE_STATUSES = [
  "provision_pending",
  "provisioning",
  "active",
  "disable_pending",
  "disabled",
  "delete_pending",
  "deleted",
  "blocked_retryable"
] as const;

export type ResearchAgentLifecycleIntent = (typeof RESEARCH_AGENT_LIFECYCLE_INTENTS)[number];
export type ResearchAgentDesiredState = (typeof RESEARCH_AGENT_DESIRED_STATES)[number];
export type ResearchAgentLifecycleStatus = (typeof RESEARCH_AGENT_LIFECYCLE_STATUSES)[number];
export type FastClawUserStatus = "active" | "disabled";

export type FastClawLifecycleErrorCode =
  | "FASTCLAW_AUTH_REJECTED"
  | "FASTCLAW_CONFLICT"
  | "FASTCLAW_HTTP_ERROR"
  | "FASTCLAW_NOT_FOUND"
  | "FASTCLAW_RATE_LIMITED"
  | "FASTCLAW_RESPONSE_INVALID"
  | "FASTCLAW_UNAVAILABLE"
  | "INVALID_LIFECYCLE_CONFIG"
  | "INVALID_LIFECYCLE_INPUT";

export class FastClawLifecycleError extends Error {
  readonly code: FastClawLifecycleErrorCode;
  readonly retryable: boolean;

  constructor(code: FastClawLifecycleErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "FastClawLifecycleError";
    this.code = code;
    this.retryable = retryable;
  }
}

export interface FastClawLifecycleClientConfig {
  adminApiKey: string;
  baseUrl: string;
  fetch?: typeof fetch;
  templateAgentId: string;
  timeoutMs?: number;
}

export interface FastClawProvisionedUser {
  external_id: string;
  user_id: string;
}

export interface FastClawProvisionedAgent {
  agent_id: string;
  created: boolean;
}

function assertNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new FastClawLifecycleError(
      "INVALID_LIFECYCLE_INPUT",
      `${label} is required`
    );
  }
  return normalized;
}

function normalizeBaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new FastClawLifecycleError(
      "INVALID_LIFECYCLE_CONFIG",
      "FastClaw base URL must be absolute"
    );
  }
  const loopback = ["127.0.0.1", "::1", "localhost"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) {
    throw new FastClawLifecycleError(
      "INVALID_LIFECYCLE_CONFIG",
      "FastClaw base URL must use https; http is allowed only for loopback"
    );
  }
  return value.replace(/\/+$/gu, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readBoundedResponseText(response: Response): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_FASTCLAW_RESPONSE_BYTES) {
      throw new FastClawLifecycleError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw control-plane response exceeded the configured limit"
      );
    }
  }
  if (response.body === null) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_FASTCLAW_RESPONSE_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new FastClawLifecycleError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw control-plane response exceeded the configured limit"
      );
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function deriveFastClawExternalIdentity(
  workspaceId: string,
  accountId: string
): Promise<string> {
  const workspace = assertNonEmpty(workspaceId, "workspace id");
  const account = assertNonEmpty(accountId, "account id");
  return `aiphabee:v1:${await sha256Hex(`${workspace}\u0000${account}`)}`;
}

export async function deriveFastClawAgentExternalIdentity(
  workspaceId: string,
  accountId: string
): Promise<string> {
  const identity = await deriveFastClawExternalIdentity(workspaceId, accountId);
  return identity.replace("aiphabee:v1:", "aiphabee-agent:v1:");
}

export async function hashLifecycleReference(value: string): Promise<string> {
  return sha256Hex(assertNonEmpty(value, "lifecycle reference"));
}

export function desiredStateForIntent(intent: ResearchAgentLifecycleIntent): ResearchAgentDesiredState {
  if (intent === "activate") return "active";
  if (intent === "disable") return "disabled";
  return "deleted";
}

export function pendingStatusForIntent(
  intent: ResearchAgentLifecycleIntent
): ResearchAgentLifecycleStatus {
  if (intent === "activate") return "provisioning";
  if (intent === "disable") return "disable_pending";
  return "delete_pending";
}

export function terminalStatusForIntent(
  intent: ResearchAgentLifecycleIntent
): ResearchAgentLifecycleStatus {
  if (intent === "activate") return "active";
  if (intent === "disable") return "disabled";
  return "deleted";
}

export class FastClawLifecycleClient {
  private readonly adminApiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly templateAgentId: string;
  private readonly timeoutMs: number;

  constructor(config: FastClawLifecycleClientConfig) {
    this.adminApiKey = assertNonEmpty(config.adminApiKey, "FastClaw admin API key");
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.fetchImpl = config.fetch ?? fetch;
    this.templateAgentId = assertNonEmpty(config.templateAgentId, "FastClaw template Agent id");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_FASTCLAW_CONTROL_TIMEOUT_MS;
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs < 1 || this.timeoutMs > 60_000) {
      throw new FastClawLifecycleError(
        "INVALID_LIFECYCLE_CONFIG",
        "FastClaw control timeout must be an integer in 1..60000ms"
      );
    }
  }

  async provisionUser(externalIdentity: string): Promise<FastClawProvisionedUser> {
    const externalId = assertNonEmpty(externalIdentity, "FastClaw external identity");
    const result = await this.requestJson("/v1/users", {
      body: JSON.stringify({
        display_name: "AiphaBee Research Agent",
        external_id: externalId
      }),
      method: "POST"
    });
    if (result.external_id !== externalId || typeof result.user_id !== "string" || result.user_id.length === 0) {
      throw new FastClawLifecycleError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw user response did not match the requested external identity"
      );
    }
    return { external_id: externalId, user_id: result.user_id };
  }

  async provisionAgent(userId: string, externalIdentity: string): Promise<FastClawProvisionedAgent> {
    const user = assertNonEmpty(userId, "FastClaw user id");
    const externalId = assertNonEmpty(externalIdentity, "FastClaw Agent external identity");
    const result = await this.requestJson(`/api/users/${encodeURIComponent(user)}/agents`, {
      body: JSON.stringify({
        description: "Dedicated AiphaBee research Agent",
        externalId,
        forkFrom: this.templateAgentId,
        name: "AiphaBee Research Agent"
      }),
      method: "POST"
    });
    const agent = isRecord(result.agent) ? result.agent : undefined;
    if (
      agent?.externalId !== externalId ||
      typeof agent.id !== "string" ||
      agent.id.length === 0 ||
      typeof result.created !== "boolean"
    ) {
      throw new FastClawLifecycleError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw Agent response did not match the idempotent provisioning contract"
      );
    }
    return { agent_id: agent.id, created: result.created };
  }

  async setUserStatus(userId: string, status: FastClawUserStatus): Promise<{ status: FastClawUserStatus }> {
    const user = assertNonEmpty(userId, "FastClaw user id");
    const result = await this.requestJson(`/api/users/${encodeURIComponent(user)}`, {
      body: JSON.stringify({ status }),
      method: "PUT"
    });
    const responseUser = isRecord(result.user) ? result.user : undefined;
    if (responseUser?.id !== user || responseUser.status !== status) {
      throw new FastClawLifecycleError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw user-status response did not match the requested state"
      );
    }
    return { status };
  }

  async removeUser(userId: string): Promise<{ already_absent: boolean }> {
    const user = assertNonEmpty(userId, "FastClaw user id");
    const result = await this.requestJson(`/api/users/${encodeURIComponent(user)}`, {
      method: "DELETE"
    });
    if (result.ok !== true || typeof result.deleted !== "boolean") {
      throw new FastClawLifecycleError(
        "FASTCLAW_RESPONSE_INVALID",
        "FastClaw user removal response did not prove remote absence"
      );
    }
    return { already_absent: result.deleted === false };
  }

  private async requestJson(path: string, init: RequestInit): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers = new Headers(init.headers);
      headers.set("authorization", `Bearer ${this.adminApiKey}`);
      headers.set("content-type", "application/json");
      let response: Response;
      try {
        response = await this.fetchImpl(`${this.baseUrl}${path}`, {
          ...init,
          headers,
          signal: controller.signal
        });
      } catch {
        throw new FastClawLifecycleError(
          "FASTCLAW_UNAVAILABLE",
          "FastClaw control-plane request failed",
          true
        );
      }
      if (!response.ok) throw this.httpError(response.status);
      const text = await readBoundedResponseText(response);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new FastClawLifecycleError(
          "FASTCLAW_RESPONSE_INVALID",
          "FastClaw control-plane response was not valid JSON"
        );
      }
      if (!isRecord(parsed)) {
        throw new FastClawLifecycleError(
          "FASTCLAW_RESPONSE_INVALID",
          "FastClaw control-plane response must be an object"
        );
      }
      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  private httpError(status: number): FastClawLifecycleError {
    if (status === 401 || status === 403) {
      return new FastClawLifecycleError(
        "FASTCLAW_AUTH_REJECTED",
        `FastClaw control-plane authentication failed with HTTP ${status}`
      );
    }
    if (status === 404) {
      return new FastClawLifecycleError(
        "FASTCLAW_NOT_FOUND",
        "FastClaw control-plane resource was not found"
      );
    }
    if (status === 409) {
      return new FastClawLifecycleError(
        "FASTCLAW_CONFLICT",
        "FastClaw control-plane request conflicted with existing state"
      );
    }
    if (status === 429) {
      return new FastClawLifecycleError(
        "FASTCLAW_RATE_LIMITED",
        "FastClaw control-plane request was rate limited",
        true
      );
    }
    return new FastClawLifecycleError(
      "FASTCLAW_HTTP_ERROR",
      `FastClaw control-plane request failed with HTTP ${status}`,
      status >= 500
    );
  }
}
