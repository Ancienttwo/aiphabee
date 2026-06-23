create schema if not exists platform;
create schema if not exists platform_audit;

create table if not exists platform.product (
  product_id text primary key,
  product_code text not null unique,
  display_name text not null,
  status text not null default 'planned' check (
    status in ('planned', 'active', 'paused', 'retired')
  ),
  default_schema_prefix text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platform.product_environment (
  product_environment_id text primary key,
  product_id text not null references platform.product(product_id),
  environment text not null check (environment in ('dev', 'staging', 'prod')),
  runtime_base_url text,
  api_exposed_schemas text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, environment)
);

create table if not exists platform.account (
  account_id text primary key,
  auth_subject text unique,
  email_hash text,
  display_name text,
  status text not null default 'active' check (
    status in ('active', 'suspended', 'closed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platform.workspace (
  workspace_id text primary key,
  owner_account_id text not null references platform.account(account_id),
  display_name text not null,
  billing_region text,
  data_region text,
  status text not null default 'active' check (
    status in ('active', 'suspended', 'closed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platform.workspace_membership (
  membership_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  account_id text not null references platform.account(account_id),
  role text not null check (role in ('owner', 'admin', 'member', 'viewer', 'billing')),
  status text not null default 'active' check (
    status in ('active', 'suspended', 'removed')
  ),
  valid_from timestamptz not null,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from),
  unique (workspace_id, account_id, role, valid_from)
);

create table if not exists platform.subscription_plan (
  plan_code text primary key check (
    plan_code in ('free', 'plus', 'pro', 'developer', 'team', 'enterprise')
  ),
  plan_name text not null,
  web_entitlement_tier text not null,
  mcp_entitlement_tier text not null,
  default_credit_limit integer not null default 0 check (default_credit_limit >= 0),
  seat_limit integer check (seat_limit is null or seat_limit > 0),
  export_allowed_default boolean not null default false,
  status text not null default 'planned' check (status in ('planned', 'active', 'retired')),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platform.workspace_subscription (
  subscription_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  plan_code text not null references platform.subscription_plan(plan_code),
  billing_state text not null default 'trialing' check (
    billing_state in ('trialing', 'active', 'grace_period', 'paused', 'canceled')
  ),
  seats_purchased integer not null default 1 check (seats_purchased > 0),
  valid_from timestamptz not null,
  valid_to timestamptz,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from)
);

create table if not exists platform.workspace_product_access (
  workspace_product_access_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  product_id text not null references platform.product(product_id),
  access_status text not null default 'revoked' check (
    access_status in ('trialing', 'active', 'paused', 'revoked')
  ),
  policy_version text not null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from),
  unique (workspace_id, product_id, valid_from)
);

create table if not exists platform.entitlement_policy (
  entitlement_policy_id text primary key,
  product_id text not null references platform.product(product_id),
  policy_version text not null,
  status text not null default 'planned' check (
    status in ('planned', 'active', 'retired')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  source_ref text not null,
  effective_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, policy_version)
);

create table if not exists platform.workspace_entitlement (
  workspace_entitlement_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  product_id text not null references platform.product(product_id),
  entitlement_key text not null,
  status text not null default 'default_deny' check (
    status in ('default_deny', 'approved', 'blocked')
  ),
  valid_from timestamptz not null,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from),
  unique (workspace_id, product_id, entitlement_key, valid_from)
);

create table if not exists platform_audit.product_access_event (
  event_id text primary key,
  product_id text not null references platform.product(product_id),
  workspace_id text references platform.workspace(workspace_id),
  actor_account_id text references platform.account(account_id),
  actor_service text,
  event_type text not null,
  event_time timestamptz not null default now(),
  policy_version text,
  metadata jsonb not null default '{}'::jsonb,
  check (actor_account_id is not null or actor_service is not null)
);

create index if not exists product_environment_product_id_idx
  on platform.product_environment (product_id);

create index if not exists workspace_owner_account_id_idx
  on platform.workspace (owner_account_id);

create index if not exists workspace_membership_workspace_id_idx
  on platform.workspace_membership (workspace_id);

create index if not exists workspace_membership_account_id_workspace_id_status_idx
  on platform.workspace_membership (account_id, workspace_id, status);

create index if not exists workspace_subscription_workspace_id_idx
  on platform.workspace_subscription (workspace_id);

create index if not exists workspace_subscription_plan_code_billing_state_idx
  on platform.workspace_subscription (plan_code, billing_state);

create index if not exists workspace_product_access_workspace_id_idx
  on platform.workspace_product_access (workspace_id);

create index if not exists workspace_product_access_product_id_workspace_id_access_status_
  on platform.workspace_product_access (product_id, workspace_id, access_status);

create index if not exists entitlement_policy_product_id_policy_version_idx
  on platform.entitlement_policy (product_id, policy_version);

create index if not exists workspace_entitlement_workspace_id_idx
  on platform.workspace_entitlement (workspace_id);

create index if not exists workspace_entitlement_product_id_workspace_id_entitlement_key_s
  on platform.workspace_entitlement (product_id, workspace_id, entitlement_key, status);

create index if not exists product_access_event_product_id_workspace_id_event_time_idx
  on platform_audit.product_access_event (product_id, workspace_id, event_time);

create index if not exists product_access_event_workspace_id_idx
  on platform_audit.product_access_event (workspace_id);

create index if not exists product_access_event_actor_account_id_idx
  on platform_audit.product_access_event (actor_account_id);

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
    from platform.workspace_membership wm
    where wm.workspace_id = target_workspace_id
      and wm.account_id = (select platform.current_account_id())
      and wm.status = 'active'
      and wm.valid_from <= now()
      and (wm.valid_to is null or wm.valid_to > now())
      and exists (
        select 1
        from platform.account a
        where a.account_id = wm.account_id
          and a.status = 'active'
      )
  )
