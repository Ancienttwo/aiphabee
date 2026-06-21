create schema if not exists core;
create schema if not exists governance;

create table if not exists core.privacy_share_release_gate (
  gate_ref text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /sharing/runtime' check (
    runtime_route = 'GET /sharing/runtime'
  ),
  gate_route text not null default 'POST /sharing/release-gates/privacy-share/plan' check (
    gate_route = 'POST /sharing/release-gates/privacy-share/plan'
  ),
  account_data_request_route text not null default 'POST /account/data-requests/plan' check (
    account_data_request_route = 'POST /account/data-requests/plan'
  ),
  private_share_route text not null default 'POST /sharing/private-links/plan' check (
    private_share_route = 'POST /sharing/private-links/plan'
  ),
  required_checks text[] not null default array[
    'personal_data_download_delivery_is_scoped_and_no_write',
    'personal_data_erasure_respects_retention_holds',
    'share_link_rechecks_recipient_entitlement',
    'share_link_effective_fields_are_intersection',
    'share_link_does_not_expand_rights',
    'private_link_has_expiry_watermark_and_no_public_index'
  ],
  account_data_secure_delivery_required boolean not null default true check (
    account_data_secure_delivery_required = true
  ),
  scoped_personal_data_items_required boolean not null default true check (
    scoped_personal_data_items_required = true
  ),
  retention_hold_required boolean not null default true check (
    retention_hold_required = true
  ),
  recipient_entitlement_recheck_required boolean not null default true check (
    recipient_entitlement_recheck_required = true
  ),
  effective_field_intersection_required boolean not null default true check (
    effective_field_intersection_required = true
  ),
  recipient_rights_expansion_allowed boolean not null default false check (
    recipient_rights_expansion_allowed = false
  ),
  share_rights_expansion_allowed boolean not null default false check (
    share_rights_expansion_allowed = false
  ),
  private_link_watermark_required boolean not null default true check (
    private_link_watermark_required = true
  ),
  public_indexing_allowed boolean not null default false check (
    public_indexing_allowed = false
  ),
  link_handle_materialized boolean not null default false check (
    link_handle_materialized = false
  ),
  live_data_export_enabled boolean not null default false check (
    live_data_export_enabled = false
  ),
  live_share_generation_enabled boolean not null default false check (
    live_share_generation_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_privacy_share_validation' check (
    gate_status in ('blocked_live_privacy_share_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.privacy_share_release_gate_contract (
  contract_name text not null default 'privacy_share_release_gate',
  contract_version text not null default '2026-06-22.phase3.privacy-share-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /sharing/runtime',
  gate_route text not null default 'POST /sharing/release-gates/privacy-share/plan',
  account_data_request_route text not null default 'POST /account/data-requests/plan',
  private_share_route text not null default 'POST /sharing/private-links/plan',
  secure_personal_data_delivery_required boolean not null default true check (
    secure_personal_data_delivery_required = true
  ),
  retention_hold_required boolean not null default true check (
    retention_hold_required = true
  ),
  recipient_entitlement_recheck_required boolean not null default true check (
    recipient_entitlement_recheck_required = true
  ),
  effective_field_intersection_required boolean not null default true check (
    effective_field_intersection_required = true
  ),
  recipient_rights_expansion_allowed boolean not null default false check (
    recipient_rights_expansion_allowed = false
  ),
  share_rights_expansion_allowed boolean not null default false check (
    share_rights_expansion_allowed = false
  ),
  public_indexing_allowed boolean not null default false check (
    public_indexing_allowed = false
  ),
  live_data_export_enabled boolean not null default false check (
    live_data_export_enabled = false
  ),
  live_share_generation_enabled boolean not null default false check (
    live_share_generation_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
