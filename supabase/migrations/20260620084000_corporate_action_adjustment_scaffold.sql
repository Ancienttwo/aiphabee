create schema if not exists core;
create schema if not exists governance;

create table if not exists core.corporate_action (
  action_id text primary key,
  instrument_id text not null references core.instrument(instrument_id),
  listing_id text references core.listing(listing_id),
  action_type text not null check (
    action_type in (
      'dividend',
      'split',
      'consolidation',
      'rights',
      'placement',
      'buyback',
      'spin_off',
      'delisting',
      'other'
    )
  ),
  announcement_date date,
  ex_date date,
  record_date date,
  payable_date date,
  effective_at timestamptz not null,
  ratio numeric check (ratio is null or ratio > 0),
  cash_amount numeric check (cash_amount is null or cash_amount >= 0),
  currency text,
  withholding_assumption text,
  reinvestment_price_rule text,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null,
  methodology_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.adjustment_methodology (
  methodology_version text primary key,
  adjustment_type text not null check (
    adjustment_type in ('raw', 'split_adjusted', 'total_return_adjusted')
  ),
  direction text not null check (direction in ('forward_adjusted', 'backward_adjusted')),
  included_action_types text[] not null,
  reinvestment_price_rule text not null,
  suspended_day_policy text not null,
  missing_bar_policy text not null,
  data_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists core.price_adjustment_factor (
  adjustment_factor_id text primary key,
  instrument_id text not null references core.instrument(instrument_id),
  listing_id text references core.listing(listing_id),
  action_id text references core.corporate_action(action_id),
  adjustment_type text not null check (
    adjustment_type in ('raw', 'split_adjusted', 'total_return_adjusted')
  ),
  direction text not null check (direction in ('forward_adjusted', 'backward_adjusted')),
  interval_start date not null,
  interval_end date,
  factor numeric not null check (factor > 0),
  cash_reinvestment_price numeric check (
    cash_reinvestment_price is null or cash_reinvestment_price >= 0
  ),
  methodology_version text not null references core.adjustment_methodology(methodology_version),
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (interval_end is null or interval_end > interval_start),
  unique (
    instrument_id,
    listing_id,
    adjustment_type,
    direction,
    interval_start,
    data_version,
    methodology_version
  )
);

create table if not exists governance.corporate_action_adjustment_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.corporate_action_adjustment_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase1.corporate_action_adjustment',
  '2026-06-20.phase1.corporate-action-adjustment.v0',
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
