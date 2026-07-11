import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { FastClawLifecycleError } from "@aiphabee/agent-runtime/fastclaw-lifecycle";
import {
  PostgresResearchAgentLifecycleRepository,
  ResearchAgentLifecycleService
} from "./research-agent-lifecycle.js";

const databaseUrl = process.env.RESEARCH_AGENT_LIFECYCLE_TEST_DATABASE_URL;
const describePostgres = databaseUrl === undefined ? describe.skip : describe;

describePostgres("research Agent lifecycle Postgres integration", () => {
  const client = new Client({ connectionString: databaseUrl });
  let priorRuntimeMembershipSetOption: boolean | undefined;

  beforeAll(async () => {
    await client.connect();
    const database = await client.query<{ current_database: string }>(
      "select current_database()"
    );
    if (!database.rows[0]?.current_database.startsWith("aiphabee_lifecycle_test")) {
      throw new Error("integration database name must start with aiphabee_lifecycle_test");
    }
    const serverVersion = await client.query<{ server_version_num: string }>(
      "select current_setting('server_version_num') as server_version_num"
    );
    if (Number(serverVersion.rows[0]?.server_version_num) < 160_000) {
      throw new Error("research Agent lifecycle integration requires PostgreSQL 16 or newer");
    }
    const priorMembership = await client.query<{ set_option: boolean }>(
      `select membership.set_option
       from pg_auth_members membership
       join pg_roles role on role.oid = membership.roleid
       where role.rolname = 'aiphabee_runtime_rls'
         and membership.member = (select oid from pg_roles where rolname = current_user)
         and membership.grantor = (select oid from pg_roles where rolname = current_user)`
    );
    priorRuntimeMembershipSetOption = priorMembership.rows[0]?.set_option;
    await client.query("drop schema if exists aiphabee_audit cascade");
    await client.query("drop schema if exists aiphabee_core cascade");
    await client.query("drop schema if exists platform cascade");
    await client.query(PREREQUISITE_SQL);
    const migration = readFileSync(
      fileURLToPath(
        new NodeURL(
          "../../../deploy/database/migrations/20260710120000_research_agent_lifecycle.sql",
          import.meta.url
        )
      ),
      "utf8"
    );
    await client.query(migration);
    await client.query(SEED_SQL);
  });

  afterAll(async () => {
    try {
      if (priorRuntimeMembershipSetOption === false) {
        await client.query(
          `do $do$ begin
             execute format('grant aiphabee_runtime_rls to %I with set false', current_user);
           end $do$;`
        );
      } else if (priorRuntimeMembershipSetOption === undefined) {
        await client.query(
          `do $do$ begin
             execute format(
               'revoke aiphabee_runtime_rls from %I granted by %I',
               current_user,
               current_user
             );
           end $do$;`
        );
      }
    } finally {
      await client.end();
    }
  });

  it("persists one activate-disable-remove lifecycle with leases and audit", async () => {
    const repository = new PostgresResearchAgentLifecycleRepository(client);
    const provisionUser = vi.fn(async (externalId: string) => ({
      external_id: externalId,
      user_id: "u_dedicated"
    }));
    const provisionAgent = vi.fn(async () => ({
      agent_id: "agt_dedicated",
      created: true
    }));
    const setUserStatus = vi.fn(async (_userId: string, status: "active" | "disabled") => {
      const row = await client.query<{ lifecycle_status: string }>(
        "select lifecycle_status from aiphabee_core.research_agent_profile limit 1"
      );
      if (status === "disabled") expect(row.rows[0]?.lifecycle_status).toBe("disable_pending");
      return { status };
    });
    const removeUser = vi.fn(async () => ({ already_absent: false }));
    const service = new ResearchAgentLifecycleService({
      remote: { provisionAgent, provisionUser, removeUser, setUserStatus },
      repository
    });

    const activate = {
      accountId: "account-test",
      intent: "activate" as const,
      reason: "paid entitlement active",
      requestId: "req-activate",
      workspaceId: "workspace-test"
    };
    await expect(service.execute(activate)).resolves.toMatchObject({
      lifecycle_status: "active",
      outcome: "succeeded"
    });
    await expect(service.execute(activate)).resolves.toMatchObject({
      lifecycle_status: "active",
      outcome: "succeeded"
    });
    expect(provisionUser).toHaveBeenCalledOnce();
    expect(provisionAgent).toHaveBeenCalledOnce();

    await client.query(
      "update platform.workspace_entitlement set status = 'revoked' where workspace_id = 'workspace-test'"
    );
    await expect(
      service.execute({
        ...activate,
        requestId: "req-activate-denied"
      })
    ).resolves.toMatchObject({
      error_code: "RESEARCH_AGENT_ENTITLEMENT_DENIED",
      lifecycle_status: "active",
      outcome: "denied"
    });
    const profileAfterDeniedActivate = await client.query<{ lifecycle_status: string }>(
      "select lifecycle_status from aiphabee_core.research_agent_profile"
    );
    expect(profileAfterDeniedActivate.rows[0]?.lifecycle_status).toBe("active");
    const activeProfile = await client.query<{ external_identity: string; profile_id: string }>(
      "select external_identity, profile_id from aiphabee_core.research_agent_profile"
    );
    if (activeProfile.rows[0] === undefined) throw new Error("active profile missing");

    const duplicateClaimInput = {
      accountId: "account-test",
      desiredState: "disabled" as const,
      externalIdentity: activeProfile.rows[0].external_identity,
      intent: "disable" as const,
      pendingStatus: "disable_pending" as const,
      profileId: activeProfile.rows[0].profile_id,
      requestId: "req-duplicate-claim",
      workspaceId: "workspace-test"
    };
    await expect(repository.claim(duplicateClaimInput)).resolves.toMatchObject({ kind: "claimed" });
    await expect(repository.claim(duplicateClaimInput)).resolves.toMatchObject({
      kind: "in_progress",
      profile: { lifecycle_status: "disable_pending" }
    });
    await client.query(
      `update aiphabee_core.research_agent_profile
       set lifecycle_status = 'active', desired_state = 'active',
           lease_owner_request_id = null, lease_expires_at = null
       where workspace_id = 'workspace-test' and account_id = 'account-test'`
    );

    await client.query("grant usage on schema platform to aiphabee_runtime_rls");
    await client.query(
      "grant execute on function platform.current_account_id(), platform.is_workspace_member(text) to aiphabee_runtime_rls"
    );
    await client.query(
      "grant select on platform.account, platform.workspace_membership to aiphabee_runtime_rls"
    );
    await client.query("grant usage on schema aiphabee_core, aiphabee_audit to aiphabee_runtime_rls");
    await client.query(
      "grant select, update, delete on aiphabee_core.research_agent_profile to aiphabee_runtime_rls"
    );
    await client.query(
      "grant select, delete on aiphabee_audit.research_agent_lifecycle_event to aiphabee_runtime_rls"
    );
    await client.query("set role aiphabee_runtime_rls");
    await client.query("select set_config('aiphabee.account_id', 'account-test', false)");
    const ownProfile = await client.query<{ count: string }>(
      "select count(*)::text as count from aiphabee_core.research_agent_profile"
    );
    expect(ownProfile.rows[0]?.count).toBe("1");
    const forbiddenProfileUpdate = await client.query(
      "update aiphabee_core.research_agent_profile set desired_state = 'disabled' returning profile_id"
    );
    expect(forbiddenProfileUpdate.rowCount).toBe(0);
    const forbiddenAuditDelete = await client.query(
      "delete from aiphabee_audit.research_agent_lifecycle_event returning event_id"
    );
    expect(forbiddenAuditDelete.rowCount).toBe(0);
    await client.query("select set_config('aiphabee.account_id', 'account-other', false)");
    const otherProfile = await client.query<{ count: string }>(
      "select count(*)::text as count from aiphabee_core.research_agent_profile"
    );
    expect(otherProfile.rows[0]?.count).toBe("0");
    await client.query("reset role");

    await expect(
      service.execute({
        ...activate,
        intent: "disable",
        reason: "subscription paused",
        requestId: "req-disable"
      })
    ).resolves.toMatchObject({ lifecycle_status: "disabled", outcome: "succeeded" });
    expect(setUserStatus).toHaveBeenCalledWith("u_dedicated", "disabled");

    await client.query(
      "update platform.workspace_entitlement set status = 'approved' where workspace_id = 'workspace-test'"
    );
    await expect(
      service.execute({
        ...activate,
        reason: "subscription resumed",
        requestId: "req-reactivate"
      })
    ).resolves.toMatchObject({ lifecycle_status: "active", outcome: "succeeded" });
    expect(setUserStatus).toHaveBeenCalledWith("u_dedicated", "active");
    expect(provisionUser).toHaveBeenCalledOnce();
    expect(provisionAgent).toHaveBeenCalledOnce();

    await expect(
      service.execute({ ...activate, requestId: "req-activate-terminal" })
    ).resolves.toMatchObject({ lifecycle_status: "active", outcome: "succeeded" });
    expect(provisionUser).toHaveBeenCalledOnce();
    expect(provisionAgent).toHaveBeenCalledOnce();

    const disableAgain = {
      ...activate,
      intent: "disable" as const,
      reason: "subscription paused again",
      requestId: "req-disable-again"
    };
    await expect(service.execute(disableAgain)).resolves.toMatchObject({
      lifecycle_status: "disabled",
      outcome: "succeeded"
    });
    await expect(
      service.execute({ ...disableAgain, requestId: "req-disable-terminal" })
    ).resolves.toMatchObject({ lifecycle_status: "disabled", outcome: "succeeded" });
    expect(setUserStatus).toHaveBeenCalledTimes(3);

    await client.query("update platform.account set status = 'closed' where account_id = 'account-test'");
    const remove = {
      ...activate,
      intent: "delete" as const,
      reason: "account erasure approved",
      requestId: "req-delete"
    };
    await expect(service.execute(remove)).resolves.toMatchObject({
      lifecycle_status: "deleted",
      outcome: "succeeded"
    });
    await expect(
      service.execute({ ...remove, requestId: "req-delete-terminal" })
    ).resolves.toMatchObject({ lifecycle_status: "deleted", outcome: "succeeded" });
    expect(removeUser).toHaveBeenCalledWith("u_dedicated");
    expect(removeUser).toHaveBeenCalledOnce();

    const profile = await client.query<{
      fastclaw_agent_id: string | null;
      fastclaw_user_id: string | null;
      lifecycle_status: string;
    }>(
      "select lifecycle_status, fastclaw_user_id, fastclaw_agent_id from aiphabee_core.research_agent_profile"
    );
    expect(profile.rows).toEqual([
      {
        fastclaw_agent_id: null,
        fastclaw_user_id: null,
        lifecycle_status: "deleted"
      }
    ]);
    const audit = await client.query<{ count: string }>(
      "select count(*)::text as count from aiphabee_audit.research_agent_lifecycle_event"
    );
    expect(audit.rows[0]?.count).toBe("9");
  });

  it("persists a partial FastClaw user before a failed Agent provision", async () => {
    const repository = new PostgresResearchAgentLifecycleRepository(client);
    const provisionUser = vi.fn(async (externalId: string) => ({
      external_id: externalId,
      user_id: "u_partial"
    }));
    const provisionAgent = vi
      .fn()
      .mockRejectedValueOnce(
        new FastClawLifecycleError("FASTCLAW_UNAVAILABLE", "unavailable", true)
      )
      .mockResolvedValueOnce({ agent_id: "agt_partial", created: true });
    const setUserStatus = vi.fn(async (_userId: string, status: "active" | "disabled") => ({
      status
    }));
    const service = new ResearchAgentLifecycleService({
      remote: {
        provisionAgent,
        provisionUser,
        removeUser: vi.fn(),
        setUserStatus
      },
      repository
    });

    await expect(
      service.execute({
        accountId: "account-partial",
        intent: "activate",
        reason: "partial provision regression",
        requestId: "req-partial-activate",
        workspaceId: "workspace-partial"
      })
    ).resolves.toMatchObject({
      lifecycle_status: "blocked_retryable",
      outcome: "retryable_failure"
    });
    const partialProfile = await client.query<{
      fastclaw_agent_id: string | null;
      fastclaw_user_id: string | null;
    }>(
      `select fastclaw_user_id, fastclaw_agent_id
       from aiphabee_core.research_agent_profile
       where workspace_id = 'workspace-partial'`
    );
    expect(partialProfile.rows).toEqual([
      { fastclaw_agent_id: null, fastclaw_user_id: "u_partial" }
    ]);

    await expect(
      service.execute({
        accountId: "account-partial",
        intent: "activate",
        reason: "retry retained partial user",
        requestId: "req-partial-retry",
        workspaceId: "workspace-partial"
      })
    ).resolves.toMatchObject({ lifecycle_status: "active", outcome: "succeeded" });
    expect(setUserStatus).toHaveBeenCalledWith("u_partial", "active");
    expect(provisionUser).toHaveBeenCalledOnce();
    expect(provisionAgent).toHaveBeenCalledTimes(2);
    const reconciledProfile = await client.query<{
      fastclaw_agent_id: string | null;
      fastclaw_user_id: string | null;
      lifecycle_status: string;
    }>(
      `select fastclaw_user_id, fastclaw_agent_id, lifecycle_status
       from aiphabee_core.research_agent_profile
       where workspace_id = 'workspace-partial'`
    );
    expect(reconciledProfile.rows).toEqual([
      {
        fastclaw_agent_id: "agt_partial",
        fastclaw_user_id: "u_partial",
        lifecycle_status: "active"
      }
    ]);
  });

  it("allows one remote provision path and audits the loser under true concurrent claims", async () => {
    await seedAuthorizedIdentity(client, "concurrent");
    const firstClient = new Client({ connectionString: databaseUrl });
    const secondClient = new Client({ connectionString: databaseUrl });
    let releaseProvision = (): void => undefined;
    let markProvisionStarted = (): void => undefined;
    const provisionGate = new Promise<void>((resolve) => {
      releaseProvision = resolve;
    });
    const provisionStarted = new Promise<void>((resolve) => {
      markProvisionStarted = resolve;
    });
    const provisionUser = vi.fn(async (externalId: string) => {
      markProvisionStarted();
      await provisionGate;
      return { external_id: externalId, user_id: "u_concurrent" };
    });
    const provisionAgent = vi.fn(async () => ({
      agent_id: "agt_concurrent",
      created: true
    }));
    const remote = {
      provisionAgent,
      provisionUser,
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };

    await firstClient.connect();
    await secondClient.connect();
    try {
      const firstService = new ResearchAgentLifecycleService({
        remote,
        repository: new PostgresResearchAgentLifecycleRepository(firstClient)
      });
      const secondService = new ResearchAgentLifecycleService({
        remote,
        repository: new PostgresResearchAgentLifecycleRepository(secondClient)
      });
      const firstResult = firstService.execute({
        accountId: "account-concurrent",
        intent: "activate",
        reason: "concurrent winner",
        requestId: "req-concurrent-first",
        workspaceId: "workspace-concurrent"
      });
      await provisionStarted;

      await expect(
        secondService.execute({
          accountId: "account-concurrent",
          intent: "activate",
          reason: "duplicate in-flight delivery",
          requestId: "req-concurrent-first",
          workspaceId: "workspace-concurrent"
        })
      ).resolves.toMatchObject({
        error_code: "LIFECYCLE_REQUEST_IN_PROGRESS",
        lifecycle_status: "provisioning",
        outcome: "conflict",
        retryable: true,
        retry_with_new_request_id: false
      });

      await expect(
        secondService.execute({
          accountId: "account-concurrent",
          intent: "activate",
          reason: "concurrent loser",
          requestId: "req-concurrent-second",
          workspaceId: "workspace-concurrent"
        })
      ).resolves.toMatchObject({
        error_code: "LIFECYCLE_LEASE_BUSY",
        lifecycle_status: "provisioning",
        outcome: "conflict",
        retryable: true,
        retry_with_new_request_id: true
      });
      releaseProvision();
      await expect(firstResult).resolves.toMatchObject({
        lifecycle_status: "active",
        outcome: "succeeded"
      });
      await expect(
        secondService.execute({
          accountId: "account-concurrent",
          intent: "activate",
          reason: "completed same-attempt replay",
          requestId: "req-concurrent-first",
          workspaceId: "workspace-concurrent"
        })
      ).resolves.toMatchObject({
        lifecycle_status: "active",
        outcome: "succeeded",
        retry_with_new_request_id: false
      });
      await expect(
        secondService.execute({
          accountId: "account-concurrent",
          intent: "activate",
          reason: "same idempotent attempt replay",
          requestId: "req-concurrent-second",
          workspaceId: "workspace-concurrent"
        })
      ).resolves.toMatchObject({
        error_code: "LIFECYCLE_LEASE_BUSY",
        outcome: "conflict",
        retry_with_new_request_id: true
      });
      await expect(
        secondService.execute({
          accountId: "account-concurrent",
          intent: "activate",
          reason: "new retry attempt",
          requestId: "req-concurrent-retry",
          workspaceId: "workspace-concurrent"
        })
      ).resolves.toMatchObject({
        lifecycle_status: "active",
        outcome: "succeeded",
        retry_with_new_request_id: false
      });
    } finally {
      releaseProvision();
      await Promise.all([
        firstClient.end().catch(() => undefined),
        secondClient.end().catch(() => undefined)
      ]);
    }

    expect(provisionUser).toHaveBeenCalledOnce();
    expect(provisionAgent).toHaveBeenCalledOnce();
    const profiles = await client.query<{ count: string; lifecycle_status: string }>(
      `select count(*)::text as count, max(lifecycle_status) as lifecycle_status
       from aiphabee_core.research_agent_profile
       where workspace_id = 'workspace-concurrent' and account_id = 'account-concurrent'`
    );
    expect(profiles.rows).toEqual([{ count: "1", lifecycle_status: "active" }]);
    const events = await client.query<{
      error_code: string | null;
      outcome: string;
      request_id: string;
      to_status: string;
    }>(
      `select event.request_id, event.outcome, event.error_code, event.to_status
       from aiphabee_audit.research_agent_lifecycle_event event
       join aiphabee_core.research_agent_profile profile on profile.profile_id = event.profile_id
       where profile.workspace_id = 'workspace-concurrent'
       order by event.request_id`
    );
    expect(events.rows).toEqual([
      {
        error_code: null,
        outcome: "succeeded",
        request_id: "req-concurrent-first",
        to_status: "active"
      },
      {
        error_code: null,
        outcome: "succeeded",
        request_id: "req-concurrent-retry",
        to_status: "active"
      },
      {
        error_code: "LIFECYCLE_LEASE_BUSY",
        outcome: "conflict",
        request_id: "req-concurrent-second",
        to_status: "provisioning"
      }
    ]);
  });

  it("reclaims an expired operation lease without provisioning a second identity", async () => {
    await seedAuthorizedIdentity(client, "lease-expiry");
    const provisionUser = vi.fn(async (externalId: string) => ({
      external_id: externalId,
      user_id: "u_lease_expiry"
    }));
    const provisionAgent = vi.fn(async () => ({
      agent_id: "agt_lease_expiry",
      created: true
    }));
    const setUserStatus = vi.fn(async (_userId: string, status: "active" | "disabled") => ({
      status
    }));
    const service = new ResearchAgentLifecycleService({
      remote: { provisionAgent, provisionUser, removeUser: vi.fn(), setUserStatus },
      repository: new PostgresResearchAgentLifecycleRepository(client)
    });
    const activate = {
      accountId: "account-lease-expiry",
      intent: "activate" as const,
      reason: "initial provision",
      requestId: "req-lease-initial",
      workspaceId: "workspace-lease-expiry"
    };
    await expect(service.execute(activate)).resolves.toMatchObject({ lifecycle_status: "active" });
    await client.query(
      `update aiphabee_core.research_agent_profile
       set lifecycle_status = 'provisioning', desired_state = 'active',
           lease_owner_request_id = 'req-stale-owner',
           lease_expires_at = now() - interval '1 second'
       where workspace_id = 'workspace-lease-expiry'`
    );

    await expect(
      service.execute({ ...activate, reason: "reclaim expired lease", requestId: "req-lease-reclaim" })
    ).resolves.toMatchObject({ lifecycle_status: "active", outcome: "succeeded" });
    expect(provisionUser).toHaveBeenCalledOnce();
    expect(provisionAgent).toHaveBeenCalledOnce();
    expect(setUserStatus).toHaveBeenCalledOnce();
    expect(setUserStatus).toHaveBeenCalledWith("u_lease_expiry", "active");
  });

  it("denies and audits activation after temporal entitlement expiry before upstream work", async () => {
    await seedAuthorizedIdentity(client, "entitlement-expiry", { entitlementExpired: true });
    const remote = {
      provisionAgent: vi.fn(),
      provisionUser: vi.fn(),
      removeUser: vi.fn(),
      setUserStatus: vi.fn()
    };
    const service = new ResearchAgentLifecycleService({
      remote,
      repository: new PostgresResearchAgentLifecycleRepository(client)
    });

    await expect(
      service.execute({
        accountId: "account-entitlement-expiry",
        intent: "activate",
        reason: "expired temporal entitlement",
        requestId: "req-entitlement-expired",
        workspaceId: "workspace-entitlement-expiry"
      })
    ).resolves.toMatchObject({
      error_code: "RESEARCH_AGENT_ENTITLEMENT_DENIED",
      lifecycle_status: "disabled",
      outcome: "denied",
      retryable: false
    });
    expect(remote.provisionUser).not.toHaveBeenCalled();
    expect(remote.provisionAgent).not.toHaveBeenCalled();
    const audit = await client.query<{ error_code: string; outcome: string; to_status: string }>(
      `select event.error_code, event.outcome, event.to_status
       from aiphabee_audit.research_agent_lifecycle_event event
       join aiphabee_core.research_agent_profile profile on profile.profile_id = event.profile_id
       where profile.workspace_id = 'workspace-entitlement-expiry'`
    );
    expect(audit.rows).toEqual([
      {
        error_code: "RESEARCH_AGENT_ENTITLEMENT_DENIED",
        outcome: "denied",
        to_status: "disabled"
      }
    ]);
  });
});

