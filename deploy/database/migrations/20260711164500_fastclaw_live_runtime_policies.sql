-- Row-10 live write policies for the restricted research-Agent runtime role.
-- Every write remains bound to platform.current_account_id() and active
-- workspace membership; the migration does not grant BYPASSRLS.

create schema if not exists aiphabee_governance;

create table if not exists aiphabee_governance.fastclaw_live_runtime_policy_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('active', 'retired')),
  default_rights_status text not null check (default_rights_status = 'default_deny'),
  bypassrls_allowed boolean not null default false check (bypassrls_allowed = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.fastclaw_live_runtime_policy_contract (
  contract_key, contract_version, status, default_rights_status, bypassrls_allowed
) values (
  'fastclaw.live-runtime-policy',
  '2026-07-11.fastclaw-live-runtime-policy.v0',
  'active',
  'default_deny',
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_rights_status = excluded.default_rights_status,
  bypassrls_allowed = excluded.bypassrls_allowed,
  updated_at = now();

alter table aiphabee_governance.fastclaw_live_runtime_policy_contract enable row level security;
alter table aiphabee_governance.fastclaw_live_runtime_policy_contract force row level security;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_governance'
      and tablename = 'fastclaw_live_runtime_policy_contract'
      and policyname = 'fastclaw_live_runtime_policy_contract_active_read'
  ) then
    create policy fastclaw_live_runtime_policy_contract_active_read
    on aiphabee_governance.fastclaw_live_runtime_policy_contract
    for select
    using (status = 'active' and default_rights_status = 'default_deny');
  end if;
end $do$;

alter table aiphabee_core.usage_meter_rule enable row level security;
alter table aiphabee_core.usage_meter_rule force row level security;
alter table aiphabee_core.usage_event enable row level security;
alter table aiphabee_core.usage_event force row level security;
alter table aiphabee_core.usage_ledger_entry enable row level security;
alter table aiphabee_core.usage_ledger_entry force row level security;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'research_agent_profile'
      and policyname = 'research_agent_profile_account_write'
  ) then
    create policy research_agent_profile_account_write
    on aiphabee_core.research_agent_profile
    for all
    using (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    )
    with check (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    );
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_audit'
      and tablename = 'research_agent_lifecycle_event'
      and policyname = 'research_agent_lifecycle_event_account_insert'
  ) then
    create policy research_agent_lifecycle_event_account_insert
    on aiphabee_audit.research_agent_lifecycle_event
    for insert
    with check (
      exists (
        select 1 from aiphabee_core.research_agent_profile profile
        where profile.profile_id = research_agent_lifecycle_event.profile_id
          and profile.account_id = (select platform.current_account_id())
          and (select platform.is_workspace_member(profile.workspace_id))
      )
    );
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'durable_agent_handoff'
      and policyname = 'durable_agent_handoff_owner_insert'
  ) then
    create policy durable_agent_handoff_owner_insert
    on aiphabee_core.durable_agent_handoff
    for insert
    with check (
      owner_account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    );
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'research_agent_run_usage'
      and policyname = 'research_agent_run_usage_account_insert'
  ) then
    create policy research_agent_run_usage_account_insert
    on aiphabee_core.research_agent_run_usage
    for insert
    with check (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    );
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_audit'
      and tablename = 'research_agent_admin_event'
      and policyname = 'research_agent_admin_event_actor_write'
  ) then
    create policy research_agent_admin_event_actor_write
    on aiphabee_audit.research_agent_admin_event
    for all
    using (
      actor_account_id = (select platform.current_account_id())
      and exists (
        select 1 from platform.workspace_membership membership
        where membership.workspace_id = research_agent_admin_event.workspace_id
          and membership.account_id = (select platform.current_account_id())
          and membership.role in ('owner', 'admin')
          and membership.status = 'active'
          and membership.valid_from <= now()
          and (membership.valid_to is null or membership.valid_to > now())
      )
    )
    with check (
      actor_account_id = (select platform.current_account_id())
      and exists (
        select 1 from platform.workspace_membership membership
        where membership.workspace_id = research_agent_admin_event.workspace_id
          and membership.account_id = (select platform.current_account_id())
          and membership.role in ('owner', 'admin')
          and membership.status = 'active'
          and membership.valid_from <= now()
          and (membership.valid_to is null or membership.valid_to > now())
      )
    );
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'usage_meter_rule'
      and policyname = 'usage_meter_rule_active_read'
  ) then
    create policy usage_meter_rule_active_read
    on aiphabee_core.usage_meter_rule
    for select
    using (status = 'active');
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'usage_event'
      and policyname = 'usage_event_account_scope'
  ) then
    create policy usage_event_account_scope
    on aiphabee_core.usage_event
    for all
    using (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    )
    with check (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    );
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'usage_ledger_entry'
      and policyname = 'usage_ledger_entry_account_scope'
  ) then
    create policy usage_ledger_entry_account_scope
    on aiphabee_core.usage_ledger_entry
    for all
    using (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    )
    with check (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
      and exists (
        select 1 from aiphabee_core.usage_event event
        where event.usage_event_id = usage_ledger_entry.usage_event_id
          and event.workspace_id = usage_ledger_entry.workspace_id
          and event.account_id = usage_ledger_entry.account_id
      )
    );
  end if;
end $do$;