$$;

insert into platform.product (
  product_id,
  product_code,
  display_name,
  status,
  default_schema_prefix
)
values
  ('aiphabee', 'aiphabee', 'AiphaBee', 'planned', 'aiphabee')
on conflict (product_code) do update set
  display_name = excluded.display_name,
  status = excluded.status,
  default_schema_prefix = excluded.default_schema_prefix,
  updated_at = now();

alter table platform.product enable row level security;
alter table platform.product force row level security;

alter table platform.product_environment enable row level security;
alter table platform.product_environment force row level security;

alter table platform.account enable row level security;
alter table platform.account force row level security;

alter table platform.workspace enable row level security;
alter table platform.workspace force row level security;

alter table platform.workspace_membership enable row level security;
alter table platform.workspace_membership force row level security;

alter table platform.subscription_plan enable row level security;
alter table platform.subscription_plan force row level security;

alter table platform.workspace_subscription enable row level security;
alter table platform.workspace_subscription force row level security;

alter table platform.workspace_product_access enable row level security;
alter table platform.workspace_product_access force row level security;

alter table platform.entitlement_policy enable row level security;
alter table platform.entitlement_policy force row level security;

alter table platform.workspace_entitlement enable row level security;
alter table platform.workspace_entitlement force row level security;

alter table platform_audit.product_access_event enable row level security;
alter table platform_audit.product_access_event force row level security;

alter table aiphabee_core.account_profile enable row level security;
alter table aiphabee_core.account_profile force row level security;

alter table aiphabee_core.workspace_profile enable row level security;
alter table aiphabee_core.workspace_profile force row level security;

alter table aiphabee_core.workspace_membership_profile enable row level security;
alter table aiphabee_core.workspace_membership_profile force row level security;

alter table aiphabee_governance.data_entitlement enable row level security;
alter table aiphabee_governance.data_entitlement force row level security;

alter table aiphabee_governance.workspace_entitlement enable row level security;
alter table aiphabee_governance.workspace_entitlement force row level security;

alter table aiphabee_governance.account_workspace_entitlement_contract enable row level security;
alter table aiphabee_governance.account_workspace_entitlement_contract force row level security;

create policy product_registry_read
on platform.product
for select
using (status in ('planned', 'active', 'paused', 'retired'));

create policy product_environment_registry_read
on platform.product_environment
for select
using (
  exists (
    select 1
    from platform.product p
    where p.product_id = product_environment.product_id
      and p.status in ('planned', 'active', 'paused')
  )
);

create policy account_self_read
on platform.account
for select
using (
  account_id = (select platform.current_account_id())
  and status = 'active'
);

create policy workspace_member_read
on platform.workspace
for select
using ((select platform.is_workspace_member(workspace_id)));

create policy workspace_membership_self_read
on platform.workspace_membership
for select
using (
  account_id = (select platform.current_account_id())
  and status = 'active'
  and valid_from <= now()
  and (valid_to is null or valid_to > now())
);

create policy subscription_plan_registry_read
on platform.subscription_plan
for select
using (status in ('planned', 'active', 'retired'));

create policy workspace_subscription_member_read
on platform.workspace_subscription
for select
using ((select platform.is_workspace_member(workspace_id)));

create policy workspace_product_access_member_read
on platform.workspace_product_access
for select
using ((select platform.is_workspace_member(workspace_id)));

create policy entitlement_policy_member_read
on platform.entitlement_policy
for select
using (
  exists (
    select 1
    from platform.workspace_product_access wpa
    where wpa.product_id = entitlement_policy.product_id
      and wpa.access_status in ('trialing', 'active')
      and (select platform.is_workspace_member(wpa.workspace_id))
  )
);