async function seedAuthorizedIdentity(
  client: Client,
  suffix: string,
  options: { entitlementExpired?: boolean } = {}
): Promise<void> {
  const accountId = `account-${suffix}`;
  const workspaceId = `workspace-${suffix}`;
  await client.query("insert into platform.account values ($1, 'active')", [accountId]);
  await client.query("insert into platform.workspace values ($1, $2, 'active')", [
    workspaceId,
    accountId
  ]);
  await client.query(
    `insert into platform.workspace_membership values
      ($1, $2, $3, 'active', now() - interval '1 day', null)`,
    [`membership-${suffix}`, workspaceId, accountId]
  );
  await client.query(
    `insert into platform.workspace_subscription values
      ($1, $2, 'pro', 'active', now() - interval '1 day', null)`,
    [`subscription-${suffix}`, workspaceId]
  );
  await client.query(
    `insert into platform.workspace_product_access values
      ($1, $2, 'aiphabee', 'active', 'policy-v1', now() - interval '1 day', null)`,
    [`access-${suffix}`, workspaceId]
  );
  await client.query(
    `insert into platform.workspace_entitlement values
      ($1, $2, 'aiphabee', 'research_agent_enabled', 'approved',
       now() - interval '1 day', $3)`,
    [
      `entitlement-${suffix}`,
      workspaceId,
      options.entitlementExpired ? new Date(Date.now() - 60_000) : null
    ]
  );
}

