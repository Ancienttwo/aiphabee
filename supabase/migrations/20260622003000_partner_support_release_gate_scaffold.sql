create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.partner_support_release_gate (
  gate_ref text primary key,
  request_id text not null,
  target_request_id text not null,
  runtime_route text not null default 'GET /usage/runtime' check (
    runtime_route = 'GET /usage/runtime'
  ),
  gate_route text not null default 'POST /usage/release-gates/partner-support/plan' check (
    gate_route = 'POST /usage/release-gates/partner-support/plan'
  ),
  partner_reconciliation_route text not null default 'POST /usage/partner-reconciliation/plan' check (
    partner_reconciliation_route = 'POST /usage/partner-reconciliation/plan'
  ),
  support_runtime_route text not null default 'GET /support/runtime' check (
    support_runtime_route = 'GET /support/runtime'
  ),
  support_help_center_route text not null default 'GET /support/help-center' check (
    support_help_center_route = 'GET /support/help-center'
  ),
  support_investigation_route text not null default 'POST /support/request-id-investigation/plan' check (
    support_investigation_route = 'POST /support/request-id-investigation/plan'
  ),
  required_checks text[] not null default array[
    'partner_report_generated',
    'partner_report_trace_links_request_id_and_usage_event',
    'partner_report_sla_counters_present',
    'support_request_id_investigation_metadata_only',
    'sensitive_payloads_excluded',
    'live_artifact_and_log_reads_blocked'
  ],
  group_by text[] not null default array[
    'dataset',
    'channel',
    'package_code',
    'user_id'
  ],
  sla_fields_required text[] not null default array[
    'data_delay_minutes',
    'missing_rows',
    'error_count',
    'backfill_count'
  ],
  request_id_trace_required boolean not null default true check (
    request_id_trace_required = true
  ),
  usage_event_trace_required boolean not null default true check (
    usage_event_trace_required = true
  ),
  metadata_only_support boolean not null default true check (
    metadata_only_support = true
  ),
  live_ledger_read_enabled boolean not null default false check (
    live_ledger_read_enabled = false
  ),
  live_support_log_read_enabled boolean not null default false check (
    live_support_log_read_enabled = false
  ),
  live_partner_report_artifact_store_enabled boolean not null default false check (
    live_partner_report_artifact_store_enabled = false
  ),
  partner_portal_delivery_enabled boolean not null default false check (
    partner_portal_delivery_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_partner_support_validation' check (
    gate_status in ('blocked_live_partner_support_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists audit.partner_support_drill_event (
  drill_event_ref text primary key,
  request_id text not null,
  target_request_id text not null,
  drill_kind text not null check (
    drill_kind in ('partner_reconciliation_report', 'support_request_id_investigation', 'sla_exception_trace')
  ),
  route text not null,
  outcome text not null default 'planned_no_write' check (
    outcome = 'planned_no_write'
  ),
  request_id_visible boolean not null default true check (
    request_id_visible = true
  ),
  sensitive_content_released boolean not null default false check (
    sensitive_content_released = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.partner_support_release_gate_contract (
  contract_name text not null default 'partner_support_release_gate',
  contract_version text not null default '2026-06-22.phase3.partner-support-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /usage/runtime',
  gate_route text not null default 'POST /usage/release-gates/partner-support/plan',
  partner_reconciliation_route text not null default 'POST /usage/partner-reconciliation/plan',
  support_runtime_route text not null default 'GET /support/runtime',
  support_help_center_route text not null default 'GET /support/help-center',
  support_investigation_route text not null default 'POST /support/request-id-investigation/plan',
  request_id_trace_required boolean not null default true check (
    request_id_trace_required = true
  ),
  usage_event_trace_required boolean not null default true check (
    usage_event_trace_required = true
  ),
  metadata_only_support boolean not null default true check (
    metadata_only_support = true
  ),
  live_ledger_read_enabled boolean not null default false check (
    live_ledger_read_enabled = false
  ),
  live_support_log_read_enabled boolean not null default false check (
    live_support_log_read_enabled = false
  ),
  live_partner_report_artifact_store_enabled boolean not null default false check (
    live_partner_report_artifact_store_enabled = false
  ),
  partner_portal_delivery_enabled boolean not null default false check (
    partner_portal_delivery_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
