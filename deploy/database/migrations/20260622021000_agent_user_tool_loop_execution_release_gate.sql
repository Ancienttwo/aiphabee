create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.agent_user_tool_loop_execution_release_gate (
  gate_id text primary key,
  request_id text not null,
  tool_loop_planner_contract_linked boolean not null default true check (
    tool_loop_planner_contract_linked = true
  ),
  pre_tool_call_resolution_contract_linked boolean not null default true check (
    pre_tool_call_resolution_contract_linked = true
  ),
  tool_enforcement_contract_linked boolean not null default true check (
    tool_enforcement_contract_linked = true
  ),
  budget_stop_policy_contract_linked boolean not null default true check (
    budget_stop_policy_contract_linked = true
  ),
  failure_recovery_policy_contract_linked boolean not null default true check (
    failure_recovery_policy_contract_linked = true
  ),
  fixed_tool_execution_evidence_smoke_linked boolean not null default true check (
    fixed_tool_execution_evidence_smoke_linked = true
  ),
  fixed_live_tool_loop_smoke_linked boolean not null default true check (
    fixed_live_tool_loop_smoke_linked = true
  ),
  user_run_persistence_gate_linked boolean not null default true check (
    user_run_persistence_gate_linked = true
  ),
  user_auth_entitlement_required boolean not null default true check (
    user_auth_entitlement_required = true
  ),
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  arbitrary_user_tool_loop_execution_enabled boolean not null default false check (
    arbitrary_user_tool_loop_execution_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  live_model_execution_enabled boolean not null default false check (
    live_model_execution_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_arbitrary_user_tool_loop_execution' check (
    gate_status in ('blocked_arbitrary_user_tool_loop_execution')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.agent_user_tool_loop_execution_release_gate_contract (
  contract_name text not null default 'agent_user_tool_loop_execution_release_gate',
  contract_version text not null default '2026-06-22.phase1.agent-user-tool-loop-execution-release-gate.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/user-tool-loop-execution/plan',
  tool_loop_route text not null default 'POST /agent/runs/plan',
  preflight_route text not null default 'POST /agent/runs/preflight',
  fixed_tool_execution_evidence_smoke_route text not null default 'POST /agent/runs/tool-execution-evidence-smoke',
  fixed_live_tool_loop_smoke_route text not null default 'POST /agent/runs/live-tool-loop-smoke',
  user_run_persistence_release_gate_route text not null default 'POST /agent/release-gates/user-run-persistence/plan',
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  arbitrary_user_tool_loop_execution_enabled boolean not null default false check (
    arbitrary_user_tool_loop_execution_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  live_model_execution_enabled boolean not null default false check (
    live_model_execution_enabled = false
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