const PREREQUISITE_SQL = `
create schema platform;
do $do$ begin
  if not exists (select 1 from pg_roles where rolname = 'aiphabee_runtime_rls') then
    create role aiphabee_runtime_rls nologin;
  end if;
  execute format(
    'grant aiphabee_runtime_rls to %I with set true',
    current_user
  );
end $do$;
create table platform.account (
  account_id text primary key,
  status text not null
);
create table platform.workspace (
  workspace_id text primary key,
  owner_account_id text not null references platform.account(account_id),
  status text not null
);
create table platform.workspace_membership (
  membership_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  account_id text not null references platform.account(account_id),
  status text not null,
  valid_from timestamptz not null,
  valid_to timestamptz
);
create table platform.subscription_plan (
  plan_code text primary key,
  status text not null
);
create table platform.workspace_subscription (
  subscription_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  plan_code text not null references platform.subscription_plan(plan_code),
  billing_state text not null,
  valid_from timestamptz not null,
  valid_to timestamptz
);
create table platform.product (
  product_id text primary key,
  product_code text not null unique,
  status text not null
);
create table platform.entitlement_policy (
  entitlement_policy_id text primary key,
  product_id text not null references platform.product(product_id),
  policy_version text not null,
  status text not null,
  effective_from timestamptz
);
create table platform.workspace_product_access (
  workspace_product_access_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  product_id text not null references platform.product(product_id),
  access_status text not null,
  policy_version text not null,
  valid_from timestamptz not null,
  valid_to timestamptz
);
create table platform.workspace_entitlement (
  workspace_entitlement_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  product_id text not null references platform.product(product_id),
  entitlement_key text not null,
  status text not null,
  valid_from timestamptz not null,
  valid_to timestamptz
);
create or replace function platform.current_account_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('aiphabee.account_id', true), '')
$$;
create or replace function platform.is_workspace_member(target_workspace_id text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from platform.workspace_membership membership
    join platform.account account on account.account_id = membership.account_id
    where membership.workspace_id = target_workspace_id
      and membership.account_id = (select platform.current_account_id())
      and membership.status = 'active'
      and membership.valid_from <= now()
      and (membership.valid_to is null or membership.valid_to > now())
      and account.status = 'active'
  )
$$;`;

