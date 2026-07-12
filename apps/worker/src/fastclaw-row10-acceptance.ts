import { Client } from "pg";

import { FastClawLifecycleClient } from "@aiphabee/agent-runtime/fastclaw-lifecycle";
import type {
  AgentExecutionEvent,
  AgentExecutionRequest
} from "@aiphabee/agent-runtime";
import type { DurableHandoffRecord } from "@aiphabee/agent-runtime/durable-memory-artifact-handoff";
import { issueSandboxRunToken } from "@aiphabee/sandbox-run-auth";
import { createFastClawVpsControlService } from "./fastclaw-service-transport.js";

import {
  createFastClawLiveControlPlane,
  type FastClawLiveControlPlaneInput
} from "./fastclaw-live-composition.js";
import { withFastClawPostgresClientLock } from "./fastclaw-agent-runner.js";
import {
  PostgresResearchAgentLifecycleRepository,
  ResearchAgentLifecycleService
} from "./research-agent-lifecycle.js";

const RUN_COUNT = 10;
const KILL_RUN_INDEX = RUN_COUNT - 1;
const EXPECTED_COMMAND =
  "printf 'row10-live-ok' > /workspace/result.txt && cat /workspace/result.txt";
const ACCEPTANCE_ID = /^row10-[a-f0-9]{24}$/u;
const CALLBACK_TIMEOUT_MS = 600_000;

interface RuntimeFetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface RuntimeHyperdrive {
  connectionString: string;
}

interface RuntimeR2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
  httpMetadata?: { contentType?: string };
}

interface RuntimeR2Bucket {
  delete(key: string): Promise<void>;
  get(key: string): Promise<RuntimeR2Object | null>;
  list(options: { cursor?: string; prefix: string }): Promise<{
    cursor?: string;
    objects: Array<{ key: string }>;
    truncated: boolean;
  }>;
  put(
    key: string,
    value: Uint8Array,
    options: { httpMetadata: { contentType: string } }
  ): Promise<unknown>;
}

export interface FastClawRow10AcceptanceEnv {
  AIPHABEE_ARTIFACTS?: RuntimeR2Bucket;
  AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE?: RuntimeHyperdrive;
  AIPHABEE_SANDBOX_BRIDGE?: RuntimeFetcher;
  APP_ENV?: string;
  ARTIFACT_SCANNER_SHARED_KEY?: string;
  FASTCLAW_ADMIN_API_KEY?: string;
  FASTCLAW_BASE_URL?: string;
  FASTCLAW_CONTROL_SERVICE?: RuntimeFetcher;
  FASTCLAW_ROW10_ACCEPTANCE_TOKEN?: string;
  FASTCLAW_TEMPLATE_AGENT_ID?: string;
  FASTCLAW_VPS_SHARED_TOKEN?: string;
  HYPERDRIVE?: RuntimeHyperdrive;
  SANDBOX_RUN_HMAC_KEY?: string;
}

interface Fixture {
  accountId: string;
  index: number;
  membershipId: string;
  runId: string;
  subscriptionId: string;
  workspaceId: string;
}

interface LiveRunState {
  authorization?: string;
  coldStartMs?: number;
  crossTenantRejected?: boolean;
  destroyConfirmed?: boolean;
  durationMs?: number;
  firstProgressMs?: number;
  handoffConfirmed?: boolean;
  killConfirmed?: boolean;
  modelInputTokens?: number;
  modelOutputTokens?: number;
  providerInstanceHash?: string;
  r2ClassAOperations: number;
  r2ClassBOperations: number;
  sandboxId?: string;
  sandboxActiveFrom?: string;
  sandboxActiveUntil?: string;
  scanSignatureVersion?: string;
  scanStatus?: "clean";
  startedAt: number;
  terminalState?: string;
  toolFailureCode?: string;
  toolCallsSucceeded: number;
  transportFailureCode?: string;
}

class Row10AcceptancePhaseError extends Error {
  readonly phase: string;
  readonly sqlstate: string | null;

  constructor(phase: string, cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : "";
    const detail = /^[A-Za-z0-9_:.-]{1,220}$/u.test(causeMessage)
      ? `:${causeMessage}`
      : "";
    super(`ROW10_${phase.toUpperCase()}_FAILED${detail}`, { cause });
    this.name = "Row10AcceptancePhaseError";
    this.phase = phase;
    const code = (cause as { code?: unknown })?.code;
    this.sqlstate = typeof code === "string" && /^[0-9A-Z]{5}$/u.test(code) ? code : null;
  }
}

async function phase<T>(name: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Row10AcceptancePhaseError) throw error;
    throw new Row10AcceptancePhaseError(name, error);
  }
}

function json(status: number, body: unknown): Response {
  return Response.json(body, {
    headers: { "cache-control": "no-store" },
    status
  });
}

