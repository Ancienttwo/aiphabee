import type { Client } from "pg";
import type { SandboxTerminalState } from "@aiphabee/agent-runtime";

import type { ResearchAgentLifecycleResult } from "./research-agent-lifecycle.js";
import type {
  ResearchAgentLifecycleIntent,
  ResearchAgentLifecycleStatus
} from "@aiphabee/agent-runtime/fastclaw-lifecycle";

export const RESEARCH_AGENT_PRODUCT_CONTROL_VERSION =
  "2026-07-11.research-agent-product-control.v0" as const;
export const FASTCLAW_USAGE_METER_RULE_ID =
  "meter_api_fastclaw_personal_agent_agent_run_credit" as const;
export const FASTCLAW_USAGE_METHODOLOGY_VERSION =
  "fastclaw-cost-pending-live-row10-v0" as const;

export type ResearchAgentUserState =
  | "blocked"
  | "disabled"
  | "provisioning"
  | "ready"
  | "retryable";

export interface ResearchAgentObservedUsage {
  account_id: string;
  credit_delta: number;
  measurement: "observed";
  methodology_version: string;
  model_input_tokens: number;
  model_output_tokens: number;
  occurred_at: string;
  request_id: string;
  rights_policy_version: string;
  run_id: string;
  sandbox_cpu_ms: number;
  sandbox_peak_disk_bytes: number;
  sandbox_peak_memory_bytes: number;
  sandbox_wall_clock_ms: number;
  source_record_id: string;
  storage_bytes_read: number;
  storage_bytes_written: number;
  storage_delete_ops: number;
  storage_read_ops: number;
  storage_write_ops: number;
  terminal_state: SandboxTerminalState;
  tool_calls_failed: number;
  tool_calls_succeeded: number;
  workspace_id: string;
}

export interface ResearchAgentUsageTotals {
  model_input_tokens: number;
  model_output_tokens: number;
  preview_credits: number;
  run_count: number;
  sandbox_cpu_ms: number;
  sandbox_wall_clock_ms: number;
  storage_bytes_read: number;
  storage_bytes_written: number;
  tool_calls_failed: number;
  tool_calls_succeeded: number;
}

export interface ResearchAgentStatusSnapshot {
  account_active: boolean;
  account_id: string | null;
  entitlement_approved: boolean;
  lifecycle_status: ResearchAgentLifecycleStatus | null;
  membership_active: boolean;
  plan_code: string | null;
  product_access_active: boolean;
  profile_exists: boolean;
  subscription_active: boolean;
  usage: ResearchAgentUsageTotals;
  workspace_active: boolean;
  workspace_id: string;
}

export interface ResearchAgentUserStatus {
  account_id: string | null;
  availability: {
    fastclaw_available: boolean;
    reason:
      | "active_profile_ready"
      | "disabled_or_not_provisioned"
      | "entitlement_or_account_blocked"
      | "lifecycle_in_progress"
      | "retry_required";
  };
  entitlement: {
    approved: boolean;
    plan_code: string | null;
  };
  lifecycle_status: ResearchAgentLifecycleStatus | null;
  routing: {
    default_runner_family: "edge";
    paid_plan_auto_selects_fastclaw: false;
    selected_runner_family: null;
    selection_owner: "agent_runtime";
  };
  state: ResearchAgentUserState;
  usage: ResearchAgentUsageTotals;
  version: typeof RESEARCH_AGENT_PRODUCT_CONTROL_VERSION;
  workspace_id: string;
}

export type ResearchAgentAdminAction = "delete" | "disable" | "kill" | "retry";
export type ResearchAgentAdminEventStatus = "denied" | "failed" | "started" | "succeeded";

export interface ResearchAgentAdminAuthority {
  actor_account_id: string;
  role: "admin" | "owner";
  workspace_id: string;
}

export interface ResearchAgentAdminTarget {
  account_exists: boolean;
  membership_active: boolean;
  profile_exists: boolean;
}

export interface ResearchAgentAdminEvent {
  action: ResearchAgentAdminAction;
  actor_account_id: string;
  created_at: string;
  error_code: string | null;
  reason: string;
  request_id: string;
  run_id: string | null;
  status: ResearchAgentAdminEventStatus;
  target_account_id: string;
  updated_at: string;
  workspace_id: string;
}

export interface ResearchAgentAdminActionInput {
  action: ResearchAgentAdminAction;
  actor_auth_subject: string;
  reason: string;
  request_id: string;
  run_id?: string;
  target_account_id: string;
  workspace_id: string;
}

export interface ResearchAgentAdminActionResult {
  action: ResearchAgentAdminAction;
  error_code: string | null;
  request_id: string;
  replayed: boolean;
  retryable: boolean;
  status: "denied" | "failed" | "succeeded";
  target_account_id: string;
  workspace_id: string;
}

