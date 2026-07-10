import { Client } from "pg";

import {
  FastClawLifecycleClient,
  FastClawLifecycleError,
  deriveFastClawAgentExternalIdentity,
  deriveFastClawExternalIdentity,
  desiredStateForIntent,
  hashLifecycleReference,
  pendingStatusForIntent,
  terminalStatusForIntent,
  type FastClawProvisionedAgent,
  type FastClawProvisionedUser,
  type FastClawUserStatus,
  type ResearchAgentDesiredState,
  type ResearchAgentLifecycleIntent,
  type ResearchAgentLifecycleStatus
} from "@aiphabee/agent-runtime/fastclaw-lifecycle";

const LIFECYCLE_LEASE_SECONDS = 45;

export interface ResearchAgentLifecycleRequest {
  accountId: string;
  intent: ResearchAgentLifecycleIntent;
  reason: string;
  requestId: string;
  workspaceId: string;
}

export interface ResearchAgentAuthoritySnapshot {
  account_exists: boolean;
  account_status?: "active" | "closed" | "suspended";
  activate_allowed: boolean;
  entitlement_approved: boolean;
  membership_active: boolean;
  product_access_active: boolean;
  subscription_active: boolean;
  workspace_exists: boolean;
  workspace_status?: "active" | "closed" | "suspended";
}

export interface ResearchAgentLifecycleProfile {
  account_id: string;
  attempt_count: number;
  desired_state: ResearchAgentDesiredState;
  external_identity: string;
  fastclaw_agent_id?: string;
  fastclaw_user_id?: string;
  lifecycle_status: ResearchAgentLifecycleStatus;
  profile_id: string;
  workspace_id: string;
}

export type ResearchAgentLifecycleOutcome =
  | "succeeded"
  | "denied"
  | "conflict"
  | "retryable_failure"
  | "internal_failure";

export interface ResearchAgentLifecycleEvent {
  error_code?: string;
  fastclaw_agent_id_hash?: string;
  fastclaw_user_id_hash?: string;
  intent: ResearchAgentLifecycleIntent;
  outcome: ResearchAgentLifecycleOutcome;
  profile_id: string;
  request_id: string;
  to_status: ResearchAgentLifecycleStatus;
}

interface EventWriteInput {
  errorCode?: string;
  fastclawAgentId?: string;
  fastclawUserId?: string;
  fromStatus?: ResearchAgentLifecycleStatus;
  intent: ResearchAgentLifecycleIntent;
  outcome: ResearchAgentLifecycleOutcome;
  profile: ResearchAgentLifecycleProfile;
  reason: string;
  requestId: string;
}

export interface ResearchAgentLifecycleRepository {
  readAuthority(accountId: string, workspaceId: string): Promise<ResearchAgentAuthoritySnapshot>;
  readEvent(profileId: string, requestId: string): Promise<ResearchAgentLifecycleEvent | undefined>;
  claim(input: {
    accountId: string;
    desiredState: ResearchAgentDesiredState;
    externalIdentity: string;
    intent: ResearchAgentLifecycleIntent;
    pendingStatus: ResearchAgentLifecycleStatus;
    profileId: string;
    requestId: string;
    workspaceId: string;
  }): Promise<
    | { kind: "busy" }
    | { kind: "terminal"; profile: ResearchAgentLifecycleProfile }
    | {
        kind: "claimed";
        previousStatus?: ResearchAgentLifecycleStatus;
        profile: ResearchAgentLifecycleProfile;
      }
  >;
  recordDenied(input: {
    accountId: string;
    errorCode: string;
    externalIdentity: string;
    intent: ResearchAgentLifecycleIntent;
    outcome: "denied";
    profileId: string;
    reason: string;
    requestId: string;
    workspaceId: string;
  }): Promise<ResearchAgentLifecycleEvent>;
  recordTerminal(input: EventWriteInput): Promise<ResearchAgentLifecycleEvent>;
  finalizeSuccess(input: EventWriteInput & {
    fastclawAgentId?: string;
    fastclawUserId?: string;
    terminalStatus: ResearchAgentLifecycleStatus;
  }): Promise<{ event: ResearchAgentLifecycleEvent; profile: ResearchAgentLifecycleProfile }>;
  finalizeFailure(input: EventWriteInput): Promise<{
    event: ResearchAgentLifecycleEvent;
    profile: ResearchAgentLifecycleProfile;
  }>;
}