const SEED_SQL = `
insert into platform.account values ('account-test', 'active');
insert into platform.workspace values ('workspace-test', 'account-test', 'active');
insert into platform.workspace_membership values (
  'membership-test', 'workspace-test', 'account-test', 'active', now() - interval '1 day', null
);
insert into platform.subscription_plan values ('pro', 'active');
insert into platform.workspace_subscription values (
  'subscription-test', 'workspace-test', 'pro', 'active', now() - interval '1 day', null
);
insert into platform.product values ('aiphabee', 'aiphabee', 'active');
insert into platform.entitlement_policy values (
  'policy-test', 'aiphabee', 'policy-v1', 'active', now() - interval '1 day'
);
insert into platform.workspace_product_access values (
  'access-test', 'workspace-test', 'aiphabee', 'active', 'policy-v1', now() - interval '1 day', null
);
insert into platform.workspace_entitlement values (
  'entitlement-test', 'workspace-test', 'aiphabee', 'research_agent_enabled', 'approved',
  now() - interval '1 day', null
);
insert into platform.account values ('account-partial', 'active');
insert into platform.workspace values ('workspace-partial', 'account-partial', 'active');
insert into platform.workspace_membership values (
  'membership-partial', 'workspace-partial', 'account-partial', 'active', now() - interval '1 day', null
);
insert into platform.workspace_subscription values (
  'subscription-partial', 'workspace-partial', 'pro', 'active', now() - interval '1 day', null
);
insert into platform.workspace_product_access values (
  'access-partial', 'workspace-partial', 'aiphabee', 'active', 'policy-v1', now() - interval '1 day', null
);
insert into platform.workspace_entitlement values (
  'entitlement-partial', 'workspace-partial', 'aiphabee', 'research_agent_enabled', 'approved',
  now() - interval '1 day', null
);`;
