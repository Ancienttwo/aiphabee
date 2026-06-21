create schema if not exists core;
create schema if not exists governance;

create table if not exists core.agent_kill_switch_state (
  switch_ref text not null,
  target text not null check (target in ('model', 'tool', 'all')),
  switch_state text not null check (switch_state in ('active', 'tripped')),
  reason_code text,
  safe_degradation_mode text not null check (
    safe_degradation_mode in ('tool_only_no_model', 'no_model_no_tools')
  ),
  live_flag_read_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);

create table if not exists governance.agent_kill_switch_contract (
  contract_name text not null default 'agent_kill_switch',
  contract_version text not null default '2026-06-21.phase2.kill-switch-scaffold.v0',
  runtime_route text not null default 'GET /agent/runtime',
  plan_route text not null default 'POST /agent/kill-switch/plan',
  live_flag_read_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
