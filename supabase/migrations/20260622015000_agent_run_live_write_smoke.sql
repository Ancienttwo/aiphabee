create schema if not exists audit;
create schema if not exists governance;

create table if not exists audit.agent_run_audit_event (
  audit_event_id text primary key,
  event_type text not null check (event_type = 'run.audit'),
  event_version text not null,
  request_id text not null,
  run_id text not null,
  route text not null,
  outcome text not null check (outcome in ('success', 'rejected', 'error')),
  event_json jsonb not null,
  payload_hash text not null,
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.agent_run_live_write_smoke_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_rights_status text not null check (default_rights_status = 'default_deny'),
  guarded_smoke_only boolean not null default true check (guarded_smoke_only = true),
  production_persistence_enabled boolean not null default false check (
    production_persistence_enabled = false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.agent_run_live_write_smoke_contract (
  contract_key,
  contract_version,
  status,
  default_rights_status,
  guarded_smoke_only,
  production_persistence_enabled
)
values (
  'phase1.agent_run_live_write_smoke',
  '2026-06-22.phase1.agent-run-live-write-smoke.v0',
  'local_contract',
  'default_deny',
  true,
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_rights_status = excluded.default_rights_status,
  guarded_smoke_only = excluded.guarded_smoke_only,
  production_persistence_enabled = excluded.production_persistence_enabled,
  updated_at = now();