async function sha256Hex(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function authorized(request: Request, expected: string | undefined): Promise<boolean> {
  const provided = request.headers.get("authorization")?.replace(/^Bearer /u, "") ?? "";
  if (expected === undefined || expected.length < 32 || provided.length === 0) return false;
  return (await sha256Hex(provided)) === (await sha256Hex(expected));
}

function fixture(acceptanceId: string, index: number): Fixture {
  const suffix = `${acceptanceId}-${String(index).padStart(2, "0")}`;
  return {
    accountId: `acct-${suffix}`,
    index,
    membershipId: `mbr-${suffix}`,
    runId: `run-${suffix}`,
    subscriptionId: `sub-${suffix}`,
    workspaceId: `ws-${suffix}`
  };
}

function assertConfigured(env: FastClawRow10AcceptanceEnv): asserts env is Required<FastClawRow10AcceptanceEnv> {
  if (
    env.APP_ENV !== "staging" ||
    env.AIPHABEE_ARTIFACTS === undefined ||
    env.AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE?.connectionString.trim() === "" ||
    env.AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE === undefined ||
    env.AIPHABEE_SANDBOX_BRIDGE === undefined ||
    env.ARTIFACT_SCANNER_SHARED_KEY === undefined ||
    env.ARTIFACT_SCANNER_SHARED_KEY.length < 32 ||
    env.FASTCLAW_ADMIN_API_KEY?.trim() === "" ||
    env.FASTCLAW_ADMIN_API_KEY === undefined ||
    env.FASTCLAW_BASE_URL?.trim() === "" ||
    env.FASTCLAW_BASE_URL === undefined ||
    (env.FASTCLAW_CONTROL_SERVICE === undefined &&
      (env.FASTCLAW_VPS_SHARED_TOKEN?.length ?? 0) < 32) ||
    env.FASTCLAW_TEMPLATE_AGENT_ID?.trim() === "" ||
    env.FASTCLAW_TEMPLATE_AGENT_ID === undefined ||
    env.HYPERDRIVE?.connectionString.trim() === "" ||
    env.HYPERDRIVE === undefined ||
    env.SANDBOX_RUN_HMAC_KEY === undefined ||
    env.SANDBOX_RUN_HMAC_KEY.length < 32
  ) {
    throw new Error("ROW10_ACCEPTANCE_CONFIG_INVALID");
  }
}

function fastClawControlService(
  env: Required<FastClawRow10AcceptanceEnv>
): RuntimeFetcher {
  return env.FASTCLAW_CONTROL_SERVICE ??
    createFastClawVpsControlService({
      base_url: env.FASTCLAW_BASE_URL,
      shared_token: env.FASTCLAW_VPS_SHARED_TOKEN
    });
}

async function withTransaction<T>(client: Client, operation: () => Promise<T>): Promise<T> {
  await client.query("begin");
  try {
    const result = await operation();
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
}

async function withAccountScope<T>(
  client: Client,
  accountId: string,
  operation: () => Promise<T>
): Promise<T> {
  return withTransaction(client, async () => {
    await client.query("select set_config('aiphabee.account_id', $1, true)", [accountId]);
    return operation();
  });
}

async function seedFixtures(
  admin: Client,
  acceptanceId: string,
  fixtures: readonly Fixture[]
): Promise<{ policyVersion: string; productId: string }> {
  return withTransaction(admin, async () => {
    const existing = await admin.query<{ count: string }>(
      `select count(*)::text as count from platform.account where account_id like $1`,
      [`acct-${acceptanceId}-%`]
    );
    const existingCount = existing.rows[0]?.count;
    if (existingCount !== "0" && existingCount !== String(fixtures.length)) {
      throw new Error("ROW10_FIXTURE_PARTIAL_STATE");
    }
    const authority = await admin.query<{ policy_version: string; product_id: string }>(
      `select product.product_id, policy.policy_version
       from platform.product product
       join platform.entitlement_policy policy
         on policy.product_id = product.product_id and policy.status = 'active'
       where product.product_code = 'aiphabee' and product.status = 'active'
         and (policy.effective_from is null or policy.effective_from <= now())
         and exists (
           select 1 from platform.subscription_plan plan
           where plan.plan_code = 'pro' and plan.status = 'active'
         )
       order by policy.effective_from desc nulls last
       limit 1`
    );
    const row = authority.rows[0];
    if (row === undefined) throw new Error("ROW10_PRODUCT_AUTHORITY_NOT_ACTIVE");
    if (existingCount === String(fixtures.length)) {
      const readback = await admin.query<{
        access_count: string;
        entitlement_count: string;
        membership_count: string;
        subscription_count: string;
        workspace_count: string;
      }>(
        `select
           (select count(*)::text from platform.workspace where workspace_id like $1) as workspace_count,
           (select count(*)::text from platform.workspace_membership where membership_id like $2) as membership_count,
           (select count(*)::text from platform.workspace_subscription where subscription_id like $3) as subscription_count,
           (select count(*)::text from platform.workspace_product_access where workspace_product_access_id like $4) as access_count,
           (select count(*)::text from platform.workspace_entitlement where workspace_entitlement_id like $5) as entitlement_count`,
        [
          `ws-${acceptanceId}-%`,
          `mbr-${acceptanceId}-%`,
          `sub-${acceptanceId}-%`,
          `wpa-${acceptanceId}-%`,
          `went-${acceptanceId}-%`
        ]
      );
      const counts = readback.rows[0];
      if (
        counts === undefined ||
        counts.workspace_count !== String(fixtures.length) ||
        counts.membership_count !== String(fixtures.length) ||
        counts.subscription_count !== String(fixtures.length) ||
        counts.access_count !== String(fixtures.length) ||
        counts.entitlement_count !== String(fixtures.length)
      ) {
        throw new Error("ROW10_FIXTURE_PARTIAL_STATE");
      }
      return { policyVersion: row.policy_version, productId: row.product_id };
    }
    for (const item of fixtures) {
      await admin.query(
        `insert into platform.account (account_id, display_name, status)
         values ($1, 'Row10 synthetic acceptance', 'active')`,
        [item.accountId]
      );
      await admin.query(
        `insert into platform.workspace (
           workspace_id, owner_account_id, display_name, billing_region, data_region, status
         ) values ($1, $2, 'Row10 synthetic acceptance', 'US', 'US', 'active')`,
        [item.workspaceId, item.accountId]
      );
      await admin.query(
        `insert into platform.workspace_membership (
           membership_id, workspace_id, account_id, role, status, valid_from
         ) values ($1, $2, $3, 'owner', 'active', now() - interval '1 minute')`,
        [item.membershipId, item.workspaceId, item.accountId]
      );
      await admin.query(
        `insert into platform.workspace_subscription (
           subscription_id, workspace_id, plan_code, billing_state, seats_purchased,
           valid_from, source_record_id
         ) values ($1, $2, 'pro', 'active', 1, now() - interval '1 minute', $3)`,
        [item.subscriptionId, item.workspaceId, `row10:${acceptanceId}`]
      );
      await admin.query(
        `insert into platform.workspace_product_access (
           workspace_product_access_id, workspace_id, product_id, access_status,
           policy_version, valid_from
         ) values ($1, $2, $3, 'active', $4, now() - interval '1 minute')`,
        [`wpa-${acceptanceId}-${item.index}`, item.workspaceId, row.product_id, row.policy_version]
      );
      await admin.query(
        `insert into platform.workspace_entitlement (
           workspace_entitlement_id, workspace_id, product_id, entitlement_key,
           status, valid_from
         ) values ($1, $2, $3, 'research_agent_enabled', 'approved', now() - interval '1 minute')`,
        [`went-${acceptanceId}-${item.index}`, item.workspaceId, row.product_id]
      );
    }
    return { policyVersion: row.policy_version, productId: row.product_id };
  });
}

async function provisionFixtures(
  env: Required<FastClawRow10AcceptanceEnv>,
  fixtures: readonly Fixture[],
  acceptanceId: string
): Promise<void> {
  await waitForFastClawControlReady(env);
  const controlService = fastClawControlService(env);
  const results = [];
  // Provisioning is intentionally serialized. The acceptance concurrency
  // requirement starts at sandbox/model execution; fanning lifecycle writes
  // out here needlessly exhausts the shared staging PG connection budget.
  const client = new Client({
    connectionString: env.AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE.connectionString
  });
  await client.connect();
  const service = new ResearchAgentLifecycleService({
    remote: new FastClawLifecycleClient({
      adminApiKey: env.FASTCLAW_ADMIN_API_KEY,
      baseUrl: env.FASTCLAW_BASE_URL,
      fetch: (input, init) => controlService.fetch(input, init),
      templateAgentId: env.FASTCLAW_TEMPLATE_AGENT_ID,
      // The private Container's measured cold boot can exceed the client's
      // 20s interactive default. Row 10 must measure that boot rather than
      // aborting just before the port becomes ready, while remaining bounded.
      timeoutMs: 60_000
    }),
    repository: new PostgresResearchAgentLifecycleRepository(client)
  });
  try {
    for (const item of fixtures) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          results.push(
            await withAccountScope(client, item.accountId, () =>
              service.execute({
                accountId: item.accountId,
                intent: "activate",
                reason: "row10 credentialed live acceptance",
                requestId: `activate-${acceptanceId}-${item.index}`,
                workspaceId: item.workspaceId
              })
            )
          );
          break;
        } catch (error) {
          const code = (error as { code?: unknown })?.code;
          if (code === "53300" && attempt < 7) {
            await new Promise((resolveDelay) =>
              setTimeout(resolveDelay, Math.min(10_000, 2_000 * (attempt + 1)))
            );
            continue;
          }
          throw new Error(
            `ROW10_FASTCLAW_PROVISION_REQUEST_FAILED:${
              typeof code === "string" && /^[A-Z0-9_]{1,120}$/u.test(code) ? code : "unclassified"
            }`
          );
        }
      }
    }
  } finally {
    await client.end().catch(() => undefined);
  }
  const failed = results.find(
    (result) =>
      result.outcome !== "succeeded" ||
      result.lifecycle_status !== "active" ||
      result.sandbox_created !== false
  );
  if (failed !== undefined) {
    throw new Error(
      `ROW10_FASTCLAW_PROVISION_FAILED:${failed.outcome}:${failed.lifecycle_status}:${failed.error_code ?? "none"}`
    );
  }
}

