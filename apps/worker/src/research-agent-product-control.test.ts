import { describe, expect, it, vi } from "vitest";
import type { Client } from "pg";

import {
  FASTCLAW_USAGE_METER_RULE_ID,
  FASTCLAW_USAGE_METHODOLOGY_VERSION,
  PostgresResearchAgentProductControlRepository,
  ResearchAgentProductControlInputError,
  ResearchAgentProductControlService,
  RESEARCH_AGENT_PRODUCT_STATUS_SQL,
  projectResearchAgentUserStatus,
  type ResearchAgentAdminActionInput,
  type ResearchAgentAdminAuthority,
  type ResearchAgentAdminEvent,
  type ResearchAgentLifecycleExecutor,
  type ResearchAgentObservedUsage,
  type ResearchAgentProductControlRepository,
  type ResearchAgentStatusSnapshot
} from "./research-agent-product-control.js";
import type { ResearchAgentLifecycleResult } from "./research-agent-lifecycle.js";

const AUTH_SUBJECT = "better-auth:123e4567-e89b-42d3-a456-426614174000";
const NOW = "2026-07-11T07:00:00.000Z";

function usageTotals() {
  return {
    model_input_tokens: 100,
    model_output_tokens: 50,
    preview_credits: 0,
    run_count: 1,
    sandbox_cpu_ms: 250,
    sandbox_wall_clock_ms: 500,
    storage_bytes_read: 128,
    storage_bytes_written: 256,
    tool_calls_failed: 1,
    tool_calls_succeeded: 2
  };
}

function snapshot(
  lifecycle_status: ResearchAgentStatusSnapshot["lifecycle_status"] = "active",
  overrides: Partial<ResearchAgentStatusSnapshot> = {}
): ResearchAgentStatusSnapshot {
  return {
    account_active: true,
    account_id: "account-row9",
    entitlement_approved: true,
    lifecycle_status,
    membership_active: true,
    plan_code: "pro",
    product_access_active: true,
    profile_exists: lifecycle_status !== null,
    subscription_active: true,
    usage: usageTotals(),
    workspace_active: true,
    workspace_id: "workspace-row9",
    ...overrides
  };
}

function observedUsage(overrides: Partial<ResearchAgentObservedUsage> = {}): ResearchAgentObservedUsage {
  return {
    account_id: "account-row9",
    credit_delta: 0,
    measurement: "observed",
    methodology_version: FASTCLAW_USAGE_METHODOLOGY_VERSION,
    model_input_tokens: 100,
    model_output_tokens: 50,
    occurred_at: NOW,
    request_id: "request-row9",
    rights_policy_version: "default_deny",
    run_id: "run-row9",
    sandbox_cpu_ms: 250,
    sandbox_peak_disk_bytes: 4096,
    sandbox_peak_memory_bytes: 8192,
    sandbox_wall_clock_ms: 500,
    source_record_id: "sandbox-terminal-run-row9",
    storage_bytes_read: 128,
    storage_bytes_written: 256,
    storage_delete_ops: 0,
    storage_read_ops: 1,
    storage_write_ops: 1,
    terminal_state: "completed",
    tool_calls_failed: 1,
    tool_calls_succeeded: 2,
    workspace_id: "workspace-row9",
    ...overrides
  };
}

class RepositoryFixture implements ResearchAgentProductControlRepository {
  authority: ResearchAgentAdminAuthority | null = {
    actor_account_id: "admin-row9",
    role: "admin",
    workspace_id: "workspace-row9"
  };
  readonly events = new Map<string, ResearchAgentAdminEvent>();
  readonly usages = new Map<string, ResearchAgentObservedUsage>();
  status = snapshot();
  target = { account_exists: true, membership_active: true, profile_exists: true };

  async readStatusByAuthSubject() {
    return this.status;
  }

  async recordObservedUsage(input: ResearchAgentObservedUsage) {
    const key = `${input.workspace_id}:${input.run_id}`;
    const existing = this.usages.get(key);
    if (existing !== undefined) {
      if (JSON.stringify(existing) !== JSON.stringify(input)) {
        throw new ResearchAgentProductControlInputError(
          "USAGE_REPLAY_MISMATCH",
          "fixture mismatch"
        );
      }
      return { replayed: true, usage: existing };
    }
    this.usages.set(key, input);
    return { replayed: false, usage: input };
  }

  async readAdminAuthority() {
    return this.authority;
  }

  async readAdminTarget() {
    return this.target;
  }

