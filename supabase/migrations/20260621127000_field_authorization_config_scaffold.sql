create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.field_authorization_change (
  change_id text primary key,
  request_id text not null,
  operator_id text not null,
  dataset text not null,
  field_pattern text not null,
  channel text not null check (channel in ('api', 'export', 'mcp', 'web')),
  plan_code text not null,
  workspace_id text references core.workspace(workspace_id),
  target_status text not null check (target_status in ('approved', 'blocked', 'default_deny')),
  export_allowed boolean not null default false,
  max_window_days integer check (max_window_days is null or max_window_days > 0),
  policy_version text not null,
  approval_status text not null default 'pending' check (
    approval_status in ('pending', 'approved', 'rejected')
  ),
  change_status text not null default 'awaiting_approval' check (
    change_status in (
      'awaiting_approval',
      'scheduled',
      'active_preview',
      'rejected',
      'blocked_missing_context'
    )
  ),
  effective_at timestamptz not null,
  expires_at timestamptz,
  reason text,
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > effective_at)
);

create table if not exists audit.field_authorization_approval (
  approval_id text primary key,
  change_id text not null references core.field_authorization_change(change_id),
  request_id text not null,
  reviewer_id text,
  approval_status text not null check (approval_status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists governance.field_authorization_config_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.field_authorization_config_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase3.field_authorization_config',
  '2026-06-21.phase3.field-authorization-config-scaffold.v0',
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