export interface FastClawLifecycleRemote {
  provisionAgent(userId: string, externalIdentity: string): Promise<FastClawProvisionedAgent>;
  provisionUser(externalIdentity: string): Promise<FastClawProvisionedUser>;
  removeUser(userId: string): Promise<{ already_absent: boolean }>;
  setUserStatus(userId: string, status: FastClawUserStatus): Promise<{ status: FastClawUserStatus }>;
}

export interface ResearchAgentLifecycleResult {
  desired_state: ResearchAgentDesiredState;
  error_code?: string;
  fastclaw_agent_id_hash?: string;
  fastclaw_user_id_hash?: string;
  lifecycle_status: ResearchAgentLifecycleStatus;
  outcome: ResearchAgentLifecycleOutcome;
  profile_id: string;
  request_id: string;
  retryable: boolean;
  sandbox_created: false;
}

export class ResearchAgentLifecycleInputError extends Error {
  readonly code = "INVALID_LIFECYCLE_INPUT";

  constructor(message: string) {
    super(message);
    this.name = "ResearchAgentLifecycleInputError";
  }
}

class ResearchAgentRemoteReconcileError extends Error {
  constructor(
    readonly remoteCause: unknown,
    readonly fastclawUserId?: string,
    readonly fastclawAgentId?: string
  ) {
    super("FastClaw reconciliation failed after a partial remote transition");
    this.name = "ResearchAgentRemoteReconcileError";
  }
}

export class ResearchAgentLifecycleService {
  private readonly remote: FastClawLifecycleRemote;
  private readonly repository: ResearchAgentLifecycleRepository;

  constructor(input: {
    remote: FastClawLifecycleRemote;
    repository: ResearchAgentLifecycleRepository;
  }) {
    this.remote = input.remote;
    this.repository = input.repository;
  }

