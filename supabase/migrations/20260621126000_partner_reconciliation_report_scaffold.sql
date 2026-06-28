create schema if not exists aiphabee_audit;
create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.partner_reconciliation_report (
  report_id text primary key,
  partner_id text not null,
  workspace_id text not null references platform.workspace(workspace_id),
  period_start timestamptz not null,
  period_end timestamptz not null,
  cadence text not null check (cadence in ('daily', 'weekly')),
  export_format text not null default 'csv' check (export_format in ('csv', 'json')),
  report_status text not null default 'planned' check (
    report_status in ('planned', 'exported', 'reconciled', 'void')
  ),
  group_by_columns text[] not null default array[
    'dataset',
    'channel',
    'package_code',
    'user_id'
  ],
  usage_count_total numeric not null default 0 check (usage_count_total >= 0),
  credit_total numeric not null default 0 check (credit_total >= 0),
  metered_row_total numeric not null default 0 check (metered_row_total >= 0),
  missing_rows numeric not null default 0 check (missing_rows >= 0),
  error_count numeric not null default 0 check (error_count >= 0),
  backfill_count numeric not null default 0 check (backfill_count >= 0),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end > period_start)
);

create table if not exists aiphabee_core.partner_reconciliation_report_line (
  line_id text primary key,
  report_id text not null references aiphabee_core.partner_reconciliation_report(report_id),
  partner_id text not null,
  dataset text not null,
  channel text not null check (channel in ('api', 'export', 'mcp', 'web')),
  package_code text not null check (
    package_code in ('free', 'plus', 'pro', 'developer', 'team', 'enterprise')
  ),
  user_id text not null,
  usage_count numeric not null default 0 check (usage_count >= 0),
  credits numeric not null default 0 check (credits >= 0),
  metered_rows numeric not null default 0 check (metered_rows >= 0),
  request_ids text[] not null default '{}',
  usage_event_ids text[] not null default '{}',
  data_delay_minutes_max integer not null default 0 check (data_delay_minutes_max >= 0),
  missing_rows numeric not null default 0 check (missing_rows >= 0),
  error_count numeric not null default 0 check (error_count >= 0),
  backfill_count numeric not null default 0 check (backfill_count >= 0),
  sla_status text not null default 'ok' check (sla_status in ('ok', 'exception')),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  unique (report_id, dataset, channel, package_code, user_id)
);

create table if not exists aiphabee_audit.partner_reconciliation_event (
  event_id text primary key,
  report_id text not null,
  partner_id text not null,
  request_id text not null,
  actor_user_id text,
  event_kind text not null default 'plan_export' check (
    event_kind in ('plan_export', 'exported', 'reconciled', 'voided')
  ),
  status text not null default 'planned_no_write' check (
    status in ('planned_no_write', 'blocked_no_rows', 'provisioned')
  ),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.partner_reconciliation_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.partner_reconciliation_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase3.partner_reconciliation_report',
  '2026-06-21.phase3.partner-reconciliation-report-scaffold.v0',
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