  async beginAdminAction(authority: ResearchAgentAdminAuthority, input: ResearchAgentAdminActionInput) {
    const key = `${input.workspace_id}:${input.request_id}`;
    const existing = this.events.get(key);
    if (existing !== undefined) {
      if (
        existing.action !== input.action ||
        existing.target_account_id !== input.target_account_id ||
        existing.run_id !== (input.run_id ?? null) ||
        existing.reason !== input.reason
      ) {
        throw new ResearchAgentProductControlInputError(
          "ADMIN_ACTION_REPLAY_MISMATCH",
          "fixture mismatch"
        );
      }
      return { event: existing, replayed: existing.status !== "started" };
    }
    const event: ResearchAgentAdminEvent = {
      action: input.action,
      actor_account_id: authority.actor_account_id,
      created_at: NOW,
      error_code: null,
      reason: input.reason,
      request_id: input.request_id,
      run_id: input.run_id ?? null,
      status: "started",
      target_account_id: input.target_account_id,
      updated_at: NOW,
      workspace_id: input.workspace_id
    };
    this.events.set(key, event);
    return { event, replayed: false };
  }

  async finalizeAdminAction(input: {
    error_code: string | null;
    request_id: string;
    status: "denied" | "failed" | "succeeded";
    workspace_id: string;
  }) {
    const key = `${input.workspace_id}:${input.request_id}`;
    const current = this.events.get(key);
    if (current === undefined) throw new Error("fixture event missing");
    if (current.status !== "started") return current;
    const event = { ...current, error_code: input.error_code, status: input.status };
    this.events.set(key, event);
    return event;
  }

  async readAdminAudit(input: { target_account_id?: string; workspace_id: string }) {
    return [...this.events.values()].filter(
      (event) =>
        event.workspace_id === input.workspace_id &&
        (input.target_account_id === undefined ||
          event.target_account_id === input.target_account_id)
    );
  }
}

function service(repository = new RepositoryFixture()) {
  const lifecycle: ResearchAgentLifecycleExecutor = {
    execute: vi.fn(async (input: { intent: string; requestId: string }): Promise<ResearchAgentLifecycleResult> => ({
      desired_state: input.intent === "delete" ? "deleted" : input.intent === "disable" ? "disabled" : "active",
      lifecycle_status: input.intent === "delete" ? "deleted" : input.intent === "disable" ? "disabled" : "active",
      outcome: "succeeded" as const,
      profile_id: "profile-row9",
      request_id: input.requestId,
      retryable: false,
      retry_with_new_request_id: false,
      sandbox_created: false
    }))
  };
  const runKiller = {
    kill: vi.fn(async () => ({ status: "killed" as const }))
  };
  return {
    lifecycle,
    product: new ResearchAgentProductControlService({
      lifecycle,
      repository,
      run_killer: runKiller
    }),
    repository,
    runKiller
  };
}

function adminInput(
  action: ResearchAgentAdminActionInput["action"],
  requestId = `admin-${action}`
): ResearchAgentAdminActionInput {
  return {
    action,
    actor_auth_subject: AUTH_SUBJECT,
    reason: `operator ${action}`,
    request_id: requestId,
    ...(action === "kill" ? { run_id: "run-row9" } : {}),
    target_account_id: "account-row9",
    workspace_id: "workspace-row9"
  };
}

describe("research Agent user status", () => {
  it.each([
    ["active", "ready"],
    ["provision_pending", "provisioning"],
    ["provisioning", "provisioning"],
    ["blocked_retryable", "retryable"],
    ["disabled", "disabled"],
    ["deleted", "disabled"],
    [null, "disabled"]
  ] as const)("maps lifecycle %s to user state %s", (lifecycle, expected) => {
    expect(projectResearchAgentUserStatus(snapshot(lifecycle)).state).toBe(expected);
  });

  it("blocks missing temporal authority and never auto-selects FastClaw for a paid plan", async () => {
    const fixture = service();
    fixture.repository.status = snapshot("active", { entitlement_approved: false });
    const blocked = await fixture.product.getUserStatus({
      auth_subject: AUTH_SUBJECT,
      workspace_id: "workspace-row9"
    });
    expect(blocked).toMatchObject({
      availability: { fastclaw_available: false },
      entitlement: { approved: false, plan_code: "pro" },
      routing: {
        default_runner_family: "edge",
        paid_plan_auto_selects_fastclaw: false,
        selected_runner_family: null,
        selection_owner: "agent_runtime"
      },
      state: "blocked"
    });

    fixture.repository.status = snapshot("active");
    const ready = await fixture.product.getUserStatus({
      auth_subject: AUTH_SUBJECT,
      workspace_id: "workspace-row9"
    });
    expect(ready.state).toBe("ready");
    expect(ready.routing.selected_runner_family).toBeNull();
    expect(ready.usage).toEqual(usageTotals());
  });
});