  async execute(request: ResearchAgentLifecycleRequest): Promise<ResearchAgentLifecycleResult> {
    const externalIdentity = await deriveFastClawExternalIdentity(
      request.workspaceId,
      request.accountId
    );
    const agentExternalIdentity = await deriveFastClawAgentExternalIdentity(
      request.workspaceId,
      request.accountId
    );
    const profileId = `research_agent_profile_${externalIdentity.slice("aiphabee:v1:".length)}`;
    const desiredState = desiredStateForIntent(request.intent);
    const replay = await this.repository.readEvent(profileId, request.requestId);
    if (replay !== undefined) {
      if (replay.intent !== request.intent) {
        return {
          desired_state: desiredState,
          error_code: "LIFECYCLE_REQUEST_MISMATCH",
          lifecycle_status: replay.to_status,
          outcome: "conflict",
          profile_id: profileId,
          request_id: request.requestId,
          retryable: false,
          sandbox_created: false
        };
      }
      return resultFromEvent(replay, desiredState);
    }

    const authority = await this.repository.readAuthority(request.accountId, request.workspaceId);
    const deniedCode = preconditionDenial(request.intent, authority);
    if (deniedCode !== undefined) {
      if (deniedCode === "ACCOUNT_NOT_FOUND" || deniedCode === "WORKSPACE_NOT_FOUND") {
        return {
          desired_state: "disabled",
          error_code: deniedCode,
          lifecycle_status: "disabled",
          outcome: "denied",
          profile_id: profileId,
          request_id: request.requestId,
          retryable: false,
          sandbox_created: false
        };
      }
      const event = await this.repository.recordDenied({
        accountId: request.accountId,
        errorCode: deniedCode,
        externalIdentity,
        intent: request.intent,
        outcome: "denied",
        profileId,
        reason: request.reason,
        requestId: request.requestId,
        workspaceId: request.workspaceId
      });
      return resultFromEvent(event, desiredState);
    }

    const claim = await this.repository.claim({
      accountId: request.accountId,
      desiredState,
      externalIdentity,
      intent: request.intent,
      pendingStatus: pendingStatusForIntent(request.intent),
      profileId,
      requestId: request.requestId,
      workspaceId: request.workspaceId
    });
    if (claim.kind === "busy") {
      return {
        desired_state: desiredState,
        error_code: "LIFECYCLE_LEASE_BUSY",
        lifecycle_status: pendingStatusForIntent(request.intent),
        outcome: "conflict",
        profile_id: profileId,
        request_id: request.requestId,
        retryable: true,
        sandbox_created: false
      };
    }
    if (claim.kind === "terminal") {
      const event = await this.repository.recordTerminal({
        fastclawAgentId: claim.profile.fastclaw_agent_id,
        fastclawUserId: claim.profile.fastclaw_user_id,
        fromStatus: claim.profile.lifecycle_status,
        intent: request.intent,
        outcome: "succeeded",
        profile: claim.profile,
        reason: request.reason,
        requestId: request.requestId
      });
      return resultFromEvent(event, desiredState);
    }

    try {
      const remoteState = await this.reconcileRemote(
        request.intent,
        claim.profile,
        externalIdentity,
        agentExternalIdentity
      );
      const completed = await this.repository.finalizeSuccess({
        fastclawAgentId: remoteState.fastclawAgentId,
        fastclawUserId: remoteState.fastclawUserId,
        fromStatus: claim.previousStatus,
        intent: request.intent,
        outcome: "succeeded",
        profile: claim.profile,
        reason: request.reason,
        requestId: request.requestId,
        terminalStatus: terminalStatusForIntent(request.intent)
      });
      return resultFromEvent(completed.event, desiredState);
    } catch (error) {
      const remoteError =
        error instanceof ResearchAgentRemoteReconcileError ? error.remoteCause : error;
      const code =
        remoteError instanceof FastClawLifecycleError
          ? remoteError.code
          : "RESEARCH_AGENT_LIFECYCLE_FAILED";
      const outcome =
        remoteError instanceof FastClawLifecycleError && remoteError.retryable
          ? "retryable_failure"
          : "internal_failure";
      const completed = await this.repository.finalizeFailure({
        errorCode: code,
        fastclawAgentId:
          error instanceof ResearchAgentRemoteReconcileError
            ? error.fastclawAgentId
            : claim.profile.fastclaw_agent_id,
        fastclawUserId:
          error instanceof ResearchAgentRemoteReconcileError
            ? error.fastclawUserId
            : claim.profile.fastclaw_user_id,
        fromStatus: claim.previousStatus,
        intent: request.intent,
        outcome,
        profile: claim.profile,
        reason: request.reason,
        requestId: request.requestId
      });
      return resultFromEvent(completed.event, desiredState);
    }
  }

  private async reconcileRemote(
    intent: ResearchAgentLifecycleIntent,
    profile: ResearchAgentLifecycleProfile,
    externalIdentity: string,
    agentExternalIdentity: string
  ): Promise<{ fastclawAgentId?: string; fastclawUserId?: string }> {
    let userId = profile.fastclaw_user_id;
    let agentId = profile.fastclaw_agent_id;
    try {
      if (intent === "activate") {
        if (userId !== undefined) {
          await this.remote.setUserStatus(userId, "active");
        } else {
          userId = (await this.remote.provisionUser(externalIdentity)).user_id;
        }
        if (agentId === undefined) {
          agentId = (await this.remote.provisionAgent(userId, agentExternalIdentity)).agent_id;
        }
        return { fastclawAgentId: agentId, fastclawUserId: userId };
      }

      if (intent === "disable") {
        userId ??= (await this.remote.provisionUser(externalIdentity)).user_id;
        await this.remote.setUserStatus(userId, "disabled");
        return { fastclawAgentId: agentId, fastclawUserId: userId };
      }

      userId ??= (await this.remote.provisionUser(externalIdentity)).user_id;
      await this.remote.removeUser(userId);
      return {};
    } catch (error) {
      throw new ResearchAgentRemoteReconcileError(error, userId, agentId);
    }
  }
}

function preconditionDenial(
  intent: ResearchAgentLifecycleIntent,
  authority: ResearchAgentAuthoritySnapshot
): string | undefined {
  if (!authority.account_exists) return "ACCOUNT_NOT_FOUND";
  if (!authority.workspace_exists) return "WORKSPACE_NOT_FOUND";
  if (intent === "activate" && !authority.activate_allowed) {
    return "RESEARCH_AGENT_ENTITLEMENT_DENIED";
  }
  if (intent === "delete" && authority.account_status !== "closed") {
    return "ACCOUNT_NOT_CLOSED";
  }
  return undefined;
}

