import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  PostgresResearchAgentLifecycleRepository,
  ResearchAgentLifecycleService
} from "./research-agent-lifecycle.js";

const databaseUrl = process.env.RESEARCH_AGENT_LIFECYCLE_TEST_DATABASE_URL;
const describePostgres = databaseUrl === undefined ? describe.skip : describe;

describePostgres("research Agent lifecycle Postgres integration", () => {
  const client = new Client({ connectionString: databaseUrl });

  beforeAll(async () => {
    await client.connect();
    const database = await client.query<{ current_database: string }>(
      "select current_database()"
    );
    if (!database.rows[0]?.current_database.startsWith("aiphabee_lifecycle_test")) {
      throw new Error("integration database name must start with aiphabee_lifecycle_test");
    }
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
    await client.end();
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
    await expect(repository.claim(duplicateClaimInput)).resolves.toEqual({ kind: "busy" });
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

    await client.query("update platform.account set status = 'closed' where account_id = 'account-test'");
    await expect(
      service.execute({
        ...activate,
        intent: "delete",
        reason: "account erasure approved",
        requestId: "req-delete"
      })
    ).resolves.toMatchObject({ lifecycle_status: "deleted", outcome: "succeeded" });
    expect(removeUser).toHaveBeenCalledWith("u_dedicated");

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
    expect(audit.rows[0]?.count).toBe("4");
  });
});

const PREREQUISITE_SQL = `
create schema platform;
do $do$ begin
  if not exists (select 1 from pg_roles where rolname = 'aiphabee_runtime_rls') then
    create role aiphabee_runtime_rls nologin;
  end if;
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
);`;
