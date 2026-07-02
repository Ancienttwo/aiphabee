create schema if not exists aiphabee_audit;
create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.static_report_artifact (
  static_report_ref text not null,
  report_id text not null,
  source_run_id text not null,
  workspace_id text references platform.workspace(workspace_id),
  user_id text references platform.account(account_id),
  format text not null check (format in ('html', 'pdf', 'image')),
  generated_at timestamptz not null,
  as_of timestamptz not null,
  data_delay_minutes integer not null check (data_delay_minutes >= 0),
  data_version text not null,
  methodology_version text not null,
  rights_policy_version text not null,
  disclaimer text not null,
  watermark_required boolean not null default true,
  raw_partner_data_embedded boolean not null default false,
  artifact_written boolean not null default false,
  live_tool_execution boolean not null default false,
  live_data_access boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (static_report_ref)
);

create table if not exists aiphabee_audit.static_report_event (
  static_report_event_ref text not null,
  static_report_ref text references aiphabee_core.static_report_artifact(static_report_ref),
  request_id text not null,
  event_kind text not null default 'planned',
  metadata_complete boolean not null default false,
  write_status text not null default 'planned_no_write',
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (static_report_event_ref)
);

create table if not exists aiphabee_governance.static_report_contract (
  contract_name text not null default 'static_report_artifact',
  contract_version text not null default '2026-06-21.phase3.static-report-metadata-scaffold.v0',
  route text not null default 'POST /research/reports/static/plan',
  runtime_route text not null default 'GET /research/runtime',
  required_scope text not null default 'exports.read',
  generated_at_required boolean not null default true,
  data_delay_required boolean not null default true,
  version_metadata_required boolean not null default true,
  disclaimer_required boolean not null default true,
  watermark_required boolean not null default true,
  artifact_writes_enabled boolean not null default false,
  persistent_writes_enabled boolean not null default false,
  frontend_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
