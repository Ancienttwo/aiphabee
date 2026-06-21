create schema if not exists core;
create schema if not exists governance;

create table if not exists core.security_name_history (
  name_history_ref text not null,
  instrument_id text not null references core.instrument(instrument_id),
  name_en text not null,
  name_zh_hans text not null,
  name_zh_hant text not null,
  valid_from date not null,
  valid_to date,
  source_record_id text not null,
  data_version text not null,
  methodology_version text not null,
  created_at timestamptz not null default now(),
  primary key (name_history_ref),
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists core.security_industry_history (
  industry_history_ref text not null,
  instrument_id text not null references core.instrument(instrument_id),
  classification_system text not null,
  sector text not null,
  industry text not null,
  valid_from date not null,
  valid_to date,
  source_record_id text not null,
  data_version text not null,
  methodology_version text not null,
  created_at timestamptz not null default now(),
  primary key (industry_history_ref),
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists core.index_constituent_history (
  constituent_history_ref text not null,
  benchmark_instrument_id text not null references core.instrument(instrument_id),
  member_instrument_id text not null references core.instrument(instrument_id),
  membership_state text not null default 'active' check (
    membership_state in ('active', 'past')
  ),
  valid_from date not null,
  valid_to date,
  weight_available boolean not null default false,
  source_record_id text not null,
  data_version text not null,
  methodology_version text not null,
  created_at timestamptz not null default now(),
  primary key (constituent_history_ref),
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists governance.security_history_contract (
  contract_name text not null default 'security_history',
  contract_version text not null default '2026-06-21.phase3.security-history-scaffold.v0',
  route text not null default 'POST /tools/get-security-history',
  as_of_required boolean not null default true,
  uses_latest_name boolean not null default false,
  uses_latest_classification boolean not null default false,
  uses_latest_constituents boolean not null default false,
  live_data_access boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
