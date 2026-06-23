create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.product_agent_release_gate (
  gate_id text primary key,
  request_id text not null,
  ambiguous_security_query text not null default 'ABC',
  ambiguous_candidate_count integer not null default 0,
  silent_selection_allowed boolean not null default false check (
    silent_selection_allowed = false
  ),
  tool_planning_allowed_before_clarification boolean not null default false check (
    tool_planning_allowed_before_clarification = false
  ),
  concrete_numbers_allowed_without_sources boolean not null default false check (
    concrete_numbers_allowed_without_sources = false
  ),
  source_record_ref_required boolean not null default true check (
    source_record_ref_required = true
  ),
  calculation_ref_required boolean not null default true check (
    calculation_ref_required = true
  ),
  model_calls_enabled boolean not null default false check (
    model_calls_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_live_post_generation_validation' check (
    gate_status in ('blocked_live_post_generation_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.product_agent_release_gate_contract (
  contract_name text not null default 'product_agent_release_gate',
  contract_version text not null default '2026-06-21.phase3.product-agent-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/product-agent/plan',
  preflight_route text not null default 'POST /agent/runs/preflight',
  tool_loop_route text not null default 'POST /agent/runs/plan',
  silent_security_selection_allowed boolean not null default false check (
    silent_security_selection_allowed = false
  ),
  ambiguous_security_must_block_tool_planning boolean not null default true check (
    ambiguous_security_must_block_tool_planning = true
  ),
  concrete_numbers_allowed_without_sources boolean not null default false check (
    concrete_numbers_allowed_without_sources = false
  ),
  source_record_ref_required boolean not null default true check (
    source_record_ref_required = true
  ),
  calculation_ref_required boolean not null default true check (
    calculation_ref_required = true
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  model_calls_enabled boolean not null default false check (
    model_calls_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
