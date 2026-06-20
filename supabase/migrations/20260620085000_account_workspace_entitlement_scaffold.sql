create schema if not exists core;
create schema if not exists governance;

create table if not exists core.account (
  account_id text primary key,
  email_hash text not null,
  display_name text,
  status text not null default 'active' check (
    status in ('active', 'suspended', 'closed')
  ),
  region text,
  default_timezone text not null default 'Asia/Hong_Kong',
  data_retention_state text not null default 'standard' check (
    data_retention_state in ('standard', 'export_requested', 'erasure_requested', 'retained_for_audit')
  ),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.workspace (
  workspace_id text primary key,
  owner_account_id text not null references core.account(account_id),
  display_name text not null,
  billing_region text,
  data_region text,
  status text not null default 'active' check (
    status in ('active', 'suspended', 'closed')
  ),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.workspace_membership (
  membership_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  account_id text not null references core.account(account_id),
  role text not null check (role in ('owner', 'admin', 'member', 'viewer', 'billing')),
  status text not null default 'active' check (
    status in ('active', 'suspended', 'removed')
  ),
  valid_from timestamptz not null,
  valid_to timestamptz,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from),
  unique (workspace_id, account_id, role, valid_from)
);

create table if not exists core.subscription_plan (
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

create table if not exists core.workspace_subscription (
  subscription_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  plan_code text not null references core.subscription_plan(plan_code),
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

create table if not exists core.data_entitlement (
  entitlement_id text primary key,
  dataset text not null,
  channel text not null check (channel in ('web', 'mcp', 'api', 'export')),
  field_pattern text not null,
  time_range_days integer check (time_range_days is null or time_range_days >= 0),
  export_allowed boolean not null default false,
  status text not null default 'default_deny' check (
    status in ('default_deny', 'approved', 'blocked')
  ),
  rights_policy_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dataset, channel, field_pattern, rights_policy_version)
);

create table if not exists core.workspace_entitlement (
  workspace_entitlement_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  subscription_id text references core.workspace_subscription(subscription_id),
  entitlement_id text not null references core.data_entitlement(entitlement_id),
  status text not null default 'default_deny' check (
    status in ('default_deny', 'approved', 'blocked')
  ),
  valid_from timestamptz not null,
  valid_to timestamptz,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from),
  unique (workspace_id, entitlement_id, valid_from)
);

create table if not exists governance.account_workspace_entitlement_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.account_workspace_entitlement_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase1.account_workspace_entitlement',
  '2026-06-20.phase1.account-workspace-entitlement.v0',
  'local_contract',
  'default_deny',
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  market_data_loaded = excluded.market_data_loaded,
  updated_at = now();
