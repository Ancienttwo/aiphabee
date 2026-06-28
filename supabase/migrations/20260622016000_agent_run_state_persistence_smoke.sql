create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.agent_run_state (
  run_state_id text primary key,
  run_id text not null unique,
  request_id text not null,
  workspace_id text not null,
  account_id text not null,
  status text not null check (
    status in ('planned', 'running', 'partial', 'completed', 'failed', 'cancelled')
  ),
  current_step_id text,
  completed_step_count integer not null default 0 check (completed_step_count >= 0),
  total_step_count integer not null check (total_step_count >= completed_step_count),
  resume_token_hash text not null,
  idempotency_key_hash text not null,
  state_json jsonb not null,
  state_hash text not null,
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aiphabee_core.agent_run_checkpoint (
  checkpoint_id text primary key,
  run_state_id text not null references aiphabee_core.agent_run_state(run_state_id),
  step_id text not null,
  step_status text not null check (
    step_status in ('planned', 'running', 'completed', 'failed', 'skipped')
  ),
  checkpoint_sequence integer not null check (checkpoint_sequence >= 1),
  checkpoint_json jsonb not null,
  checkpoint_hash text not null,
  idempotency_key_hash text not null,
  evidence_record_id text,
  usage_event_id text,
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now(),
  unique (run_state_id, checkpoint_sequence)
);

create table if not exists aiphabee_governance.agent_run_state_persistence_smoke_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_rights_status text not null check (default_rights_status = 'default_deny'),
  guarded_smoke_only boolean not null default true check (guarded_smoke_only = true),
  production_persistence_enabled boolean not null default false check (
    production_persistence_enabled = false
  ),
  user_facing_resume_enabled boolean not null default false check (
    user_facing_resume_enabled = false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.agent_run_state_persistence_smoke_contract (
  contract_key,
  contract_version,
  status,
  default_rights_status,
  guarded_smoke_only,
  production_persistence_enabled,
  user_facing_resume_enabled
)
values (
  'phase1.agent_run_state_persistence_smoke',
  '2026-06-22.phase1.agent-run-state-persistence-smoke.v0',
  'local_contract',
  'default_deny',
  true,
  false,
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_rights_status = excluded.default_rights_status,
  guarded_smoke_only = excluded.guarded_smoke_only,
  production_persistence_enabled = excluded.production_persistence_enabled,
  user_facing_resume_enabled = excluded.user_facing_resume_enabled,
  updated_at = now();
