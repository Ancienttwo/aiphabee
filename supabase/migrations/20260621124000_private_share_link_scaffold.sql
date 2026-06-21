create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.private_share_link (
  private_share_ref text not null,
  creator_account_id text references core.account(account_id),
  creator_workspace_id text references core.workspace(workspace_id),
  recipient_account_id text references core.account(account_id),
  recipient_workspace_id text references core.workspace(workspace_id),
  request_id text not null,
  dataset text not null,
  requested_fields text[] not null default '{}',
  effective_fields text[] not null default '{}',
  redacted_fields text[] not null default '{}',
  requested_rows integer not null default 0 check (requested_rows >= 0),
  required_scope text not null default 'exports.read',
  recipient_entitlement_rechecked boolean not null default true,
  recipient_data_rights_expansion boolean not null default false,
  share_expands_recipient_rights boolean not null default false,
  watermark_required boolean not null default true,
  link_handle_materialized boolean not null default false,
  public_indexing_enabled boolean not null default false,
  artifact_written boolean not null default false,
  live_data_access boolean not null default false,
  rights_policy_version text not null,
  rights_state text not null default 'default_deny',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (private_share_ref)
);

create table if not exists audit.private_share_event (
  private_share_event_ref text not null,
  private_share_ref text references core.private_share_link(private_share_ref),
  request_id text not null,
  event_kind text not null default 'planned',
  creator_gateway_status text not null default 'not_evaluated',
  recipient_gateway_status text not null default 'not_evaluated',
  write_status text not null default 'planned_no_write',
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (private_share_event_ref)
);

create table if not exists governance.private_sharing_contract (
  contract_name text not null default 'private_sharing_links',
  contract_version text not null default '2026-06-21.phase3.private-share-link-scaffold.v0',
  route text not null default 'POST /sharing/private-links/plan',
  runtime_route text not null default 'GET /sharing/runtime',
  required_scope text not null default 'exports.read',
  recipient_entitlement_recheck boolean not null default true,
  recipient_data_rights_expansion boolean not null default false,
  share_expands_recipient_rights boolean not null default false,
  max_expires_in_hours integer not null default 168,
  watermark_required boolean not null default true,
  live_data_access boolean not null default false,
  link_handle_materialized boolean not null default false,
  public_indexing_enabled boolean not null default false,
  persistent_writes_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
