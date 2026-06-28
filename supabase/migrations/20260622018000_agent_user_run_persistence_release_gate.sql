create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.agent_user_run_persistence_release_gate (
  gate_id text primary key,
  request_id text not null,
  agent_run_live_write_smoke_contract_linked boolean not null default true check (
    agent_run_live_write_smoke_contract_linked = true
  ),
  agent_run_state_persistence_smoke_contract_linked boolean not null default true check (
    agent_run_state_persistence_smoke_contract_linked = true
  ),
  agent_billing_posted_ledger_smoke_contract_linked boolean not null default true check (
    agent_billing_posted_ledger_smoke_contract_linked = true
  ),
  hash_only_smoke_responses_required boolean not null default true check (
    hash_only_smoke_responses_required = true
  ),
  production_persistence_enabled boolean not null default false check (
    production_persistence_enabled = false
  ),
  production_cutover_allowed boolean not null default false check (
    production_cutover_allowed = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_production_user_run_persistence' check (
    gate_status in ('blocked_production_user_run_persistence')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.agent_user_run_persistence_release_gate_contract (
  contract_name text not null default 'agent_user_run_persistence_release_gate',
  contract_version text not null default '2026-06-22.phase1.agent-user-run-persistence-release-gate.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/user-run-persistence/plan',
  live_write_smoke_route text not null default 'POST /agent/runs/live-write-smoke',
  state_persistence_smoke_route text not null default 'POST /agent/runs/state-persistence-smoke',
  billing_posted_ledger_smoke_route text not null default 'POST /agent/runs/billing-posted-ledger-smoke',
  production_persistence_enabled boolean not null default false check (
    production_persistence_enabled = false
  ),
  production_cutover_allowed boolean not null default false check (
    production_cutover_allowed = false
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
