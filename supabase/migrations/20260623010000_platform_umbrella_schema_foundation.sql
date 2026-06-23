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
  supabase_exposed_schemas text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, environment)
);

create table if not exists platform.account (
  account_id text primary key,
  auth_user_id uuid unique,
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

create index if not exists workspace_product_access_workspace_id_idx
  on platform.workspace_product_access (workspace_id);

create index if not exists workspace_product_access_product_id_workspace_id_access_status_idx
  on platform.workspace_product_access (product_id, workspace_id, access_status);

create index if not exists entitlement_policy_product_id_policy_version_idx
  on platform.entitlement_policy (product_id, policy_version);

create index if not exists workspace_entitlement_workspace_id_idx
  on platform.workspace_entitlement (workspace_id);

create index if not exists workspace_entitlement_product_id_workspace_id_entitlement_key_status_idx
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
  select account_id
  from platform.account
  where auth_user_id = (select auth.uid())
    and status = 'active'
  limit 1
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
      and (wm.valid_to is null or wm.valid_to > now())
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
  ('aiphabee', 'aiphabee', 'AiphaBee', 'planned', 'aiphabee'),
  ('aimpact', 'aimpact', 'AIMPACT', 'planned', 'aimpact'),
  ('salesko', 'salesko', 'Salesko', 'planned', 'salesko')
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

alter table platform.workspace_product_access enable row level security;
alter table platform.workspace_product_access force row level security;

alter table platform.entitlement_policy enable row level security;
alter table platform.entitlement_policy force row level security;

alter table platform.workspace_entitlement enable row level security;
alter table platform.workspace_entitlement force row level security;

alter table platform_audit.product_access_event enable row level security;
alter table platform_audit.product_access_event force row level security;

create policy product_authenticated_read
on platform.product
for select
to authenticated
using (status in ('planned', 'active', 'paused', 'retired'));

create policy product_environment_authenticated_read
on platform.product_environment
for select
to authenticated
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
to authenticated
using (
  auth_user_id = (select auth.uid())
  and status = 'active'
);

create policy workspace_member_read
on platform.workspace
for select
to authenticated
using ((select platform.is_workspace_member(workspace_id)));

create policy workspace_membership_self_read
on platform.workspace_membership
for select
to authenticated
using (
  account_id = (select platform.current_account_id())
  and status = 'active'
  and (valid_to is null or valid_to > now())
);

create policy workspace_product_access_member_read
on platform.workspace_product_access
for select
to authenticated
using ((select platform.is_workspace_member(workspace_id)));

create policy entitlement_policy_member_read
on platform.entitlement_policy
for select
to authenticated
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
to authenticated
using ((select platform.is_workspace_member(workspace_id)));
