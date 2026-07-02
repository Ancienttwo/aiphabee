create schema if not exists aiphabee_audit;
create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.user_public_data_join_plan (
  plan_id text primary key,
  request_id text not null,
  workspace_id text,
  user_file_id text,
  user_file_sha256 text,
  user_consent_id text,
  public_data_scope text,
  field_authorization_policy_id text,
  privacy_policy_id text,
  retention_policy_id text,
  custom_layout_id text,
  route text not null default 'POST /documents/user-public-data-join/plan' check (
    route = 'POST /documents/user-public-data-join/plan'
  ),
  runtime_route text not null default 'GET /documents/runtime' check (
    runtime_route = 'GET /documents/runtime'
  ),
  gateway_access_route text not null default 'POST /gateway/access-check' check (
    gateway_access_route = 'POST /gateway/access-check'
  ),
  gateway_export_route text not null default 'POST /gateway/exports/plan' check (
    gateway_export_route = 'POST /gateway/exports/plan'
  ),
  join_keys text[] not null default array['instrument_id'],
  requested_fields text[] not null default array[]::text[],
  raw_file_body_persisted boolean not null default false check (
    raw_file_body_persisted = false
  ),
  live_upload_storage boolean not null default false check (
    live_upload_storage = false
  ),
  public_data_live_read boolean not null default false check (
    public_data_live_read = false
  ),
  join_execution_live boolean not null default false check (
    join_execution_live = false
  ),
  custom_layout_metadata_only boolean not null default true check (
    custom_layout_metadata_only = true
  ),
  cross_workspace_join boolean not null default false check (
    cross_workspace_join = false
  ),
  public_data_rights_expansion boolean not null default false check (
    public_data_rights_expansion = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  sql_emitted boolean not null default false check (
    sql_emitted = false
  ),
  frontend_rendering boolean not null default false check (
    frontend_rendering = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_audit.user_public_data_join_event (
  event_id text primary key,
  request_id text not null,
  workspace_id text,
  event_kind text not null default 'documents.user_public_data_join.plan' check (
    event_kind = 'documents.user_public_data_join.plan'
  ),
  metadata_only boolean not null default true check (
    metadata_only = true
  ),
  raw_file_body_persisted boolean not null default false check (
    raw_file_body_persisted = false
  ),
  public_data_live_read boolean not null default false check (
    public_data_live_read = false
  ),
  cross_workspace_join boolean not null default false check (
    cross_workspace_join = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.user_public_data_join_privacy_contract (
  contract_name text not null default 'user_public_data_join_privacy',
  contract_version text not null default '2026-06-22.phase4.user-public-data-join-privacy-scaffold.v0',
  runtime_route text not null default 'GET /documents/runtime',
  plan_route text not null default 'POST /documents/user-public-data-join/plan',
  gateway_access_route text not null default 'POST /gateway/access-check',
  gateway_export_route text not null default 'POST /gateway/exports/plan',
  workspace_scoped_user_file boolean not null default true check (
    workspace_scoped_user_file = true
  ),
  user_consent_required boolean not null default true check (
    user_consent_required = true
  ),
  document_sanitizer_required boolean not null default true check (
    document_sanitizer_required = true
  ),
  field_authorization_required boolean not null default true check (
    field_authorization_required = true
  ),
  custom_layout_metadata_only boolean not null default true check (
    custom_layout_metadata_only = true
  ),
  raw_file_body_persisted boolean not null default false check (
    raw_file_body_persisted = false
  ),
  public_data_live_read boolean not null default false check (
    public_data_live_read = false
  ),
  cross_workspace_join boolean not null default false check (
    cross_workspace_join = false
  ),
  public_data_rights_expansion boolean not null default false check (
    public_data_rights_expansion = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  sql_emitted boolean not null default false check (
    sql_emitted = false
  ),
  frontend_rendering boolean not null default false check (
    frontend_rendering = false
  ),
  created_at timestamptz not null default now()
);