describe("research Agent observed usage and billing trace", () => {
  it("records all model, tool, sandbox and storage dimensions once per run", async () => {
    const fixture = service();
    const input = observedUsage();
    await expect(fixture.product.recordObservedUsage(input)).resolves.toEqual({
      replayed: false,
      usage: input
    });
    await expect(fixture.product.recordObservedUsage(input)).resolves.toEqual({
      replayed: true,
      usage: input
    });
    expect(fixture.repository.usages.size).toBe(1);
  });

  it("rejects estimates, negative counters and changed replays", async () => {
    const fixture = service();
    await expect(
      fixture.product.recordObservedUsage({
        ...observedUsage(),
        measurement: "estimated"
      } as unknown as ResearchAgentObservedUsage)
    ).rejects.toMatchObject({ code: "USAGE_INPUT_INVALID" });
    await expect(
      fixture.product.recordObservedUsage(observedUsage({ sandbox_cpu_ms: -1 }))
    ).rejects.toMatchObject({ code: "USAGE_INPUT_INVALID" });
    await fixture.product.recordObservedUsage(observedUsage());
    await expect(
      fixture.product.recordObservedUsage(observedUsage({ storage_bytes_written: 257 }))
    ).rejects.toMatchObject({ code: "USAGE_REPLAY_MISMATCH" });
  });

  it("accepts observed usage from non-success terminal runs", async () => {
    const fixture = service();
    await expect(
      fixture.product.recordObservedUsage(
        observedUsage({ run_id: "run-timeout-row9", terminal_state: "hard_timeout" })
      )
    ).resolves.toMatchObject({ replayed: false });
  });
});

describe("research Agent admin control", () => {
  it.each([
    ["retry", "activate"],
    ["disable", "disable"],
    ["delete", "delete"]
  ] as const)("authorises and records idempotent %s through lifecycle %s", async (action, intent) => {
    const fixture = service();
    const first = await fixture.product.executeAdminAction(adminInput(action));
    const replay = await fixture.product.executeAdminAction(adminInput(action));
    expect(first).toMatchObject({ action, replayed: false, status: "succeeded" });
    expect(replay).toMatchObject({ action, replayed: true, status: "succeeded" });
    expect(fixture.lifecycle.execute).toHaveBeenCalledTimes(1);
    expect(fixture.lifecycle.execute).toHaveBeenCalledWith(
      expect.objectContaining({ intent, requestId: `admin-${action}` })
    );
    expect(fixture.repository.events.size).toBe(1);
  });

  it("authorises and records an idempotent run kill", async () => {
    const fixture = service();
    await expect(fixture.product.executeAdminAction(adminInput("kill"))).resolves.toMatchObject({
      status: "succeeded"
    });
    await expect(fixture.product.executeAdminAction(adminInput("kill"))).resolves.toMatchObject({
      replayed: true,
      status: "succeeded"
    });
    expect(fixture.runKiller.kill).toHaveBeenCalledTimes(1);
    expect(fixture.runKiller.kill).toHaveBeenCalledWith({
      reason: "operator kill",
      request_id: "admin-kill",
      run_id: "run-row9",
      tenant_id: "workspace-row9",
      user_id: "account-row9"
    });
  });

  it("denies a non-admin before lifecycle, kill or audit access", async () => {
    const fixture = service();
    fixture.repository.authority = null;
    await expect(fixture.product.executeAdminAction(adminInput("disable"))).rejects.toMatchObject({
      code: "ADMIN_UNAUTHORIZED"
    });
    await expect(
      fixture.product.readAdminAudit({
        actor_auth_subject: AUTH_SUBJECT,
        workspace_id: "workspace-row9"
      })
    ).rejects.toMatchObject({ code: "ADMIN_UNAUTHORIZED" });
    expect(fixture.lifecycle.execute).not.toHaveBeenCalled();
    expect(fixture.runKiller.kill).not.toHaveBeenCalled();
    expect(fixture.repository.events.size).toBe(0);
  });

  it("blocks unrelated targets before lifecycle or kill side effects", async () => {
    const fixture = service();
    fixture.repository.target = {
      account_exists: true,
      membership_active: false,
      profile_exists: false
    };
    await expect(fixture.product.executeAdminAction(adminInput("retry"))).rejects.toMatchObject({
      code: "ADMIN_TARGET_INVALID"
    });
    await expect(fixture.product.executeAdminAction(adminInput("kill"))).rejects.toMatchObject({
      code: "ADMIN_TARGET_INVALID"
    });
    expect(fixture.lifecycle.execute).not.toHaveBeenCalled();
    expect(fixture.runKiller.kill).not.toHaveBeenCalled();
    expect(fixture.repository.events.size).toBe(0);
  });

  it("fails a changed admin replay and returns tenant-scoped audit without protected fields", async () => {
    const fixture = service();
    await fixture.product.executeAdminAction(adminInput("disable", "admin-same"));
    await expect(
      fixture.product.executeAdminAction({
        ...adminInput("delete", "admin-same"),
        reason: "different action"
      })
    ).rejects.toMatchObject({ code: "ADMIN_ACTION_REPLAY_MISMATCH" });
    const audit = await fixture.product.readAdminAudit({
      actor_auth_subject: AUTH_SUBJECT,
      target_account_id: "account-row9",
      workspace_id: "workspace-row9"
    });
    expect(audit).toHaveLength(1);
    expect(JSON.stringify(audit)).not.toMatch(/fastclaw|token|lease|raw_error/iu);
  });
});

