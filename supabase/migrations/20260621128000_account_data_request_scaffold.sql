create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.account_data_request (
  data_request_id text not null,
  account_id text not null references core.account(account_id),
  workspace_id text not null references core.workspace(workspace_id),
  request_action text not null check (request_action in ('download', 'erasure_request')),
  request_status text not null default 'planned_no_write' check (
    request_status in ('planned_no_write', 'blocked', 'completed', 'rejected')
  ),
  requested_at timestamptz not null,
  retention_policy_version text not null,
  identity_verification_state text not null default 'pending' check (
    identity_verification_state in ('pending', 'verified', 'failed')
  ),
  secure_delivery_required boolean not null default true,
  live_data_export_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (data_request_id)
);

create table if not exists core.account_data_request_item (
  data_request_item_id text not null,
  data_request_id text not null references core.account_data_request(data_request_id),
  request_scope text not null check (
    request_scope in (
      'account_profile',
      'workspace_membership',
      'subscription_billing',
      'mcp_credentials_metadata',
      'authorized_memory',
      'saved_research',
      'usage_ledger',
      'audit_log'
    )
  ),
  planned_action text not null check (
    planned_action in ('export', 'schedule_erasure', 'anonymize', 'retain')
  ),
  retention_state text not null default 'policy_pending' check (
    retention_state in ('policy_pending', 'eligible_for_erasure', 'retained_for_audit')
  ),
  live_execution_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (data_request_item_id)
);

create table if not exists audit.account_data_request_event (
  account_data_request_event_id text not null,
  data_request_id text not null,
  request_id text not null,
  account_id text not null,
  workspace_id text not null,
  request_action text not null check (request_action in ('download', 'erasure_request')),
  audit_event text not null default 'account.data_request.plan',
  retention_policy_version text not null,
  verified_by text not null default 'verification_pending',
  write_status text not null default 'planned_no_write',
  raw_payload_stored boolean not null default false,
  credential_material_stored boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (account_data_request_event_id)
);

create table if not exists governance.account_data_request_contract (
  contract_name text not null default 'account_data_request',
  contract_version text not null default '2026-06-21.phase3.account-data-request-scaffold.v0',
  runtime_route text not null default 'GET /account/runtime',
  plan_route text not null default 'POST /account/data-requests/plan',
  retention_policy_required boolean not null default true,
  audit_required boolean not null default true,
  live_data_export_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  sql_emitted boolean not null default false,
  unsupported_scopes_block_before_write boolean not null default true,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
