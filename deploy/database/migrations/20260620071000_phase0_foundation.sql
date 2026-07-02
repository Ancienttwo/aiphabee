create schema if not exists aiphabee_audit;
create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_governance.phase0_migration_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.phase0_migration_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status
)
values (
  'phase0.database_migrations',
  '2026-06-20.phase0.database-migrations.v0',
  'local_contract',
  'default_deny'
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  updated_at = now();

create table if not exists aiphabee_governance.data_rights_channel_status (
  channel text primary key check (channel in ('web', 'mcp', 'api', 'export')),
  status text not null default 'default_deny' check (
    status in ('default_deny', 'approved', 'blocked')
  ),
  source_evidence text not null default 'gate0_pending',
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.data_rights_channel_status (channel, status, source_evidence)
values
  ('web', 'default_deny', 'gate0_pending'),
  ('mcp', 'default_deny', 'gate0_pending'),
  ('api', 'default_deny', 'gate0_pending'),
  ('export', 'default_deny', 'gate0_pending')
on conflict (channel) do update set
  status = excluded.status,
  source_evidence = excluded.source_evidence,
  updated_at = now();