async function waitForFastClawControlReady(
  env: Required<FastClawRow10AcceptanceEnv>
): Promise<void> {
  const deadline = Date.now() + 90_000;
  const controlService = fastClawControlService(env);
  let lastStatus = 0;
  let lastFailure = "none";
  while (Date.now() < deadline) {
    try {
      const response = await controlService.fetch(
        `${env.FASTCLAW_BASE_URL.replace(/\/+$/gu, "")}/api/status`,
        {
          headers: { authorization: `Bearer ${env.FASTCLAW_ADMIN_API_KEY}` },
          method: "GET",
          signal: AbortSignal.timeout(60_000)
        }
      );
      lastStatus = response.status;
      if (response.ok) {
        await response.body?.cancel().catch(() => undefined);
        return;
      }
      await response.body?.cancel().catch(() => undefined);
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      lastFailure =
        typeof code === "string" && /^[A-Z0-9_]{1,120}$/u.test(code)
          ? code
          : error instanceof DOMException && error.name === "TimeoutError"
            ? "TIMEOUT"
            : "FETCH_FAILED";
      // Read-only readiness may be retried; no provisioning side effect has run.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
  }
  throw new Error(`ROW10_FASTCLAW_CONTROL_NOT_READY_${lastStatus}_${lastFailure}`);
}

function parseExecResponse(body: string): { exitCode: number; stdout: string } {
  let stdout = "";
  let exitCode: number | undefined;
  for (const frame of body.split("\n\n")) {
    const lines = frame.split("\n");
    const event = lines.find((line) => line.startsWith("event: "))?.slice(7);
    const data = lines.find((line) => line.startsWith("data: "))?.slice(6);
    if (event === "stdout" && data !== undefined) stdout += atob(data);
    if (event === "exit" && data !== undefined) {
      const decoded = JSON.parse(data) as { exit_code?: unknown };
      if (typeof decoded.exit_code === "number" && Number.isSafeInteger(decoded.exit_code)) {
        exitCode = decoded.exit_code;
      }
    }
  }
  if (exitCode === undefined) throw new Error("ROW10_SANDBOX_EXEC_TERMINAL_MISSING");
  return { exitCode, stdout };
}

function commandFromCall(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const command = (input as Record<string, unknown>).command;
  return typeof command === "string" ? command : undefined;
}

async function bridgeJson(
  service: RuntimeFetcher,
  url: string,
  authorization: string,
  init: RequestInit
): Promise<{ body: Record<string, unknown>; response: Response }> {
  const response = await service.fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${authorization}` }
  });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  return { body: body ?? {}, response };
}

async function destroyAndReadback(
  env: Required<FastClawRow10AcceptanceEnv>,
  state: LiveRunState
): Promise<void> {
  if (state.authorization === undefined || state.sandboxId === undefined) {
    throw new Error("ROW10_SANDBOX_IDENTITY_MISSING");
  }
  const destroyed = await env.AIPHABEE_SANDBOX_BRIDGE.fetch(
    `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(state.sandboxId)}`,
    {
      headers: { authorization: `Bearer ${state.authorization}` },
      method: "DELETE"
    }
  );
  if (destroyed.status !== 204) throw new Error("ROW10_SANDBOX_DESTROY_FAILED");
  const status = await bridgeJson(
    env.AIPHABEE_SANDBOX_BRIDGE,
    `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(state.sandboxId)}/running`,
    state.authorization,
    { method: "GET" }
  );
  if (
    !status.response.ok ||
    status.body.running !== false ||
    status.body.terminal !== true
  ) {
    throw new Error("ROW10_SANDBOX_DESTROY_READBACK_FAILED");
  }
  state.destroyConfirmed = true;
}

async function runOne(
  env: Required<FastClawRow10AcceptanceEnv>,
  item: Fixture,
  acceptanceId: string,
  states: LiveRunState[],
  markCreated: () => void,
  awaitAllCreated: () => Promise<void>,
  client: Client
): Promise<void> {
  const state = states[item.index]!;
  let control: ReturnType<typeof createFastClawLiveControlPlane>;
  {
    const input: FastClawLiveControlPlaneInput = {
      artifact_scanner_service: env.AIPHABEE_SANDBOX_BRIDGE,
      artifact_scanner_shared_key: env.ARTIFACT_SCANNER_SHARED_KEY,
      client,
      durable_handoff_bucket: env.AIPHABEE_ARTIFACTS,
      fastclaw_admin_api_key: env.FASTCLAW_ADMIN_API_KEY,
      fastclaw_base_url: env.FASTCLAW_BASE_URL,
      fastclaw_control_service: fastClawControlService(env),
      post_check: {
        check: async ({ raw_answer }) =>
          raw_answer.trim().length === 0
            ? { code: "ROW10_EMPTY_FINAL", status: "denied" as const }
            : { final_answer: "row10-live-post-check-approved", status: "approved" as const }
      },
      sandbox_bridge_service: env.AIPHABEE_SANDBOX_BRIDGE,
      sandbox_token_secret: env.SANDBOX_RUN_HMAC_KEY,
      tool_policy_executor: {
        execute: async ({ call, sandbox_authorization }) => {
          let callbackPhase = "VALIDATE";
          try {
          if (call.name !== "exec" || commandFromCall(call.input) !== EXPECTED_COMMAND) {
            return { code: "ROW10_CONTROLLED_TOOL_MISMATCH", status: "denied" as const };
          }
          state.firstProgressMs ??= Date.now() - state.startedAt;
          state.authorization = sandbox_authorization;
          const createStartedAt = Date.now();
          callbackPhase = "SANDBOX_CREATE";
          let created: Awaited<ReturnType<typeof bridgeJson>> | undefined;
          for (let attempt = 0; attempt < 8; attempt += 1) {
            created = await bridgeJson(
              env.AIPHABEE_SANDBOX_BRIDGE,
              "https://sandbox-bridge/v1/sandbox",
              sandbox_authorization,
              { method: "POST" }
            );
            if (
              created.response.status === 201 &&
              typeof created.body.id === "string" &&
              created.body.id.length > 0
            ) {
              break;
            }
            if (![502, 503].includes(created.response.status) || attempt === 7) break;
            await new Promise((resolveDelay) =>
              setTimeout(resolveDelay, Math.min(20_000, 5_000 * (attempt + 1)))
            );
          }
          if (
            created === undefined ||
            created.response.status !== 201 ||
            typeof created.body.id !== "string" ||
            created.body.id.length === 0
          ) {
            const code = created?.body.error;
            const errorCode =
              typeof code === "object" &&
              code !== null &&
              typeof (code as { code?: unknown }).code === "string" &&
              /^[A-Z0-9_]{1,64}$/u.test((code as { code: string }).code)
                ? (code as { code: string }).code
                : "UNKNOWN";
            throw new Error(
              `ROW10_SANDBOX_CREATE_FAILED_${created?.response.status ?? 0}_${errorCode}`
            );
          }
          const providerInstanceHash = created.body.provider_instance_hash;
          if (
            typeof providerInstanceHash !== "string" ||
            !/^sha256:[0-9a-f]{64}$/u.test(providerInstanceHash)
          ) {
            throw new Error("ROW10_PROVIDER_INSTANCE_HASH_INVALID");
          }
          state.sandboxId = created.body.id;
          state.providerInstanceHash = providerInstanceHash;
          state.sandboxActiveFrom = new Date().toISOString();
          state.coldStartMs = Date.now() - createStartedAt;
          markCreated();
          let allSandboxesCreated = false;
          while (!allSandboxesCreated) {
            allSandboxesCreated = await Promise.race([
              awaitAllCreated().then(() => true),
              new Promise<false>((resolveDelay) =>
                setTimeout(() => resolveDelay(false), 45_000)
              )
            ]);
            if (!allSandboxesCreated) {
              callbackPhase = "SANDBOX_KEEPALIVE";
              const response = await env.AIPHABEE_SANDBOX_BRIDGE.fetch(
                `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(state.sandboxId)}/exec`,
                {
                  body: JSON.stringify({
                    argv: ["true"],
                    cwd: "/workspace",
                    timeout_ms: 10_000
                  }),
                  headers: {
                    authorization: `Bearer ${sandbox_authorization}`,
                    "content-type": "application/json"
                  },
                  method: "POST"
                }
              );
              const responseBody = await response.text();
              if (
                !response.ok ||
                !response.headers.get("content-type")?.startsWith("text/event-stream") ||
                parseExecResponse(responseBody).exitCode !== 0
              ) {
                throw new Error("ROW10_SANDBOX_KEEPALIVE_FAILED");
              }
            }
          }

          const other = states[(item.index + 1) % RUN_COUNT]?.sandboxId;
          callbackPhase = "CROSS_TENANT_PROBE";
          if (other === undefined) throw new Error("ROW10_CROSS_TENANT_TARGET_MISSING");
          const negative = await env.AIPHABEE_SANDBOX_BRIDGE.fetch(
            `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(other)}/running`,
            {
              headers: { authorization: `Bearer ${sandbox_authorization}` },
              method: "GET"
            }
          );
          if (negative.status !== 403) throw new Error("ROW10_CROSS_TENANT_PROBE_ALLOWED");
          state.crossTenantRejected = true;

          if (item.index === KILL_RUN_INDEX) {
            callbackPhase = "KILL";
            const killed = await control.run_killer.kill({
              reason: "row10 concurrent kill acceptance",
              request_id: `kill-${acceptanceId}`,
              run_id: item.runId,
              tenant_id: item.workspaceId,
              user_id: item.accountId
            });
            if (killed.status !== "killed" && killed.status !== "already_terminal") {
              throw new Error("ROW10_KILL_NOT_CONFIRMED");
            }
            state.killConfirmed = true;
            state.toolCallsSucceeded += 1;
            return { output: { killed: true }, status: "completed" as const };
          }

          callbackPhase = "SANDBOX_EXEC";
          const execution = await env.AIPHABEE_SANDBOX_BRIDGE.fetch(
            `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(state.sandboxId)}/exec`,
            {
              body: JSON.stringify({
                argv: ["sh", "-lc", EXPECTED_COMMAND],
                cwd: "/workspace",
                timeout_ms: 30_000
              }),
              headers: {
                authorization: `Bearer ${sandbox_authorization}`,
                "content-type": "application/json"
              },
              method: "POST"
            }
          );
          const executionBody = await execution.text();
          if (!execution.ok || !execution.headers.get("content-type")?.startsWith("text/event-stream")) {
            const failure = (() => {
              try {
                const parsed = JSON.parse(executionBody) as { error?: { code?: unknown } };
                return typeof parsed.error?.code === "string" && /^[A-Z0-9_]{1,64}$/u.test(parsed.error.code)
                  ? parsed.error.code
                  : "UNKNOWN";
              } catch {
                return "UNKNOWN";
              }
            })();
            throw new Error(`ROW10_SANDBOX_EXEC_FAILED_${execution.status}_${failure}`);
          }
          const exec = parseExecResponse(executionBody);
          if (exec.exitCode !== 0 || exec.stdout !== "row10-live-ok") {
            throw new Error("ROW10_SANDBOX_EXEC_OUTPUT_MISMATCH");
          }
          callbackPhase = "SANDBOX_FILE";
          const fileResponse = await env.AIPHABEE_SANDBOX_BRIDGE.fetch(
            `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(state.sandboxId)}/file/workspace/result.txt`,
            {
              headers: { authorization: `Bearer ${sandbox_authorization}` },
              method: "GET"
            }
          );
          const bytes = new Uint8Array(await fileResponse.arrayBuffer());
          if (!fileResponse.ok || new TextDecoder().decode(bytes) !== "row10-live-ok") {
            throw new Error("ROW10_SANDBOX_FILE_READBACK_FAILED");
          }
          const contentHash = await sha256Hex(bytes);
          const handoffContentHash = `sha256:${contentHash}`;
          callbackPhase = "ARTIFACT_SCAN";
          const scan = await control.artifact_scanner.scan({
            bytes,
            classification: "tenant_confidential",
            content_hash_sha256: contentHash,
            content_type: "text/plain",
            kind: "artifact"
          });
          if (scan.status !== "clean" || scan.classification !== "tenant_confidential") {
            throw new Error("ROW10_AUTHORITATIVE_SCAN_FAILED");
          }
          state.scanStatus = "clean";
          state.scanSignatureVersion = scan.signature_version;
          const handoffId = `handoff-${acceptanceId}-${item.index}`;
          const storageKey = `agent-handoff/v0/${item.workspaceId}/${item.accountId}/${item.runId}/artifact/${handoffId}-${contentHash}`;
          callbackPhase = "R2_PUT";
          await control.durable_handoff.object_store.put(storageKey, bytes, {
            contentType: "text/plain"
          });
          state.r2ClassAOperations += 1;
          callbackPhase = "R2_GET";
          const stored = await control.durable_handoff.object_store.get(storageKey);
          state.r2ClassBOperations += 1;
          if (
            stored === null ||
            (await sha256Hex(new Uint8Array(await stored.arrayBuffer()))) !== contentHash
          ) {
            throw new Error("ROW10_R2_HANDOFF_READBACK_FAILED");
          }
          const createdAt = new Date().toISOString();
          const record: DurableHandoffRecord = {
            approval: {
              approved_at: createdAt,
              approver: "row10-acceptance-policy",
              decision_id: `decision-${acceptanceId}-${item.index}`
            },
            byte_size: bytes.byteLength,
            classification: "tenant_confidential",
            content_hash_sha256: handoffContentHash,
            content_type: "text/plain",
            contract_version: "2026-07-11.durable-memory-artifact-handoff.v0",
            created_at: createdAt,
            deleted_at: null,
            evidence: { evidence_ids: [`evidence-${acceptanceId}-${item.index}`] },
            expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
            id: handoffId,
            kind: "artifact",
            lease_id: state.sandboxId,
            owner_user_id: item.accountId,
            provenance: {
              generated_at: createdAt,
              runner_id: "fastclaw.personal-v0",
              source: "sandbox",
              source_run_id: item.runId,
              tool_call_ids: [call.call_id],
              workspace_path: "result.txt"
            },
            retention_policy: "temporary_30d",
            run_id: item.runId,
            scan,
            storage_key: storageKey,
            tenant_id: item.workspaceId
          };
          try {
            callbackPhase = "METADATA_INSERT";
            await withFastClawPostgresClientLock(client, () =>
              withAccountScope(client, item.accountId, () =>
                control.durable_handoff.metadata_store.insert(record)
              )
            );
          } catch (error) {
            await control.durable_handoff.object_store.delete(storageKey).catch(() => undefined);
            throw error;
          }
          state.handoffConfirmed = true;
          state.toolCallsSucceeded += 1;
          return {
            output: { content_sha256: contentHash, status: "completed" },
            status: "completed" as const
          };
          } catch (error) {
            const message = error instanceof Error ? error.message : "ROW10_TOOL_CALLBACK_FAILED";
            const errorCode = (error as { code?: unknown })?.code;
            const errorName = error instanceof Error ? error.name.toUpperCase() : "UNKNOWN";
            state.toolFailureCode = /^[A-Z0-9_:.-]{1,160}$/u.test(message)
              ? message
              : typeof errorCode === "string" && /^[A-Za-z0-9_.-]{1,64}$/u.test(errorCode)
                ? `ROW10_${callbackPhase}_FAILED_${errorCode.toUpperCase()}`
                : /^[A-Z][A-Z0-9_]{0,63}$/u.test(errorName)
                  ? `ROW10_${callbackPhase}_FAILED_${errorName}`
                  : `ROW10_${callbackPhase}_FAILED_UNKNOWN`;
            throw error;
          }
        }
      },
      transport_error_observer: (code) => {
        state.transportFailureCode ??= code;
      }
    };
    control = createFastClawLiveControlPlane(input);
    const request: AgentExecutionRequest = {
      allowed_tools: ["exec"],
      budget: {
        max_credits: 1,
        max_parallel_tools: 1,
        max_rows: 1,
        max_steps: 8,
        max_tokens: 1_000,
        max_wall_clock_ms: CALLBACK_TIMEOUT_MS
      },
      context_refs: { acceptance_id: acceptanceId },
      layer: "research",
      mode: "runner_remote",
      prompt: `Call the exec tool exactly once with this exact command: ${EXPECTED_COMMAND}. After the tool result, answer with a short confirmation.`,
      request_id: `request-${acceptanceId}-${item.index}`,
      run_id: item.runId,
      tenant_id: item.workspaceId,
      user_id: item.accountId
    };
    const events: AgentExecutionEvent[] = [];
    for await (const event of control.runner.run(request)) events.push(event);
    const terminal = events.at(-1);
    if (terminal?.event_type !== "run.completed") {
      const detail = state.toolFailureCode ?? state.transportFailureCode;
      const toolFailure = detail === undefined ? "" : `:${detail}`;
      throw new Error(
        `ROW10_AGENT_RUN_FAILED:${String(terminal?.payload.code ?? "missing")}${toolFailure}`
      );
    }
    const usage = terminal.payload.usage as Record<string, unknown> | undefined;
    if (
      typeof usage?.input_tokens !== "number" ||
      typeof usage.output_tokens !== "number"
    ) {
      throw new Error("ROW10_MODEL_USAGE_MISSING");
    }
    state.modelInputTokens = usage.input_tokens;
    state.modelOutputTokens = usage.output_tokens;
    state.terminalState = item.index === KILL_RUN_INDEX ? "kill_switch" : "completed";
    if (item.index === KILL_RUN_INDEX) {
      const status = await bridgeJson(
        env.AIPHABEE_SANDBOX_BRIDGE,
        `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(state.sandboxId!)}/running`,
        state.authorization!,
        { method: "GET" }
      );
      if (!status.response.ok || status.body.running !== false || status.body.terminal !== true) {
        throw new Error("ROW10_KILL_READBACK_FAILED");
      }
      state.destroyConfirmed = true;
      state.sandboxActiveUntil = new Date().toISOString();
    } else {
      await destroyAndReadback(env, state);
      state.sandboxActiveUntil = new Date().toISOString();
    }
    state.durationMs = Date.now() - state.startedAt;
  }
}

async function prepareAcceptance(
  env: Required<FastClawRow10AcceptanceEnv>,
  acceptanceId: string
): Promise<Record<string, unknown>> {
  const fixtures = Array.from({ length: RUN_COUNT }, (_, index) => fixture(acceptanceId, index));
  const admin = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await admin.connect();
  let authority: { policyVersion: string; productId: string };
  try {
    authority = await phase("fixture_seed", () => seedFixtures(admin, acceptanceId, fixtures));
  } finally {
    await admin.end().catch(() => undefined);
  }
  await phase("agent_provision", () => provisionFixtures(env, fixtures, acceptanceId));
  return {
    acceptance_id_hash: `sha256:${await sha256Hex(acceptanceId)}`,
    fixture_authority_hash: `sha256:${await sha256Hex(
      `${authority.productId}\u0000${authority.policyVersion}`
    )}`,
    prepared_agents: RUN_COUNT,
    status: "prepared"
  };
}

async function runSingleAcceptance(
  env: Required<FastClawRow10AcceptanceEnv>,
  acceptanceId: string,
  index: number,
  releaseAt: string
): Promise<Record<string, unknown>> {
  if (!Number.isSafeInteger(index) || index < 0 || index >= RUN_COUNT) {
    throw new Error("ROW10_RUN_INDEX_INVALID");
  }
  const releaseAtMs = Date.parse(releaseAt);
  if (
    !Number.isFinite(releaseAtMs) ||
    releaseAtMs < Date.now() - 30_000 ||
    releaseAtMs > Date.now() + 12 * 60_000
  ) {
    throw new Error("ROW10_RELEASE_BARRIER_INVALID");
  }
  const fixtures = Array.from({ length: RUN_COUNT }, (_, itemIndex) =>
    fixture(acceptanceId, itemIndex)
  );
  const states = fixtures.map<LiveRunState>(() => ({
    r2ClassAOperations: 0,
    r2ClassBOperations: 0,
    startedAt: Date.now(),
    toolCallsSucceeded: 0
  }));
  for (const item of fixtures) {
    const issued = await phase("single_token_issue", () =>
      issueSandboxRunToken({
        maxCalls: 8,
        runId: item.runId,
        scopes: ["sandbox:create", "sandbox:destroy", "sandbox:exec", "sandbox:file", "sandbox:status"],
        secret: env.SANDBOX_RUN_HMAC_KEY,
        tenantId: item.workspaceId,
        ttlSeconds: 600,
        userId: item.accountId
      })
    );
    states[item.index]!.sandboxId = issued.sandbox_id;
  }
  const client = await phase("single_client_create", async () =>
    new Client({
      connectionString: env.AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE.connectionString
    })
  );
  await phase("single_runtime_connect", () => client.connect());
  try {
    await phase("single_run_execute", () =>
      runOne(
        env,
        fixtures[index]!,
        acceptanceId,
        states,
        () => undefined,
        () =>
          new Promise((resolveDelay) =>
            setTimeout(resolveDelay, Math.max(0, releaseAtMs - Date.now()))
          ),
        client
      )
    );
  } finally {
    await client.end().catch(() => undefined);
  }
  const item = fixtures[index]!;
  const state = states[index]!;
  if (
    state.coldStartMs === undefined ||
    state.firstProgressMs === undefined ||
    state.durationMs === undefined ||
    state.modelInputTokens === undefined ||
    state.modelOutputTokens === undefined ||
    state.providerInstanceHash === undefined ||
    state.sandboxId === undefined ||
    state.sandboxActiveFrom === undefined ||
    state.sandboxActiveUntil === undefined ||
    state.crossTenantRejected !== true ||
    state.destroyConfirmed !== true
  ) {
    throw new Error("ROW10_RUN_EVIDENCE_INCOMPLETE");
  }
  const runHash = `sha256:${await sha256Hex(item.runId)}`;
  console.info({
    component: "aiphabee_worker",
    event: "row10_worker_invocation",
    run_hash: runHash
  });
  return {
    account_hash: `sha256:${await sha256Hex(item.accountId)}`,
    cold_start_ms: state.coldStartMs,
    cross_tenant_rejected: true,
    destroy_confirmed: true,
    duration_ms: state.durationMs,
    first_progress_ms: state.firstProgressMs,
    handoff_confirmed: state.handoffConfirmed === true,
    kill_switch_confirmed: state.killConfirmed === true,
    model_input_tokens: state.modelInputTokens,
    model_output_tokens: state.modelOutputTokens,
    provider_instance_hash: state.providerInstanceHash,
    r2_class_a_operations: state.r2ClassAOperations,
    r2_class_b_operations: state.r2ClassBOperations,
    run_hash: runHash,
    sandbox_active_from: state.sandboxActiveFrom,
    sandbox_active_until: state.sandboxActiveUntil,
    sandbox_hash: `sha256:${await sha256Hex(state.sandboxId)}`,
    scan_signature_hash:
      state.scanSignatureVersion === undefined
        ? null
        : `sha256:${await sha256Hex(state.scanSignatureVersion)}`,
    scan_status: state.scanStatus ?? null,
    status: "run_captured",
    terminal_state: state.terminalState,
    tool_calls_succeeded: state.toolCallsSucceeded,
    workspace_hash: `sha256:${await sha256Hex(item.workspaceId)}`
  };
}

async function runAcceptance(
  env: Required<FastClawRow10AcceptanceEnv>,
  acceptanceId: string
): Promise<Record<string, unknown>> {
  const fixtures = Array.from({ length: RUN_COUNT }, (_, index) => fixture(acceptanceId, index));
  const admin = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await admin.connect();
  let authority: { policyVersion: string; productId: string };
  try {
    authority = await phase("fixture_seed", () => seedFixtures(admin, acceptanceId, fixtures));
  } finally {
    await admin.end().catch(() => undefined);
  }
  await phase("agent_provision", () => provisionFixtures(env, fixtures, acceptanceId));

  let createdCount = 0;
  let releaseCreated: (() => void) | undefined;
  const allCreated = new Promise<void>((resolve) => {
    releaseCreated = resolve;
  });
  const allCreatedWithTimeout = Promise.race([
    allCreated,
    new Promise<never>((_resolve, reject) =>
      setTimeout(() => reject(new Error("ROW10_CONCURRENT_CREATE_TIMEOUT")), 600_000)
    )
  ]);
  const states = fixtures.map<LiveRunState>(() => ({
    r2ClassAOperations: 0,
    r2ClassBOperations: 0,
    startedAt: Date.now(),
    toolCallsSucceeded: 0
  }));
  const awaitAllCreated = async () => {
    await allCreatedWithTimeout;
  };
  const runtimeClient = new Client({
    connectionString: env.AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE.connectionString
  });
  await runtimeClient.connect();
  try {
    await phase("concurrent_runs", async () => {
      let admissionError: unknown;
      const runs: Promise<{ error?: unknown; ok: boolean }>[] = [];
      for (let offset = 0; offset < fixtures.length; offset += 2) {
        const batch = fixtures.slice(offset, offset + 2);
        for (const item of batch) {
          runs.push(
            runOne(
              env,
              item,
              acceptanceId,
              states,
              () => {
                createdCount += 1;
                if (createdCount === RUN_COUNT) releaseCreated?.();
              },
              awaitAllCreated,
              runtimeClient
            ).then(
              () => ({ ok: true }),
              (error) => {
                admissionError ??= error;
                return { error, ok: false };
              }
            )
          );
        }
        const target = Math.min(offset + batch.length, RUN_COUNT);
        const admissionDeadline = Date.now() + 480_000;
        while (createdCount < target) {
          if (admissionError !== undefined) throw admissionError;
          if (Date.now() >= admissionDeadline) {
            throw new Error("ROW10_FASTCLAW_ADMISSION_TIMEOUT");
          }
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
        }
      }
      const results = await Promise.all(runs);
      const failed = results.find((result) => !result.ok);
      if (failed !== undefined) throw failed.error;
    });
  } finally {
    await runtimeClient.end().catch(() => undefined);
  }

  const redactedRuns = await Promise.all(
    fixtures.map(async (item) => {
      const state = states[item.index]!;
      if (
        state.coldStartMs === undefined ||
        state.firstProgressMs === undefined ||
        state.durationMs === undefined ||
        state.modelInputTokens === undefined ||
        state.modelOutputTokens === undefined ||
        state.providerInstanceHash === undefined ||
        state.sandboxId === undefined ||
        state.crossTenantRejected !== true ||
        state.destroyConfirmed !== true
      ) {
        throw new Error("ROW10_RUN_EVIDENCE_INCOMPLETE");
      }
      return {
        account_hash: `sha256:${await sha256Hex(item.accountId)}`,
        cold_start_ms: state.coldStartMs,
        cross_tenant_rejected: true,
        destroy_confirmed: true,
        duration_ms: state.durationMs,
        first_progress_ms: state.firstProgressMs,
        handoff_confirmed: state.handoffConfirmed === true,
        kill_switch_confirmed: state.killConfirmed === true,
        model_input_tokens: state.modelInputTokens,
        model_output_tokens: state.modelOutputTokens,
        provider_instance_hash: state.providerInstanceHash,
        r2_class_a_operations: state.r2ClassAOperations,
        r2_class_b_operations: state.r2ClassBOperations,
        run_hash: `sha256:${await sha256Hex(item.runId)}`,
        sandbox_hash: `sha256:${await sha256Hex(state.sandboxId)}`,
        scan_signature_hash:
          state.scanSignatureVersion === undefined
            ? null
            : `sha256:${await sha256Hex(state.scanSignatureVersion)}`,
        scan_status: state.scanStatus ?? null,
        terminal_state: state.terminalState,
        tool_calls_succeeded: state.toolCallsSucceeded,
        workspace_hash: `sha256:${await sha256Hex(item.workspaceId)}`
      };
    })
  );
  return {
    acceptance_id_hash: `sha256:${await sha256Hex(acceptanceId)}`,
    callback_contract: "2026-07-11.aiphabee-tool-callback.v1",
    concurrent_runs: RUN_COUNT,
    environment: "staging",
    fixture_authority_hash: `sha256:${await sha256Hex(
      `${authority.productId}\u0000${authority.policyVersion}`
    )}`,
    observed_at: new Date().toISOString(),
    runs: redactedRuns,
    status: "live_application_evidence_captured"
  };
}

async function cleanupAcceptance(
  env: Required<FastClawRow10AcceptanceEnv>,
  acceptanceId: string
): Promise<Record<string, unknown>> {
  const fixtures = Array.from({ length: RUN_COUNT }, (_, index) => fixture(acceptanceId, index));
  const admin = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await admin.connect();
  let userIds: string[] = [];
  let handoffKeys: string[] = [];
  let r2Usage: Array<{ byte_seconds: number; run_hash: string }> = [];
  try {
    userIds = await phase("cleanup_profile_read", async () => {
      const profiles = await admin.query<{ fastclaw_user_id: string | null }>(
        `select fastclaw_user_id from aiphabee_core.research_agent_profile
         where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      return profiles.rows.flatMap((row) =>
        row.fastclaw_user_id === null ? [] : [row.fastclaw_user_id]
      );
    });
    const handoffs = await phase("cleanup_handoff_read", () =>
      admin.query<{ byte_seconds: string; run_id: string; storage_key: string }>(
        `select storage_key, run_id,
                (byte_size * greatest(0, extract(epoch from now() - created_at)))::text
                  as byte_seconds
         from aiphabee_core.durable_agent_handoff
         where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      )
    );
    handoffKeys = handoffs.rows.map((row) => row.storage_key);
    r2Usage = await Promise.all(
      handoffs.rows.map(async (row) => ({
        byte_seconds: Number(row.byte_seconds),
        run_hash: `sha256:${await sha256Hex(row.run_id)}`
      }))
    );
    if (r2Usage.some((usage) => !Number.isFinite(usage.byte_seconds) || usage.byte_seconds < 0)) {
      throw new Error("ROW10_R2_USAGE_INVALID");
    }
  } finally {
    await admin.end().catch(() => undefined);
  }

  await phase("cleanup_r2_handoffs", async () => {
    const keys = new Set(handoffKeys);
    let cursor: string | undefined;
    do {
      const listed = await env.AIPHABEE_ARTIFACTS.list({
        ...(cursor === undefined ? {} : { cursor }),
        prefix: `agent-handoff/v0/ws-${acceptanceId}-`
      });
      for (const object of listed.objects) keys.add(object.key);
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor !== undefined);
    await Promise.all([...keys].map((key) => env.AIPHABEE_ARTIFACTS.delete(key)));
    for (const key of keys) {
      if ((await env.AIPHABEE_ARTIFACTS.get(key)) !== null) {
        throw new Error("ROW10_CLEANUP_R2_RESIDUAL_OBJECT");
      }
    }
  });

  const remote = new FastClawLifecycleClient({
    adminApiKey: env.FASTCLAW_ADMIN_API_KEY,
    baseUrl: env.FASTCLAW_BASE_URL,
    fetch: (input, init) => fastClawControlService(env).fetch(input, init),
    templateAgentId: env.FASTCLAW_TEMPLATE_AGENT_ID,
    timeoutMs: 60_000
  });
  await phase("cleanup_remote_users", async () => {
    for (const [index, userId] of userIds.entries()) {
      try {
        await remote.removeUser(userId);
      } catch (error) {
        const code = (error as { code?: unknown })?.code;
        // Recovery cleanup is intentionally idempotent: the failed live run
        // may already have removed a prefix of users before its cleanup job
        // was interrupted. A verified remote 404 is the desired terminal
        // state, not a reason to preserve synthetic staging fixtures.
        if (code === "FASTCLAW_NOT_FOUND") continue;
        throw new Error(
          `ROW10_REMOTE_USER_REMOVE_FAILED:${index}:${
            typeof code === "string" && /^[A-Z0-9_]{1,120}$/u.test(code)
              ? code
              : "unclassified"
          }`
        );
      }
    }
  });

  const sandboxReadback = await phase("cleanup_sandboxes", () =>
    Promise.all(fixtures.map(async (item) => {
      const issued = await issueSandboxRunToken({
        maxCalls: 64,
        runId: item.runId,
        scopes: ["sandbox:destroy", "sandbox:status"],
        secret: env.SANDBOX_RUN_HMAC_KEY,
        tenantId: item.workspaceId,
        ttlSeconds: 120,
        userId: item.accountId
      });
      const destroyed = await env.AIPHABEE_SANDBOX_BRIDGE.fetch(
        `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(issued.sandbox_id)}/kill`,
        {
          headers: { authorization: `Bearer ${issued.token}` },
          method: "POST"
        }
      );
      const destroyedBody = (await destroyed.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
      if (
        !destroyed.ok ||
        destroyedBody?.terminal !== true ||
        (destroyedBody.status !== "killed" && destroyedBody.status !== "already_terminal")
      ) {
        throw new Error("ROW10_CLEANUP_SANDBOX_DESTROY_FAILED");
      }
      const status = await bridgeJson(
        env.AIPHABEE_SANDBOX_BRIDGE,
        `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(issued.sandbox_id)}/running`,
        issued.token,
        { method: "GET" }
      );
      if (!status.response.ok || status.body.running !== false || status.body.terminal !== true) {
        throw new Error("ROW10_CLEANUP_SANDBOX_READBACK_FAILED");
      }
      await env.AIPHABEE_ARTIFACTS.delete(
        `row10/${acceptanceId}/${item.runId}/result.txt`
      );
      return `sha256:${await sha256Hex(issued.sandbox_id)}`;
    }))
  );

  const cleanup = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await cleanup.connect();
  let residualRows = -1;
  try {
    await phase("cleanup_database", () => withTransaction(cleanup, async () => {
      await cleanup.query(
        `delete from aiphabee_core.usage_ledger_entry where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(`delete from aiphabee_core.usage_event where workspace_id like $1`, [
        `ws-${acceptanceId}-%`
      ]);
      await cleanup.query(
        `delete from aiphabee_core.research_agent_run_usage where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from aiphabee_core.durable_agent_handoff where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from aiphabee_audit.research_agent_admin_event where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from aiphabee_audit.research_agent_lifecycle_event
         where profile_id in (
           select profile_id from aiphabee_core.research_agent_profile where workspace_id like $1
         )`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from aiphabee_core.research_agent_profile where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from platform.workspace_entitlement where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from platform.workspace_product_access where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from platform.workspace_subscription where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(
        `delete from platform.workspace_membership where workspace_id like $1`,
        [`ws-${acceptanceId}-%`]
      );
      await cleanup.query(`delete from platform.workspace where workspace_id like $1`, [
        `ws-${acceptanceId}-%`
      ]);
      await cleanup.query(`delete from platform.account where account_id like $1`, [
        `acct-${acceptanceId}-%`
      ]);
    }));
    const readback = await cleanup.query<{ count: string }>(
      `select (
        (select count(*) from platform.account where account_id like $1) +
        (select count(*) from platform.workspace where workspace_id like $2) +
        (select count(*) from aiphabee_core.research_agent_profile where workspace_id like $2) +
        (select count(*) from aiphabee_core.durable_agent_handoff where workspace_id like $2)
      )::text as count`,
      [`acct-${acceptanceId}-%`, `ws-${acceptanceId}-%`]
    );
    residualRows = Number(readback.rows[0]?.count ?? "-1");
  } finally {
    await cleanup.end().catch(() => undefined);
  }
  if (residualRows !== 0) throw new Error("ROW10_CLEANUP_RESIDUAL_ROWS");
  return {
    acceptance_id_hash: `sha256:${await sha256Hex(acceptanceId)}`,
    remote_users_removed: userIds.length,
    r2_objects_removed: handoffKeys.length,
    r2_usage: r2Usage,
    residual_rows: 0,
    sandbox_hashes: sandboxReadback,
    status: "cleanup_confirmed"
  };
}

