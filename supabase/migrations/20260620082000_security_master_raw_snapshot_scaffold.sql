create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.company (
  company_id text primary key,
  legal_name text not null,
  display_name text not null,
  domicile text,
  incorporation_date date,
  status text not null check (status in ('active', 'delisted', 'suspended', 'unknown')),
  data_version text not null,
  methodology_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aiphabee_core.instrument (
  instrument_id text primary key,
  company_id text not null references aiphabee_core.company(company_id),
  instrument_type text not null check (
    instrument_type in ('ordinary_share', 'etf', 'reit', 'preferred_share', 'unknown')
  ),
  primary_currency text not null,
  status text not null check (status in ('active', 'delisted', 'suspended', 'unknown')),
  data_version text not null,
  methodology_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aiphabee_core.listing (
  listing_id text primary key,
  instrument_id text not null references aiphabee_core.instrument(instrument_id),
  exchange text not null,
  ticker text not null,
  currency text not null,
  lot_size integer check (lot_size is null or lot_size > 0),
  listed_at date,
  delisted_at date,
  status text not null check (status in ('active', 'delisted', 'suspended', 'unknown')),
  data_version text not null,
  methodology_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delisted_at is null or listed_at is null or delisted_at >= listed_at)
);

create table if not exists aiphabee_core.identifier_history (
  identifier_history_id text primary key,
  instrument_id text not null references aiphabee_core.instrument(instrument_id),
  listing_id text references aiphabee_core.listing(listing_id),
  identifier_type text not null check (
    identifier_type in ('ticker', 'isin', 'sedol', 'ric', 'bbg', 'name')
  ),
  identifier_value text not null,
  valid_from date not null,
  valid_to date,
  source_record_id text not null,
  data_version text not null,
  methodology_version text not null,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists aiphabee_core.raw_source_batch (
  source_batch_id text primary key,
  source_name text not null,
  source_dataset text not null,
  received_at timestamptz not null,
  source_as_of timestamptz,
  source_rights_status text not null default 'default_deny' check (
    source_rights_status in ('default_deny', 'approved', 'blocked')
  ),
  checksum_sha256 text,
  row_count integer not null default 0 check (row_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_core.raw_snapshot (
  raw_snapshot_id text primary key,
  source_batch_id text not null references aiphabee_core.raw_source_batch(source_batch_id),
  source_record_id text not null,
  record_kind text not null check (
    record_kind in ('company', 'instrument', 'listing', 'identifier_history', 'financial_fact', 'corporate_action')
  ),
  payload jsonb not null,
  payload_hash_sha256 text not null,
  received_at timestamptz not null,
  immutable boolean not null default true check (immutable = true),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  data_version text not null,
  methodology_version text not null,
  created_at timestamptz not null default now(),
  unique (source_batch_id, source_record_id)
);

create table if not exists aiphabee_core.data_version_batch (
  data_version text primary key,
  source_batch_id text not null references aiphabee_core.raw_source_batch(source_batch_id),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_run_id text,
  created_at timestamptz not null default now(),
  released_at timestamptz,
  release_state text not null default 'held' check (
    release_state in ('held', 'released', 'withdrawn')
  )
);

create table if not exists aiphabee_governance.security_master_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.security_master_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase1.security_master_raw_snapshot',
  '2026-06-20.phase1.security-master-raw-snapshot.v0',
  'local_contract',
  'default_deny',
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  market_data_loaded = excluded.market_data_loaded,
  updated_at = now();
