create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.agent_ai_gateway_observability_release_gate (
  gate_id text primary key,
  request_id text not null,
  model_execution_audit_smoke_contract_linked boolean not null default true check (
    model_execution_audit_smoke_contract_linked = true
  ),
  ai_gateway_observability_smoke_script_linked boolean not null default true check (
    ai_gateway_observability_smoke_script_linked = true
  ),
  ai_gateway_read_permission_evidence_required boolean not null default true check (
    ai_gateway_read_permission_evidence_required = true
  ),
  account_analytics_read_permission_evidence_required boolean not null default true check (
    account_analytics_read_permission_evidence_required = true
  ),
  request_log_cost_cache_fields_required boolean not null default true check (
    request_log_cost_cache_fields_required = true
  ),
  rate_limit_fallback_evidence_required boolean not null default true check (
    rate_limit_fallback_evidence_required = true
  ),
  hash_only_capture_packet_required boolean not null default true check (
    hash_only_capture_packet_required = true
  ),
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_ai_gateway_reads_enabled boolean not null default false check (
    live_ai_gateway_reads_enabled = false
  ),
  live_model_execution_enabled boolean not null default false check (
    live_model_execution_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_ai_gateway_observability_evidence' check (
    gate_status in ('blocked_ai_gateway_observability_evidence')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.agent_ai_gateway_observability_release_gate_contract (
  contract_name text not null default 'agent_ai_gateway_observability_release_gate',
  contract_version text not null default '2026-06-22.phase1.agent-ai-gateway-observability-release-gate.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/ai-gateway-observability/plan',
  model_execution_audit_smoke_route text not null default 'POST /agent/runs/model-execution-audit-smoke',
  ai_gateway_observability_smoke_command text not null default 'npm run smoke:ai-gateway-observability-live',
  model_provider_readiness_contract text not null default 'deploy/model-providers/live-smoke-readiness.contract.json',
  model_routing_audit_contract text not null default 'deploy/agent/model-routing-audit.contract.json',
  live_smoke_capture_artifacts_contract text not null default 'deploy/governance/live-smoke-capture-artifacts.contract.json',
  live_smoke_evidence_ledger_contract text not null default 'deploy/governance/live-smoke-evidence-ledger.contract.json',
  required_ai_gateway_permission text not null default 'AI Gateway Read',
  required_account_analytics_permission text not null default 'Account Analytics Read',
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_ai_gateway_reads_enabled boolean not null default false check (
    live_ai_gateway_reads_enabled = false
  ),
  live_model_execution_enabled boolean not null default false check (
    live_model_execution_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
