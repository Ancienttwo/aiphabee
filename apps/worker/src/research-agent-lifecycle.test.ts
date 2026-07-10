import { describe, expect, it, vi } from "vitest";

import {
  FastClawLifecycleError,
  hashLifecycleReference
} from "@aiphabee/agent-runtime/fastclaw-lifecycle";
import {
  ResearchAgentLifecycleService,
  runResearchAgentLifecycle,
  type ResearchAgentAuthoritySnapshot,
  type ResearchAgentLifecycleEvent,
  type ResearchAgentLifecycleProfile,
  type ResearchAgentLifecycleRepository
} from "./research-agent-lifecycle.js";

const AUTHORIZED: ResearchAgentAuthoritySnapshot = {
  account_exists: true,
  account_status: "active",
  activate_allowed: true,
  entitlement_approved: true,
  membership_active: true,
  product_access_active: true,
  subscription_active: true,
  workspace_exists: true,
  workspace_status: "active"
};

class MemoryRepository implements ResearchAgentLifecycleRepository {
  authority = AUTHORIZED;
  audit = new Map<string, ResearchAgentLifecycleEvent>();
  busy = false;
  profile?: ResearchAgentLifecycleProfile;

  async readAuthority(): Promise<ResearchAgentAuthoritySnapshot> {
    return this.authority;
  }

  async readEvent(_profileId: string, requestId: string): Promise<ResearchAgentLifecycleEvent | undefined> {
    return this.audit.get(requestId);
  }

  async claim(input: Parameters<ResearchAgentLifecycleRepository["claim"]>[0]) {
    if (this.busy) return { kind: "busy" as const };
    const terminal =
      (input.intent === "activate" && this.profile?.lifecycle_status === "active") ||
      (input.intent === "disable" && this.profile?.lifecycle_status === "disabled") ||
      (input.intent === "delete" && this.profile?.lifecycle_status === "deleted");
    if (terminal && this.profile !== undefined) {
      return { kind: "terminal" as const, profile: this.profile };
    }
    const previousStatus = this.profile?.lifecycle_status;
    this.profile = {
      account_id: input.accountId,
      attempt_count: (this.profile?.attempt_count ?? 0) + 1,
      desired_state: input.desiredState,
      external_identity: input.externalIdentity,
      fastclaw_agent_id: this.profile?.fastclaw_agent_id,
      fastclaw_user_id: this.profile?.fastclaw_user_id,
      lifecycle_status: input.pendingStatus,
      profile_id: input.profileId,
      workspace_id: input.workspaceId
    };
    return { kind: "claimed" as const, previousStatus, profile: this.profile };
  }

  async recordDenied(input: Parameters<ResearchAgentLifecycleRepository["recordDenied"]>[0]) {
    this.profile ??= {
      account_id: input.accountId,
      attempt_count: 0,
      desired_state: "disabled",
      external_identity: input.externalIdentity,
      lifecycle_status: "disabled",
      profile_id: input.profileId,
      workspace_id: input.workspaceId
    };
    if (input.intent === "activate") {
      this.profile = {
        ...this.profile,
        desired_state: "disabled",
        lifecycle_status: "disabled"
      };
    }
    const event = eventFrom(input, this.profile);
    this.audit.set(input.requestId, event);
    return event;
  }

  async recordTerminal(input: Parameters<ResearchAgentLifecycleRepository["recordTerminal"]>[0]) {
    const event = eventFrom(input, input.profile);
    this.audit.set(input.requestId, event);
    return event;
  }

  async finalizeSuccess(input: Parameters<ResearchAgentLifecycleRepository["finalizeSuccess"]>[0]) {
    if (this.profile === undefined) throw new Error("profile missing");
    this.profile = {
      ...this.profile,
      fastclaw_agent_id: input.fastclawAgentId,
      fastclaw_user_id: input.fastclawUserId,
      lifecycle_status: input.terminalStatus
    };
    const event = eventFrom(input, this.profile);
    event.fastclaw_user_id_hash =
      input.fastclawUserId === undefined
        ? undefined
        : await hashLifecycleReference(input.fastclawUserId);
    event.fastclaw_agent_id_hash =
      input.fastclawAgentId === undefined
        ? undefined
        : await hashLifecycleReference(input.fastclawAgentId);
    this.audit.set(input.requestId, event);
    return { event, profile: this.profile };
  }

  async finalizeFailure(input: Parameters<ResearchAgentLifecycleRepository["finalizeFailure"]>[0]) {
    if (this.profile === undefined) throw new Error("profile missing");
    this.profile = { ...this.profile, lifecycle_status: "blocked_retryable" };
    const event = eventFrom(input, this.profile);
    this.audit.set(input.requestId, event);
    return { event, profile: this.profile };
  }
}

