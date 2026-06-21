create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.restricted_export_request (
  export_request_ref text not null,
  account_id text references core.account(account_id),
  workspace_id text references core.workspace(workspace_id),
  request_id text not null,
  dataset text not null,
  export_format text not null check (export_format in ('csv', 'image', 'pdf')),
  required_scope text not null default 'exports.read',
  requested_rows integer not null check (requested_rows >= 0),
  served_rows integer not null default 0 check (served_rows >= 0),
  allowed_fields text[] not null default '{}',
  denied_fields text[] not null default '{}',
  watermark_required boolean not null default true,
  artifact_written boolean not null default false,
  live_data_access boolean not null default false,
  rights_policy_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  primary key (export_request_ref)
);

create table if not exists audit.restricted_export_event (
  export_event_ref text not null,
  export_request_ref text not null references core.restricted_export_request(export_request_ref),
  request_id text not null,
  event_kind text not null check (
    event_kind in ('planned', 'blocked_missing_scope', 'blocked_gateway_denied')
  ),
  gateway_status text not null,
  created_at timestamptz not null default now(),
  primary key (export_event_ref)
);

create table if not exists governance.restricted_export_contract (
  contract_name text not null default 'restricted_exports',
  contract_version text not null default '2026-06-21.phase3.restricted-export-scaffold.v0',
  route text not null default 'POST /gateway/exports/plan',
  runtime_route text not null default 'GET /gateway/runtime',
  required_scope text not null default 'exports.read',
  watermark_required boolean not null default true,
  live_data_access boolean not null default false,
  artifact_writes_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