create policy workspace_entitlement_member_read
on platform.workspace_entitlement
for select
using ((select platform.is_workspace_member(workspace_id)));

create policy account_profile_self_read
on aiphabee_core.account_profile
for select
using (account_id = (select platform.current_account_id()));

create policy workspace_profile_member_read
on aiphabee_core.workspace_profile
for select
using ((select platform.is_workspace_member(workspace_id)));

create policy workspace_membership_profile_self_read
on aiphabee_core.workspace_membership_profile
for select
using (
  exists (
    select 1
    from platform.workspace_membership wm
    where wm.membership_id = workspace_membership_profile.membership_id
      and wm.account_id = (select platform.current_account_id())
      and wm.status = 'active'
      and wm.valid_from <= now()
      and (wm.valid_to is null or wm.valid_to > now())
  )
);

create policy data_entitlement_member_read
on aiphabee_governance.data_entitlement
for select
using (
  exists (
    select 1
    from aiphabee_governance.workspace_entitlement we
    where we.entitlement_id = data_entitlement.entitlement_id
      and (select platform.is_workspace_member(we.workspace_id))
      and we.valid_from <= now()
      and (we.valid_to is null or we.valid_to > now())
  )
);

create policy workspace_entitlement_member_read
on aiphabee_governance.workspace_entitlement
for select
using ((select platform.is_workspace_member(workspace_id)));

create policy account_workspace_entitlement_contract_read
on aiphabee_governance.account_workspace_entitlement_contract
for select
using (status in ('local_contract', 'provisioned'));

-- Supabase exposure grants. RLS only filters rows; without schema/table
-- privileges the authenticated read policies above are unreachable. Grant the
-- minimum: usage on the hardened schemas plus select on each read-policy table.
-- anon receives nothing. The cross-product audit log is granted to service_role
-- only, so it stays deny-all for authenticated.
grant usage on schema platform to authenticated, service_role;
grant usage on schema platform_audit to service_role;
grant usage on schema aiphabee_core to authenticated, service_role;
grant usage on schema aiphabee_governance to authenticated, service_role;

grant select on
  platform.product,
  platform.product_environment,
  platform.account,
  platform.workspace,
  platform.workspace_membership,
  platform.subscription_plan,
  platform.workspace_subscription,
  platform.workspace_product_access,
  platform.entitlement_policy,
  platform.workspace_entitlement,
  aiphabee_core.account_profile,
  aiphabee_core.workspace_profile,
  aiphabee_core.workspace_membership_profile,
  aiphabee_governance.data_entitlement,
  aiphabee_governance.workspace_entitlement,
  aiphabee_governance.account_workspace_entitlement_contract
to authenticated;

-- Service-role all-access policies, one per forced-RLS table. service_role also
-- carries bypassrls in Supabase; these policies keep server-side access intact
-- if that attribute is ever dropped. service_role paths must still filter by
-- product_id/workspace_id in application code.
create policy product_service_role_all on platform.product for all to service_role using (true) with check (true);
create policy product_environment_service_role_all on platform.product_environment for all to service_role using (true) with check (true);
create policy account_service_role_all on platform.account for all to service_role using (true) with check (true);
create policy workspace_service_role_all on platform.workspace for all to service_role using (true) with check (true);
create policy workspace_membership_service_role_all on platform.workspace_membership for all to service_role using (true) with check (true);
create policy subscription_plan_service_role_all on platform.subscription_plan for all to service_role using (true) with check (true);
create policy workspace_subscription_service_role_all on platform.workspace_subscription for all to service_role using (true) with check (true);
create policy workspace_product_access_service_role_all on platform.workspace_product_access for all to service_role using (true) with check (true);
create policy entitlement_policy_service_role_all on platform.entitlement_policy for all to service_role using (true) with check (true);
create policy workspace_entitlement_service_role_all on platform.workspace_entitlement for all to service_role using (true) with check (true);
create policy product_access_event_service_role_all on platform_audit.product_access_event for all to service_role using (true) with check (true);
create policy account_profile_service_role_all on aiphabee_core.account_profile for all to service_role using (true) with check (true);
create policy workspace_profile_service_role_all on aiphabee_core.workspace_profile for all to service_role using (true) with check (true);
create policy workspace_membership_profile_service_role_all on aiphabee_core.workspace_membership_profile for all to service_role using (true) with check (true);
create policy data_entitlement_service_role_all on aiphabee_governance.data_entitlement for all to service_role using (true) with check (true);
create policy workspace_entitlement_service_role_all on aiphabee_governance.workspace_entitlement for all to service_role using (true) with check (true);
create policy account_workspace_entitlement_contract_service_role_all on aiphabee_governance.account_workspace_entitlement_contract for all to service_role using (true) with check (true);
