create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.enterprise_seat_assignment (
  seat_assignment_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  account_id text not null references core.account(account_id),
  membership_id text references core.workspace_membership(membership_id),
  plan_code text not null check (plan_code in ('team', 'enterprise')),
  seat_status text not null default 'planned_no_write' check (
    seat_status in ('planned_no_write', 'invited', 'active', 'suspended', 'removed')
  ),
  directory_sync_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists core.enterprise_sso_config (
  sso_config_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  plan_code text not null check (plan_code in ('team', 'enterprise')),
  sso_protocol text not null check (sso_protocol in ('saml', 'oidc')),
  domain_hash text,
  metadata_validation_status text not null default 'planned_no_live' check (
    metadata_validation_status in ('planned_no_live', 'validated', 'failed')
  ),
  identity_provider_calls_enabled boolean not null default false,
  credential_material_stored boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists audit.enterprise_admin_event (
  enterprise_admin_event_id text primary key,
  request_id text not null,
  workspace_id text not null references core.workspace(workspace_id),
  actor_account_id text not null references core.account(account_id),
  audit_event text not null default 'account.enterprise_controls.plan',
  event_type text not null check (
    event_type in ('seat_plan', 'sso_plan', 'audit_export_plan', 'private_connector_plan')
  ),
  write_status text not null default 'planned_no_write' check (
    write_status in ('planned_no_write', 'written')
  ),
  raw_payload_stored boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists core.private_data_connector (
  connector_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  connector_kind text not null check (
    connector_kind in ('customer_warehouse', 'managed_bucket', 'private_api')
  ),
  connector_name text not null,
  connection_test_status text not null default 'planned_no_live' check (
    connection_test_status in ('planned_no_live', 'validated', 'failed')
  ),
  live_connection_enabled boolean not null default false,
  credential_material_stored boolean not null default false,
  rights_gateway_required boolean not null default true,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists governance.enterprise_controls_contract (
  contract_name text not null default 'enterprise_controls',
  contract_version text not null default '2026-06-22.phase4.enterprise-controls-scaffold.v0',
  runtime_route text not null default 'GET /account/runtime',
  plan_route text not null default 'POST /account/enterprise-controls/plan',
  team_enterprise_only boolean not null default true,
  sso_provider_calls_enabled boolean not null default false,
  directory_sync_enabled boolean not null default false,
  private_connector_live_calls_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  sql_emitted boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
