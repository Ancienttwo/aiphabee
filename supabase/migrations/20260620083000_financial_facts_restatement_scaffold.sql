create schema if not exists core;
create schema if not exists governance;

create table if not exists core.financial_statement (
  statement_id text primary key,
  company_id text not null references core.company(company_id),
  period_start date not null,
  period_end date not null,
  fiscal_year integer,
  fiscal_period text not null check (
    fiscal_period in ('annual', 'half_year', 'quarter', 'ttm', 'point_in_time', 'unknown')
  ),
  statement_type text not null check (
    statement_type in ('income_statement', 'balance_sheet', 'cash_flow', 'notes', 'unknown')
  ),
  currency text not null,
  unit text not null,
  scale numeric not null default 1 check (scale > 0),
  accounting_standard text not null,
  published_at timestamptz not null,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null,
  methodology_version text not null,
  restatement_version integer not null default 0 check (restatement_version >= 0),
  is_latest boolean not null default true,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table if not exists core.financial_fact (
  fact_id text primary key,
  statement_id text not null references core.financial_statement(statement_id),
  company_id text not null references core.company(company_id),
  metric_id text not null,
  metric_label text not null,
  fact_value numeric,
  currency text not null,
  unit text not null,
  scale numeric not null default 1 check (scale > 0),
  accounting_standard text not null,
  period_start date not null,
  period_end date not null,
  published_at timestamptz not null,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null,
  methodology_version text not null,
  restatement_version integer not null default 0 check (restatement_version >= 0),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (statement_id, metric_id, data_version, restatement_version)
);

create table if not exists core.financial_restatement (
  restatement_id text primary key,
  company_id text not null references core.company(company_id),
  original_statement_id text not null references core.financial_statement(statement_id),
  restated_statement_id text not null references core.financial_statement(statement_id),
  restated_at timestamptz not null,
  reason_category text not null check (
    reason_category in (
      'issuer_restatement',
      'accounting_policy_change',
      'partner_correction',
      'currency_unit_correction',
      'source_revision',
      'unknown'
    )
  ),
  reason_details text,
  source_record_id text not null,
  data_version_before text not null,
  data_version_after text not null,
  methodology_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (original_statement_id <> restated_statement_id)
);

create table if not exists governance.financial_facts_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.financial_facts_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase1.financial_facts_restatement',
  '2026-06-20.phase1.financial-facts-restatement.v0',
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
