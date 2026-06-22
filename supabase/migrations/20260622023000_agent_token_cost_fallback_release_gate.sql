create schema if not exists core;
create schema if not exists governance;

create table if not exists core.agent_token_cost_fallback_release_gate (
  gate_id text primary key,
  request_id text not null,
  model_execution_audit_smoke_linked boolean not null default true check (
    model_execution_audit_smoke_linked = true
  ),
  model_routing_audit_contract_linked boolean not null default true check (
    model_routing_audit_contract_linked = true
  ),
  run_tool_audit_fields_contract_linked boolean not null default true check (
    run_tool_audit_fields_contract_linked = true
  ),
  ai_gateway_observability_gate_linked boolean not null default true check (
    ai_gateway_observability_gate_linked = true
  ),
  billing_posted_ledger_smoke_linked boolean not null default true check (
    billing_posted_ledger_smoke_linked = true
  ),
  user_run_persistence_gate_linked boolean not null default true check (
    user_run_persistence_gate_linked = true
  ),
  cost_rate_limit_fallback_evidence_required boolean not null default true check (
    cost_rate_limit_fallback_evidence_required = true
  ),
  live_cost_ledger_writer_required boolean not null default true check (
    live_cost_ledger_writer_required = true
  ),
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_token_cost_fallback_log_writes_enabled boolean not null default false check (
    live_token_cost_fallback_log_writes_enabled = false
  ),
  production_cost_ledger_enabled boolean not null default false check (
    production_cost_ledger_enabled = false
  ),
  model_call_enabled boolean not null default false check (
    model_call_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_live_token_cost_fallback_writes' check (
    gate_status in ('blocked_live_token_cost_fallback_writes')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.agent_token_cost_fallback_release_gate_contract (
  contract_name text not null default 'agent_token_cost_fallback_release_gate',
  contract_version text not null default '2026-06-22.phase1.agent_token_cost_fallback_release_gate.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/agent_token_cost_fallback/plan',
  model_execution_audit_smoke_route text not null default 'POST /agent/runs/model-execution-audit-smoke',
  model_routing_audit_contract text not null default 'deploy/agent/model-routing-audit.contract.json',
  run_tool_audit_fields_contract text not null default 'deploy/governance/run-tool-audit-fields.contract.json',
  ai_gateway_observability_release_gate_route text not null default 'POST /agent/release-gates/ai-gateway-observability/plan',
  billing_posted_ledger_smoke_route text not null default 'POST /agent/runs/billing-posted-ledger-smoke',
  user_run_persistence_release_gate_route text not null default 'POST /agent/release-gates/user-run-persistence/plan',
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_token_cost_fallback_log_writes_enabled boolean not null default false check (
    live_token_cost_fallback_log_writes_enabled = false
  ),
  production_cost_ledger_enabled boolean not null default false check (
    production_cost_ledger_enabled = false
  ),
  model_call_enabled boolean not null default false check (
    model_call_enabled = false
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