function resultFromEvent(
  event: ResearchAgentLifecycleEvent,
  desiredState: ResearchAgentDesiredState
): ResearchAgentLifecycleResult {
  return {
    desired_state: desiredState,
    error_code: event.error_code,
    fastclaw_agent_id_hash: event.fastclaw_agent_id_hash,
    fastclaw_user_id_hash: event.fastclaw_user_id_hash,
    lifecycle_status: event.to_status,
    outcome: event.outcome,
    profile_id: event.profile_id,
    request_id: event.request_id,
    retryable: event.outcome === "retryable_failure" || event.outcome === "conflict",
    sandbox_created: false
  };
}

export function parseResearchAgentLifecycleRequest(
  value: unknown,
  requestId: string | undefined
): ResearchAgentLifecycleRequest {
  if (!isRecord(value)) throw new ResearchAgentLifecycleInputError("request body must be an object");
  const accountId = requiredText(value.account_id, "account_id", 200);
  const workspaceId = requiredText(value.workspace_id, "workspace_id", 200);
  const reason = requiredText(value.reason, "reason", 500);
  const normalizedRequestId = requiredText(requestId, "x-request-id", 200);
  const intent = value.intent;
  if (intent !== "activate" && intent !== "disable" && intent !== "delete") {
    throw new ResearchAgentLifecycleInputError("intent must be activate, disable, or delete");
  }
  return { accountId, intent, reason, requestId: normalizedRequestId, workspaceId };
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new ResearchAgentLifecycleInputError(`${label} must be a non-empty string up to ${maxLength} characters`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The Postgres adapter and Worker entry function live below the domain service
// so tests can exercise lifecycle behavior without opening a database or
// touching FastClaw.
export class PostgresResearchAgentLifecycleRepository implements ResearchAgentLifecycleRepository {
  constructor(private readonly client: Client) {}

  async readAuthority(accountId: string, workspaceId: string): Promise<ResearchAgentAuthoritySnapshot> {
    const result = await this.client.query<{
      account_exists: boolean;
      account_status: "active" | "closed" | "suspended" | null;
      entitlement_approved: boolean;
      membership_active: boolean;
      product_access_active: boolean;
      subscription_active: boolean;
      workspace_exists: boolean;
      workspace_status: "active" | "closed" | "suspended" | null;
    }>(AUTHORITY_SQL, [accountId, workspaceId]);
    const row = result.rows[0];
    if (row === undefined) throw new Error("research Agent authority query returned no row");
    const accountStatus = row.account_status ?? undefined;
    const workspaceStatus = row.workspace_status ?? undefined;
    return {
      account_exists: row.account_exists,
      account_status: accountStatus,
      activate_allowed:
        accountStatus === "active" &&
        workspaceStatus === "active" &&
        row.membership_active &&
        row.subscription_active &&
        row.product_access_active &&
        row.entitlement_approved,
      entitlement_approved: row.entitlement_approved,
      membership_active: row.membership_active,
      product_access_active: row.product_access_active,
      subscription_active: row.subscription_active,
      workspace_exists: row.workspace_exists,
      workspace_status: workspaceStatus
    };
  }

  async readEvent(profileId: string, requestId: string): Promise<ResearchAgentLifecycleEvent | undefined> {
    const result = await this.client.query<ResearchAgentLifecycleEvent>(
      `select profile_id, request_id, intent, outcome, to_status, error_code,
        fastclaw_user_id_hash, fastclaw_agent_id_hash
      from aiphabee_audit.research_agent_lifecycle_event
      where profile_id = $1 and request_id = $2
      limit 1`,
      [profileId, requestId]
    );
    return normalizeEvent(result.rows[0]);
  }

  async claim(input: Parameters<ResearchAgentLifecycleRepository["claim"]>[0]) {
    await this.client.query(
      `insert into aiphabee_core.research_agent_profile as profile (
        profile_id, workspace_id, account_id, external_identity, desired_state, lifecycle_status
      ) values ($1, $2, $3, $4, 'disabled', 'disabled')
      on conflict (workspace_id, account_id) do nothing`,
      [input.profileId, input.workspaceId, input.accountId, input.externalIdentity]
    );
    const current = await this.readProfile(input.profileId);
    if (current === undefined) throw new Error("research Agent profile missing after ensure");
    const terminal = terminalStatusForIntent(input.intent);
    if (current.lifecycle_status === terminal) return { kind: "terminal" as const, profile: current };
    if (current.lifecycle_status === "deleted") return { kind: "busy" as const };

    const result = await this.client.query<ProfileRow>(
      `update aiphabee_core.research_agent_profile
      set desired_state = $2,
          lifecycle_status = $3,
          lease_owner_request_id = $4,
          lease_expires_at = now() + ($5 * interval '1 second'),
          last_request_id = $4,
          last_error_code = null,
          attempt_count = attempt_count + 1,
          operation_version = operation_version + 1,
          updated_at = now()
      where profile_id = $1
        and lifecycle_status <> 'deleted'
        and (
          lease_owner_request_id is null
          or lease_expires_at <= now()
        )
      returning ${PROFILE_COLUMNS}`,
      [input.profileId, input.desiredState, input.pendingStatus, input.requestId, LIFECYCLE_LEASE_SECONDS]
    );
    const claimed = normalizeProfile(result.rows[0]);
    return claimed === undefined
      ? { kind: "busy" as const }
      : { kind: "claimed" as const, previousStatus: current.lifecycle_status, profile: claimed };
  }

  async recordDenied(input: Parameters<ResearchAgentLifecycleRepository["recordDenied"]>[0]) {
    await this.client.query(
      `insert into aiphabee_core.research_agent_profile as profile (
        profile_id, workspace_id, account_id, external_identity, desired_state, lifecycle_status,
        last_request_id, last_error_code
      ) values ($1, $2, $3, $4, 'disabled', 'disabled', $5, $6)
      on conflict (workspace_id, account_id) do update set
        last_request_id = excluded.last_request_id,
        last_error_code = excluded.last_error_code,
        updated_at = now()`,
      [
        input.profileId,
        input.workspaceId,
        input.accountId,
        input.externalIdentity,
        input.requestId,
        input.errorCode
      ]
    );
    const profile = await this.readProfile(input.profileId);
    if (profile === undefined) throw new Error("research Agent denied profile missing");
    return this.writeEvent({ ...input, profile, toStatus: profile.lifecycle_status });
  }

  async recordTerminal(input: EventWriteInput) {
    return this.writeEvent({ ...input, toStatus: input.profile.lifecycle_status });
  }

  async finalizeSuccess(input: EventWriteInput & {
    terminalStatus: ResearchAgentLifecycleStatus;
  }) {
    const result = await this.client.query<ProfileRow>(
      `update aiphabee_core.research_agent_profile
      set lifecycle_status = $3,
          fastclaw_user_id = $4,
          fastclaw_agent_id = $5,
          lease_owner_request_id = null,
          lease_expires_at = null,
          last_error_code = null,
          activated_at = case when $3 = 'active' then now() else activated_at end,
          disabled_at = case when $3 = 'disabled' then now() else disabled_at end,
          deleted_at = case when $3 = 'deleted' then now() else null end,
          operation_version = operation_version + 1,
          updated_at = now()
      where profile_id = $1 and lease_owner_request_id = $2
      returning ${PROFILE_COLUMNS}`,
      [
        input.profile.profile_id,
        input.requestId,
        input.terminalStatus,
        input.fastclawUserId ?? null,
        input.fastclawAgentId ?? null
      ]
    );
    const profile = normalizeProfile(result.rows[0]);
    if (profile === undefined) throw new Error("research Agent success finalization lost its lease");
    const event = await this.writeEvent({ ...input, profile, toStatus: profile.lifecycle_status });
    return { event, profile };
  }

  async finalizeFailure(input: EventWriteInput) {
    const failureStatus =
      input.outcome === "retryable_failure"
        ? "blocked_retryable"
        : (input.fromStatus ?? "disabled");
    const result = await this.client.query<ProfileRow>(
      `update aiphabee_core.research_agent_profile
      set lifecycle_status = $3,
          fastclaw_user_id = coalesce($5, fastclaw_user_id),
          fastclaw_agent_id = coalesce($6, fastclaw_agent_id),
          lease_owner_request_id = null,
          lease_expires_at = null,
          last_error_code = $4,
          operation_version = operation_version + 1,
          updated_at = now()
      where profile_id = $1 and lease_owner_request_id = $2
      returning ${PROFILE_COLUMNS}`,
      [
        input.profile.profile_id,
        input.requestId,
        failureStatus,
        input.errorCode ?? "RESEARCH_AGENT_LIFECYCLE_FAILED",
        input.fastclawUserId ?? null,
        input.fastclawAgentId ?? null
      ]
    );
    const profile = normalizeProfile(result.rows[0]);
    if (profile === undefined) throw new Error("research Agent failure finalization lost its lease");
    const event = await this.writeEvent({ ...input, profile, toStatus: profile.lifecycle_status });
    return { event, profile };
  }

  private async readProfile(profileId: string): Promise<ResearchAgentLifecycleProfile | undefined> {
    const result = await this.client.query<ProfileRow>(
      `select ${PROFILE_COLUMNS}
      from aiphabee_core.research_agent_profile
      where profile_id = $1
      limit 1`,
      [profileId]
    );
    return normalizeProfile(result.rows[0]);
  }

  private async writeEvent(
    input: EventWriteInput & { toStatus: ResearchAgentLifecycleStatus }
  ): Promise<ResearchAgentLifecycleEvent> {
    const userHash =
      input.fastclawUserId === undefined
        ? undefined
        : await hashLifecycleReference(input.fastclawUserId);
    const agentHash =
      input.fastclawAgentId === undefined
        ? undefined
        : await hashLifecycleReference(input.fastclawAgentId);
    const eventId = `research_agent_lifecycle_${await hashLifecycleReference(
      `${input.profile.profile_id}\u0000${input.requestId}`
    )}`;
    await this.client.query(
      `insert into aiphabee_audit.research_agent_lifecycle_event (
        event_id, profile_id, request_id, intent, from_status, to_status, outcome,
        error_code, fastclaw_user_id_hash, fastclaw_agent_id_hash, metadata
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      on conflict (profile_id, request_id) do nothing`,
      [
        eventId,
        input.profile.profile_id,
        input.requestId,
        input.intent,
        input.fromStatus ?? null,
        input.toStatus,
        input.outcome,
        input.errorCode ?? null,
        userHash ?? null,
        agentHash ?? null,
        JSON.stringify({ reason: input.reason })
      ]
    );
    const stored = await this.readEvent(input.profile.profile_id, input.requestId);
    if (stored === undefined) throw new Error("research Agent lifecycle audit event missing after write");
    return stored;
  }
}

interface ProfileRow {
  account_id: string;
  attempt_count: number | string;
  desired_state: ResearchAgentDesiredState;
  external_identity: string;
  fastclaw_agent_id: string | null;
  fastclaw_user_id: string | null;
  lifecycle_status: ResearchAgentLifecycleStatus;
  profile_id: string;
  workspace_id: string;
}

const PROFILE_COLUMNS = `profile_id, workspace_id, account_id, external_identity,
  fastclaw_user_id, fastclaw_agent_id, desired_state, lifecycle_status, attempt_count`;

function normalizeProfile(row: ProfileRow | undefined): ResearchAgentLifecycleProfile | undefined {
  if (row === undefined) return undefined;
  return {
    account_id: row.account_id,
    attempt_count: Number(row.attempt_count),
    desired_state: row.desired_state,
    external_identity: row.external_identity,
    fastclaw_agent_id: row.fastclaw_agent_id ?? undefined,
    fastclaw_user_id: row.fastclaw_user_id ?? undefined,
    lifecycle_status: row.lifecycle_status,
    profile_id: row.profile_id,
    workspace_id: row.workspace_id
  };
}

function normalizeEvent(row: ResearchAgentLifecycleEvent | undefined) {
  if (row === undefined) return undefined;
  return {
    ...row,
    error_code: row.error_code ?? undefined,
    fastclaw_agent_id_hash: row.fastclaw_agent_id_hash ?? undefined,
    fastclaw_user_id_hash: row.fastclaw_user_id_hash ?? undefined
  };
}

const AUTHORITY_SQL = `select
  exists(select 1 from platform.account a where a.account_id = $1) as account_exists,
  (select a.status from platform.account a where a.account_id = $1 limit 1) as account_status,
  exists(select 1 from platform.workspace w where w.workspace_id = $2) as workspace_exists,
  (select w.status from platform.workspace w where w.workspace_id = $2 limit 1) as workspace_status,
  exists(
    select 1 from platform.workspace_membership wm
    where wm.workspace_id = $2 and wm.account_id = $1 and wm.status = 'active'
      and wm.valid_from <= now() and (wm.valid_to is null or wm.valid_to > now())
  ) as membership_active,
  exists(
    select 1 from platform.workspace_subscription ws
    join platform.subscription_plan sp on sp.plan_code = ws.plan_code and sp.status = 'active'
    where ws.workspace_id = $2 and ws.billing_state in ('active', 'grace_period')
      and ws.valid_from <= now() and (ws.valid_to is null or ws.valid_to > now())
  ) as subscription_active,
  exists(
    select 1 from platform.workspace_product_access wpa
    join platform.product p on p.product_id = wpa.product_id and p.product_code = 'aiphabee' and p.status = 'active'
    join platform.entitlement_policy ep on ep.product_id = p.product_id
      and ep.policy_version = wpa.policy_version and ep.status = 'active'
      and (ep.effective_from is null or ep.effective_from <= now())
    where wpa.workspace_id = $2 and wpa.access_status in ('trialing', 'active')
      and wpa.valid_from <= now() and (wpa.valid_to is null or wpa.valid_to > now())
  ) as product_access_active,
  exists(
    select 1 from platform.workspace_entitlement we
    join platform.product p on p.product_id = we.product_id and p.product_code = 'aiphabee' and p.status = 'active'
    where we.workspace_id = $2 and we.entitlement_key = 'research_agent_enabled'
      and we.status = 'approved' and we.valid_from <= now()
      and (we.valid_to is null or we.valid_to > now())
  ) as entitlement_approved`;

export interface ResearchAgentLifecycleBindings {
  AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE?: { connectionString?: string };
  FASTCLAW_CONTROL_SERVICE?: {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
  FASTCLAW_ADMIN_API_KEY?: string;
  FASTCLAW_BASE_URL?: string;
  FASTCLAW_TEMPLATE_AGENT_ID?: string;
}

export async function runResearchAgentLifecycle(
  bindings: ResearchAgentLifecycleBindings,
  request: ResearchAgentLifecycleRequest
): Promise<ResearchAgentLifecycleResult> {
  const connectionString =
    bindings.AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE?.connectionString?.trim();
  if (
    connectionString === undefined ||
    connectionString.length === 0 ||
    bindings.FASTCLAW_CONTROL_SERVICE === undefined ||
    bindings.FASTCLAW_ADMIN_API_KEY?.trim() === "" ||
    bindings.FASTCLAW_ADMIN_API_KEY === undefined ||
    bindings.FASTCLAW_BASE_URL?.trim() === "" ||
    bindings.FASTCLAW_BASE_URL === undefined ||
    bindings.FASTCLAW_TEMPLATE_AGENT_ID?.trim() === "" ||
    bindings.FASTCLAW_TEMPLATE_AGENT_ID === undefined
  ) {
    throw new FastClawLifecycleError(
      "INVALID_LIFECYCLE_CONFIG",
      "research Agent lifecycle requires its dedicated control-plane Hyperdrive, FastClaw service binding, and FastClaw configuration"
    );
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const repository = new PostgresResearchAgentLifecycleRepository(client);
    const remote = new FastClawLifecycleClient({
      adminApiKey: bindings.FASTCLAW_ADMIN_API_KEY,
      baseUrl: bindings.FASTCLAW_BASE_URL,
      fetch: (input, init) => bindings.FASTCLAW_CONTROL_SERVICE!.fetch(input, init),
      templateAgentId: bindings.FASTCLAW_TEMPLATE_AGENT_ID
    });
    return await new ResearchAgentLifecycleService({ remote, repository }).execute(request);
  } finally {
    await client.end().catch(() => undefined);
  }
}