export interface ResearchAgentLifecycleExecutor {
  execute(input: {
    accountId: string;
    intent: ResearchAgentLifecycleIntent;
    reason: string;
    requestId: string;
    workspaceId: string;
  }): Promise<ResearchAgentLifecycleResult>;
}

export interface ResearchAgentRunKiller {
  kill(input: {
    reason: string;
    request_id: string;
    run_id: string;
    tenant_id: string;
    user_id: string;
  }): Promise<{ status: "already_terminal" | "killed" }>;
}

export interface ResearchAgentProductControlRepository {
  beginAdminAction(
    authority: ResearchAgentAdminAuthority,
    input: ResearchAgentAdminActionInput
  ): Promise<{ event: ResearchAgentAdminEvent; replayed: boolean }>;
  finalizeAdminAction(input: {
    error_code: string | null;
    request_id: string;
    status: Exclude<ResearchAgentAdminEventStatus, "started">;
    workspace_id: string;
  }): Promise<ResearchAgentAdminEvent>;
  readAdminAudit(input: {
    actor_auth_subject: string;
    target_account_id?: string;
    workspace_id: string;
  }): Promise<readonly ResearchAgentAdminEvent[]>;
  readAdminAuthority(
    actorAuthSubject: string,
    workspaceId: string
  ): Promise<ResearchAgentAdminAuthority | null>;
  readAdminTarget(workspaceId: string, targetAccountId: string): Promise<ResearchAgentAdminTarget>;
  readStatusByAuthSubject(
    authSubject: string,
    workspaceId: string
  ): Promise<ResearchAgentStatusSnapshot>;
  recordObservedUsage(input: ResearchAgentObservedUsage): Promise<{
    replayed: boolean;
    usage: ResearchAgentObservedUsage;
  }>;
}

export class ResearchAgentProductControlInputError extends Error {
  readonly code:
    | "ADMIN_ACTION_INVALID"
    | "ADMIN_ACTION_REPLAY_MISMATCH"
    | "ADMIN_TARGET_INVALID"
    | "ADMIN_UNAUTHORIZED"
    | "AUTH_SUBJECT_INVALID"
    | "USAGE_INPUT_INVALID"
    | "USAGE_REPLAY_MISMATCH";

  constructor(code: ResearchAgentProductControlInputError["code"], message: string) {
    super(message);
    this.name = "ResearchAgentProductControlInputError";
    this.code = code;
  }
}

const AUTH_SUBJECT =
  /^better-auth:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const OPAQUE_ID = /^[A-Za-z0-9._:-]{1,200}$/u;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u;

function validText(value: string, maxLength = 500): boolean {
  return (
    value.length > 0 &&
    value.length <= maxLength &&
    value.trim() === value &&
    !CONTROL_CHARACTER.test(value)
  );
}

function validId(value: string): boolean {
  return OPAQUE_ID.test(value) && value !== "." && value !== "..";
}

function validAuthSubject(value: string): boolean {
  return AUTH_SUBJECT.test(value);
}

function safeCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function safeCredits(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

const SANDBOX_TERMINAL_STATES = new Set<SandboxTerminalState>([
  "client_cancelled",
  "completed",
  "create_failed",
  "execution_failed",
  "global_killed",
  "hard_timeout",
  "kill_switch",
  "soft_timeout",
  "stream_interrupted",
  "tenant_killed"
]);

function validateUsage(input: ResearchAgentObservedUsage): void {
  if (
    input.measurement !== "observed" ||
    !validId(input.account_id) ||
    !validId(input.workspace_id) ||
    !validId(input.request_id) ||
    !validId(input.run_id) ||
    input.methodology_version !== FASTCLAW_USAGE_METHODOLOGY_VERSION ||
    input.rights_policy_version !== "default_deny" ||
    !SANDBOX_TERMINAL_STATES.has(input.terminal_state) ||
    !validId(input.source_record_id) ||
    !Number.isFinite(Date.parse(input.occurred_at)) ||
    !safeCredits(input.credit_delta) ||
    input.credit_delta !== 0
  ) {
    throw new ResearchAgentProductControlInputError(
      "USAGE_INPUT_INVALID",
      "observed run usage identity, time, policy, source and credit fields are invalid"
    );
  }
  const counters = [
    input.model_input_tokens,
    input.model_output_tokens,
    input.sandbox_cpu_ms,
    input.sandbox_peak_disk_bytes,
    input.sandbox_peak_memory_bytes,
    input.sandbox_wall_clock_ms,
    input.storage_bytes_read,
    input.storage_bytes_written,
    input.storage_delete_ops,
    input.storage_read_ops,
    input.storage_write_ops,
    input.tool_calls_failed,
    input.tool_calls_succeeded
  ];
  if (counters.some((value) => !safeCount(value))) {
    throw new ResearchAgentProductControlInputError(
      "USAGE_INPUT_INVALID",
      "observed run usage counters must be non-negative safe integers"
    );
  }
}

function validateAdminInput(input: ResearchAgentAdminActionInput): void {
  if (
    !validAuthSubject(input.actor_auth_subject) ||
    !validId(input.workspace_id) ||
    !validId(input.target_account_id) ||
    !validId(input.request_id) ||
    !validText(input.reason)
  ) {
    throw new ResearchAgentProductControlInputError(
      "ADMIN_ACTION_INVALID",
      "admin action actor, target, request, workspace or reason is invalid"
    );
  }
  if (
    (input.action === "kill" && (input.run_id === undefined || !validId(input.run_id))) ||
    (input.action !== "kill" && input.run_id !== undefined)
  ) {
    throw new ResearchAgentProductControlInputError(
      "ADMIN_ACTION_INVALID",
      "kill requires one run_id and lifecycle actions must not include run_id"
    );
  }
}

function emptyUsage(): ResearchAgentUsageTotals {
  return {
    model_input_tokens: 0,
    model_output_tokens: 0,
    preview_credits: 0,
    run_count: 0,
    sandbox_cpu_ms: 0,
    sandbox_wall_clock_ms: 0,
    storage_bytes_read: 0,
    storage_bytes_written: 0,
    tool_calls_failed: 0,
    tool_calls_succeeded: 0
  };
}

export function projectResearchAgentUserStatus(
  snapshot: ResearchAgentStatusSnapshot
): ResearchAgentUserStatus {
  const authorityAllowed =
    snapshot.account_active &&
    snapshot.workspace_active &&
    snapshot.membership_active &&
    snapshot.subscription_active &&
    snapshot.product_access_active &&
    snapshot.entitlement_approved;
  let state: ResearchAgentUserState;
  let reason: ResearchAgentUserStatus["availability"]["reason"];
  if (!authorityAllowed) {
    state = "blocked";
    reason = "entitlement_or_account_blocked";
  } else if (snapshot.profile_exists && snapshot.lifecycle_status === "active") {
    state = "ready";
    reason = "active_profile_ready";
  } else if (snapshot.profile_exists && snapshot.lifecycle_status === "blocked_retryable") {
    state = "retryable";
    reason = "retry_required";
  } else if (
    snapshot.profile_exists &&
    (snapshot.lifecycle_status === "provision_pending" ||
      snapshot.lifecycle_status === "provisioning")
  ) {
    state = "provisioning";
    reason = "lifecycle_in_progress";
  } else {
    state = "disabled";
    reason = "disabled_or_not_provisioned";
  }
  return {
    account_id: snapshot.account_id,
    availability: {
      fastclaw_available: state === "ready",
      reason
    },
    entitlement: {
      approved: authorityAllowed,
      plan_code: snapshot.plan_code
    },
    lifecycle_status: snapshot.lifecycle_status,
    routing: {
      default_runner_family: "edge",
      paid_plan_auto_selects_fastclaw: false,
      selected_runner_family: null,
      selection_owner: "agent_runtime"
    },
    state,
    usage: snapshot.usage ?? emptyUsage(),
    version: RESEARCH_AGENT_PRODUCT_CONTROL_VERSION,
    workspace_id: snapshot.workspace_id
  };
}

function adminResult(
  event: ResearchAgentAdminEvent,
  replayed: boolean,
  retryable: boolean
): ResearchAgentAdminActionResult {
  return {
    action: event.action,
    error_code: event.error_code,
    request_id: event.request_id,
    replayed,
    retryable,
    status: event.status === "started" ? "failed" : event.status,
    target_account_id: event.target_account_id,
    workspace_id: event.workspace_id
  };
}

export class ResearchAgentProductControlService {
  constructor(
    private readonly dependencies: {
      lifecycle: ResearchAgentLifecycleExecutor;
      repository: ResearchAgentProductControlRepository;
      run_killer: ResearchAgentRunKiller;
    }
  ) {}

  async getUserStatus(input: {
    auth_subject: string;
    workspace_id: string;
  }): Promise<ResearchAgentUserStatus> {
    if (!validAuthSubject(input.auth_subject) || !validId(input.workspace_id)) {
      throw new ResearchAgentProductControlInputError(
        "AUTH_SUBJECT_INVALID",
        "status requires an exact Better Auth subject and workspace"
      );
    }
    return projectResearchAgentUserStatus(
      await this.dependencies.repository.readStatusByAuthSubject(
        input.auth_subject,
        input.workspace_id
      )
    );
  }

  async recordObservedUsage(input: ResearchAgentObservedUsage) {
    validateUsage(input);
    return this.dependencies.repository.recordObservedUsage(input);
  }

  async executeAdminAction(
    input: ResearchAgentAdminActionInput
  ): Promise<ResearchAgentAdminActionResult> {
    validateAdminInput(input);
    const authority = await this.dependencies.repository.readAdminAuthority(
      input.actor_auth_subject,
      input.workspace_id
    );
    if (authority === null) {
      throw new ResearchAgentProductControlInputError(
        "ADMIN_UNAUTHORIZED",
        "current owner or admin workspace membership is required"
      );
    }
    const target = await this.dependencies.repository.readAdminTarget(
      input.workspace_id,
      input.target_account_id
    );
    const targetAllowed =
      target.account_exists &&
      (input.action === "retry" ? target.membership_active : target.profile_exists);
    if (!targetAllowed) {
      throw new ResearchAgentProductControlInputError(
        "ADMIN_TARGET_INVALID",
        "admin target must be a current member for retry or own an exact workspace profile for control"
      );
    }
    const started = await this.dependencies.repository.beginAdminAction(authority, input);
    if (started.event.status !== "started") {
      return adminResult(
        started.event,
        true,
        started.event.status === "failed" && started.event.error_code === "ADMIN_DEPENDENCY_RETRYABLE"
      );
    }

    let status: "denied" | "failed" | "succeeded" = "succeeded";
    let errorCode: string | null = null;
    let retryable = false;
    try {
      if (input.action === "kill") {
        await this.dependencies.run_killer.kill({
          reason: input.reason,
          request_id: input.request_id,
          run_id: input.run_id!,
          tenant_id: input.workspace_id,
          user_id: input.target_account_id
        });
      } else {
        const intent: ResearchAgentLifecycleIntent =
          input.action === "retry" ? "activate" : input.action;
        const result = await this.dependencies.lifecycle.execute({
          accountId: input.target_account_id,
          intent,
          reason: input.reason,
          requestId: input.request_id,
          workspaceId: input.workspace_id
        });
        if (result.outcome !== "succeeded") {
          status = result.outcome === "denied" ? "denied" : "failed";
          errorCode = result.error_code ?? "ADMIN_LIFECYCLE_FAILED";
          retryable = result.retryable;
        }
      }
    } catch {
      status = "failed";
      errorCode = "ADMIN_DEPENDENCY_RETRYABLE";
      retryable = true;
    }
    const event = await this.dependencies.repository.finalizeAdminAction({
      error_code: errorCode,
      request_id: input.request_id,
      status,
      workspace_id: input.workspace_id
    });
    return adminResult(event, started.replayed, retryable);
  }

  async readAdminAudit(input: {
    actor_auth_subject: string;
    target_account_id?: string;
    workspace_id: string;
  }): Promise<readonly ResearchAgentAdminEvent[]> {
    if (
      !validAuthSubject(input.actor_auth_subject) ||
      !validId(input.workspace_id) ||
      (input.target_account_id !== undefined && !validId(input.target_account_id))
    ) {
      throw new ResearchAgentProductControlInputError(
        "ADMIN_ACTION_INVALID",
        "admin audit identity or filter is invalid"
      );
    }
    const authority = await this.dependencies.repository.readAdminAuthority(
      input.actor_auth_subject,
      input.workspace_id
    );
    if (authority === null) {
      throw new ResearchAgentProductControlInputError(
        "ADMIN_UNAUTHORIZED",
        "current owner or admin workspace membership is required"
      );
    }
    return this.dependencies.repository.readAdminAudit(input);
  }
}

export const RESEARCH_AGENT_PRODUCT_STATUS_SQL = `
with actor as (
  select platform.resolve_active_account_id_by_auth_subject($1) as account_id
), membership as (
  select wm.account_id, wm.workspace_id
  from platform.workspace_membership wm
  join actor on actor.account_id = wm.account_id
  where wm.workspace_id = $2
    and wm.status = 'active'
    and wm.valid_from <= now()
    and (wm.valid_to is null or wm.valid_to > now())
), subscription as (
  select ws.plan_code
  from platform.workspace_subscription ws
  join platform.subscription_plan sp on sp.plan_code = ws.plan_code and sp.status = 'active'
  where ws.workspace_id = $2
    and ws.billing_state in ('active', 'grace_period')
    and ws.valid_from <= now()
    and (ws.valid_to is null or ws.valid_to > now())
), product_access as (
  select 1
  from platform.workspace_product_access wpa
  join platform.product p on p.product_id = wpa.product_id
    and p.product_code = 'aiphabee' and p.status = 'active'
  join platform.entitlement_policy ep on ep.product_id = p.product_id
    and ep.policy_version = wpa.policy_version and ep.status = 'active'
    and (ep.effective_from is null or ep.effective_from <= now())
  where wpa.workspace_id = $2 and wpa.access_status in ('trialing', 'active')
    and wpa.valid_from <= now() and (wpa.valid_to is null or wpa.valid_to > now())
), entitlement as (
  select 1
  from platform.workspace_entitlement we
  join platform.product p on p.product_id = we.product_id
    and p.product_code = 'aiphabee' and p.status = 'active'
  where we.workspace_id = $2 and we.entitlement_key = 'research_agent_enabled'
    and we.status = 'approved' and we.valid_from <= now()
    and (we.valid_to is null or we.valid_to > now())
), profile as (
  select lifecycle_status
  from aiphabee_core.research_agent_profile
  where workspace_id = $2 and account_id = (select account_id from actor)
), usage_totals as (
  select
    count(*)::int as run_count,
    coalesce(sum(model_input_tokens), 0)::bigint as model_input_tokens,
    coalesce(sum(model_output_tokens), 0)::bigint as model_output_tokens,
    coalesce(sum(tool_calls_succeeded), 0)::bigint as tool_calls_succeeded,
    coalesce(sum(tool_calls_failed), 0)::bigint as tool_calls_failed,
    coalesce(sum(sandbox_wall_clock_ms), 0)::bigint as sandbox_wall_clock_ms,
    coalesce(sum(sandbox_cpu_ms), 0)::bigint as sandbox_cpu_ms,
    coalesce(sum(storage_bytes_written), 0)::bigint as storage_bytes_written,
    coalesce(sum(storage_bytes_read), 0)::bigint as storage_bytes_read,
    coalesce(sum(credit_delta), 0)::numeric as preview_credits
  from aiphabee_core.research_agent_run_usage
  where workspace_id = $2 and account_id = (select account_id from actor)
)
select
  (select account_id from actor) as account_id,
  exists(select 1 from platform.account a join actor on actor.account_id = a.account_id where a.status = 'active') as account_active,
  exists(select 1 from platform.workspace w where w.workspace_id = $2 and w.status = 'active') as workspace_active,
  exists(select 1 from membership) as membership_active,
  exists(select 1 from subscription) as subscription_active,
  (select plan_code from subscription) as plan_code,
  exists(select 1 from product_access) as product_access_active,
  exists(select 1 from entitlement) as entitlement_approved,
  exists(select 1 from profile) as profile_exists,
  (select lifecycle_status from profile) as lifecycle_status,
  usage_totals.*
from usage_totals`;

interface ProductStatusRow {
  account_active: boolean;
  account_id: string | null;
  entitlement_approved: boolean;
  lifecycle_status: ResearchAgentLifecycleStatus | null;
  membership_active: boolean;
  model_input_tokens: number | string;
  model_output_tokens: number | string;
  plan_code: string | null;
  preview_credits: number | string;
  product_access_active: boolean;
  profile_exists: boolean;
  run_count: number | string;
  sandbox_cpu_ms: number | string;
  sandbox_wall_clock_ms: number | string;
  storage_bytes_read: number | string;
  storage_bytes_written: number | string;
  subscription_active: boolean;
  tool_calls_failed: number | string;
  tool_calls_succeeded: number | string;
  workspace_active: boolean;
}

interface UsageRow {
  account_id: string;
  credit_delta: number | string;
  measurement: "observed";
  methodology_version: string;
  model_input_tokens: number | string;
  model_output_tokens: number | string;
  occurred_at: Date | string;
  request_id: string;
  rights_policy_version: string;
  run_id: string;
  sandbox_cpu_ms: number | string;
  sandbox_peak_disk_bytes: number | string;
  sandbox_peak_memory_bytes: number | string;
  sandbox_wall_clock_ms: number | string;
  source_record_id: string;
  storage_bytes_read: number | string;
  storage_bytes_written: number | string;
  storage_delete_ops: number | string;
  storage_read_ops: number | string;
  storage_write_ops: number | string;
  terminal_state: SandboxTerminalState;
  tool_calls_failed: number | string;
  tool_calls_succeeded: number | string;
  workspace_id: string;
}

interface AdminEventRow {
  action: ResearchAgentAdminAction;
  actor_account_id: string;
  created_at: Date | string;
  error_code: string | null;
  reason: string;
  request_id: string;
  run_id: string | null;
  status: ResearchAgentAdminEventStatus;
  target_account_id: string;
  updated_at: Date | string;
  workspace_id: string;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function number(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("invalid product-control numeric row");
  return parsed;
}

function toAdminEvent(row: AdminEventRow): ResearchAgentAdminEvent {
  return { ...row, created_at: iso(row.created_at), updated_at: iso(row.updated_at) };
}

function normalizeUsageRow(row: UsageRow): ResearchAgentObservedUsage {
  return {
    account_id: row.account_id,
    credit_delta: number(row.credit_delta),
    measurement: "observed",
    methodology_version: row.methodology_version,
    model_input_tokens: number(row.model_input_tokens),
    model_output_tokens: number(row.model_output_tokens),
    occurred_at: iso(row.occurred_at),
    request_id: row.request_id,
    rights_policy_version: row.rights_policy_version,
    run_id: row.run_id,
    sandbox_cpu_ms: number(row.sandbox_cpu_ms),
    sandbox_peak_disk_bytes: number(row.sandbox_peak_disk_bytes),
    sandbox_peak_memory_bytes: number(row.sandbox_peak_memory_bytes),
    sandbox_wall_clock_ms: number(row.sandbox_wall_clock_ms),
    source_record_id: row.source_record_id,
    storage_bytes_read: number(row.storage_bytes_read),
    storage_bytes_written: number(row.storage_bytes_written),
    storage_delete_ops: number(row.storage_delete_ops),
    storage_read_ops: number(row.storage_read_ops),
    storage_write_ops: number(row.storage_write_ops),
    terminal_state: row.terminal_state,
    tool_calls_failed: number(row.tool_calls_failed),
    tool_calls_succeeded: number(row.tool_calls_succeeded),
    workspace_id: row.workspace_id
  };
}

function usageMatches(left: ResearchAgentObservedUsage, right: ResearchAgentObservedUsage): boolean {
  const values = (usage: ResearchAgentObservedUsage) => [
    usage.account_id,
    usage.credit_delta,
    usage.measurement,
    usage.methodology_version,
    usage.model_input_tokens,
    usage.model_output_tokens,
    usage.occurred_at,
    usage.request_id,
    usage.rights_policy_version,
    usage.run_id,
    usage.sandbox_cpu_ms,
    usage.sandbox_peak_disk_bytes,
    usage.sandbox_peak_memory_bytes,
    usage.sandbox_wall_clock_ms,
    usage.source_record_id,
    usage.storage_bytes_read,
    usage.storage_bytes_written,
    usage.storage_delete_ops,
    usage.storage_read_ops,
    usage.storage_write_ops,
    usage.terminal_state,
    usage.tool_calls_failed,
    usage.tool_calls_succeeded,
    usage.workspace_id
  ];
  return JSON.stringify(values(left)) === JSON.stringify(values(right));
}

const ADMIN_EVENT_COLUMNS = `action, actor_account_id, created_at, error_code, reason,
  request_id, run_id, status, target_account_id, updated_at, workspace_id`;
const USAGE_COLUMNS = `account_id, credit_delta, measurement, methodology_version,
  model_input_tokens, model_output_tokens, occurred_at, request_id,
  rights_policy_version, run_id, sandbox_cpu_ms, sandbox_peak_disk_bytes,
  sandbox_peak_memory_bytes, sandbox_wall_clock_ms, source_record_id,
  storage_bytes_read, storage_bytes_written, storage_delete_ops,
  storage_read_ops, storage_write_ops, terminal_state, tool_calls_failed,
  tool_calls_succeeded, workspace_id`;

export class PostgresResearchAgentProductControlRepository
  implements ResearchAgentProductControlRepository
{
  constructor(private readonly client: Client) {}

  async readStatusByAuthSubject(
    authSubject: string,
    workspaceId: string
  ): Promise<ResearchAgentStatusSnapshot> {
    const result = await this.client.query<ProductStatusRow>(
      RESEARCH_AGENT_PRODUCT_STATUS_SQL,
      [authSubject, workspaceId]
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error("research Agent product status returned no row");
    return {
      account_active: row.account_active,
      account_id: row.account_id,
      entitlement_approved: row.entitlement_approved,
      lifecycle_status: row.lifecycle_status,
      membership_active: row.membership_active,
      plan_code: row.plan_code,
      product_access_active: row.product_access_active,
      profile_exists: row.profile_exists,
      subscription_active: row.subscription_active,
      usage: {
        model_input_tokens: number(row.model_input_tokens),
        model_output_tokens: number(row.model_output_tokens),
        preview_credits: number(row.preview_credits),
        run_count: number(row.run_count),
        sandbox_cpu_ms: number(row.sandbox_cpu_ms),
        sandbox_wall_clock_ms: number(row.sandbox_wall_clock_ms),
        storage_bytes_read: number(row.storage_bytes_read),
        storage_bytes_written: number(row.storage_bytes_written),
        tool_calls_failed: number(row.tool_calls_failed),
        tool_calls_succeeded: number(row.tool_calls_succeeded)
      },
      workspace_active: row.workspace_active,
      workspace_id: workspaceId
    };
  }

  async recordObservedUsage(input: ResearchAgentObservedUsage) {
    const existing = await this.readUsage(input.workspace_id, input.run_id);
    if (existing !== null) {
      if (!usageMatches(input, existing)) {
        throw new ResearchAgentProductControlInputError(
          "USAGE_REPLAY_MISMATCH",
          "run usage replay does not match the original observed measurement"
        );
      }
      return { replayed: true, usage: input };
    }
    const usageEventId = `usage_event_fastclaw_${input.run_id}`;
    const ledgerEntryId = `usage_ledger_entry_fastclaw_${input.run_id}`;
    await this.client.query("begin");
    try {
      await this.client.query(
        `insert into aiphabee_core.usage_event (
          usage_event_id, request_id, run_id, workspace_id, account_id, channel,
          dataset, operation, occurred_at, input_units, output_units, cache_state,
          quality_state, data_version, methodology_version, rights_policy_version,
          source_record_id
        ) values ($1, $2, $3, $4, $5, 'api', 'fastclaw_personal_agent',
          'agent_run', $6, $7, $8, 'not_applicable',
          case when $12 = 'completed' then 'PASS' else 'HOLD' end,
          'fastclaw-personal-v0', $9, $10, $11)
        on conflict (usage_event_id) do nothing`,
        [
          usageEventId,
          input.request_id,
          input.run_id,
          input.workspace_id,
          input.account_id,
          input.occurred_at,
          input.model_input_tokens,
          input.model_output_tokens,
          input.methodology_version,
          input.rights_policy_version,
          input.source_record_id,
          input.terminal_state
        ]
      );
      await this.client.query(
        `insert into aiphabee_core.usage_ledger_entry (
          ledger_entry_id, usage_event_id, workspace_id, account_id, meter_rule_id,
          credit_delta, billable_state, source_record_id
        ) values ($1, $2, $3, $4, $5, $6, 'preview', $7)
        on conflict (usage_event_id, meter_rule_id) do nothing`,
        [
          ledgerEntryId,
          usageEventId,
          input.workspace_id,
          input.account_id,
          FASTCLAW_USAGE_METER_RULE_ID,
          input.credit_delta,
          input.source_record_id
        ]
      );
      const inserted = await this.client.query<UsageRow>(
        `insert into aiphabee_core.research_agent_run_usage (
          ${USAGE_COLUMNS}, usage_event_id, ledger_entry_id
        ) values (
          $1, $2, 'observed', $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
          $24, $25
        ) on conflict (workspace_id, run_id) do nothing
        returning ${USAGE_COLUMNS}`,
        [
          input.account_id,
          input.credit_delta,
          input.methodology_version,
          input.model_input_tokens,
          input.model_output_tokens,
          input.occurred_at,
          input.request_id,
          input.rights_policy_version,
          input.run_id,
          input.sandbox_cpu_ms,
          input.sandbox_peak_disk_bytes,
          input.sandbox_peak_memory_bytes,
          input.sandbox_wall_clock_ms,
          input.source_record_id,
          input.storage_bytes_read,
          input.storage_bytes_written,
          input.storage_delete_ops,
          input.storage_read_ops,
          input.storage_write_ops,
          input.terminal_state,
          input.tool_calls_failed,
          input.tool_calls_succeeded,
          input.workspace_id,
          usageEventId,
          ledgerEntryId
        ]
      );
      const stored =
        inserted.rows[0] === undefined
          ? await this.readUsage(input.workspace_id, input.run_id)
          : normalizeUsageRow(inserted.rows[0]);
      if (stored === null || !usageMatches(input, stored)) {
        throw new ResearchAgentProductControlInputError(
          "USAGE_REPLAY_MISMATCH",
          "concurrent run usage does not match the original observed measurement"
        );
      }
      await this.client.query("commit");
      return { replayed: inserted.rows.length === 0, usage: input };
    } catch (error) {
      await this.client.query("rollback").catch(() => undefined);
      throw error;
    }
  }

  private async readUsage(
    workspaceId: string,
    runId: string
  ): Promise<ResearchAgentObservedUsage | null> {
    const result = await this.client.query<UsageRow>(
      `select ${USAGE_COLUMNS}
      from aiphabee_core.research_agent_run_usage
      where workspace_id = $1 and run_id = $2
      limit 1`,
      [workspaceId, runId]
    );
    return result.rows[0] === undefined ? null : normalizeUsageRow(result.rows[0]);
  }

  async readAdminAuthority(actorAuthSubject: string, workspaceId: string) {
    const result = await this.client.query<{
      actor_account_id: string;
      role: "admin" | "owner";
      workspace_id: string;
    }>(
      `with actor as (
        select platform.resolve_active_account_id_by_auth_subject($1) as account_id
      )
      select actor.account_id as actor_account_id,
        case when bool_or(wm.role = 'owner') then 'owner' else 'admin' end as role,
        wm.workspace_id
      from actor
      join platform.workspace_membership wm on wm.account_id = actor.account_id
      where wm.workspace_id = $2 and wm.role in ('owner', 'admin')
        and wm.status = 'active' and wm.valid_from <= now()
        and (wm.valid_to is null or wm.valid_to > now())
      group by actor.account_id, wm.workspace_id`,
      [actorAuthSubject, workspaceId]
    );
    return result.rows[0] ?? null;
  }

  async readAdminTarget(workspaceId: string, targetAccountId: string) {
    const result = await this.client.query<ResearchAgentAdminTarget>(
      `select
        exists(select 1 from platform.account where account_id = $2) as account_exists,
        exists(
          select 1 from platform.workspace_membership
          where workspace_id = $1 and account_id = $2 and status = 'active'
            and valid_from <= now() and (valid_to is null or valid_to > now())
        ) as membership_active,
        exists(
          select 1 from aiphabee_core.research_agent_profile
          where workspace_id = $1 and account_id = $2 and lifecycle_status <> 'deleted'
        ) as profile_exists`,
      [workspaceId, targetAccountId]
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error("admin target authority returned no row");
    return row;
  }

  async beginAdminAction(
    authority: ResearchAgentAdminAuthority,
    input: ResearchAgentAdminActionInput
  ) {
    await this.client.query(
      `insert into aiphabee_audit.research_agent_admin_event (
        request_id, workspace_id, actor_account_id, target_account_id, action,
        run_id, reason, status
      ) values ($1, $2, $3, $4, $5, $6, $7, 'started')
      on conflict (workspace_id, request_id) do nothing`,
      [
        input.request_id,
        input.workspace_id,
        authority.actor_account_id,
        input.target_account_id,
        input.action,
        input.run_id ?? null,
        input.reason
      ]
    );
    const result = await this.client.query<AdminEventRow>(
      `select ${ADMIN_EVENT_COLUMNS}
      from aiphabee_audit.research_agent_admin_event
      where workspace_id = $1 and request_id = $2 limit 1`,
      [input.workspace_id, input.request_id]
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error("admin event missing after begin");
    if (
      row.actor_account_id !== authority.actor_account_id ||
      row.target_account_id !== input.target_account_id ||
      row.action !== input.action ||
      row.run_id !== (input.run_id ?? null) ||
      row.reason !== input.reason
    ) {
      throw new ResearchAgentProductControlInputError(
        "ADMIN_ACTION_REPLAY_MISMATCH",
        "admin request ID is already bound to a different action"
      );
    }
    return { event: toAdminEvent(row), replayed: row.status !== "started" };
  }

  async finalizeAdminAction(input: {
    error_code: string | null;
    request_id: string;
    status: Exclude<ResearchAgentAdminEventStatus, "started">;
    workspace_id: string;
  }) {
    const result = await this.client.query<AdminEventRow>(
      `update aiphabee_audit.research_agent_admin_event
      set status = $3, error_code = $4, updated_at = now()
      where workspace_id = $1 and request_id = $2 and status = 'started'
      returning ${ADMIN_EVENT_COLUMNS}`,
      [input.workspace_id, input.request_id, input.status, input.error_code]
    );
    if (result.rows[0] !== undefined) return toAdminEvent(result.rows[0]);
    const replay = await this.client.query<AdminEventRow>(
      `select ${ADMIN_EVENT_COLUMNS}
      from aiphabee_audit.research_agent_admin_event
      where workspace_id = $1 and request_id = $2 limit 1`,
      [input.workspace_id, input.request_id]
    );
    if (replay.rows[0] === undefined) throw new Error("admin event missing after finalize");
    return toAdminEvent(replay.rows[0]);
  }

  async readAdminAudit(input: {
    actor_auth_subject: string;
    target_account_id?: string;
    workspace_id: string;
  }) {
    const result = await this.client.query<AdminEventRow>(
      `select ${ADMIN_EVENT_COLUMNS}
      from aiphabee_audit.research_agent_admin_event
      where workspace_id = $1 and ($2::text is null or target_account_id = $2)
      order by created_at desc, request_id desc
      limit 200`,
      [input.workspace_id, input.target_account_id ?? null]
    );
    return result.rows.map(toAdminEvent);
  }
}