function eventFrom(
  input: { errorCode?: string; intent: "activate" | "disable" | "delete"; outcome: ResearchAgentLifecycleEvent["outcome"]; requestId: string },
  profile: ResearchAgentLifecycleProfile
): ResearchAgentLifecycleEvent {
  return {
    error_code: input.errorCode,
    intent: input.intent,
    outcome: input.outcome,
    profile_id: profile.profile_id,
    request_id: input.requestId,
    to_status: profile.lifecycle_status
  };
}

function request(intent: "activate" | "disable" | "delete", requestId = `req-${intent}`) {
  return {
    accountId: "account-1",
    intent,
    reason: "test lifecycle",
    requestId,
    workspaceId: "workspace-1"
  } as const;
}

describe("ResearchAgentLifecycleService", () => {
  it("requires the dedicated control-plane Hyperdrive instead of the user runtime binding", async () => {
    await expect(
      runResearchAgentLifecycle(
        {
          AIPHABEE_HYPERDRIVE: { connectionString: "postgresql://runtime.invalid/db" },
          FASTCLAW_ADMIN_API_KEY: "admin-key",
          FASTCLAW_BASE_URL: "https://fastclaw.invalid",
          FASTCLAW_CONTROL_SERVICE: { fetch: vi.fn() },
          FASTCLAW_TEMPLATE_AGENT_ID: "agt_template"
        } as unknown as Parameters<typeof runResearchAgentLifecycle>[0],
        request("activate")
      )
    ).rejects.toMatchObject({ code: "INVALID_LIFECYCLE_CONFIG" });
  });

  it("requires the FastClaw service binding before opening the control database", async () => {
    await expect(
      runResearchAgentLifecycle(
        {
          AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE: {
            connectionString: "postgresql://control.invalid/db"
          },
          FASTCLAW_ADMIN_API_KEY: "admin-key",
          FASTCLAW_BASE_URL: "https://fastclaw.invalid",
          FASTCLAW_TEMPLATE_AGENT_ID: "agt_template"
        },
        request("activate")
      )
    ).rejects.toMatchObject({ code: "INVALID_LIFECYCLE_CONFIG" });
  });

  it("activates one dedicated user and Agent under the authoritative entitlement", async () => {
    const repository = new MemoryRepository();
    const remote = {
      provisionAgent: vi.fn(async () => ({ agent_id: "agt_dedicated", created: true })),
      provisionUser: vi.fn(async (externalId: string) => ({ external_id: externalId, user_id: "u_dedicated" })),
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };
    const service = new ResearchAgentLifecycleService({ remote, repository });

    const result = await service.execute(request("activate"));

    expect(result).toMatchObject({
      desired_state: "active",
      lifecycle_status: "active",
      outcome: "succeeded",
      retryable: false,
      sandbox_created: false
    });
    expect(result.fastclaw_user_id_hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(result).not.toHaveProperty("fastclaw_user_id");
    expect(repository.profile).toMatchObject({
      fastclaw_agent_id: "agt_dedicated",
      fastclaw_user_id: "u_dedicated",
      lifecycle_status: "active"
    });
    expect(remote.provisionAgent).toHaveBeenCalledOnce();
  });

  it("denies activation before remote calls when entitlement is not authoritative", async () => {
    const repository = new MemoryRepository();
    repository.authority = { ...AUTHORIZED, activate_allowed: false, entitlement_approved: false };
    const remote = {
      provisionAgent: vi.fn(),
      provisionUser: vi.fn(),
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };
    const result = await new ResearchAgentLifecycleService({ remote, repository }).execute(
      request("activate")
    );

    expect(result).toMatchObject({ error_code: "RESEARCH_AGENT_ENTITLEMENT_DENIED", outcome: "denied" });
    expect(repository.profile).toMatchObject({
      desired_state: "disabled",
      lifecycle_status: "disabled"
    });
    expect(remote.provisionUser).not.toHaveBeenCalled();
  });

  it("locally disables an existing active profile when entitlement is revoked", async () => {
    const repository = new MemoryRepository();
    repository.authority = { ...AUTHORIZED, activate_allowed: false, entitlement_approved: false };
    repository.profile = {
      account_id: "account-1",
      attempt_count: 1,
      desired_state: "active",
      external_identity: "aiphabee:v1:abc",
      fastclaw_agent_id: "agt_dedicated",
      fastclaw_user_id: "u_dedicated",
      lifecycle_status: "active",
      profile_id: "profile-1",
      workspace_id: "workspace-1"
    };
    const remote = {
      provisionAgent: vi.fn(),
      provisionUser: vi.fn(),
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };

    const result = await new ResearchAgentLifecycleService({ remote, repository }).execute(
      request("activate")
    );
    expect(result).toMatchObject({
      error_code: "RESEARCH_AGENT_ENTITLEMENT_DENIED",
      lifecycle_status: "disabled",
      outcome: "denied"
    });
    expect(repository.profile?.lifecycle_status).toBe("disabled");
  });

  it("blocks locally before disabling the remote app-user", async () => {
    const repository = new MemoryRepository();
    repository.profile = {
      account_id: "account-1",
      attempt_count: 1,
      desired_state: "active",
      external_identity: "aiphabee:v1:abc",
      fastclaw_agent_id: "agt_dedicated",
      fastclaw_user_id: "u_dedicated",
      lifecycle_status: "active",
      profile_id: "profile-1",
      workspace_id: "workspace-1"
    };
    const setUserStatus = vi.fn(async () => {
      expect(repository.profile?.lifecycle_status).toBe("disable_pending");
      return { status: "disabled" as const };
    });
    const remote = {
      provisionAgent: vi.fn(),
      provisionUser: vi.fn(),
      removeUser: vi.fn(),
      setUserStatus
    };

    const result = await new ResearchAgentLifecycleService({ remote, repository }).execute(
      request("disable")
    );
    expect(result).toMatchObject({ lifecycle_status: "disabled", outcome: "succeeded" });
    expect(setUserStatus).toHaveBeenCalledWith("u_dedicated", "disabled");
  });

  it("persists retryable blocked state when FastClaw is unavailable", async () => {
    const repository = new MemoryRepository();
    const remote = {
      provisionAgent: vi.fn(),
      provisionUser: vi.fn(async () => {
        throw new FastClawLifecycleError("FASTCLAW_UNAVAILABLE", "unavailable", true);
      }),
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };

    const result = await new ResearchAgentLifecycleService({ remote, repository }).execute(
      request("activate")
    );
    expect(result).toMatchObject({
      error_code: "FASTCLAW_UNAVAILABLE",
      lifecycle_status: "blocked_retryable",
      outcome: "retryable_failure",
      retryable: true
    });
  });

  it("requires a closed account before terminal remote removal", async () => {
    const repository = new MemoryRepository();
    repository.profile = {
      account_id: "account-1",
      attempt_count: 1,
      desired_state: "disabled",
      external_identity: "aiphabee:v1:abc",
      fastclaw_agent_id: "agt_dedicated",
      fastclaw_user_id: "u_dedicated",
      lifecycle_status: "disabled",
      profile_id: "profile-1",
      workspace_id: "workspace-1"
    };
    const remote = {
      provisionAgent: vi.fn(),
      provisionUser: vi.fn(),
      removeUser: vi.fn(async () => ({ already_absent: false })),
      setUserStatus: vi.fn()
    };
    const service = new ResearchAgentLifecycleService({ remote, repository });

    const denied = await service.execute(request("delete"));
    expect(denied).toMatchObject({ error_code: "ACCOUNT_NOT_CLOSED", outcome: "denied" });
    expect(remote.removeUser).not.toHaveBeenCalled();

    repository.authority = { ...AUTHORIZED, account_status: "closed", activate_allowed: false };
    const removed = await service.execute(request("delete", "req-delete-closed"));
    expect(removed).toMatchObject({ lifecycle_status: "deleted", outcome: "succeeded" });
    expect(remote.removeUser).toHaveBeenCalledWith("u_dedicated");
  });

  it("returns conflict for an unexpired competing lease", async () => {
    const repository = new MemoryRepository();
    repository.busy = true;
    const remote = {
      provisionAgent: vi.fn(),
      provisionUser: vi.fn(),
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };
    const result = await new ResearchAgentLifecycleService({ remote, repository }).execute(
      request("activate")
    );
    expect(result).toMatchObject({ error_code: "LIFECYCLE_LEASE_BUSY", outcome: "conflict" });
    expect(remote.provisionUser).not.toHaveBeenCalled();
  });

  it("rejects reusing a request id for a different lifecycle intent", async () => {
    const repository = new MemoryRepository();
    const remote = {
      provisionAgent: vi.fn(async () => ({ agent_id: "agt_dedicated", created: true })),
      provisionUser: vi.fn(async (externalId: string) => ({
        external_id: externalId,
        user_id: "u_dedicated"
      })),
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };
    const service = new ResearchAgentLifecycleService({ remote, repository });
    await expect(service.execute(request("activate", "req-reused"))).resolves.toMatchObject({
      outcome: "succeeded"
    });

    await expect(service.execute(request("disable", "req-reused"))).resolves.toMatchObject({
      error_code: "LIFECYCLE_REQUEST_MISMATCH",
      lifecycle_status: "active",
      outcome: "conflict",
      retryable: false
    });
    expect(remote.setUserStatus).not.toHaveBeenCalled();
  });
});
