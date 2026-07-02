create schema if not exists aiphabee_audit;
create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.compliance_ops_release_gate (
  gate_ref text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /public/runtime' check (
    runtime_route = 'GET /public/runtime'
  ),
  gate_route text not null default 'POST /public/release-gates/compliance-ops/plan' check (
    gate_route = 'POST /public/release-gates/compliance-ops/plan'
  ),
  docs_route text not null default 'GET /public/docs' check (
    docs_route = 'GET /public/docs'
  ),
  public_status_route text not null default 'GET /public/status' check (
    public_status_route = 'GET /public/status'
  ),
  kill_switch_route text not null default 'POST /agent/kill-switch/plan' check (
    kill_switch_route = 'POST /agent/kill-switch/plan'
  ),
  incident_response_route text not null default 'POST /support/request-id-investigation/plan' check (
    incident_response_route = 'POST /support/request-id-investigation/plan'
  ),
  required_checks text[] not null default array[
    'type4_research_boundary_copy_reviewed',
    'marketing_copy_forbidden_advice_claims_absent',
    'kill_switch_safe_degradation_drill_planned',
    'incident_response_request_id_trace_drill_planned',
    'audit_export_contains_required_fields_and_excludes_sensitive_payloads',
    'public_status_incident_disclosure_surface_present'
  ],
  type4_written_opinion_required boolean not null default true check (
    type4_written_opinion_required = true
  ),
  external_legal_opinion_present boolean not null default false check (
    external_legal_opinion_present = false
  ),
  marketing_forbidden_claims_absent boolean not null default true check (
    marketing_forbidden_claims_absent = true
  ),
  kill_switch_blocks_model_request boolean not null default true check (
    kill_switch_blocks_model_request = true
  ),
  kill_switch_blocks_tool_execution boolean not null default true check (
    kill_switch_blocks_tool_execution = true
  ),
  safe_degradation_required boolean not null default true check (
    safe_degradation_required = true
  ),
  incident_request_id_trace_required boolean not null default true check (
    incident_request_id_trace_required = true
  ),
  public_status_component_source_required boolean not null default true check (
    public_status_component_source_required = true
  ),
  sensitive_payload_allowed boolean not null default false check (
    sensitive_payload_allowed = false
  ),
  live_compliance_signoff_enabled boolean not null default false check (
    live_compliance_signoff_enabled = false
  ),
  live_kill_switch_flag_source_enabled boolean not null default false check (
    live_kill_switch_flag_source_enabled = false
  ),
  live_incident_feed_enabled boolean not null default false check (
    live_incident_feed_enabled = false
  ),
  live_audit_export_store_enabled boolean not null default false check (
    live_audit_export_store_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_compliance_ops_validation' check (
    gate_status in ('blocked_live_compliance_ops_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_audit.compliance_ops_drill_event (
  drill_event_ref text primary key,
  request_id text not null,
  drill_kind text not null check (
    drill_kind in ('kill_switch', 'incident_response', 'audit_export', 'marketing_copy_review')
  ),
  route text not null,
  outcome text not null default 'planned_no_write' check (
    outcome = 'planned_no_write'
  ),
  request_id_visible boolean not null default true check (
    request_id_visible = true
  ),
  sensitive_payload_allowed boolean not null default false check (
    sensitive_payload_allowed = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.compliance_ops_release_gate_contract (
  contract_name text not null default 'compliance_ops_release_gate',
  contract_version text not null default '2026-06-22.phase3.compliance-ops-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /public/runtime',
  gate_route text not null default 'POST /public/release-gates/compliance-ops/plan',
  docs_route text not null default 'GET /public/docs',
  public_status_route text not null default 'GET /public/status',
  kill_switch_route text not null default 'POST /agent/kill-switch/plan',
  incident_response_route text not null default 'POST /support/request-id-investigation/plan',
  type4_written_opinion_required boolean not null default true check (
    type4_written_opinion_required = true
  ),
  external_legal_opinion_present boolean not null default false check (
    external_legal_opinion_present = false
  ),
  safe_degradation_required boolean not null default true check (
    safe_degradation_required = true
  ),
  request_id_trace_required boolean not null default true check (
    request_id_trace_required = true
  ),
  sensitive_payload_allowed boolean not null default false check (
    sensitive_payload_allowed = false
  ),
  live_compliance_signoff_enabled boolean not null default false check (
    live_compliance_signoff_enabled = false
  ),
  live_kill_switch_flag_source_enabled boolean not null default false check (
    live_kill_switch_flag_source_enabled = false
  ),
  live_incident_feed_enabled boolean not null default false check (
    live_incident_feed_enabled = false
  ),
  live_audit_export_store_enabled boolean not null default false check (
    live_audit_export_store_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
