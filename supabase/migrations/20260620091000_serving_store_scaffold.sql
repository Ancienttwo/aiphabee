create schema if not exists core;
create schema if not exists governance;

create table if not exists core.serving_dataset (
  serving_dataset_id text primary key,
  dataset text not null unique,
  domain text not null check (
    domain in ('security_master', 'quote_snapshot', 'price_history', 'financial_fact', 'corporate_action', 'derived_metric')
  ),
  description text not null,
  default_quality_state text not null default 'HOLD' check (
    default_quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status in ('default_deny', 'approved', 'blocked')
  ),
  rights_policy_version text not null,
  methodology_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.serving_field (
  serving_field_id text primary key,
  serving_dataset_id text not null references core.serving_dataset(serving_dataset_id),
  field_path text not null,
  display_name text not null,
  data_type text not null check (
    data_type in ('text', 'integer', 'numeric', 'boolean', 'date', 'timestamp', 'json')
  ),
  nullable boolean not null default true,
  rights_status text not null default 'default_deny' check (
    rights_status in ('default_deny', 'approved', 'blocked')
  ),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  methodology_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (serving_dataset_id, field_path, methodology_version)
);

create table if not exists core.serving_snapshot (
  serving_snapshot_id text primary key,
  serving_dataset_id text not null references core.serving_dataset(serving_dataset_id),
  data_version text not null references core.data_version_batch(data_version),
  rights_policy_version text not null,
  methodology_version text not null,
  as_of timestamptz not null,
  market_status text not null default 'unknown' check (
    market_status in ('open', 'closed', 'pre_open', 'post_close', 'halted', 'unknown', 'not_applicable')
  ),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  row_count integer not null default 0 check (row_count >= 0),
  release_state text not null default 'held' check (
    release_state in ('held', 'released', 'withdrawn')
  ),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (serving_dataset_id, data_version, methodology_version, rights_policy_version)
);

create table if not exists core.serving_record (
  serving_record_id text primary key,
  serving_snapshot_id text not null references core.serving_snapshot(serving_snapshot_id),
  entity_type text not null check (
    entity_type in ('company', 'instrument', 'listing', 'market', 'workspace', 'unknown')
  ),
  entity_id text not null,
  effective_from date,
  effective_to date,
  payload jsonb not null,
  field_set text[] not null default '{}',
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  unique (serving_snapshot_id, entity_type, entity_id, effective_from, source_record_id)
);

create table if not exists governance.serving_store_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  live_serving_reads boolean not null default false check (live_serving_reads = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.serving_store_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded,
  live_serving_reads
)
values (
  'phase1.serving_store',
  '2026-06-20.phase1.serving-store.v0',
  'local_contract',
  'default_deny',
  false,
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  market_data_loaded = excluded.market_data_loaded,
  live_serving_reads = excluded.live_serving_reads,
  updated_at = now();