export async function handleFastClawRow10AcceptanceRequest(
  request: Request,
  env: FastClawRow10AcceptanceEnv
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") {
    return json(200, {
      environment: env.APP_ENV ?? null,
      service: "fastclaw-row10-acceptance",
      status: env.APP_ENV === "staging" ? "ready" : "disabled"
    });
  }
  if (request.method === "POST" && url.pathname === "/internal/row10/auth-readback") {
    const authorizationMatches = await authorized(
      request,
      env.FASTCLAW_ROW10_ACCEPTANCE_TOKEN
    );
    return json(200, {
      authorization_matches: authorizationMatches,
      authorization_present: request.headers.has("authorization"),
      secret_configured:
        typeof env.FASTCLAW_ROW10_ACCEPTANCE_TOKEN === "string" &&
        env.FASTCLAW_ROW10_ACCEPTANCE_TOKEN.length >= 32,
      status: "auth_readback",
      vps_shared_token_hash:
        authorizationMatches && typeof env.FASTCLAW_VPS_SHARED_TOKEN === "string"
          ? `sha256:${await sha256Hex(env.FASTCLAW_VPS_SHARED_TOKEN)}`
          : null
    });
  }
  if (
    request.method !== "POST" ||
    ![
      "/internal/row10/prepare",
      "/internal/row10/run-all",
      "/internal/row10/run-one",
      "/internal/row10/cleanup"
    ].includes(url.pathname)
  ) {
    return json(404, { status: "not_found" });
  }
  if (!(await authorized(request, env.FASTCLAW_ROW10_ACCEPTANCE_TOKEN))) {
    return json(403, { status: "forbidden" });
  }
  const body = (await request.json().catch(() => null)) as {
    acceptance_id?: unknown;
    index?: unknown;
    release_at?: unknown;
  } | null;
  if (typeof body?.acceptance_id !== "string" || !ACCEPTANCE_ID.test(body.acceptance_id)) {
    return json(400, { status: "invalid_acceptance_id" });
  }
  const acceptanceId = body.acceptance_id;
  try {
    assertConfigured(env);
    const result =
      url.pathname === "/internal/row10/prepare"
        ? await prepareAcceptance(env, acceptanceId)
        : url.pathname === "/internal/row10/run-all"
          ? await phase("concurrent_run", () => runAcceptance(env, acceptanceId))
        : url.pathname === "/internal/row10/run-one"
          ? await runSingleAcceptance(
              env,
              acceptanceId,
              Number(body.index),
              String(body.release_at ?? "")
            )
          : await cleanupAcceptance(env, acceptanceId);
    return json(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ROW10_ACCEPTANCE_FAILED";
    return json(500, {
      error_hash: `sha256:${await sha256Hex(message)}`,
      failure_phase:
        error instanceof Row10AcceptancePhaseError ? error.phase : "unclassified",
      failure_code: /^[A-Za-z0-9_:.-]{1,320}$/u.test(message)
        ? message
        : "ROW10_ACCEPTANCE_FAILED",
      sqlstate:
        error instanceof Row10AcceptancePhaseError ? error.sqlstate : null,
      status: "failed"
    });
  }
}