describe("PostgreSQL product-control repository", () => {
  it("uses one temporal status snapshot and preserves no-selection routing", async () => {
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const client = {
      query: vi.fn(async (text: string, values?: unknown[]) => {
        queries.push({ text, values });
        return {
          rows: [
            {
              account_active: true,
              account_id: "account-row9",
              entitlement_approved: true,
              lifecycle_status: "active",
              membership_active: true,
              model_input_tokens: "100",
              model_output_tokens: "50",
              plan_code: "pro",
              preview_credits: "0",
              product_access_active: true,
              profile_exists: true,
              run_count: "1",
              sandbox_cpu_ms: "250",
              sandbox_wall_clock_ms: "500",
              storage_bytes_read: "128",
              storage_bytes_written: "256",
              subscription_active: true,
              tool_calls_failed: "1",
              tool_calls_succeeded: "2",
              workspace_active: true
            }
          ]
        };
      })
    } as unknown as Client;
    const repository = new PostgresResearchAgentProductControlRepository(client);
    const result = await repository.readStatusByAuthSubject(AUTH_SUBJECT, "workspace-row9");
    expect(result).toEqual(snapshot());
    expect(queries[0]?.text).toBe(RESEARCH_AGENT_PRODUCT_STATUS_SQL);
    expect(queries[0]?.values).toEqual([AUTH_SUBJECT, "workspace-row9"]);
    expect(queries[0]?.text).toContain("entitlement_key = 'research_agent_enabled'");
    expect(queries[0]?.text).toContain("valid_to > now()");
  });

  it("links observed usage to existing event and preview ledger in one transaction", async () => {
    const input = observedUsage();
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const client = {
      query: vi.fn(async (text: string, values?: unknown[]) => {
        queries.push({ text, values });
        if (text.includes("select account_id, credit_delta")) return { rows: [] };
        if (text.includes("returning account_id, credit_delta")) return { rows: [input] };
        return { rows: [] };
      })
    } as unknown as Client;
    const repository = new PostgresResearchAgentProductControlRepository(client);
    await expect(repository.recordObservedUsage(input)).resolves.toEqual({
      replayed: false,
      usage: input
    });
    const normalized = queries.map((query) => query.text.replace(/\s+/gu, " ").trim());
    expect(normalized).toEqual([
      expect.stringContaining("from aiphabee_core.research_agent_run_usage"),
      "begin",
      expect.stringContaining("insert into aiphabee_core.usage_event"),
      expect.stringContaining("insert into aiphabee_core.usage_ledger_entry"),
      expect.stringContaining("insert into aiphabee_core.research_agent_run_usage"),
      "commit"
    ]);
    expect(queries[3]?.values?.[4]).toBe(FASTCLAW_USAGE_METER_RULE_ID);
    expect(normalized[3]).toContain("'preview'");
    expect(normalized[2]).toContain("case when $12 = 'completed' then 'PASS' else 'HOLD' end");
    expect(queries[2]?.values?.[11]).toBe("completed");
  });

  it("resolves only temporal owner/admin authority and exact tenant audit queries", async () => {
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const client = {
      query: vi.fn(async (text: string, values?: unknown[]) => {
        queries.push({ text, values });
        if (text.includes("bool_or")) {
          return {
            rows: [
              {
                actor_account_id: "admin-row9",
                role: "admin",
                workspace_id: "workspace-row9"
              }
            ]
          };
        }
        return { rows: [] };
      })
    } as unknown as Client;
    const repository = new PostgresResearchAgentProductControlRepository(client);
    await expect(repository.readAdminAuthority(AUTH_SUBJECT, "workspace-row9")).resolves.toEqual({
      actor_account_id: "admin-row9",
      role: "admin",
      workspace_id: "workspace-row9"
    });
    await repository.readAdminAudit({
      actor_auth_subject: AUTH_SUBJECT,
      target_account_id: "account-row9",
      workspace_id: "workspace-row9"
    });
    expect(queries[0]?.text).toContain("wm.role in ('owner', 'admin')");
    expect(queries[0]?.text).toContain("wm.valid_from <= now()");
    expect(queries[1]?.text).toContain("where workspace_id = $1");
    expect(queries[1]?.values).toEqual(["workspace-row9", "account-row9"]);
  });
});
